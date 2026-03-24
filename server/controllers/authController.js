const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('FATAL: JWT_SECRET environment variable is required. Set it in your .env file.');

const login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Missing credentials" });

    db.get("SELECT * FROM teachers WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });

        if (!user) {
            // Fixed Admin Fallback System for System Bootstrap
            const FIXED_ADMIN_EMAIL = process.env.ADMIN_EMAIL;
            const FIXED_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

            if (!FIXED_ADMIN_EMAIL || !FIXED_ADMIN_PASSWORD) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (email === FIXED_ADMIN_EMAIL && password === FIXED_ADMIN_PASSWORD) {
                if (req.rateLimitHelpers) {
                    req.rateLimitHelpers.clearAttempts();
                }

                const role = 'admin';
                const token = jwt.sign({ id: 0, role, department: 'Administration' }, SECRET, { expiresIn: '24h' });

                const safeUser = {
                    id: 0,
                    name: 'System Setup Administrator',
                    email: FIXED_ADMIN_EMAIL,
                    department: 'Administration',
                    role: role,
                    is_fixed_admin: true
                };

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });

                return res.json({ success: true, user: safeUser });
            }

            // Track failed attempt
            if (req.rateLimitHelpers) {
                req.rateLimitHelpers.trackAttempt(false);
            }
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify password using bcrypt
        let isValid = false;
        if (user.password && user.password.startsWith('$2b$')) {
            isValid = await bcrypt.compare(String(password), user.password);
        } else {
            // Password is not hashed — reject login and log warning
            console.warn(`[SECURITY] User ${user.id} has an unhashed password. Run migrate-passwords.js to fix.`);
            return res.status(401).json({ success: false, message: "Account requires password reset. Contact administrator." });
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

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ success: true, user: safeUser });
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

                        res.cookie('token', token, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict',
                            maxAge: 24 * 60 * 60 * 1000 // 24 hours
                        });

                        res.status(201).json({ success: true, role: 'teacher', user: { id: this.lastID, name, email, department } });
                    }
                );
            } catch (e) {
                res.status(500).json({ success: false, message: "Encryption failed" });
            }
        });
    });
};

const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.json({ success: true, message: 'Logged out successfully' });
};

const me = (req, res) => {
    // Requires verifyToken middleware
    res.json({ success: true, user: req.user });
};

const changePassword = (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const userId = req.userId;
    if (userId === 0) {
        return res.status(403).json({ success: false, message: 'Fixed admin cannot change password here. Update your .env file.' });
    }

    db.get("SELECT password FROM teachers WHERE id = ?", [userId], async (err, row) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error.' });
        if (!row) return res.status(404).json({ success: false, message: 'User not found.' });

        try {
            const isValid = await bcrypt.compare(String(currentPassword), row.password);
            if (!isValid) {
                return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
            }

            const hash = await bcrypt.hash(newPassword, 10);
            db.run("UPDATE teachers SET password = ? WHERE id = ?", [hash, userId], function (updateErr) {
                if (updateErr) return res.status(500).json({ success: false, message: 'Failed to update password.' });
                console.log(`🔑 Password changed for user ${userId}`);
                res.json({ success: true, message: 'Password updated successfully.' });
            });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Server error during password change.' });
        }
    });
};

module.exports = { login, register, logout, me, changePassword };
