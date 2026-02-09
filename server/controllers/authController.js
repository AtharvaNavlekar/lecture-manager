const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const SECRET = process.env.JWT_SECRET || 'secret_key_123';

const login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Missing credentials" });

    db.get("SELECT * FROM teachers WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });

        if (!user) {
            // Track failed attempt
            if (req.rateLimitHelpers) {
                req.rateLimitHelpers.trackAttempt(false);
            }
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if password is hashed (starts with $2b$)
        let isValid = false;
        if (user.password && user.password.startsWith('$2b$')) {
            isValid = await bcrypt.compare(String(password), user.password);
        } else {
            // Legacy plaintext fallback (for migration)
            const legacyPass = user.password || String(user.id);
            isValid = String(password) === legacyPass;

            // Auto-hash for next time if valid
            if (isValid) {
                const hash = await bcrypt.hash(String(password), 10);
                db.run("UPDATE teachers SET password = ? WHERE id = ?", [hash, user.id]);
            }
        }

        if (!isValid) {
            // Track failed attempt
            if (req.rateLimitHelpers) {
                req.rateLimitHelpers.trackAttempt(false);
                const remaining = req.rateLimitHelpers.getRemainingAttempts();
                return res.status(401).json({
                    success: false,
                    message: "Invalid password",
                    remaining_attempts: remaining
                });
            }
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

        // Success - clear attempts
        if (req.rateLimitHelpers) {
            req.rateLimitHelpers.clearAttempts();
        }

        let role = 'teacher';
        if (user.department === 'Administration' || user.department === 'Admin') {
            role = 'admin';
        } else if (user.is_hod === 1 || user.is_acting_hod === 1) {
            role = 'hod';
        }

        const token = jwt.sign({ id: user.id, role, department: user.department }, SECRET, { expiresIn: '24h' });

        const { password: _, ...safeUser } = user;
        safeUser.role = role; // Add role to user object
        res.json({ success: true, token, user: safeUser });
    });
};

const register = (req, res) => {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password || !department) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // 1. Check Global Registration Gate
    db.get("SELECT value FROM settings WHERE key = 'allow_registrations'", [], async (err, row) => {
        if (err) return res.status(500).json({ success: false, message: "System error" });

        const allowReg = row ? row.value === 'true' : false; // Default false if not set
        if (!allowReg) {
            return res.status(403).json({
                success: false,
                message: "Self-service registration is disabled by the administrator. Please contact your HOD."
            });
        }

        // 2. Check existing user
        db.get("SELECT id FROM teachers WHERE email = ?", [email], async (err, existing) => {
            if (existing) {
                return res.status(409).json({ success: false, message: "Email already registered" });
            }

            try {
                // 3. Create User
                const hash = await bcrypt.hash(password, 10);

                // Defaults: not HOD, not Admin
                db.run(
                    "INSERT INTO teachers (name, email, password, department, post, is_hod, is_acting_hod) VALUES (?, ?, ?, ?, ?, 0, 0)",
                    [name, email, hash, department, 'Assistant Professor'],
                    function (err) {
                        if (err) return res.status(500).json({ success: false, message: err.message });

                        // Auto-login after register
                        const token = jwt.sign({ id: this.lastID, role: 'teacher', department }, SECRET, { expiresIn: '24h' });
                        res.status(201).json({ success: true, token, role: 'teacher', user: { id: this.lastID, name, email, department } });
                    }
                );
            } catch (e) {
                res.status(500).json({ success: false, message: "Encryption failed" });
            }
        });
    });
};

module.exports = { login, register };
