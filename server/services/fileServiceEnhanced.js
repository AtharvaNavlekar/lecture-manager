const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const dbAsync = require('../utils/dbAsync');

/**
 * File Service - Comprehensive file upload and management
 */

// Upload directory structure
const UPLOAD_DIRS = {
    profiles: path.join(__dirname, '../../uploads/profiles'),
    documents: path.join(__dirname, '../../uploads/documents'),
    assignments: path.join(__dirname, '../../uploads/assignments'),
    resources: path.join(__dirname, '../../uploads/resources'),
    temp: path.join(__dirname, '../../uploads/temp')
};

// File size limits (in bytes)
const SIZE_LIMITS = {
    profile: 5 * 1024 * 1024,      // 5MB
    document: 50 * 1024 * 1024,    // 50MB
    assignment: 10 * 1024 * 1024,  // 10MB
    resource: 100 * 1024 * 1024    // 100MB
};

// Allowed file types
const ALLOWED_TYPES = {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    document: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'],
    text: ['.txt', '.md'],
    all: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.md']
};

/**
 * Initialize upload directories
 */
const initializeDirectories = async () => {
    for (const dir of Object.values(UPLOAD_DIRS)) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            console.error(`Failed to create directory ${dir}:`, error);
        }
    }
};

/**
 * Generate unique filename
 */
const generateUniqueFilename = (originalName) => {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    return `${Date.now()}-${hash}${ext}`;
};

/**
 * Validate file type
 */
const validateFileType = (filename, allowedTypes) => {
    const ext = path.extname(filename).toLowerCase();
    return allowedTypes.includes(ext);
};

/**
 * Save file metadata to database
 */
const saveFileMetadata = async (fileData) => {
    const {
        filename, originalName, mimetype, size, path: filePath, category,
        uploadedBy, relatedId = null, relatedType = null, description = null, isPublic = false
    } = fileData;

    try {
        const result = await dbAsync.run(`
            INSERT INTO files (
                filename, original_name, mimetype, size, path, category,
                uploaded_by, related_id, related_type, description, is_public
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [filename, originalName, mimetype, size, filePath, category, uploadedBy, relatedId, relatedType, description, isPublic ? 1 : 0]);
        return result.lastID;
    } catch (error) {
        console.warn('File metadata not saved:', error.message);
        return null;
    }
};

/**
 * Upload profile photo
 */
const uploadProfilePhoto = async (file, userId, userType) => {
    try {
        if (!validateFileType(file.originalname, ALLOWED_TYPES.image)) {
            throw new Error('Invalid file type. Only images are allowed.');
        }
        if (file.size > SIZE_LIMITS.profile) {
            throw new Error(`File too large. Maximum size is ${SIZE_LIMITS.profile / (1024 * 1024)}MB`);
        }

        const filename = generateUniqueFilename(file.originalname);
        const filepath = path.join(UPLOAD_DIRS.profiles, filename);
        await fs.rename(file.path, filepath);

        const table = userType === 'teacher' ? 'teachers' : 'students';
        const photoUrl = `/uploads/profiles/${filename}`;
        await dbAsync.run(`UPDATE ${table} SET photo_url = ? WHERE id = ?`, [photoUrl, userId]);

        const fileId = await saveFileMetadata({
            filename, originalName: file.originalname, mimetype: file.mimetype,
            size: file.size, path: photoUrl, category: 'profile',
            uploadedBy: userId, relatedId: userId, relatedType: userType, isPublic: true
        });

        return { success: true, fileId, url: photoUrl, filename };
    } catch (error) {
        if (file.path) { try { await fs.unlink(file.path); } catch (e) { } }
        throw error;
    }
};

/**
 * Upload document
 */
const uploadDocument = async (file, metadata) => {
    try {
        const { uploadedBy, subject, classYear, description, isPublic = false } = metadata;

        if (!validateFileType(file.originalname, ALLOWED_TYPES.all)) {
            throw new Error('Invalid file type.');
        }
        if (file.size > SIZE_LIMITS.document) {
            throw new Error(`File too large. Maximum size is ${SIZE_LIMITS.document / (1024 * 1024)}MB`);
        }

        const filename = generateUniqueFilename(file.originalname);
        const filepath = path.join(UPLOAD_DIRS.documents, filename);
        await fs.rename(file.path, filepath);

        const documentUrl = `/uploads/documents/${filename}`;
        const fileId = await saveFileMetadata({
            filename, originalName: file.originalname, mimetype: file.mimetype,
            size: file.size, path: documentUrl, category: 'document',
            uploadedBy, description: description || `${subject} - ${classYear}`, isPublic
        });

        return { success: true, fileId, url: documentUrl, filename, originalName: file.originalname };
    } catch (error) {
        if (file.path) { try { await fs.unlink(file.path); } catch (e) { } }
        throw error;
    }
};

/**
 * Delete file
 */
const deleteFile = async (fileId, userId) => {
    try {
        const file = await dbAsync.get('SELECT * FROM files WHERE id = ?', [fileId]);
        if (!file) throw new Error('File not found');
        if (file.uploaded_by !== userId) throw new Error('Unauthorized');

        const fullPath = path.join(__dirname, '../..', file.path);
        try { await fs.unlink(fullPath); } catch (error) { console.warn('Physical file not found'); }

        await dbAsync.run('DELETE FROM files WHERE id = ?', [fileId]);
        return { success: true, message: 'File deleted successfully' };
    } catch (error) {
        throw error;
    }
};

/**
 * List files with filtering
 */
const listFiles = async (filters = {}) => {
    try {
        const { category, uploadedBy, isPublic, limit = 50, offset = 0 } = filters;
        let whereClause = '1=1';
        const params = [];

        if (category) { whereClause += ' AND f.category = ?'; params.push(category); }
        if (uploadedBy) { whereClause += ' AND f.uploaded_by = ?'; params.push(uploadedBy); }
        if (isPublic !== undefined) { whereClause += ' AND f.is_public = ?'; params.push(isPublic ? 1 : 0); }

        const files = await dbAsync.all(`
            SELECT f.*, t.name as uploader_name
            FROM files f
            LEFT JOIN teachers t ON f.uploaded_by = t.id
            WHERE ${whereClause}
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        return files;
    } catch (error) {
        return [];
    }
};

// Initialize directories on module load
initializeDirectories();

module.exports = {
    uploadProfilePhoto,
    uploadDocument,
    deleteFile,
    listFiles,
    validateFileType,
    UPLOAD_DIRS,
    SIZE_LIMITS,
    ALLOWED_TYPES,
    initializeDirectories
};
