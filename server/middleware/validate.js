const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: e.errors });
        }
        return res.status(500).json({ success: false, error: 'Validation error' });
    }
};

module.exports = { validate };
