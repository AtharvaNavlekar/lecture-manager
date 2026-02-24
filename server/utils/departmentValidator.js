const { db } = require('../config/db');

/**
 * Department validation utility
 * Validates department codes against the departments config table
 */

/**
 * Get all valid department codes from the database
 * @returns {Promise<Array>} Array of valid department codes
 */
const getValidDepartments = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT code FROM departments WHERE is_active = 1', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.code));
        });
    });
};

/**
 * Validate a department code
 * @param {String} code - Department code to validate
 * @param {Array} validDepts - Optional cached list of valid departments
 * @returns {Object} { valid: boolean, suggestion: string|null, message: string }
 */
const validateDepartmentCode = async (code, validDepts = null) => {
    if (!code || typeof code !== 'string') {
        return { valid: false, suggestion: null, message: 'Department code is required' };
    }

    const trimmedCode = code.trim();

    // Get valid departments if not provided
    if (!validDepts) {
        validDepts = await getValidDepartments();
    }

    // Exact match
    if (validDepts.includes(trimmedCode)) {
        return { valid: true, suggestion: null, message: 'Valid department' };
    }

    // Case-insensitive match
    const upperCode = trimmedCode.toUpperCase();
    const caseMatch = validDepts.find(d => d.toUpperCase() === upperCode);
    if (caseMatch) {
        return {
            valid: false,
            suggestion: caseMatch,
            message: `Department code case mismatch. Did you mean '${caseMatch}'?`
        };
    }

    // Common mapping patterns (B.Sc. IT -> IT, etc.)
    const mappings = {
        'B.Sc. IT': 'IT',
        'B.Sc. CS': 'CS',
        'B.Sc. Data Science': 'DS',
        'B.Sc.IT': 'IT',
        'B.Sc.CS': 'CS',
        'BSc IT': 'IT',
        'BSc CS': 'CS',
        'Computer Science': 'CS',
        'Information Technology': 'IT',
        'Data Science': 'DS'
    };

    const suggestion = mappings[trimmedCode] || mappings[trimmedCode.replace(/\s+/g, '')];
    if (suggestion && validDepts.includes(suggestion)) {
        return {
            valid: false,
            suggestion,
            message: `Unknown department '${trimmedCode}'. Did you mean '${suggestion}'?`
        };
    }

    return {
        valid: false,
        suggestion: null,
        message: `Unknown department '${trimmedCode}'. Valid departments: ${validDepts.join(', ')}`
    };
};

/**
 * Batch validate multiple department codes
 * @param {Array} codes - Array of department codes to validate
 * @returns {Promise<Object>} { valid: Array, invalid: Array }
 */
const batchValidateDepartments = async (codes) => {
    const validDepts = await getValidDepartments();
    const results = { valid: [], invalid: [] };

    for (const code of codes) {
        const result = await validateDepartmentCode(code, validDepts);
        if (result.valid) {
            results.valid.push(code);
        } else {
            results.invalid.push({ code, ...result });
        }
    }

    return results;
};

module.exports = {
    getValidDepartments,
    validateDepartmentCode,
    batchValidateDepartments
};
