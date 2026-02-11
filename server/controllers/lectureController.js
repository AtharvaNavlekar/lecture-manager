const { db } = require('../config/db');
const { logAction } = require('../services/auditService');

// --- HELPERS ---
function getLocalDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
}

const getSyncData = (req, res) => {
    const userId = req.userId;
    const userRole = req.userRole;

    // 1. Get ONLY relevant notifications
    const data = {};

    db.all("SELECT * FROM notifications WHERE target_teacher_id = ?", [userId], (err, n) => {
        if (err) return res.status(500).json({ success: false });
        data.notifications = n || [];

        // 2. Get ONLY relevant lectures (My Schedule)
        // Teachers see their own classes. Admins see everything (or we can limit admins too if needed, but for sync usually own is best)
        // For Dashboard, we just need the user's schedule. Use getMasterSchedule for full view.

        // Get current day of week (e.g., 'Wednesday') instead of specific date
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDayName = dayNames[new Date().getDay()];

        db.all(`
            SELECT * FROM lectures 
            WHERE (scheduled_teacher_id = ? OR substitute_teacher_id = ?) 
            AND day_of_week = ? 
        `, [userId, userId, todayDayName], (err2, l) => {
            if (err2) return res.status(500).json({ success: false });
            data.lectures = l || []; // Only MY lectures for today

            // 3. Get basic teacher info (lightweight list for dropdowns if needed, or remove if not used in dashboard)
            // Ideally dashboard doesn't need full teacher list. Let's send empty or minimal.
            // Sending empty to break dependency on this heavy query for the dashboard.
            data.teachers = [];

            res.json(data);
        });
    });
};

const markAbsent = (req, res) => {
    const { teacherId, date } = req.body;
    const requesterId = req.userId; // From Token

    // Security check: only allow self or admin
    if (Number(teacherId) !== Number(requesterId) && req.userRole !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized action." });
    }

    db.get("SELECT * FROM teachers WHERE id = ?", [teacherId], (err, requester) => {
        if (err || !requester) {
            return res.status(500).json({ success: false, message: "Failed to fetch teacher info" });
        }

        db.all(`SELECT * FROM lectures WHERE scheduled_teacher_id = ? AND date = ? AND status != 'completed' AND substitute_teacher_id IS NULL`,
            [teacherId, date], (err2, lectures) => {
                if (err2) return res.status(500).json({ success: false, message: "Database error" });
                if (!lectures || lectures.length === 0) return res.json({ success: true, message: "No classes to cover today." });

                // Process assignments sequentially with transaction support
                let processed = 0, assignedCount = 0, logs = [];

                const processLecture = (lecture) => {
                    const dept = requester.department;
                    const time = lecture.start_time;

                    // BEGIN TRANSACTION for atomic assignment
                    db.serialize(() => {
                        db.run("BEGIN TRANSACTION");

                        const sqlSmartAssign = `
                    SELECT t.id, t.name,
                    (SELECT COUNT(*) FROM lectures l WHERE (l.scheduled_teacher_id = t.id OR l.substitute_teacher_id = t.id) AND l.status != 'completed') as workload,
                    (SELECT COUNT(*) FROM lectures l2 WHERE l2.substitute_teacher_id = t.id AND l2.date = ?) as daily_sub_count
                    FROM teachers t
                    WHERE t.department = ? AND t.id != ? 
                    AND t.id NOT IN (
                        SELECT scheduled_teacher_id FROM lectures WHERE date = ? AND start_time = ? AND status != 'completed'
                        UNION
                        SELECT substitute_teacher_id FROM lectures WHERE date = ? AND start_time = ? AND substitute_teacher_id IS NOT NULL
                    )
                    AND daily_sub_count < 1 -- Constraint: Max 1 proxy lecture per day
                    ORDER BY workload ASC LIMIT 1`;

                        db.get(sqlSmartAssign, [date, dept, teacherId, date, time, date, time], (err, bestCandidate) => {
                            if (err) {
                                db.run("ROLLBACK");
                                logs.push(`Class ${lecture.start_time}: Error during assignment`);
                                processed++;
                                if (processed === lectures.length) res.json({ success: true, assignedCount, total: lectures.length, logs });
                                return;
                            }

                            if (bestCandidate) {
                                // Double-check availability within transaction (prevents race condition)
                                db.run("UPDATE lectures SET substitute_teacher_id = ?, status = 'sub_assigned' WHERE id = ? AND substitute_teacher_id IS NULL",
                                    [bestCandidate.id, lecture.id], function (updateErr) {
                                        if (updateErr || this.changes === 0) {
                                            db.run("ROLLBACK");
                                            logs.push(`Class ${lecture.start_time}: Assignment conflict`);
                                        } else {
                                            // Insert notifications
                                            const stmt = db.prepare("INSERT INTO notifications (target_teacher_id, lecture_id, type, title, message, status) VALUES (?,?,?,?,?,?)");
                                            stmt.run(bestCandidate.id, lecture.id, 'auto_assign', 'Urgent Substitution', `You have been assigned ${requester.name}'s class: ${lecture.subject}.`, 'unread');
                                            stmt.run(teacherId, lecture.id, 'info', 'Substitute Found', `System assigned ${bestCandidate.name}.`, 'unread');
                                            stmt.finalize();

                                            db.run("COMMIT");
                                            assignedCount++;
                                            logs.push(`Class ${lecture.start_time}: Assigned to ${bestCandidate.name}`);
                                        }

                                        processed++;
                                        if (processed === lectures.length) res.json({ success: true, assignedCount, total: lectures.length, logs });
                                    });
                            } else {
                                db.run("ROLLBACK");
                                logs.push(`Class ${lecture.start_time}: No teachers available`);
                                processed++;
                                if (processed === lectures.length) res.json({ success: true, assignedCount, total: lectures.length, logs });
                            }
                        });
                    });
                };

                // Process each lecture
                lectures.forEach(processLecture);
            });
    });
};

