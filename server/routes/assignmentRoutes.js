const express = require('express');
const router = express.Router();
const {
    createAssignment,
    getAssignments,
    getAssignmentDetails,
    updateAssignment,
    deleteAssignment,
    gradeSubmission
} = require('../controllers/assignmentController');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadDocument } = require('../middleware/uploadMiddleware');

router.post('/', verifyToken, uploadDocument.single('file'), createAssignment);
router.get('/', verifyToken, getAssignments);
router.get('/:id', verifyToken, getAssignmentDetails);
router.put('/:id', verifyToken, updateAssignment);
router.delete('/:id', verifyToken, deleteAssignment);
router.post('/submissions/:id/grade', verifyToken, gradeSubmission);

module.exports = router;
