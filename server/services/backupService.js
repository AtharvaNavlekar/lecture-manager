// Comprehensive Backup Service
// Handles automated backups, scheduling, retention, and restoration

const fs = require('fs').promises;
const path = require('path');
const { db } = require('../config/db');
const cron = require('node-cron');

// Backup configuration
let backupConfig = {
    enabled: process.env.BACKUP_ENABLED === 'true' || false,
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // 2 AM daily
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    localPath: process.env.BACKUP_PATH || path.join(__dirname, '..', 'backups'),
    cloudEnabled: process.env.CLOUD_BACKUP_ENABLED === 'true' || false,
    cloudProvider: process.env.CLOUD_PROVIDER || 'local', // local, s3, gcs, azure
    maxBackups: parseInt(process.env.MAX_BACKUPS) || 10
};

// Backup history tracking
const backupHistory = [];
let cronJob = null;

/**
 * Load backup settings from database
 */
const loadBackupSettings = async () => {
    return new Promise((resolve) => {
        db.all("SELECT key, value FROM settings WHERE key LIKE 'backup_%'", [], (err, rows) => {
            if (err) {
                console.error('Failed to load backup settings:', err);
                resolve();
                return;
            }

            rows.forEach(row => {
                switch (row.key) {
                    case 'backup_enabled':
                        backupConfig.enabled = row.value === 'true';
                        break;
                    case 'backup_schedule':
                        backupConfig.schedule = row.value;
                        break;
                    case 'backup_retention_days':
                        backupConfig.retentionDays = parseInt(row.value);
                        break;
                    case 'backup_max_backups':
                        backupConfig.maxBackups = parseInt(row.value);
                        break;
                }
            });

            console.log('📋 Backup settings loaded from database');
            resolve();
        });
    });
};

/**
 * Initialize backup directory
 */
const initializeBackupDirectory = async () => {
    try {
        await fs.mkdir(backupConfig.localPath, { recursive: true });
        console.log('📁 Backup directory initialized:', backupConfig.localPath);
        return true;
    } catch (error) {
        console.error('❌ Failed to create backup directory:', error);
        return false;
    }
};

/**
 * Create a backup of the database
 */
