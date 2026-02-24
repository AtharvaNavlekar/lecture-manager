const { db } = require('../config/db');
const dbAsync = require('../utils/dbAsync');
const xlsx = require('xlsx');
const { logAction } = require('../services/auditService');
const { parseExcel, validateStudentData, generateTemplate } = require('../utils/excelParser');
const { exportStudentsCSV } = require('../utils/csvExporter');
const path = require('path');

// GET all students (with optional filtering and pagination)
const getAllStudents = async (req, res) => {
    try {
        const { department, class_year } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100; // Higher default for students
        const offset = (page - 1) * limit;

        console.log(`🔍 GET Students Request: Dept='${department}', Class='${class_year}', UserRole='${req.userRole}', UserDept='${req.userDept}'`);

        let whereClause = "1=1";
        const params = [];

        if (department) {
            whereClause += " AND department LIKE ?";
            params.push(`%${department}%`);
        }
        if (class_year) {
            // Normalize Class Year (Robust: handles case, parens, whitespace)
            const cy = class_year.toUpperCase().trim();
            let normalizedYear = cy;

            // Log what frontend actually sent
            console.log(`📋 Frontend sent class_year: "${class_year}" -> Normalized to: "${cy}"`);

            if (cy.includes('FY') || cy.includes('FIRST') || cy.includes('1ST')) normalizedYear = 'FY';
            else if (cy.includes('SY') || cy.includes('SECOND') || cy.includes('2ND')) normalizedYear = 'SY';
            else if (cy.includes('TY') || cy.includes('THIRD') || cy.includes('3RD')) normalizedYear = 'TY';

            console.log(`✅ Final normalized value: "${normalizedYear}"`);

            whereClause += " AND class_year = ?";
            params.push(normalizedYear);
        }

        // Security: Non-admins restricted to their dept
        if (req.userRole !== 'admin' && req.userDept) {
            whereClause += " AND department LIKE ?";
            params.push(`%${req.userDept}%`);
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM students WHERE ${whereClause}`;
        const { total } = await dbAsync.get(countQuery, params);

        console.log(`📊 Query: "SELECT * FROM students WHERE ${whereClause}" Params: [${params}] => Found ${total}`);

        // Get paginated results
        const dataQuery = `
            SELECT * FROM students 
            WHERE ${whereClause}
            ORDER BY class_year, roll_no
            LIMIT ? OFFSET ?
        `;
        const students = await dbAsync.all(dataQuery, [...params, limit, offset]);

        res.json({
            success: true,
            students,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: offset + students.length < total
            }
        });
    } catch (err) {
        console.error("❌ Error fetching students:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ADD / UPDATE Student
const saveStudent = (req, res) => {
    let { id, name, roll_no, department, class_year, email } = req.body;

    // Security Check
    if (req.userRole !== 'admin' && req.userDept && department !== req.userDept) {
        return res.status(403).json({ success: false, message: "Unauthorized dept" });
    }

    if (id) {
        // Update
        db.run("UPDATE students SET name=?, roll_no=?, department=?, class_year=?, email=? WHERE id=?",
            [name, roll_no, department, class_year, email, id],
            (err) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                logAction(req, 'UPDATE_STUDENT', `ID: ${id}`, `Updated profile for ${name}`);
                res.json({ success: true, message: "Student updated" });
            }
        );
    } else {
        // Create
        db.run("INSERT INTO students (name, roll_no, department, class_year, email) VALUES (?,?,?,?,?)",
            [name, roll_no, department, class_year, email],
            function (err) {
                if (err) return res.status(500).json({ success: false, message: err.message });
                logAction(req, 'ADD_STUDENT', `New ID: ${this.lastID}`, `Added student ${name} to ${class_year}`);
                res.json({ success: true, message: "Student added", newId: this.lastID });
            }
        );
    }
};

const deleteStudent = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    db.run("DELETE FROM students WHERE id = ?", [id], function (err) {
        if (err) {
            console.error('Delete student error:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        logAction(req, 'DELETE_STUDENT', `ID: ${id}`, `Student deleted`);
        res.json({ success: true, message: "Student deleted" });
    });
};

// BULK IMPORT via Excel
const uploadExcel = async (req, res) => {
    const fs = require('fs');
    const logFile = path.resolve(__dirname, '../../debug_log.txt');
    const log = (msg) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

    log('--- Upload Started ---');
    if (!req.file) {
        log('No file uploaded');
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    log(`File received: ${req.file.originalname}, Size: ${req.file.size}`);

    try {
        const rows = await parseExcel(req.file.buffer);
        log(`Parsed rows: ${rows.length}`);

        const { validRows, errors, total } = await validateStudentData(rows);
        log(`Validation: Valid=${validRows.length}, Errors=${errors.length}, Total=${total}`);

        if (validRows.length === 0) {
            log('No valid data');
            if (errors.length > 0) log(`First Error: ${JSON.stringify(errors[0])}`);
            return res.status(400).json({
                success: false,
                message: "No valid data to import",
                errors,
                total
            });
        }

        let imported = 0;
        let dbErrors = 0;

        db.serialize(() => {
            const stmt = db.prepare("INSERT INTO students (name, roll_no, department, class_year, email) VALUES (?,?,?,?,?)");

            validRows.forEach(row => {
                const dept = row.department || req.userDept || 'CS';
                // Security check logged
                if (req.userRole !== 'admin' && dept !== req.userDept) {
                    log(`Skipped row (Unauthorized dept): ${row.email}`);
                    dbErrors++;
                    return;
                }

                stmt.run(
                    row.name,
                    row.roll_no,
                    dept,
                    row.class_year,
                    row.email,
                    (err) => {
                        if (err) {
                            log(`DB Insert Error: ${err.message} for ${row.email}`);
                            dbErrors++;
                        } else {
                            imported++;
                        }
                    }
                );
            });
            stmt.finalize(() => {
                log(`Finalize: Imported=${imported}, DBErrors=${dbErrors}`);
                logAction(req, 'IMPORT_STUDENTS', 'Bulk Import', `Imported ${imported} students`);
                res.json({
                    success: true,
                    message: `Imported ${imported} students. ${dbErrors + errors.length} failed/skipped.`,
                    imported,
                    total
                });
            });
        });

    } catch (e) {
        log(`Exception: ${e.message}`);
        console.error(e);
        res.status(500).json({ success: false, message: "Failed to parse Excel" });
    }
};

// Export students to CSV
const exportStudents = (req, res) => {
    const { department, class_year, format } = req.query;

    let sql = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    // Apply filters
    if (department) {
        sql += ' AND department = ?';
        params.push(department);
    }
    if (class_year) {
        sql += ' AND class_year = ?';
        params.push(class_year);
    }

    // Security: Non-admin can only export their department
    if (req.userRole !== 'admin' && req.userDept) {
        sql += ' AND department = ?';
        params.push(req.userDept);
    }

    sql += ' ORDER BY class_year, roll_no';

    db.all(sql, params, (err, students) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        try {
            const csv = exportStudentsCSV(students);
            const filename = `students_${class_year || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csv);

            console.log(`📊 Exported ${students.length} students to CSV`);

        } catch (error) {
            console.error('❌ Export error:', error);
            res.status(500).json({ success: false, message: 'Export failed' });
        }
    });
};

// Download import template
const downloadStudentTemplate = async (req, res) => {
    try {
        const template = await generateTemplate('student');
        const filename = 'student_import_template.xlsx';

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(template);

        console.log('📥 Student template downloaded');

    } catch (error) {
        console.error('❌ Template generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
};

module.exports = {
    getAllStudents,
    saveStudent,
    deleteStudent,
    uploadExcel,
    exportStudents,
    downloadStudentTemplate
};
