const { getDB } = require('../config/db');
const { sendLeaveApprovalEmail } = require('../services/emailService');

// Assign substitute teacher
const assignSubstitute = (req, res) => {
    const { lecture_id, substitute_teacher_id } = req.body;

    if (!lecture_id || !substitute_teacher_id) {
        return res.status(400).json({ success: false, message: 'Lecture ID and substitute teacher ID required' });
    }

    const db = getDB();
    db.run(
        `UPDATE lectures SET substitute_teacher_id = ?, status = 'sub_assigned' WHERE id = ?`,
        [substitute_teacher_id, lecture_id],
        function (err) {
            if (err) {
                console.error('Assign substitute error:', err);
                return res.status(500).json({ success: false, message: 'Failed to assign substitute' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Lecture not found' });
            }

            // Notify substitute teacher
            const { createNotification } = require('../services/notificationService');
            createNotification({
                targetTeacherId: substitute_teacher_id,
                lectureId: lecture_id,
                type: 'auto_assign',
                title: 'New Substitution Assigned',
                message: 'You have been assigned a new substitution lecture.',
                priority: 'high'
            }).catch(err => console.error('Notification error:', err));

            res.json({ success: true, message: 'Substitute assigned successfully' });
        }
    );
};

// Get teachers on leave for a date range
const getTeachersOnLeave = (req, res) => {
    const { start_date, end_date } = req.query;
    const department = req.user.department;
    const db = getDB();

    db.all(
        `SELECT lr.*, t.name as teacher_name
         FROM leave_requests lr
         JOIN teachers t ON lr.teacher_id = t.id
         WHERE lr.status = 'approved' 
         AND t.department = ?
         AND ((lr.start_date <= ? AND lr.end_date >= ?) OR (lr.start_date <= ? AND lr.end_date >= ?))`,
        [department, end_date, start_date, end_date, end_date],
        (err, rows) => {
            if (err) {
                console.error('Get teachers on leave error:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch teachers on leave' });
            }
            res.json({ success: true, teachers: rows });
        }
    );
};

// Get lectures needing substitutes
const getLecturesNeedingSubstitutes = (req, res) => {
    const department = req.user.department;
    const db = getDB();

    db.all(
        `SELECT l.*, t.name as teacher_name, lr.start_date, lr.end_date
         FROM lectures l
         JOIN teachers t ON l.scheduled_teacher_id = t.id
         LEFT JOIN leave_requests lr ON lr.teacher_id = t.id AND lr.status = 'approved'
         WHERE t.department = ? AND l.status = 'scheduled' 
         AND l.date BETWEEN lr.start_date AND lr.end_date
         AND l.substitute_teacher_id IS NULL
         ORDER BY l.date, l.start_time`,
        [department],
        (err, rows) => {
            if (err) {
                console.error('Get lectures needing subs error:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch lectures' });
            }
            res.json({ success: true, lectures: rows });
        }
    );
};

module.exports = {
    assignSubstitute,
    getTeachersOnLeave,
    getLecturesNeedingSubstitutes
};
