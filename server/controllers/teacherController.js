const { db } = require('../config/db');
const dbAsync = require('../utils/dbAsync');
const bcrypt = require('bcrypt');
const { parseExcel, validateTeacherData, generateTemplate } = require('../utils/excelParser');
const { exportTeachersCSV } = require('../utils/csvExporter');

const getAllTeachers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // Default 50 per page
        const offset = (page - 1) * limit;
        const department = req.query.department; // Optional filter

        // Build query with optional department filter
        let whereClause = '1=1';
        let params = [];

        if (department) {
            whereClause += ' AND department LIKE ?';
            params.push(`%${department}%`);
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM teachers WHERE ${whereClause}`;
        const { total } = await dbAsync.get(countQuery, params);

        // Get paginated results - INCLUDE is_active and status for Faculty Directory
        const dataQuery = `
            SELECT id, name, department, email, is_hod, is_acting_hod, post, 
                   contact_number, qualification, date_of_joining, 
                   is_active, status, profile_photo, role
            FROM teachers 
            WHERE ${whereClause}
            ORDER BY name ASC
            LIMIT ? OFFSET ?
        `;
        const teachers = await dbAsync.all(dataQuery, [...params, limit, offset]);

        res.json({
            success: true,
            teachers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: offset + teachers.length < total
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get all unique departments (for dropdowns)
const getAllDepartments = async (req, res) => {
    try {
        const departments = await dbAsync.all(`
            SELECT DISTINCT department 
            FROM teachers 
            WHERE department != 'Admin'
            ORDER BY department ASC
        `);

        res.json({
            success: true,
            departments: departments.map(d => d.department)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const addTeacher = async (req, res) => {
    let { id, name, department, email, is_hod, post, password } = req.body;

    // Security: Only Admin can add to any dept. HOD can only add to own dept.
    if (req.userRole !== 'admin') {
        if (req.userDept && department !== req.userDept) {
            return res.status(403).json({ success: false, message: "You can only manage teachers in your own department." });
        }
    }

    // UPDATE MODE: If ID exists, check if we are updating
    if (id) {
        // Check if teacher exists
        const existing = await new Promise((resolve) => {
            db.get("SELECT * FROM teachers WHERE id = ?", [id], (err, row) => resolve(row));
        });

        if (existing) {
            // It's an update
            const newPass = password ? await bcrypt.hash(password, 10) : existing.password;

            db.run("UPDATE teachers SET name = ?, department = ?, email = ?, is_hod = ?, post = ?, password = ? WHERE id = ?",
                [name, department, email, is_hod ? 1 : 0, post, newPass, id],
                (err) => {
                    if (err) return res.status(500).json({ success: false, message: err.message });
                    res.json({ success: true, message: "Teacher Profile Updated", mode: 'update' });
                }
            );
            return;
        }
    }

    // CREATE MODE
    // Auto-generate ID if not provided (Find max ID + 1)
    if (!id) {
        const last = await new Promise((resolve) => {
            db.get("SELECT MAX(id) as maxId FROM teachers", (err, row) => resolve(row?.maxId || 0));
        });
        id = last + 1;
    }

    // Generate secure random password if not provided
    const crypto = require('crypto');
    const passwordRaw = password || crypto.randomBytes(8).toString('base64').slice(0, 12);
    const hash = await bcrypt.hash(passwordRaw, 10);

    const stmt = db.prepare("INSERT INTO teachers (id, name, department, email, is_hod, post, password, is_active, status) VALUES (?,?,?,?,?,?,?,1,'active')");
    stmt.run(id, name, department, email, is_hod ? 1 : 0, post, hash, (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        // Return temporary password to admin (they should share it with the teacher)
        res.json({
            success: true,
            message: "Teacher Added Successfully",
            newId: id,
            mode: 'create',
            temporaryPassword: password ? undefined : passwordRaw // Only show if auto-generated
        });
    });
    stmt.finalize();
};

const { logAction } = require('../services/auditService');

const deleteTeacher = (req, res) => {
    const id = req.params.id || req.body.id;
    const requesterRole = req.userRole;
    const requesterDept = req.userDept;

    db.get("SELECT department, name FROM teachers WHERE id = ?", [id], (err, target) => {
        if (!target) return res.status(404).json({ success: false, message: "Teacher not found" });

        // Security: HOD can only delete own dept
        if (requesterRole !== 'admin') {
            if (target.department !== requesterDept) {
                return res.status(403).json({ success: false, message: "Unauthorized to delete this teacher." });
            }
        }

        db.serialize(() => {
            db.run("DELETE FROM teachers WHERE id = ?", [id]);
            db.run("DELETE FROM lectures WHERE scheduled_teacher_id = ?", [id]);
            db.run("DELETE FROM lectures WHERE substitute_teacher_id = ?", [id]);

            logAction(req, 'DELETE_TEACHER', `Teacher ID: ${id}`, `Deleted teacher ${target.name} from ${target.department}`);

            res.json({ success: true, message: "Teacher offboarded/deleted successfully" });
        });
    });
};

const importTeachers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
        // Parse Excel file
        const rows = await parseExcel(req.file.buffer);

        // Validate data
        const { validRows, errors, total } = await validateTeacherData(rows);

        if (validRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid data to import',
                errors,
                total,
                imported: 0
            });
        }

        // Import valid rows
        let imported = 0;
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO teachers 
            (name, email, department, post, is_hod, password) 
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const teacher of validRows) {
            const password = teacher.password || 'teacher123';
            const hash = await bcrypt.hash(password, 10);

            stmt.run(
                teacher.name,
                teacher.email,
                teacher.department,
                teacher.post,
                teacher.is_hod ? 1 : 0,
                hash
            );
            imported++;
        }

        stmt.finalize();

        console.log(`✅ Imported ${imported} teachers`);
        res.json({
            success: true,
            message: `Successfully imported ${imported} of ${total} teachers`,
            imported,
            total,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('❌ Teacher import error:', error);
        res.status(500).json({
            success: false,
            message: 'Import failed: ' + error.message
        });
    }
};

// Export teachers to CSV
const exportTeachers = (req, res) => {
    const { department, format } = req.query;

    let sql = 'SELECT id, name, email, department, post, is_hod, is_acting_hod FROM teachers WHERE 1=1';
    const params = [];

    // Filter by department if provided
    if (department) {
        sql += ' AND department = ?';
        params.push(department);
    }

    // Non-admin can only export their department
    if (req.userRole !== 'admin' && req.userDept) {
        sql += ' AND department = ?';
        params.push(req.userDept);
    }

    sql += ' ORDER BY department, name';

    db.all(sql, params, (err, teachers) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        try {
            const csv = exportTeachersCSV(teachers);
            const filename = `teachers_${department || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csv);

            console.log(`📊 Exported ${teachers.length} teachers to CSV`);

        } catch (error) {
            console.error('❌ Export error:', error);
            res.status(500).json({ success: false, message: 'Export failed' });
        }
    });
};

// Download import template
const downloadTemplate = async (req, res) => {
    try {
        const template = await generateTemplate('teacher');
        const filename = 'teacher_import_template.xlsx';

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(template);

        console.log('📥 Template downloaded');

    } catch (error) {
        console.error('❌ Template generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
};

module.exports = {
    getAllTeachers,
    getAllDepartments,
    addTeacher,
    deleteTeacher,
    importTeachers,
    exportTeachers,
    downloadTemplate
};
