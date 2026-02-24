const { getDB } = require('../config/db');

// Create evaluation
const createEvaluation = (req, res) => {
    const { teacher_id, academic_year, performance_score, teaching_quality, punctuality, student_feedback_score, comments } = req.body;
    const evaluator_id = req.user.id;

    if (!teacher_id || !academic_year) {
        return res.status(400).json({ success: false, message: 'Teacher ID and academic year required' });
    }

    const db = getDB();
    db.run(
        `INSERT INTO faculty_evaluations (teacher_id, evaluator_id, academic_year, performance_score, teaching_quality, punctuality, student_feedback_score, comments)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [teacher_id, evaluator_id, academic_year, performance_score, teaching_quality, punctuality, student_feedback_score, comments],
        function (err) {
            if (err) {
                console.error('Create evaluation error:', err);
                return res.status(500).json({ success: false, message: 'Failed to create evaluation' });
            }
            res.json({ success: true, message: 'Evaluation created successfully', id: this.lastID });
        }
    );
};

// Get evaluations for a teacher
const getTeacherEvaluations = (req, res) => {
    const { teacher_id } = req.params;
    const db = getDB();

    db.all(
        `SELECT fe.*, t.name as evaluator_name
         FROM faculty_evaluations fe
         JOIN teachers t ON fe.evaluator_id = t.id
         WHERE fe.teacher_id = ?
         ORDER BY fe.created_at DESC`,
        [teacher_id],
        (err, rows) => {
            if (err) {
                console.error('Get evaluations error:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch evaluations' });
            }
            res.json({ success: true, evaluations: rows });
        }
    );
};

// Get all evaluations for department (HOD)
const getDepartmentEvaluations = (req, res) => {
    const department = req.user.department;
    const db = getDB();

    db.all(
        `SELECT fe.*, t1.name as teacher_name, t2.name as evaluator_name
         FROM faculty_evaluations fe
         JOIN teachers t1 ON fe.teacher_id = t1.id
         JOIN teachers t2 ON fe.evaluator_id = t2.id
         WHERE t1.department = ?
         ORDER BY fe.created_at DESC`,
        [department],
        (err, rows) => {
            if (err) {
                console.error('Get department evaluations error:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch evaluations' });
            }
            res.json({ success: true, evaluations: rows });
        }
    );
};

module.exports = {
    createEvaluation,
    getTeacherEvaluations,
    getDepartmentEvaluations
};
