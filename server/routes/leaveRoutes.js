const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { promisify } = require('util');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Proper wrapper for db.run that returns lastID
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// GET all leave requests
router.get('/', async (req, res) => {
    try {
        const status = req.query.status || 'all';
        const teacherId = req.query.teacher_id;

        let whereClause = '1=1';
        const params = [];

        if (status !== 'all') {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        if (teacherId) {
            whereClause += ' AND teacher_id = ?';
            params.push(teacherId);
        }

        const leaves = await dbAll(`
            SELECT lr.*, t.name as teacher_name, t.department
            FROM leave_requests lr
            JOIN teachers t ON lr.teacher_id = t.id
            WHERE ${whereClause}
            ORDER BY lr.submitted_at DESC
        `, params);

        res.json({ success: true, leaves });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET pending leave requests (for admin/HOD)
router.get('/pending', async (req, res) => {
    try {
        const requests = await dbAll(`
            SELECT lr.*, t.name as teacher_name, t.department
            FROM leave_requests lr
            JOIN teachers t ON lr.teacher_id = t.id
            WHERE lr.status = 'pending'
            ORDER BY lr.submitted_at DESC
        `);

        res.json({ success: true, requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET approved leaves calendar (for admin/HOD)
router.get('/calendar', async (req, res) => {
    try {
        const leaves = await dbAll(`
            SELECT lr.*, t.name as teacher_name, t.department
            FROM leave_requests lr
            JOIN teachers t ON lr.teacher_id = t.id
            WHERE lr.status = 'approved'
            ORDER BY lr.start_date DESC
        `);

        res.json({ success: true, leaves });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST create leave request
router.post('/', async (req, res) => {
    try {
        const { teacher_id, start_date, end_date, reason, affected_lectures, notes, is_hod, delegate_responsibilities } = req.body;

        // Calculate total days
        const start = new Date(start_date);
        const end = new Date(end_date);
        const total_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Default leave_type_id to 1 (casual leave)
        const leave_type_id = 1;

        // HOD leave requests should be marked differently for routing to Principal
        const hodFlag = is_hod ? 1 : 0;
        const delegation = delegate_responsibilities || null;

        const result = await dbRun(`
            INSERT INTO leave_requests (
                teacher_id, leave_type_id, start_date, end_date, 
                total_days, reason, affected_lectures, notes, status,
                is_hod_request, delegate_to
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        `, [teacher_id, leave_type_id, start_date, end_date, total_days, reason, JSON.stringify(affected_lectures || []), notes, hodFlag, delegation]);

        // Logic to notify HOD (or Admin if requester is HOD)
        try {
            // 1. Get requester's department and name
            const requester = await dbGet('SELECT name, department, is_hod FROM teachers WHERE id = ?', [teacher_id]);

            if (requester) {
                let targetId = null;

                if (requester.is_hod) {
                    // If HOD, notify Admin (Assuming Admin has ID 1 or find first admin)
                    // For now, let's find a teacher who is admin or ID 1
                    targetId = 1; // Fallback to ID 1 (System Admin usually)
                    // Optional: You could query for role='admin' if user_roles used
                } else {
                    // If Teacher, notify HOD of same department
                    const hod = await dbGet('SELECT id FROM teachers WHERE department = ? AND (is_hod = 1 OR is_acting_hod = 1)', [requester.department]);
                    if (hod) targetId = hod.id;
                }

                if (targetId) {
                    await dbRun(`
                        INSERT INTO notifications (
                            target_teacher_id, type, title, message, status
                        ) VALUES (?, 'leave_request', 'New Leave Request', ?, 'unread')
                    `, [targetId, `${requester.name} has requested leave for ${total_days} days.`]);
                }
            }
        } catch (notifyErr) {
            console.error('Notification Error:', notifyErr);
            // Don't fail the request if notification fails
        }

        res.json({
            success: true,
            leave_id: result.lastID,
            message: 'Leave request submitted successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT approve/deny leave request
router.put('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_by, status, denial_reason } = req.body;

        await dbRun(`
            UPDATE leave_requests 
            SET status = ?, 
                approved_by = ?, 
                hod_decision_at = CURRENT_TIMESTAMP,
                denial_reason = ?
            WHERE id = ?
        `, [status, approved_by, denial_reason, id]);

        // Notify requester
        try {
            const leave = await dbGet('SELECT teacher_id, start_date FROM leave_requests WHERE id = ?', [id]);
            if (leave) {
                await dbRun(`
                    INSERT INTO notifications (target_teacher_id, type, title, message, status)
                    VALUES (?, 'leave_status', 'Leave Status Update', ?, 'unread')
                `, [leave.teacher_id, `Your leave request starting ${leave.start_date} has been ${status}.`]);
            }
        } catch (err) { console.error('Notify Error:', err); }

        res.json({ success: true, message: `Leave request ${status}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT review leave request (approve/reject)
router.put('/:id/review', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body;

        await dbRun(`
            UPDATE leave_requests 
            SET status = ?, 
                rejection_reason = ?,
                hod_decision_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [status, comments || null, id]);

        // Notify requester
        try {
            const leave = await dbGet('SELECT teacher_id, start_date FROM leave_requests WHERE id = ?', [id]);
            if (leave) {
                await dbRun(`
                    INSERT INTO notifications (target_teacher_id, type, title, message, status)
                    VALUES (?, 'leave_status', 'Leave Status Update', ?, 'unread')
                `, [leave.teacher_id, `Your leave request starting ${leave.start_date} has been ${status}.`]);
            }
        } catch (err) { console.error('Notify Error:', err); }

        res.json({ success: true, message: `Leave request ${status} successfully` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// GET lectures needing substitutes
router.get('/lectures/needingsubstitutes', async (req, res) => {
    try {
        const lectures = await dbAll(`
            SELECT DISTINCT
                l.*,
                lr.id as leave_id,
                lr.reason as leave_reason,
                t.name as original_teacher_name
            FROM lectures l
            JOIN leave_requests lr ON lr.affected_lectures LIKE '%' || l.id || '%'
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE lr.status = 'approved'
            AND l.id NOT IN (
                SELECT lecture_id FROM substitute_assignments WHERE status = 'assigned'
            )
            ORDER BY l.date, l.time_slot
        `);

        res.json({ success: true, lectures });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET available teachers for a lecture
router.get('/teachers/available', async (req, res) => {
    try {
        const { lecture_id, ignore_department } = req.query;

        const lecture = await dbGet(`
            SELECT l.*, t.department 
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE l.id = ?
        `, [lecture_id]);

        if (!lecture) {
            return res.status(404).json({ success: false, message: 'Lecture not found' });
        }

        let query = `
            SELECT t.id, t.name, t.email, t.post, t.qualification, t.department
            FROM teachers t
            WHERE t.id != ?
            AND t.is_active = 1
            AND t.id NOT IN (
                SELECT scheduled_teacher_id 
                FROM lectures 
                WHERE date = ? AND time_slot = ? AND scheduled_teacher_id IS NOT NULL
            )
        `;

        const params = [lecture.scheduled_teacher_id, lecture.date, lecture.time_slot];

        // Apply department filter unless explicitly ignored (Override Mode)
        if (ignore_department !== 'true') {
            query += ` AND t.department = ?`;
            params.push(lecture.department);
        }

        query += ` ORDER BY t.name ASC`;

        const available = await dbAll(query, params);

        res.json({ success: true, available, lecture });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET teacher's schedule for a specific date (for substitute request)
router.get('/teacher/schedule', async (req, res) => {
    try {
        const { date, teacher_id } = req.query;

        if (!date || !teacher_id) {
            return res.status(400).json({ success: false, message: 'Date and teacher_id are required' });
        }

        // Helper to get day name reliably (handling timezone offsets)
        // Parse YYYY-MM-DD explicitly to avoid UTC/Local shifts
        const [year, month, day] = date.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[utcDate.getUTCDay()];

        console.log(`[Schedule Check] Date: ${date}, Day: ${dayName}, Teacher: ${teacher_id}`);

        // 1. Try to find specific lectures for this date
        const specificLectures = await dbAll(`
            SELECT id, subject, time_slot, start_time, end_time, class_year, room, date
            FROM lectures
            WHERE scheduled_teacher_id = ? 
            AND date = ?
            AND status != 'cancelled'
            ORDER BY start_time ASC
        `, [teacher_id, date]);

        console.log(`[Schedule Check] Specific lectures found: ${specificLectures.length}`);

        // 2. ALWAYS look for RECURRING templates (Day of Week match)
        // We merge them so user sees Master Schedule + Ad-hoc/Override lectures
        console.log(`[Schedule Check] Looking for templates for day: ${dayName}`);
        const templateLectures = await dbAll(`
            SELECT id, subject, time_slot, start_time, end_time, class_year, room, date
            FROM lectures
            WHERE scheduled_teacher_id = ? 
            AND day_of_week = ? COLLATE NOCASE
            AND status != 'cancelled'
            GROUP BY start_time
            ORDER BY start_time ASC
        `, [teacher_id, dayName]);
        console.log(`[Schedule Check] Templates found: ${templateLectures.length}`);

        // 3. Merge and Sort
        // We include ALL distinct lectures.
        // If a specific lecture exists at 10:00 and a template exists at 10:00, we show BOTH?
        // Or specific overrides template?
        // For robustness, let's show all unique combinations of (start_time, subject).
        // Actually, just showing all sorted by time is safest for user visibility.
        let lectures = [...specificLectures, ...templateLectures];

        // Optional: Deduplicate if ANY specific lecture matches a template exactly (same time AND subject)
        // But if subjects differ, show both (conflict/extra class).
        const seen = new Set();
        lectures = lectures.filter(l => {
            const key = `${l.start_time}-${l.subject}-${l.class_year}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // re-sort merged list
        lectures.sort((a, b) => a.start_time.localeCompare(b.start_time));

        // 3. Ensure time_slot format is present
        lectures = lectures.map(l => ({
            ...l,
            time_slot: l.time_slot || `${l.start_time} - ${l.end_time}`
        }));

        res.json({ success: true, lectures });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST assign substitute
router.post('/substitute/assign', async (req, res) => {
    try {
        const { lecture_id, original_teacher_id, substitute_teacher_id, leave_request_id, notes } = req.body;

        const result = await dbRun(`
            INSERT INTO substitute_assignments (
                lecture_id, original_teacher_id, substitute_teacher_id,
                leave_request_id, assignment_type, assigned_at, 
                syllabus_notes, status
            ) VALUES (?, ?, ?, ?, 'manual', CURRENT_TIMESTAMP, ?, 'assigned')
        `, [lecture_id, original_teacher_id, substitute_teacher_id, leave_request_id, notes]);

        res.json({
            success: true,
            assignment_id: result.lastID,
            message: 'Substitute assigned successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST substitute request (for teachers requesting coverage)
router.post('/substitute/request', async (req, res) => {
    try {
        const { date, time_slot, subject, class_year, reason, teacher_id } = req.body;

        // Validate required fields
        if (!date || !time_slot || !subject || !class_year || !reason || !teacher_id) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // 1. Find or Create Lecture
        let lecture = await dbGet(`
            SELECT id FROM lectures 
            WHERE date = ? AND time_slot = ? AND class_year = ? AND subject = ?
        `, [date, time_slot, class_year, subject]);

        let lecture_id;

        if (lecture) {
            lecture_id = lecture.id;
        } else {
            // Create new lecture if not found (Ad-hoc)
            lecture_id = Date.now().toString();

            // Parse time_slot (supports both "09:00-10:00" and "09:00 AM - 10:00 AM")
            const timeSlotParts = time_slot.includes(' - ')
                ? time_slot.split(' - ').map(t => t.trim())
                : time_slot.split('-').map(t => t.trim());

            const startTime = timeSlotParts[0];
            const endTime = timeSlotParts[1] || null;  // Handle case where split fails

            // Validate we got both times
            if (!startTime || !endTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid time slot format. Expected: "HH:MM-HH:MM" or "HH:MM - HH:MM"'
                });
            }

            await dbRun(`
                INSERT INTO lectures (id, date, time_slot, start_time, end_time, subject, class_year, scheduled_teacher_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
            `, [lecture_id, date, time_slot, startTime, endTime, subject, class_year, teacher_id]);
        }

        // 2. Insert Leave Request linked to this lecture
        const notes = `Ad-hoc substitute request: ${subject} for ${class_year} at ${time_slot}`;
        const leave_type_id = 1; // Default to casual leave type
        const total_days = 1; // Single day request
        const affected_lectures = JSON.stringify([lecture_id]); // Link the lecture!

        const result = await dbRun(`
            INSERT INTO leave_requests (
                teacher_id, leave_type_id, start_date, end_date, total_days, 
                reason, notes, status, affected_lectures, submitted_at
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, CURRENT_TIMESTAMP)
        `, [teacher_id, leave_type_id, date, date, total_days, reason, notes, affected_lectures]);

        res.json({
            success: true,
            request_id: result.lastID,
            message: 'Substitute request submitted successfully'
        });
    } catch (err) {
        console.error('Substitute request error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET weekly substitute report
router.get('/substitute/report', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        console.log('[DEBUG] Report query params:', { start_date, end_date });

        const summary = await dbAll(`
            SELECT 
                sa.substitute_teacher_id,
                t.name as substitute_name,
                t.department,
                COUNT(sa.id) as lecture_count,
                GROUP_CONCAT(DISTINCT l.subject) as subjects
            FROM substitute_assignments sa
            JOIN teachers t ON sa.substitute_teacher_id = t.id
            JOIN lectures l ON sa.lecture_id = l.id
            WHERE DATE(sa.assigned_at) >= ? AND DATE(sa.assigned_at) <= ? AND sa.status = 'assigned'
            GROUP BY sa.substitute_teacher_id
            ORDER BY lecture_count DESC
        `, [start_date, end_date]);

        const details = await dbAll(`
            SELECT 
                sa.*,
                l.subject, l.class_year, l.date, l.time_slot,
                t1.name as original_teacher_name,
                t2.name as substitute_teacher_name,
                lr.reason as leave_reason
            FROM substitute_assignments sa
            JOIN lectures l ON sa.lecture_id = l.id
            JOIN teachers t1 ON sa.original_teacher_id = t1.id
            JOIN teachers t2 ON sa.substitute_teacher_id = t2.id
            LEFT JOIN leave_requests lr ON sa.leave_request_id = lr.id
            WHERE DATE(sa.assigned_at) >= ? AND DATE(sa.assigned_at) <= ? AND sa.status = 'assigned'
            ORDER BY sa.assigned_at DESC
        `, [start_date, end_date]);

        console.log('[DEBUG] Report results:', { summary: summary.length, details: details.length });

        res.json({ success: true, summary, details });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