const updateLecture = (req, res) => {
    const { id, topic_covered, syllabus_topic_id } = req.body;
    db.run("UPDATE lectures SET topic_covered = ?, syllabus_topic_id = ? WHERE id = ?",
        [topic_covered, syllabus_topic_id, id],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: "Lecture updated" });
        });
};

const getRoster = (req, res) => {
    const { lectureId, classYear } = req.params;
    const requesterId = req.userId;
    const requesterRole = req.userRole;

    // 0. Get Lecture + Teacher Department in ONE query using JOIN
    db.get(`
        SELECT l.*, t.department as teacher_department 
        FROM lectures l
        JOIN teachers t ON l.scheduled_teacher_id = t.id
        WHERE l.id = ?
    `, [lectureId], (errL, lecture) => {
        if (!lecture) return res.status(404).json([]);

        // SECURITY: Verify requester is authorized to view this roster
        if (requesterRole !== 'admin' &&
            lecture.scheduled_teacher_id !== requesterId &&
            lecture.substitute_teacher_id !== requesterId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can only view rosters for your own lectures"
            });
        }

        // 1. Build optimized student query with filters
        let studentQuery = "SELECT * FROM students WHERE class_year = ? AND department = ?";
        let studentParams = [classYear, lecture.teacher_department];

        // Add division filter if lecture has division specified
        if (lecture.division) {
            studentQuery += " AND (division = ? OR name LIKE ?)";
            studentParams.push(lecture.division);
            studentParams.push(`%${classYear}-${lecture.division}%`);
        }

        // 2. Fetch students and attendance records in parallel
        // Calculate current week start (Sunday at 00:00:00)
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const weekStartISO = startOfWeek.toISOString().split('T')[0];

        Promise.all([
            new Promise((resolve, reject) => {
                db.all(studentQuery, studentParams, (err, students) => {
                    if (err) reject(err);
                    else resolve(students || []);
                });
            }),
            new Promise((resolve, reject) => {
                // CRITICAL FIX: Only load attendance records from THIS WEEK
                db.all(`
                    SELECT * FROM attendance_records 
                    WHERE lecture_id = ? 
                    AND date(created_at) >= ?
                `, [lectureId, weekStartISO], (err, records) => {
                    if (err) reject(err);
                    else resolve(records || []);
                });
            })
        ])
            .then(([students, records]) => {
                // 3. Merge student data with attendance records
                const recordsMap = {};
                records.forEach(r => recordsMap[r.student_id] = { status: r.status, note: r.note });

                const roster = students.map(s => ({
                    ...s,
                    status: recordsMap[s.id] ? recordsMap[s.id].status : null,
                    note: recordsMap[s.id] ? recordsMap[s.id].note : ''
                }));

                // Return both roster AND lecture metadata
                res.json({
                    roster,
                    lecture: {
                        subject: lecture.subject,
                        date: lecture.date,
                        start_time: lecture.start_time,
                        division: lecture.division,
                        topic_covered: lecture.topic_covered,
                        syllabus_topic_id: lecture.syllabus_topic_id
                    }
                });
            })
            .catch(err => {
                console.error('Error fetching roster:', err);
                res.status(500).json({ success: false, message: 'Failed to fetch roster' });
            });
    });
};

