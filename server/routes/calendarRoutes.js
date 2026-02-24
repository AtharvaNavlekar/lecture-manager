const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { verifyToken } = require('../middleware/authMiddleware');

// ==================== CALENDAR VIEWS ====================
router.get('/events', verifyToken, calendarController.getEvents);
router.get('/month/:year/:month', verifyToken, calendarController.getMonthView);

// ==================== CALENDAR EXPORT ====================
router.get('/export', verifyToken, calendarController.exportCalendar);

// ==================== SCHEDULING ====================
router.put('/lectures/:id/reschedule', verifyToken, calendarController.rescheduleLecture);
router.post('/check-conflicts', verifyToken, calendarController.checkConflicts);
router.post('/recurring', verifyToken, calendarController.createRecurringLectures);

// ==================== ACADEMIC CALENDAR ====================
router.get('/academic', verifyToken, calendarController.getAcademicCalendar);
router.post('/academic', verifyToken, calendarController.addAcademicEvent);

module.exports = router;