const createBackup = async (type = 'manual') => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${type}-${timestamp}.sqlite`;
        const backupPath = path.join(backupConfig.localPath, filename);

        const dbPath = path.resolve(__dirname, '..', 'database.sqlite');

        console.log(`🔄 Creating ${type} backup...`);

        // Copy database file
        await fs.copyFile(dbPath, backupPath);

        // Get file stats
        const stats = await fs.stat(backupPath);

        const backup = {
            id: Date.now(),
            filename,
            path: backupPath,
            type, // manual, scheduled, pre-update
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            createdAt: new Date(),
            verified: false
        };

        // Verify backup
        backup.verified = await verifyBackup(backupPath);

        if (backup.verified) {
            backupHistory.unshift(backup);

            // Store  in database
            db.run(
                `INSERT OR IGNORE INTO backup_logs (filename, type, size, created_at, verified) VALUES (?, ?, ?, ?, ?)`,
                [filename, type, stats.size, new Date().toISOString(), backup.verified ? 1 : 0],
                (err) => {
                    if (err) console.error('Failed to log backup:', err);
                }
            );

            console.log(`✅ Backup created successfully: ${filename} (${backup.sizeFormatted})`);

            // Clean old backups
            await cleanOldBackups();

            return { success: true, backup };
        } else {
            console.error(`❌ Backup verification failed: ${filename}`);
            // Delete corrupted backup
            await fs.unlink(backupPath).catch(() => { });
            return { success: false, error: 'Backup verification failed' };
        }

    } catch (error) {
        console.error('❌ Backup creation failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verify backup integrity
 */
const verifyBackup = async (backupPath) => {
    try {
        const stats = await fs.stat(backupPath);

        // Check file exists and has size
        if (stats.size === 0) {
            console.error('Backup file is empty');
            return false;
        }

        // TODO: Add SQLite integrity check
        // const sqlite3 = require('sqlite3');
        // const db = new sqlite3.Database(backupPath);
        // db.run('PRAGMA integrity_check', ...)

        return true;
    } catch (error) {
        console.error('Backup verification error:', error);
        return false;
    }
};

/**
 * Clean old backups based on retention policy
 */
const cleanOldBackups = async () => {
    try {
        const files = await fs.readdir(backupConfig.localPath);
        const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.sqlite'));

        if (backupFiles.length <= backupConfig.maxBackups) {
            return;
        }

        // Sort by creation time (newest first)
        const fileStats = await Promise.all(
            backupFiles.map(async (file) => {
                const filePath = path.join(backupConfig.localPath, file);
                const stats = await fs.stat(filePath);
                return { file, path: filePath, mtime: stats.mtime };
            })
        );

        fileStats.sort((a, b) => b.mtime - a.mtime);

        // Calculate retention cutoff
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - backupConfig.retentionDays);

        // Delete old files
        let deleted = 0;
        for (let i = backupConfig.maxBackups; i < fileStats.length; i++) {
            const file = fileStats[i];

            // Delete if beyond max backups OR older than retention period
            if (i >= backupConfig.maxBackups || file.mtime < retentionDate) {
                await fs.unlink(file.path);
                deleted++;
                console.log(`🗑️  Deleted old backup: ${file.file}`);
            }
        }

        if (deleted > 0) {
            console.log(`✅ Cleaned up ${deleted} old backup(s)`);
        }

    } catch (error) {
        console.error('❌ Failed to clean old backups:', error);
    }
};

/**
 * Restore database from backup
 */
const restoreBackup = async (filename) => {
    try {
        const backupPath = path.join(backupConfig.localPath, filename);
        const dbPath = path.resolve(__dirname, '..', 'database.sqlite');

        console.log(`🔄 Restoring backup: ${filename}`);

        // Verify backup before restoring
        const isValid = await verifyBackup(backupPath);
        if (!isValid) {
            throw new Error('Backup file is corrupted or invalid');
        }

        // Create safety backup of current database
        const safetyBackup = await createBackup('pre-restore');
        if (!safetyBackup.success) {
            throw new Error('Failed to create safety backup');
        }

        // Close database connections (this is tricky - may need app restart)
        // For now, we'll just copy - production should handle this carefully

        await fs.copyFile(backupPath, dbPath);

        console.log(`✅ Database restored from: ${filename}`);
        console.log(`⚠️  Server restart may be required for changes to take effect`);

        return {
            success: true,
            message: 'Backup restored successfully. Please restart the server.',
            safetyBackup: safetyBackup.backup.filename
        };

    } catch (error) {
        console.error('❌ Backup restoration failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * List all available backups
 */
const listBackups = async () => {
    try {
        const files = await fs.readdir(backupConfig.localPath);
        const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.sqlite'));

        const backups = await Promise.all(
            backupFiles.map(async (file) => {
                const filePath = path.join(backupConfig.localPath, file);
                const stats = await fs.stat(filePath);

                // Parse type from filename
                const typeMatch = file.match(/backup-(manual|scheduled|pre-update|pre-restore)/);
                const type = typeMatch ? typeMatch[1] : 'unknown';

                return {
                    filename: file,
                    path: filePath,
                    type,
                    size: stats.size,
                    sizeFormatted: formatBytes(stats.size),
                    createdAt: stats.mtime,
                    age: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)) // days
                };
            })
        );

        // Sort by creation time (newest first)
        backups.sort((a, b) => b.createdAt - a.createdAt);

        return { success: true, backups, count: backups.length };

    } catch (error) {
        console.error('❌ Failed to list backups:', error);
        return { success: false, error: error.message, backups: [] };
    }
};

/**
 * Delete a specific backup
 */
const deleteBackup = async (filename) => {
    try {
        const backupPath = path.join(backupConfig.localPath, filename);

        // Security check - ensure filename doesn't contain path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            throw new Error('Invalid filename');
        }

        await fs.unlink(backupPath);
        console.log(`🗑️  Deleted backup: ${filename}`);

        return { success: true, message: 'Backup deleted successfully' };

    } catch (error) {
        console.error('❌ Failed to delete backup:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get backup service status
 */
const getBackupStatus = async () => {
    try {
        const backups = await listBackups();

        return {
            status: backupConfig.enabled ? 'ready' : 'disabled',
            enabled: backupConfig.enabled,
            schedule: backupConfig.schedule,
            nextBackup: cronJob ? 'Scheduled' : 'Not scheduled',
            retentionDays: backupConfig.retentionDays,
            maxBackups: backupConfig.maxBackups,
            totalBackups: backups.backups.length,
            latestBackup: backups.backups[0] || null,
            storageUsed: backups.backups.reduce((sum, b) => sum + b.size, 0),
            storageUsedFormatted: formatBytes(backups.backups.reduce((sum, b) => sum + b.size, 0)),
            cloudEnabled: backupConfig.cloudEnabled,
            localPath: backupConfig.localPath
        };
    } catch (error) {
        return {
            status: 'error',
            error: error.message
        };
    }
};

/**
 * Start automated backup scheduler
 */
const startScheduler = () => {
    if (!backupConfig.enabled) {
        console.log('📅 Backup scheduler is DISABLED');
        return;
    }

    if (cronJob) {
        console.log('📅 Backup scheduler already running');
        return;
    }

    try {
        cronJob = cron.schedule(backupConfig.schedule, async () => {
            console.log('⏰ Scheduled backup triggered');
            await createBackup('scheduled');
        });

        console.log(`✅ Backup scheduler started: ${backupConfig.schedule}`);
    } catch (error) {
        console.error('❌ Failed to start backup scheduler:', error);
    }
};

/**
 * Stop automated backup scheduler
 */
const stopScheduler = () => {
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
        console.log('🛑 Backup scheduler stopped');
    }
};

/**
 * Update backup configuration
 */
const updateBackupConfig = (newConfig) => {
    const oldSchedule = backupConfig.schedule;
    backupConfig = { ...backupConfig, ...newConfig };

    // Restart scheduler if schedule changed
    if (newConfig.schedule && newConfig.schedule !== oldSchedule) {
        stopScheduler();
        startScheduler();
    }

    console.log('⚙️  Backup configuration updated');
};

/**
 * Utility: Format bytes to human readable
 */
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Initialize on module load
(async () => {
    await loadBackupSettings();
    await initializeBackupDirectory();

    if (backupConfig.enabled) {
        startScheduler();
    }
})();

module.exports = {
    createBackup,
    restoreBackup,
    listBackups,
    deleteBackup,
    getBackupStatus,
    startScheduler,
    stopScheduler,
    updateBackupConfig,
    verifyBackup,
    cleanOldBackups
};
