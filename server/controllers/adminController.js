const { getDB } = require('../config/db');
const path = require('path');
const { spawn } = require('child_process');
const { getEmailStatus } = require('../services/emailService');
const backupService = require('../services/backupService');
const { encrypt, decrypt } = require('../utils/vault');
const bcrypt = require('bcryptjs');

// Assign role to user (admin only)
const assignRole = (req, res) => {
    const { teacher_id, role } = req.body;
    const granted_by = req.user.id;

    if (!teacher_id || !role) {
        return res.status(400).json({ success: false, message: 'Teacher ID and role required' });
    }

    const validRoles = ['admin', 'hod', 'teacher'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const db = getDB();

    // Update teacher role
    db.run(
        `UPDATE teachers SET role = ? WHERE id = ?`,
        [role, teacher_id],
        function (err) {
            if (err) {
                console.error('Assign role error:', err);
                return res.status(500).json({ success: false, message: 'Failed to assign role' });
            }

            // Log in user_roles table
            db.run(
                `INSERT INTO user_roles (teacher_id, role, granted_by) VALUES (?, ?, ?)`,
                [teacher_id, role, granted_by],
                (err2) => {
                    if (err2) console.error('Log role error:', err2);
                }
            );

            res.json({ success: true, message: 'Role assigned successfully' });
        }
    );
};

// Get all users with roles (admin only)
const getAllUsersWithRoles = (req, res) => {
    console.log(`🔍 GET Users Credentials Request from ${req.user.email}`);
    const db = getDB();

    db.all(
        `SELECT id, name, email, department, role, is_hod, 
        CASE WHEN encrypted_password IS NOT NULL AND encrypted_password != '' THEN 1 ELSE 0 END as has_encrypted_password 
        FROM teachers ORDER BY department, name`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Get users error:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch users' });
            }
            res.json({ success: true, users: rows });
        }
    );
};

// Reveal Password (Admin only, highly sensitive)
const revealPassword = (req, res) => {
    const { teacher_id } = req.params;
    const db = getDB();

    db.get('SELECT encrypted_password FROM teachers WHERE id = ?', [teacher_id], (err, row) => {
        if (err || !row) return res.status(404).json({ success: false, message: 'User not found' });

        if (!row.encrypted_password) {
            return res.status(404).json({ success: false, message: 'No encrypted password stored for this user.' });
        }

        const password = decrypt(row.encrypted_password);
        if (!password) {
            return res.status(500).json({ success: false, message: 'Failed to decrypt password.' });
        }

        // Log this access!
        console.warn(`⚠️  Admin ${req.user.email} revealed password for user ID ${teacher_id}`);

        res.json({ success: true, password });
    });
};

// Set Temporary Password (Admin only)
const setTempPassword = async (req, res) => {
    const { teacher_id, temp_password } = req.body;

    if (!teacher_id || !temp_password) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const db = getDB();
    const hashedPassword = await bcrypt.hash(temp_password, 10);
    const encryptedPassword = encrypt(temp_password);

    db.run(
        'UPDATE teachers SET password = ?, encrypted_password = ? WHERE id = ?',
        [hashedPassword, encryptedPassword, teacher_id],
        (err) => {
            if (err) {
                console.error('Update password error:', err);
                return res.status(500).json({ success: false, message: 'Failed to update password' });
            }
            res.json({ success: true, message: 'Password updated and vaulted successfully.' });
        }
    );
};

// Get role history for a user
const getRoleHistory = (req, res) => {
    const { teacher_id } = req.params;
    const db = getDB();

    db.all(
        `SELECT ur.*, t.name as granted_by_name
         FROM user_roles ur
         LEFT JOIN teachers t ON ur.granted_by = t.id
         WHERE ur.teacher_id = ?
         ORDER BY ur.granted_at DESC`,
        [teacher_id],
        (err, rows) => {
            if (err) {
                console.error('Get role history error:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch role history' });
            }
            res.json({ success: true, history: rows });
        }
    );
};

