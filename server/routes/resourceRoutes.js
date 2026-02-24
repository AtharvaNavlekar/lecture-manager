const express = require('express');
const router = express.Router();
const {
    uploadResource,
    getResources,
    deleteResource,
    trackDownload
} = require('../controllers/resourceController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

router.post('/', uploadResource);
router.get('/', getResources);
router.get('/:id/download', trackDownload);
router.delete('/:id', deleteResource);

module.exports = router;
