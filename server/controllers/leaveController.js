const { getDB } = require('../config/db');

// Get available leave types
const getLeaveTypes = (req, res) => {
    const leaveTypes = [
        { id: 'casual', name: 'Casual Leave', max_days: 12, default_days: 1 },
        { id: 'medical', name: 'Medical Leave', max_days: 10, default_days: 10 },
        { id: 'earned', name: 'Earned Leave', max_days: 15, default_days: 15 },
        { id: 'duty', name: 'On Duty', max_days: 30, default_days: 30 },
        { id: 'unpaid', name: 'Loss of Pay', max_days: 365, default_days: 30 },
        { id: 'custom', name: 'Other (Specify)', max_days: 0, default_days: 1 }
    ];
    res.json({ success: true, leaveTypes });
};

// Submit leave request
const submitLeaveRequest = (req, res) => {
    const { start_date, end_date, reason, leave_type } = req.body;
    const teacher_id = req.user.id;
    const userRole = req.userRole;
    const department = req.user.department;

    if (!start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Start and end dates required' });
    }

    // Legacy support: Calculate total_days and map leave_type_id
    const start = new Date(start_date);
    const end = new Date(end_date);
    const total_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Map text types to IDs where possible (best effort), default to 2 (Casual)
    const typeMap = {
        'medical': 1,
        'casual': 2,
        'earned': 3
        // Others default to 2
    };
    const leave_type_id = typeMap[leave_type] || 2;

    const db = getDB();
    db.run(
        `INSERT INTO leave_requests (teacher_id, start_date, end_date, reason, leave_type, status, leave_type_id, total_days)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [teacher_id, start_date, end_date, reason, leave_type || 'casual', leave_type_id, total_days],
        function (err) {
            if (err) {
                console.error('Leave request error:', err);
                return res.status(500).json({ success: false, message: 'Failed to submit leave request' });
            }

            const leaveId = this.lastID;

            // Notification Logic
            // 1. Determine target (HOD for teachers, Admin for HODs)
            let targetQuery = "SELECT id FROM teachers WHERE department = ? AND (is_hod = 1 OR is_acting_hod = 1)";
            let targetParams = [department];

            if (userRole === 'hod' || userRole === 'admin') {
                // If HOD, notify Admin (Department = 'Administration' or 'Admin')
                targetQuery = "SELECT id FROM teachers WHERE (department = 'Administration' OR department = 'Admin')";
                targetParams = [];
            }

            db.all(targetQuery, targetParams, (err, targets) => {
                if (!err && targets && targets.length > 0) {
                    // Fix: Dynamic URL based on target role
                    // If requester is HOD/Admin, we notified Admin -> /admin/leave-management
                    // If requester is Teacher, we notified HOD -> /leave-management
                    const actionUrl = (userRole === 'hod' || userRole === 'admin')
                        ? '/admin/leave-management'
                        : '/leave-management';

                    const stmt = db.prepare(`INSERT INTO notifications (target_teacher_id, type, title, message, status, action_url, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`);
                    targets.forEach(target => {
                        // Don't notify self
                        if (target.id !== teacher_id) {
                            stmt.run(
                                target.id,
                                'leave_request',
                                'New Leave Request',
                                `Incoming leave request from ${req.user.name} (${leave_type})`,
                                'unread',
                                actionUrl,
                                'high'
                            );
                        }
                    });
                    stmt.finalize();
                }
            });

            res.json({ success: true, message: 'Leave request submitted successfully', id: leaveId });
        }
    );
};

// Get leave requests for a teacher
const getMyLeaveRequests = (req, res) => {
    const teacher_id = req.user.id;
    const db = getDB();

    db.all(
        `SELECT lr.*, t.name as reviewer_name 
         FROM leave_requests lr
         LEFT JOIN teachers t ON lr.approver_id = t.id
         WHERE lr.teacher_id = ?
         ORDER BY lr.created_at DESC`,
        [teacher_id],
        (err, rows) => {
            if (err) {
                console.error('Get leave requests error:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch leave requests' });
            }
            res.json({ success: true, requests: rows });
        }
    );
};

// Get pending leave requests (HOD/Admin)
const getPendingLeaveRequests = (req, res) => {
    const db = getDB();
    const department = req.user.department;
    const userRole = req.userRole;

    let query = `SELECT lr.*, t.name as teacher_name, t.department
         FROM leave_requests lr
         JOIN teachers t ON lr.teacher_id = t.id
         WHERE lr.status = 'pending'`;

    let params = [];

    // If NOT Admin, filter by department
    if (userRole !== 'admin') {
        query += ` AND t.department = ?`;
        params.push(department);
    }

    query += ` ORDER BY lr.created_at ASC`;

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Get pending leaves error:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch pending requests' });
        }
        res.json({ success: true, requests: rows });
    }
    );
};

// Approve/Reject leave request (HOD/Admin)
const reviewLeaveRequest = (req, res) => {
    const { id } = req.params;
    const { status, comments } = req.body;
    const reviewer_id = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const db = getDB();

    // First get the request to know who to notify
    db.get("SELECT teacher_id, start_date, end_date, leave_type FROM leave_requests WHERE id = ?", [id], (err, request) => {
        if (err || !request) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        db.run(
            `UPDATE leave_requests 
             SET status = ?, approver_id = ?, approved_at = CURRENT_TIMESTAMP, rejection_reason = ?
             WHERE id = ?`,
            [status, reviewer_id, comments, id],
            async function (err) {
                if (err) {
                    console.error('Review leave error:', err);
                    return res.status(500).json({ success: false, message: 'Failed to review leave request' });
                }

                // If APPROVED, trigger auto-substitution
                if (status === 'approved') {
                    await assignSubstitutes(request.teacher_id, request.start_date, request.end_date, db);
                }

                // Send Notification to Requester
                const stmt = db.prepare(`INSERT INTO notifications (target_teacher_id, type, title, message, status, action_url, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`);
                stmt.run(
                    request.teacher_id,
                    'leave_status',
                    `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    `Your ${request.leave_type} request has been ${status}. ${comments ? `Comment: ${comments}` : ''}`,
                    'unread',
                    '/leave-request',
                    status === 'approved' ? 'high' : 'normal'
                );
                stmt.finalize();

                res.json({ success: true, message: `Leave request ${status}` });
            }
        );
    });
};