function updateLectureStats(lectureId) {
    db.get("SELECT count(*) as count FROM attendance_records WHERE lecture_id = ? AND status = 'present'", [lectureId], (err, row) => {
        if (!row) return;
        // Mark lecture as completed when attendance is recorded so it shows in analytics
        db.run("UPDATE lectures SET attendance_count = ?, status = 'completed' WHERE id = ?", [row.count, lectureId]);
    });
}

const markStudent = (req, res) => {
    const { lecture_id, student_id, status, note, user_id } = req.body;
    db.get("SELECT id FROM attendance_records WHERE lecture_id = ? AND student_id = ?", [lecture_id, student_id], (err, row) => {
        if (row) {
            db.run("UPDATE attendance_records SET status = ?, note = ? WHERE id = ?", [status, note, row.id]);
        } else {
            db.run("INSERT INTO attendance_records (lecture_id, student_id, status, note, user_id) VALUES (?,?,?,?,?)", [lecture_id, student_id, status, note, user_id]);
        }
        updateLectureStats(lecture_id);
        res.json({ success: true });
    });
};

const markAll = (req, res) => {
    const { lecture_id, class_year, user_id } = req.body;

    // 1. Get Lecture details first to know Department and Division
    db.get(`
        SELECT l.*, t.department as teacher_department 
        FROM lectures l
        JOIN teachers t ON l.scheduled_teacher_id = t.id
        WHERE l.id = ?
    `, [lecture_id], (err, lecture) => {
        if (err || !lecture) return res.status(404).json({ success: false, message: "Lecture not found" });

        // 2. Build Query matches getRoster logic
        let studentQuery = "SELECT id FROM students WHERE class_year = ? AND department = ?";
        let studentParams = [class_year, lecture.teacher_department];

        if (lecture.division) {
            studentQuery += " AND (division = ? OR name LIKE ?)";
            studentParams.push(lecture.division);
            studentParams.push(`%${class_year}-${lecture.division}%`);
        }

        db.all(studentQuery, studentParams, (err, students) => {
            if (!students || !students.length) return res.json({ success: false });

            // 3. Update total_students for accurate analytics
            db.run("UPDATE lectures SET total_students = ? WHERE id = ?", [students.length, lecture_id]);

            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                db.run("DELETE FROM attendance_records WHERE lecture_id = ?", [lecture_id]);

                const stmt = db.prepare("INSERT INTO attendance_records (lecture_id, student_id, status, note, user_id) VALUES (?, ?, 'present', '', ?)");
                students.forEach(s => stmt.run(lecture_id, s.id, user_id));
                stmt.finalize();

                db.run("COMMIT", () => {
                    updateLectureStats(lecture_id);
                    res.json({ success: true, count: students.length });
                });
            });
        });
    });
};

