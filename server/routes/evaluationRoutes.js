const express = require('express');
const router = express.Router();
const {
    createEvaluation,
    getTeacherEvaluations,
    getDepartmentEvaluations
} = require('../controllers/evaluationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createEvaluation);
router.get('/teacher/:teacher_id', verifyToken, getTeacherEvaluations);
router.get('/department', verifyToken, getDepartmentEvaluations);

module.exports = router;