// Factory Reset - Restore system to default state
const factoryReset = async (req, res) => {
    console.log('🚨 FACTORY RESET INITIATED BY', req.user.email);
    const db = getDB();

    // Helper for async db execution
    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    const get = (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    try {
        await run("BEGIN TRANSACTION");

        const tablesToClear = [
            'lectures', 'students', 'attendance_records', 'leave_requests',
            'notifications', 'assignments', 'submissions', 'audit_logs'
        ];

        for (const table of tablesToClear) {
            await run(`DELETE FROM ${table}`);
            await run(`DELETE FROM sqlite_sequence WHERE name='${table}'`);
        }

        // Clear teachers except admins
        await run("DELETE FROM teachers WHERE department NOT IN (?, ?)", ['Admin', 'Administration']);

        // Check if admin exists
        const row = await get("SELECT COUNT(*) as count FROM teachers");
        if (row.count === 0) {
            console.log('⚠️ No Admin found. Creating default System Admin...');
            // Use hashSync to avoid any promise ambiguity with bcryptjs version
            const hash = bcrypt.hashSync('admin123', 10);

            await run(`INSERT INTO teachers (name, email, password, department, post, is_hod, is_acting_hod) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                ['System Admin', 'admin@lecman.edu', hash, 'Administration', 'Administrator', 0, 0]);
        }

        await run("COMMIT");
        console.log('✅ Factory reset clean commit.');

        // Log notification (fire and forget)
        run(
            "INSERT INTO notifications (title, message, type, target_teacher_id) VALUES (?, ?, ?, ?)",
            ['SYSTEM RESET', `Admin ${req.user.name} performed a Factory Reset.`, 'system', req.user.id]
        ).catch(err => console.error("Notification log failed:", err));

        res.json({
            success: true,
            message: 'Factory reset complete. System restored to default state.'
        });

    } catch (error) {
        console.error('❌ Factory reset transaction error:', error);
        try { await run("ROLLBACK"); } catch (e) { console.error("Rollback failed:", e); }

        res.status(500).json({
            success: false,
            message: 'Factory reset failed',
            error: error.message
        });
    }
};

// Database Backup - Download current database
const downloadBackup = (req, res) => {
    try {
        const dbPath = path.resolve(__dirname, '..', 'database.sqlite');
        const filename = `backup-${new Date().toISOString().split('T')[0]}.sqlite`;

        console.log(`📦 Database backup requested by ${req.user.email}`);

        res.download(dbPath, filename, (err) => {
            if (err) {
                console.error('❌ Backup download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Failed to download backup'
                    });
                }
            } else {
                console.log(`✅ Backup downloaded successfully: ${filename}`);
            }
        });
    } catch (error) {
        console.error('❌ Backup preparation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to prepare backup',
            error: error.message
        });
    }
};

// Get System Statistics
const getSystemStats = (req, res) => {
    const db = getDB();

    const stats = {};
    let completed = 0;
    const total = 7;

    const checkComplete = () => {
        completed++;
        if (completed === total) {
            console.log('📊 System stats retrieved');
            res.json({ success: true, stats });
        }
    };

    // Total teachers
    db.get('SELECT COUNT(*) as count FROM teachers', [], (err, row) => {
        stats.totalTeachers = err ? 0 : row.count;
        checkComplete();
    });

    // Total students
    db.get('SELECT COUNT(*) as count FROM students', [], (err, row) => {
        stats.totalStudents = err ? 0 : row.count;
        checkComplete();
    });

    // Total subjects
    db.get('SELECT COUNT(*) as count FROM subjects', [], (err, row) => {
        stats.totalSubjects = err ? 0 : row.count;
        checkComplete();
    });

    // Total lectures
    db.get('SELECT COUNT(*) as count FROM lectures', [], (err, row) => {
        stats.totalLectures = err ? 0 : row.count;
        checkComplete();
    });

    // Pending leave requests
    db.get('SELECT COUNT(*) as count FROM leave_requests WHERE status = ?', ['pending'], (err, row) => {
        stats.pendingLeaves = err ? 0 : row.count;
        checkComplete();
    });

    // Assignments
    db.get('SELECT COUNT(*) as count FROM assignments', [], (err, row) => {
        stats.totalAssignments = err ? 0 : row.count;
        checkComplete();
    });

    // Active announcements
    db.get('SELECT COUNT(*) as count FROM announcements WHERE is_active = 1', [], (err, row) => {
        stats.activeAnnouncements = err ? 0 : row.count;
        checkComplete();
    });
};

// Get Email Service Status
const getEmailServiceStatus = async (req, res) => {
    try {
        const status = await getEmailStatus();
        res.json({ success: true, ...status });
    } catch (error) {
        console.error('❌ Failed to get email status:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Failed to get email service status',
            error: error.message
        });
    }
};

// Backup Management Functions

const createManualBackup = async (req, res) => {
    try {
        console.log(`📦 Manual backup requested by ${req.user.email}`);
        const result = await backupService.createBackup('manual');

        if (result.success) {
            res.json({
                success: true,
                message: 'Backup created successfully',
                backup: result.backup
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Backup creation failed',
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Backup creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Backup creation failed',
            error: error.message
        });
    }
};

const getAllBackups = async (req, res) => {
    try {
        const result = await backupService.listBackups();
        res.json(result);
    } catch (error) {
        console.error('❌ Failed to list backups:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            backups: []
        });
    }
};

const getBackupServiceStatus = async (req, res) => {
    try {
        const status = await backupService.getBackupStatus();
        res.json({ success: true, ...status });
    } catch (error) {
        console.error('❌ Failed to get backup status:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message
        });
    }
};

const restoreFromBackup = async (req, res) => {
    try {
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({
                success: false,
                message: 'Backup filename is required'
            });
        }

        console.log(`🔄 Backup restoration requested by ${req.user.email}: ${filename}`);
        const result = await backupService.restoreBackup(filename);

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('❌ Backup restoration error:', error);
        res.status(500).json({
            success: false,
            message: 'Backup restoration failed',
            error: error.message
        });
    }
};

const removeBackup = async (req, res) => {
    try {
        const { filename } = req.params;

        console.log(`🗑️  Backup deletion requested by ${req.user.email}: ${filename}`);
        const result = await backupService.deleteBackup(filename);

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('❌ Backup deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Backup deletion failed',
            error: error.message
        });
    }
};

module.exports = {
    assignRole,
    getAllUsersWithRoles,
    getRoleHistory,
    factoryReset,
    downloadBackup,
    getSystemStats,
    getEmailServiceStatus,
    createManualBackup,
    getAllBackups,
    getBackupServiceStatus,
    restoreFromBackup,
    removeBackup,
    revealPassword,
    setTempPassword
};
