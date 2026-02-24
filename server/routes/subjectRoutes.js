const express = require('express');
const router = express.Router();
const { getSubjects, createSubject, deleteSubject, getSyllabus, addTopic, deleteTopic, importSubjects, importSyllabus, downloadSubjectTemplate } = require('../controllers/subjectController');
const { verifyToken, verifyHod } = require('../middleware/authMiddleware');
const { uploadAny } = require('../middleware/uploadMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

// Subjects
router.get('/', getSubjects);
router.post('/', verifyHod, createSubject);
router.post('/delete', verifyHod, deleteSubject);
router.post('/import', verifyHod, uploadAny.single('file'), importSubjects);
router.get('/template', downloadSubjectTemplate);

// Syllabus Topics
router.get('/:subjectId/topics', getSyllabus);
router.post('/topics', verifyHod, addTopic);
router.post('/topics/import', verifyHod, uploadAny.single('file'), importSyllabus);
router.post('/topics/delete', verifyHod, deleteTopic);

module.exports = router;
