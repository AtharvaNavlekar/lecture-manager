// Middleware for backend validation
const validateConfig = (req, res, next) => {
    const { name, code, start_time, end_time } = req.body;
    const path = req.path;

    // Time Slot Validation
    if (path.includes('time-slots')) {
        if (!start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Start time and End time are required' });
        }
        if (start_time >= end_time) {
            return res.status(400).json({ success: false, message: 'Start time must be before end time' });
        }
    }

    // Generic Name/Code Validation
    if (name && name.length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }

    if (code && !/^[A-Za-z0-9_-]+$/.test(code)) {
        return res.status(400).json({ success: false, message: 'Code must comprise alphanumeric characters, hyphens or underscores only' });
    }

    next();
};

const validateImport = (data, type) => {
    const errors = [];
    if (!Array.isArray(data)) return ['Invalid data format: Expected an array'];

    data.forEach((row, index) => {
        if (type === 'departments' && (!row.name || !row.code)) {
            errors.push(`Row ${index + 1}: Missing name or code`);
        }
        if (type === 'time-slots' && (!row.start_time || !row.end_time)) {
            errors.push(`Row ${index + 1}: Missing times`);
        }
    });

    return errors;
};

module.exports = { validateConfig, validateImport };
