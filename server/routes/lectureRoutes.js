const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/lectureController');
const { verifyToken, verifyHod, verifyAdmin } = require('../middleware/authMiddleware');
const { uploadAny } = require('../middleware/uploadMiddleware');

// Sync & Schedule
router.get('/sync', verifyToken, getSyncData);
router.get('/schedule', verifyToken, getMasterSchedule);

// GET lectures for a teacher (for leave request affected lectures)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { teacher_id } = req.query;
        const { db } = require('../config/db');
        const { promisify } = require('util');
        const dbAll = promisify(db.all.bind(db));

        let query = 'SELECT * FROM lectures WHERE 1=1';
        const params = [];

        if (teacher_id) {
            query += ' AND scheduled_teacher_id = ?';
            params.push(teacher_id);
        }

        query += ' ORDER BY date ASC';

        const lectures = await dbAll(query, params);
        res.json({ success: true, lectures });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// CRUD Operations
router.post('/create', verifyToken, verifyHod, createLecture);
router.put('/:id', verifyToken, verifyHod, editLecture);
router.delete('/:id', verifyToken, verifyHod, deleteLecture);
router.post('/:id/reschedule', verifyToken, verifyHod, rescheduleLecture);
router.post('/:id/reschedule', verifyToken, verifyHod, rescheduleLecture);
router.post('/update-details', verifyToken, updateLecture); // Legacy topic update
router.post('/import', verifyToken, verifyHod, uploadAny.single('file'), importLectures);
router.get('/template', verifyToken, downloadLectureTemplate);

// Conflict detection
router.get('/conflicts', verifyToken, checkConflicts);

// Attendance
router.get('/attendance/roster/:lectureId/:classYear', verifyToken, getRoster);
router.post('/attendance/mark', verifyToken, markStudent);
router.post('/attendance/mark-all', verifyToken, markAll);

// Absence & Substitution
router.post('/mark-absent', verifyToken, markAbsent);

// Notifications
router.get('/notifications', verifyToken, getNotifications);
router.post('/notifications/read', verifyToken, markNotificationRead);

module.exports = router;
