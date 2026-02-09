const { getDB } = require('../config/db');

// Create announcement
const createAnnouncement = (req, res) => {
    const { title, content, priority, target_audience, expires_at } = req.body;
    const created_by = req.user.id;
    const department = req.user.department;

    if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const db = getDB();
    db.run(
        `INSERT INTO announcements (created_by, department, title, message, priority, target_audience, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [created_by, department, title, content, priority || 'normal', target_audience || 'all', expires_at],
        function (err) {
            if (err) {
                console.error('Create announcement error:', err);
                return res.status(500).json({ success: false, message: 'Failed to create announcement' });
            }

            // Broadcast to department
            const { notifyDepartment } = require('../services/notificationService');
            // If target_audience is specific (e.g. 'CS'), use it. Else use creator's department if scoped.
            const targetDept = department; // Since user can only post to their dept usually

            if (targetDept) {
                notifyDepartment(targetDept, {
                    type: 'info',
                    title: `New Announcement: ${title}`,
                    message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                    priority: priority || 'normal'
                }).catch(err => console.error('Announcement broadcast error:', err));
            }

            res.json({ success: true, message: 'Announcement created successfully', id: this.lastID });
        }
    );
};

// Get announcements
const getAnnouncements = (req, res) => {
    const department = req.user.department;
    const db = getDB();

    db.all(
        `SELECT a.*, t.name as creator_name
         FROM announcements a
         JOIN teachers t ON a.created_by = t.id
         WHERE a.department = ? OR a.department IS NULL
         AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))
         ORDER BY a.is_pinned DESC, a.created_at DESC`,
        [department],
        (err, rows) => {
            if (err) {
                console.error('Get announcements error:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
            }
            res.json({ success: true, announcements: rows });
        }
    );
};

// Update announcement
const updateAnnouncement = (req, res) => {
    const { id } = req.params;
    const { title, content, priority, is_pinned } = req.body;

    const db = getDB();
    db.run(
        `UPDATE announcements 
         SET title = COALESCE(?, title),
             message = COALESCE(?, message),
             priority = COALESCE(?, priority),
             is_pinned = COALESCE(?, is_pinned)
         WHERE id = ? AND created_by = ?`,
        [title, content, priority, is_pinned, id, req.user.id],
        function (err) {
            if (err) {
                console.error('Update announcement error:', err);
                return res.status(500).json({ success: false, message: 'Failed to update announcement' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Announcement not found or unauthorized' });
            }
            res.json({ success: true, message: 'Announcement updated successfully' });
        }
    );
};

// Delete announcement
const deleteAnnouncement = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.run(
        `DELETE FROM announcements WHERE id = ? AND created_by = ?`,
        [id, req.user.id],
        function (err) {
            if (err) {
                console.error('Delete announcement error:', err);
                return res.status(500).json({ success: false, message: 'Failed to delete announcement' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Announcement not found or unauthorized' });
            }
            res.json({ success: true, message: 'Announcement deleted successfully' });
        }
    );
};

module.exports = {
    createAnnouncement,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement
};
