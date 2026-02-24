const { getDB } = require('../config/db');

// Upload resource (simplified without actual file handling for now)
const uploadResource = (req, res) => {
    const { title, description, category, subject, class_year, is_public, file_path, file_type } = req.body;
    const teacher_id = req.user.id;

    if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const db = getDB();
    db.run(
        `INSERT INTO resources (teacher_id, title, description, category, subject, class_year, is_public, file_path, file_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [teacher_id, title, description, category || 'notes', subject, class_year, is_public || 0, file_path, file_type],
        function (err) {
            if (err) {
                console.error('Upload resource error:', err);
                return res.status(500).json({ success: false, message: 'Failed to upload resource' });
            }
            res.json({ success: true, message: 'Resource uploaded successfully', id: this.lastID });
        }
    );
};

// Get resources (with filters)
const getResources = (req, res) => {
    const { subject, class_year, category, is_public } = req.query;
    const teacher_id = req.user.id;
    const db = getDB();

    let query = `SELECT r.*, t.name as teacher_name 
                 FROM resources r 
                 JOIN teachers t ON r.teacher_id = t.id 
                 WHERE (r.teacher_id = ? OR r.is_public = 1)`;
    const params = [teacher_id];

    if (subject) {
        query += ` AND r.subject = ?`;
        params.push(subject);
    }
    if (class_year) {
        query += ` AND r.class_year = ?`;
        params.push(class_year);
    }
    if (category) {
        query += ` AND r.category = ?`;
        params.push(category);
    }

    query += ` ORDER BY r.created_at DESC`;

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Get resources error:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch resources' });
        }
        res.json({ success: true, resources: rows });
    });
};

// Delete resource
const deleteResource = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.run(
        `DELETE FROM resources WHERE id = ? AND teacher_id = ?`,
        [id, req.user.id],
        function (err) {
            if (err) {
                console.error('Delete resource error:', err);
                return res.status(500).json({ success: false, message: 'Failed to delete resource' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Resource not found or unauthorized' });
            }
            res.json({ success: true, message: 'Resource deleted successfully' });
        }
    );
};

// Track download
const trackDownload = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.run(
        `UPDATE resources SET downloads = downloads + 1 WHERE id = ?`,
        [id],
        function (err) {
            if (err) {
                console.error('Track download error:', err);
            }
        }
    );

    // Return the resource for download
    db.get(`SELECT * FROM resources WHERE id = ?`, [id], (err, resource) => {
        if (err || !resource) {
            return res.status(404).json({ success: false, message: 'Resource not found' });
        }
        res.json({ success: true, resource });
    });
};

// Get resource statistics
const getResourceStats = (req, res) => {
    const db = getDB();
    const teacher_id = req.user.id;

    const query = `
        SELECT 
            COUNT(*) as total_resources,
            SUM(downloads) as total_downloads,
            COUNT(DISTINCT subject) as subjects_count
        FROM resources
        WHERE teacher_id = ? OR is_public = 1
    `;

    db.get(query, [teacher_id], (err, stats) => {
        if (err) {
            console.error('Get resource stats error:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
        }
        res.json({ success: true, stats });
    });
};

// Get popular resources
const getPopularResources = (req, res) => {
    const db = getDB();
    const limit = req.query.limit || 5;

    const query = `
        SELECT r.*, t.name as teacher_name
        FROM resources r
        JOIN teachers t ON r.teacher_id = t.id
        WHERE r.is_public = 1
        ORDER BY r.downloads DESC
        LIMIT ?
    `;

    db.all(query, [limit], (err, resources) => {
        if (err) {
            console.error('Get popular resources error:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch popular resources' });
        }
        res.json({ success: true, resources });
    });
};

module.exports = {
    uploadResource,
    getResources,
    deleteResource,
    trackDownload,
    getResourceStats,
    getPopularResources
};
