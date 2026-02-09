const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
    getAllTeachers,
    getAllDepartments,
    addTeacher,
    deleteTeacher,
    importTeachers,
    exportTeachers,
    downloadTemplate
} = require('../controllers/teacherController');
const { verifyAdmin, verifyHod, verifyToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

// CRUD
router.get('/departments', getAllDepartments);
router.get('/', getAllTeachers);
router.post('/', verifyHod, addTeacher);
router.post('/delete', verifyHod, deleteTeacher);
router.delete('/:id', verifyHod, deleteTeacher);

// Import/Export
router.post('/import', verifyHod, upload.single('file'), importTeachers);
router.get('/export', exportTeachers);
router.get('/template', downloadTemplate);

module.exports = router;
