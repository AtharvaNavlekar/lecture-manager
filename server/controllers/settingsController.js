const { getDB } = require('../config/db');

// Get all settings
const getAllSettings = (req, res) => {
    const db = getDB();

    db.all("SELECT * FROM settings", [], (err, rows) => {
        if (err) {
            console.error('❌ Failed to fetch settings:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        // Convert to key-value object for frontend convenience
        const settingsMap = {};
        rows.forEach(row => {
            settingsMap[row.key] = row.value;
        });

        console.log('📋 Settings retrieved:', rows.length, 'items');
        res.json({
            success: true,
            settings: settingsMap,
            raw: rows
        });
    });
};

// Update settings (Bulk update)
// Update settings (Bulk update)
const updateSettings = (req, res) => {
    let changes = req.body; // Expects { key: value, key2: value2 } OR { settings: [{key, value}, ...] }

    // Normalize input if sent as array wrapper
    if (changes.settings && Array.isArray(changes.settings)) {
        const map = {};
        changes.settings.forEach(s => {
            if (s.key) map[s.key] = s.value;
        });
        changes = map;
    }

    const db = getDB();

    if (!changes || Object.keys(changes).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No settings provided to update'
        });
    }

    const keys = Object.keys(changes);
    let completed = 0;
    let errors = [];
    let successful = 0;

    console.log(`⚙️  Updating ${keys.length} settings by ${req.user.email}`);

    keys.forEach(key => {
        db.run(
            "UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?",
            [changes[key], key],
            function (err) {
                if (err) {
                    console.error(`❌ Failed to update setting '${key}':`, err);
                    errors.push({ key, error: err.message });
                } else if (this.changes === 0) {
                    console.warn(`⚠️  Setting key '${key}' not found in database`);
                    errors.push({ key, error: 'Setting key not found' });
                } else {
                    successful++;
                    console.log(`✅ Updated setting '${key}' to '${changes[key]}'`);
                }

                completed++;

                if (completed === keys.length) {
                    if (errors.length > 0) {
                        res.status(207).json({ // 207 Multi-Status
                            success: successful > 0,
                            message: `${successful} settings updated, ${errors.length} failed`,
                            successful,
                            failed: errors.length,
                            errors
                        });
                    } else {
                        console.log(`✅ All ${successful} settings updated successfully`);
                        res.json({
                            success: true,
                            message: `${successful} settings updated successfully`,
                            updated: successful
                        });
                    }
                }
            }
        );
    });
};

// Get a single setting by key
const getSetting = (req, res) => {
    const { key } = req.params;
    const db = getDB();

    db.get("SELECT * FROM settings WHERE key = ?", [key], (err, row) => {
        if (err) {
            console.error(`❌ Failed to fetch setting '${key}':`, err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: `Setting '${key}' not found`
            });
        }

        res.json({
            success: true,
            setting: row
        });
    });
};

// Update a single setting
const updateSetting = (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    const db = getDB();

    if (value === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Value is required'
        });
    }

    console.log(`⚙️  Updating setting '${key}' to '${value}' by ${req.user.email}`);

    db.run(
        "UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?",
        [value, key],
        function (err) {
            if (err) {
                console.error(`❌ Failed to update setting '${key}':`, err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update setting',
                    error: err.message
                });
            }

            if (this.changes === 0) {
                console.warn(`⚠️  Setting key '${key}' not found`);
                return res.status(404).json({
                    success: false,
                    message: `Setting '${key}' not found`
                });
            }

            console.log(`✅ Setting '${key}' updated successfully`);
            res.json({
                success: true,
                message: 'Setting updated successfully'
            });
        }
    );
};

module.exports = {
    getAllSettings,
    updateSettings,
    getSetting,
    updateSetting
};
