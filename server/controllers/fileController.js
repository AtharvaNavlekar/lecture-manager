const fileService = require('../services/fileServiceEnhanced');
const dbAsync = require('../utils/dbAsync');

/**
 * File Controller - Handle file uploads and management
 */

/**
 * Upload profile photo
 * POST /api/files/profile
 */
const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const userId = req.userId;
        const userType = req.body.userType || 'teacher'; // 'teacher' or 'student'

        const result = await fileService.uploadProfilePhoto(req.file, userId, userType);

        res.json(result);

    } catch (error) {
        console.error('Profile upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Upload document
 * POST /api/files/document
 */
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { subject, classYear, description, isPublic } = req.body;
        const metadata = {
            uploadedBy: req.userId,
            subject,
            classYear,
            description,
            isPublic: isPublic === 'true' || isPublic === true
        };

        const result = await fileService.uploadDocument(req.file, metadata);

        res.json(result);

    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get user's files
 * GET /api/files/my-files
 */
const getMyFiles = async (req, res) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const files = await fileService.listFiles({
            uploadedBy: req.userId,
            category,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({ success: true, files });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get public files (resource library)
 * GET /api/files/public
 */
const getPublicFiles = async (req, res) => {
    try {
        const { category, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const files = await fileService.listFiles({
            isPublic: true,
            category,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({ success: true, files });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete file
 * DELETE /api/files/:id
 */
const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await fileService.deleteFile(parseInt(id), req.userId);

        res.json(result);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Download file
 * GET /api/files/:id/download
 */
const downloadFile = async (req, res) => {
    try {
        const { id } = req.params;

        // Get file metadata from database
        const file = await dbAsync.get('SELECT * FROM files WHERE id = ?', [id]);

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Check permissions (if not public, must be owner)
        if (!file.is_public && file.uploaded_by !== req.userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const filePath = require('path').join(__dirname, '../..', file.path);

        // Increment download count
        try {
            await dbAsync.run('UPDATE files SET downloads = downloads + 1 WHERE id = ?', [id]);
        } catch (e) { /* Ignore if column doesn't exist */ }

        res.download(filePath, file.original_name);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    uploadProfilePhoto,
    uploadDocument,
    getMyFiles,
    getPublicFiles,
    deleteFile,
    downloadFile
};