const getMasterSchedule = (req, res) => {
    const { date, department } = req.query;
    const userDept = req.userDept; // From verifyToken middleware
    const userRole = req.userRole;

    let targetDept = department;

    // SECURITY: Enforce isolation
    // If user is NOT admin, they can ONLY see their own department
    if (userRole !== 'admin') {
        if (!userDept) {
            // Fallback: If for some reason token didn't have dept (old token?), fetch it
            return db.get("SELECT department FROM teachers WHERE id = ?", [req.userId], (err, row) => {
                if (row) {
                    // Retry with fetched dept
                    proceedWithSchedule(req, res, date, row.department);
                } else {
                    res.status(403).json({ success: false, message: "Access Denied" });
                }
            });
        }
        targetDept = userDept;
    }

    proceedWithSchedule(req, res, date, targetDept);
};

const proceedWithSchedule = (req, res, dayOrDate, deptFilter) => {
    let sql = `
        SELECT l.*, t.name as teacher_name, t.department 
        FROM lectures l 
        JOIN teachers t ON l.scheduled_teacher_id = t.id 
        WHERE 1=1
    `;
    const params = [];

    // Support both day names (new) and dates (legacy)
    if (dayOrDate) {
        // Check if it's a day name (Monday, Tuesday, etc.)
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (dayNames.includes(dayOrDate)) {
            sql += " AND l.day_of_week = ?";
            params.push(dayOrDate);
        } else {
            // Legacy: date format
            sql += " AND l.date = ?";
            params.push(dayOrDate);
        }
    }

    // Apply department filter
    if (deptFilter) {
        sql += " AND t.department LIKE ?";
        params.push(`%${deptFilter}%`);
    }

    sql += " ORDER BY l.start_time ASC";

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        // Calculate start of current week (Sunday at 00:00:00)
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const weekStartISO = startOfWeek.toISOString().split('T')[0];

        // For each lecture, check if attendance was marked THIS WEEK
        const lectureStatusPromises = rows.map(lecture => {
            return new Promise((resolve) => {
                db.get(`
                    SELECT COUNT(*) as count 
                    FROM attendance_records 
                    WHERE lecture_id = ? 
                    AND date(created_at) >= ?
                `, [lecture.id, weekStartISO], (err, row) => {
                    if (err) {
                        // On error, fallback to database status
                        resolve(lecture);
                    } else {
                        // Override status based on this week's attendance
                        resolve({
                            ...lecture,
                            status: (row && row.count > 0) ? 'completed' : 'scheduled'
                        });
                    }
                });
            });
        });

        // Wait for all status checks to complete
        Promise.all(lectureStatusPromises).then(lectures => {
            res.json({ success: true, schedule: lectures });
        }).catch(err => {
            // Fallback to original data if promise chain fails
            res.json({ success: true, schedule: rows });
        });
    });
};

const getNotifications = (req, res) => {
    const userId = req.userId;
    db.all("SELECT * FROM notifications WHERE target_teacher_id = ? ORDER BY created_at DESC", [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, notifications: rows || [] });
    });
};

const markNotificationRead = (req, res) => {
    const { id } = req.body; // Notification ID
    const userId = req.userId;

    // If id is provided, mark specific. If not, mark all for user.
    if (id) {
        db.run("UPDATE notifications SET status = 'read' WHERE id = ? AND target_teacher_id = ?", [id, userId], (err) => {
            res.json({ success: true });
        });
    } else {
        db.run("UPDATE notifications SET status = 'read' WHERE target_teacher_id = ?", [userId], (err) => {
            res.json({ success: true });
        });
    }
};

