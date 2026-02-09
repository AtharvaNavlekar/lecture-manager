const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
    getAllStudents,
    saveStudent,
    deleteStudent,
    uploadExcel,
    exportStudents,
    downloadStudentTemplate
} = require('../controllers/studentController');
const { verifyToken, verifyHod } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

// CRUD
router.get('/', getAllStudents);
router.post('/', verifyHod, saveStudent);
router.put('/:id', verifyHod, saveStudent);
router.delete('/:id', verifyHod, deleteStudent);

// Import/Export
router.post('/import', verifyHod, upload.single('file'), uploadExcel);
router.get('/export', exportStudents);
router.get('/template', downloadStudentTemplate);

module.exports = router;
