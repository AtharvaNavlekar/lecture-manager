const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

/**
 * Report Routes
 * All routes require authentication
 * Some routes have additional role-based restrictions
 */

// ==================== ATTENDANCE REPORTS ====================

// Get attendance by student
router.get('/attendance/student/:studentId',
    verifyToken,
    reportController.getAttendanceByStudent
);

// Get attendance by teacher
router.get('/attendance/teacher/:teacherId',
    verifyToken,
    reportController.getAttendanceByTeacher
);

// Get attendance by class
router.get('/attendance/class/:classYear',
    verifyToken,
    reportController.getAttendanceByClass
);

// ==================== PERFORMANCE REPORTS ====================

// Get student performance report
router.get('/performance/students',
    verifyToken,
    reportController.getStudentPerformance
);

// ==================== SYLLABUS REPORTS ====================

// Get syllabus completion report
router.get('/syllabus/completion',
    verifyToken,
    reportController.getSyllabusCompletion
);

// ==================== DEPARTMENT & WORKLOAD REPORTS ====================

// Get department workload
router.get('/department/workload',
    verifyToken,
    reportController.getDepartmentWorkload
);

// Get risk students
router.get('/department/risk-students',
    verifyToken,
    reportController.getRiskStudents
);

// Get HOD monthly summary (HOD/Admin only)
router.get('/hod/monthly-summary',
    verifyToken,
    reportController.getHODMonthlySummary
);

module.exports = router;