// Create new lecture
const createLecture = (req, res) => {
    const { teacher_id, subject, class_year, room, date, start_time, end_time, recurring } = req.body;
    const requester = req.userId;

    // Validation
    if (!teacher_id || !subject || !class_year || !date || !start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check for time conflicts
    const conflictSQL = `
        SELECT id, subject, teacher_name FROM (
            SELECT l.id, l.subject, t.name as teacher_name
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE l.date = ? AND l.room = ?
            AND (
                (l.start_time < ? AND l.end_time > ?) OR
                (l.start_time >= ? AND l.start_time < ?)
            )
            AND l.status != 'cancelled'
        )
    `;

    db.get(conflictSQL, [date, room, end_time, start_time, start_time, end_time], (err, conflict) => {
        if (conflict) {
            return res.status(409).json({
                success: false,
                message: `Room conflict: ${conflict.subject} by ${conflict.teacher_name}`,
                conflict
            });
        }

        // Handle recurring lectures
        if (recurring && recurring.count > 0) {
            const lectures = [];
            const baseDate = new Date(date);

            for (let i = 0; i < recurring.count; i++) {
                const lectureDate = new Date(baseDate);

                if (recurring.type === 'daily') {
                    lectureDate.setDate(baseDate.getDate() + i);
                } else if (recurring.type === 'weekly') {
                    lectureDate.setDate(baseDate.getDate() + (i * 7));
                }

                lectures.push({
                    teacher_id,
                    subject,
                    class_year,
                    room,
                    date: lectureDate.toISOString().split('T')[0],
                    start_time,
                    end_time
                });
            }

            // Bulk insert
            const stmt = db.prepare(`
                INSERT INTO lectures 
                (scheduled_teacher_id, subject, class_year, room, date, start_time, end_time, status, total_students)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', 60)
            `);

            lectures.forEach(lec => {
                stmt.run(lec.teacher_id, lec.subject, lec.class_year, lec.room, lec.date, lec.start_time, lec.end_time);
            });

            stmt.finalize(() => {
                logAction(req, 'CREATE_LECTURE', `Recurring: ${lectures.length} lectures`, `${subject} for ${class_year}`);
                res.json({
                    success: true,
                    message: `${lectures.length} recurring lectures created`,
                    count: lectures.length
                });
            });
        } else {
            // Single lecture
            db.run(`
                INSERT INTO lectures 
                (scheduled_teacher_id, subject, class_year, room, date, start_time, end_time, status, total_students)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', 60)
            `, [teacher_id, subject, class_year, room, date, start_time, end_time], function (err) {
                if (err) {
                    console.error('Failed to create lecture:', err);
                    return res.status(500).json({ success: false, message: err.message });
                }

                logAction(req, 'CREATE_LECTURE', `Lecture ID: ${this.lastID}`, `${subject} for ${class_year}`);
                res.json({
                    success: true,
                    message: 'Lecture created successfully',
                    lectureId: this.lastID
                });
            });
        }
    });
};

// Edit lecture (full edit)
const editLecture = (req, res) => {
    const { id } = req.params;
    const { teacher_id, subject, class_year, room, date, start_time, end_time } = req.body;

    // Check if lecture has attendance
    db.get('SELECT COUNT(*) as count FROM attendance_records WHERE lecture_id = ?', [id], (err, result) => {
        const hasAttendance = result && result.count > 0;

        // Update lecture
        db.run(`
            UPDATE lectures
            SET scheduled_teacher_id = ?, subject = ?, class_year = ?, 
                room = ?, date = ?, start_time = ?, end_time = ?
            WHERE id = ?
        `, [teacher_id, subject, class_year, room, date, start_time, end_time, id], function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Lecture not found' });
            }

            logAction(req, 'EDIT_LECTURE', `Lecture ID: ${id}`, `Updated ${subject}`);
            res.json({
                success: true,
                message: 'Lecture updated successfully',
                hasAttendance
            });
        });
    });
};