// Helper: Auto-assign substitutes
const assignSubstitutes = (absentTeacherId, startDate, endDate, db) => {
    return new Promise((resolve, reject) => {
        console.log(`🤖 Starting Auto-Substitution for Teacher ${absentTeacherId} from ${startDate} to ${endDate}`);

        // 1. Find all lectures for this teacher in the date range
        // Note: comparing dates as strings 'YYYY-MM-DD' works in SQL
        db.all(
            `SELECT * FROM lectures 
             WHERE scheduled_teacher_id = ? AND date >= ? AND date <= ? AND substitute_teacher_id IS NULL`,
            [absentTeacherId, startDate, endDate],
            (err, lectures) => {
                if (err) {
                    console.error("Error finding lectures:", err);
                    return resolve(); // Don't crash, just stop
                }

                if (lectures.length === 0) {
                    console.log("No lectures found to assign.");
                    return resolve();
                }

                console.log(`Found ${lectures.length} lectures to assign.`);

                // Get absent teacher's department to find colleagues
                db.get("SELECT department FROM teachers WHERE id = ?", [absentTeacherId], (err, teacher) => {
                    if (err || !teacher) return resolve();

                    const department = teacher.department;

                    // Processing sequentially to avoid race conditions on availability
                    const processLectures = async () => {
                        for (const lecture of lectures) {
                            await assignSingleLecture(lecture, department, db);
                        }
                        resolve();
                    };
                    processLectures();
                });
            }
        );
    });
};

// Helper: Assign a single lecture
const assignSingleLecture = (lecture, department, db) => {
    return new Promise((resolve) => {
        // 2. Find eligible substitutes in same department
        // Conditions:
        // - Same department
        // - Not the absent teacher
        // - FREE at that specific time slot (start_time) on that date
        // - Has < 4 lectures on that date

        const query = `
            SELECT t.id, t.name,
                (SELECT COUNT(*) FROM lectures l2 
                 WHERE (l2.scheduled_teacher_id = t.id OR l2.substitute_teacher_id = t.id) 
                 AND l2.date = ?) as daily_load
            FROM teachers t
            WHERE t.department = ? 
            AND t.id != ?
            AND NOT EXISTS (
                SELECT 1 FROM lectures l3 
                WHERE (l3.scheduled_teacher_id = t.id OR l3.substitute_teacher_id = t.id)
                AND l3.date = ? 
                AND l3.start_time = ?
            )
        `;

        db.all(query, [lecture.date, department, lecture.scheduled_teacher_id, lecture.date, lecture.start_time], (err, candidates) => {
            if (err) {
                console.error("Error finding candidates:", err);
                return resolve();
            }

            // Filter for max load < 4
            // Sort by load (ascending) -> Give to busiest teacher last
            const eligible = candidates
                .filter(c => c.daily_load < 4)
                .sort((a, b) => a.daily_load - b.daily_load);

            if (eligible.length > 0) {
                const sub = eligible[0]; // Best candidate
                console.log(`✅ Assigning ${lecture.subject} (${lecture.start_time}) to ${sub.name} (Load: ${sub.daily_load})`);

                // Update Lecture
                db.run(
                    `UPDATE lectures SET substitute_teacher_id = ?, status = 'substituted' WHERE id = ?`,
                    [sub.id, lecture.id],
                    (err) => {
                        if (!err) {
                            // Notify Substitute
                            const stmt = db.prepare(`INSERT INTO notifications (target_teacher_id, type, title, message, status, action_url, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`);
                            stmt.run(
                                sub.id,
                                'start_substitution', // Custom type
                                'New Substitution Assigned',
                                `You have been assigned a substitute lecture: ${lecture.subject} on ${lecture.date} at ${lecture.start_time}.`,
                                'unread',
                                '/timetable',
                                'high'
                            );
                            stmt.finalize();
                        }
                        resolve();
                    }
                );
            } else {
                console.log(`❌ No eligible substitute found for lecture ${lecture.id}`);
                // Mark as cancelled or needing manual attention? For now leave as is.
                resolve();
            }
        });
    });
};

// Get leave calendar (all approved leaves)
const getLeaveCalendar = (req, res) => {
    const db = getDB();
    const department = req.user.department;

    db.all(
        `SELECT lr.*, t.name as teacher_name
         FROM leave_requests lr
         JOIN teachers t ON lr.teacher_id = t.id
         WHERE lr.status = 'approved' AND t.department = ?
         ORDER BY lr.start_date DESC`,
        [department],
        (err, rows) => {
            if (err) {
                console.error('Get leave calendar error:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch leave calendar' });
            }
            res.json({ success: true, leaves: rows });
        }
    );
};

module.exports = {
    submitLeaveRequest,
    getMyLeaveRequests,
    getPendingLeaveRequests,
    reviewLeaveRequest,
    getLeaveCalendar,
    getLeaveTypes
};
