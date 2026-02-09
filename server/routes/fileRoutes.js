const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const resourceController = require('../controllers/resourceController');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadProfile, uploadDocument } = require('../middleware/uploadMiddleware');

// ==================== FILE UPLOADS ====================
router.post('/profile', verifyToken, uploadProfile.single('photo'), fileController.uploadProfilePhoto);
router.post('/document', verifyToken, uploadDocument.single('file'), fileController.uploadDocument);

// ==================== FILE MANAGEMENT ====================
router.get('/my-files', verifyToken, fileController.getMyFiles);
router.get('/public', verifyToken, fileController.getPublicFiles);
router.delete('/:id', verifyToken, fileController.deleteFile);
router.get('/:id/download', verifyToken, fileController.downloadFile);

// ==================== RESOURCE LIBRARY ====================
router.get('/resources', verifyToken, resourceController.getResources);
router.get('/resources/stats', verifyToken, resourceController.getResourceStats);
router.get('/resources/popular', verifyToken, resourceController.getPopularResources);

module.exports = router;