// Delete/Cancel lecture
const deleteLecture = (req, res) => {
    const { id } = req.params;
    const { reason, notify_students } = req.body;
    const hard = req.query.hard === 'true'; // Admin-only hard delete

    // Check if can delete
    db.get('SELECT * FROM lectures WHERE id = ?', [id], (err, lecture) => {
        if (!lecture) {
            return res.status(404).json({ success: false, message: 'Lecture not found' });
        }

        // Check if has attendance
        db.get('SELECT COUNT(*) as count FROM attendance_records WHERE lecture_id = ?', [id], (err, result) => {
            const hasAttendance = result && result.count > 0;

            if (hard && req.userRole === 'admin') {
                // Hard delete (admin only)
                db.serialize(() => {
                    db.run('DELETE FROM attendance_records WHERE lecture_id = ?', [id]);
                    db.run('DELETE FROM lectures WHERE id = ?', [id], (err) => {
                        if (err) return res.status(500).json({ success: false, message: err.message });

                        logAction(req, 'DELETE_LECTURE', `Lecture ID: ${id}`, `Hard deleted ${lecture.subject}`);
                        res.json({ success: true, message: 'Lecture permanently deleted' });
                    });
                });
            } else {
                // Soft delete (cancel)
                db.run(`
                    UPDATE lectures 
                    SET status = 'cancelled' 
                    WHERE id = ?
                `, [id], (err) => {
                    if (err) return res.status(500).json({ success: false, message: err.message });

                    // Create notification if needed
                    if (notify_students) {
                        const message = reason ? `Cancelled: ${reason}` : 'Lecture cancelled';
                        db.run(`
                            INSERT INTO notifications 
                            (title, message, type, target_teacher_id)
                            VALUES (?, ?, 'info', ?)
                        `, [`${lecture.subject} Cancelled`, message, lecture.scheduled_teacher_id]);
                    }

                    logAction(req, 'CANCEL_LECTURE', `Lecture ID: ${id}`, `Cancelled ${lecture.subject}`);
                    res.json({
                        success: true,
                        message: 'Lecture cancelled successfully',
                        hasAttendance
                    });
                });
            }
        });
    });
};

// Reschedule lecture
const rescheduleLecture = (req, res) => {
    const { id } = req.params;
    const { new_date, new_start_time, new_end_time, new_room } = req.body;

    if (!new_date || !new_start_time || !new_end_time) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get current lecture
    db.get('SELECT * FROM lectures WHERE id = ?', [id], (err, lecture) => {
        if (!lecture) {
            return res.status(404).json({ success: false, message: 'Lecture not found' });
        }

        const targetRoom = new_room || lecture.room;

        // Check for conflicts in new slot
        const conflictSQL = `
            SELECT id, subject FROM lectures
            WHERE date = ? AND room = ? AND id != ?
            AND (
                (start_time < ? AND end_time > ?) OR
                (start_time >= ? AND start_time < ?)
            )
            AND status != 'cancelled'
        `;

        db.get(conflictSQL, [new_date, targetRoom, id, new_end_time, new_start_time, new_start_time, new_end_time], (err, conflict) => {
            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: `Time slot conflict with ${conflict.subject}`,
                    conflict
                });
            }

            // Update lecture
            db.run(`
                UPDATE lectures
                SET date = ?, start_time = ?, end_time = ?, room = ?
                WHERE id = ?
            `, [new_date, new_start_time, new_end_time, targetRoom, id], (err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: err.message });
                }

                // Notify teacher
                db.run(`
                    INSERT INTO notifications
                    (title, message, type, target_teacher_id)
                    VALUES (?, ?, 'info', ?)
                `, [
                    'Lecture Rescheduled',
                    `${lecture.subject} moved to ${new_date} at ${new_start_time}`,
                    lecture.scheduled_teacher_id
                ]);

                logAction(req, 'RESCHEDULE_LECTURE', `Lecture ID: ${id}`, `${lecture.subject} to ${new_date} ${new_start_time}`);
                res.json({
                    success: true,
                    message: 'Lecture rescheduled successfully'
                });
            });
        });
    });
};

// Check for time conflicts
const checkConflicts = (req, res) => {
    const { date, start_time, end_time, room, exclude_id } = req.query;

    const sql = `
        SELECT l.id, l.subject, l.room, l.start_time, l.end_time, t.name as teacher_name
        FROM lectures l
        JOIN teachers t ON l.scheduled_teacher_id = t.id
        WHERE l.date = ? ${exclude_id ? 'AND l.id != ?' : ''}
        AND l.status != 'cancelled'
        AND (
            (l.room = ? AND (
                (l.start_time < ? AND l.end_time > ?) OR
                (l.start_time >= ? AND l.start_time < ?)
            ))
        )
    `;

    const params = exclude_id
        ? [date, exclude_id, room, end_time, start_time, start_time, end_time]
        : [date, room, end_time, start_time, start_time, end_time];

    db.all(sql, params, (err, conflicts) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        res.json({
            success: true,
            hasConflicts: conflicts.length > 0,
            conflicts
        });
    });
};

const { parseExcel, validateLectureData, generateTemplate } = require('../utils/excelParser');

const fs = require('fs');

// Bulk Import Lectures
const importLectures = async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    let filePath = null;

    try {
        let buffer;
        if (req.file.buffer) {
            buffer = req.file.buffer;
        } else if (req.file.path) {
            filePath = req.file.path;
            buffer = fs.readFileSync(filePath);
        } else {
            throw new Error("File not found");
        }

        const rows = await parseExcel(buffer);
        const { validRows, errors } = validateLectureData(rows);

        // Cleanup temp file immediately if it exists
        if (filePath) {
            try { fs.unlinkSync(filePath); } catch (e) { console.error("Failed to delete temp file", e); }
        }

        if (validRows.length === 0) {
            return res.status(400).json({ success: false, message: "No valid data", errors });
        }

        // Helper: Convert day_of_week to actual date for current week
        const getDateFromDayOfWeek = (dayOfWeek) => {
            const dayMap = {
                'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
                'thursday': 4, 'friday': 5, 'saturday': 6
            };

            const today = new Date();
            const currentDay = today.getDay();
            const targetDay = dayMap[dayOfWeek.toLowerCase()];

            // Calculate offset to get to target day this week
            let offset = targetDay - currentDay;
            if (offset < 0) offset += 7; // If day already passed, get next week's

            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + offset);

            const year = targetDate.getFullYear();
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const day = String(targetDate.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        };

        let imported = 0;
        let insertErrors = 0;

        // Get all teachers for lookup (optimization)
        db.all("SELECT id, email FROM teachers", [], (err, teachers) => {
            if (err) return res.status(500).json({ success: false, message: "DB Error" });

            const teacherMap = new Map();
            teachers.forEach(t => teacherMap.set(t.email.toLowerCase().trim(), t.id));

            db.serialize(() => {
                const stmt = db.prepare(`
                    INSERT INTO lectures 
                    (scheduled_teacher_id, subject, class_year, division, room, date, day_of_week, start_time, end_time, status, total_students)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 60)
                `);

                validRows.forEach(row => {
                    const teacherId = teacherMap.get(row.teacher_email.toLowerCase());

                    if (!teacherId) {
                        insertErrors++;
                        return;
                    }

                    // Generate date from day_of_week if date is null (recurring schedule)
                    let lectureDate = row.date;
                    if (!lectureDate && row.day_of_week) {
                        lectureDate = getDateFromDayOfWeek(row.day_of_week);
                    }

                    stmt.run(
                        teacherId,
                        row.subject,
                        row.class_year,
                        row.division,
                        row.room,
                        lectureDate,
                        row.day_of_week || null,
                        row.start_time,
                        row.end_time,
                        (err) => {
                            if (err) insertErrors++;
                            else imported++;
                        }
                    );
                });

                stmt.finalize(() => {
                    logAction(req, 'IMPORT_LECTURES', 'Bulk Import', `Imported ${imported} lectures`);
                    res.json({ success: true, message: `Imported ${imported} lectures. ${insertErrors + errors.length} failed/skipped.` });
                });
            });
        });

    } catch (e) {
        if (filePath) {
            try { fs.unlinkSync(filePath); } catch (delErr) { }
        }
        console.error(e);
        res.status(500).json({ success: false, message: "Failed to parse Excel" });
    }
};

const downloadLectureTemplate = async (req, res) => {
    try {
        const template = await generateTemplate('lecture');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="lecture_import_template.xlsx"');
        res.send(template);
    } catch (e) {
        res.status(500).json({ success: false, message: "Failed to generate template" });
    }
};

module.exports = {
    getSyncData,
    markAbsent,
    getRoster,
    markStudent,
    markAll,
    getMasterSchedule,
    getNotifications,
    markNotificationRead,
    updateLecture,
    createLecture,
    editLecture,
    deleteLecture,
    rescheduleLecture,
    checkConflicts,
    importLectures,
    downloadLectureTemplate
};

