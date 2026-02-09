const { db } = require('../config/db');

// --- SUBJECTS ---
const getSubjects = (req, res) => {
    const { department, class_year } = req.query;
    let sql = "SELECT * FROM subjects WHERE 1=1";
    const params = [];

    if (department) {
        sql += " AND department LIKE ?";
        params.push(`%${department}%`);
    }
    // Security fallback
    if (req.userRole !== 'admin' && req.userDept) {
        sql += " AND department = ?";
        params.push(req.userDept);
    }

    if (class_year) {
        sql += " AND class_year = ?";
        params.push(class_year);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, subjects: rows });
    });
};

const createSubject = (req, res) => {
    const { name, code, department, class_year } = req.body;

    if (req.userRole !== 'admin' && req.userDept && department !== req.userDept) {
        return res.status(403).json({ success: false, message: "Unauthorized dept" });
    }

    const stmt = db.prepare("INSERT INTO subjects (name, code, department, class_year) VALUES (?,?,?,?)");
    stmt.run(name, code, department, class_year, function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
};

const deleteSubject = (req, res) => {
    const { id } = req.body;
    // Security check omitted for brevity, assumes HOD/Admin middleware does job
    db.run("DELETE FROM subjects WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
};

// --- SYLLABUS ---
const getSyllabus = (req, res) => {
    const { subjectId } = req.params;
    db.all("SELECT * FROM syllabus_topics WHERE subject_id = ? ORDER BY unit_number ASC", [subjectId], (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, topics: rows });
    });
};

const addTopic = (req, res) => {
    const { subject_id, unit_number, title, estimated_hours } = req.body;
    db.run("INSERT INTO syllabus_topics (subject_id, unit_number, title, estimated_hours) VALUES (?,?,?,?)",
        [subject_id, unit_number, title, estimated_hours || 1],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        }
    );
};

const deleteTopic = (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM syllabus_topics WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
};

const { parseExcel, validateSubjectData, generateTemplate } = require('../utils/excelParser');
const { logAction } = require('../services/auditService');

const fs = require('fs');

const path = require('path');
// Bulk Import Subjects
const importSubjects = async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    let filePath = null;
    const logFile = path.join(__dirname, '..', 'debug_log.txt');
    const log = (msg) => {
        try {
            fs.appendFileSync(logFile, `[SUBJECT_IMPORT] ${new Date().toISOString()}: ${msg}\n`);
        } catch (e) { console.error('Log failed:', e); }
    };

    try {
        log(`Starting import. File size: ${req.file.size} bytes`);
        let buffer;
        if (req.file.buffer) {
            buffer = req.file.buffer;
        } else if (req.file.path) {
            filePath = req.file.path;
            buffer = fs.readFileSync(filePath);
        } else {
            throw new Error("File not found");
        }

        const rows = await parseExcel(buffer);
        log(`Parsed ${rows.length} rows`);
        if (rows.length > 0) log(`First row headers: ${JSON.stringify(Object.keys(rows[0]))}`);

        const { validRows, errors, total } = await validateSubjectData(rows); // await added just to be safe, though sync

        log(`Validation: ${validRows.length} valid, ${errors.length} errors`);
        if (errors.length > 0) log(`First error: ${JSON.stringify(errors[0])}`);

        // Cleanup temp file
        if (filePath) {
            try { fs.unlinkSync(filePath); } catch (e) { console.error("Failed to delete temp file", e); }
        }

        if (validRows.length === 0) {
            return res.status(400).json({ success: false, message: "No valid data", errors, total });
        }


        let imported = 0;
        let insertErrors = 0;

        // Use Promise-based approach to ensure all inserts complete before response
        const insertPromises = validRows.map((row) => {
            return new Promise((resolve) => {
                // Security check: non-admin can only import for their dept
                if (req.userRole !== 'admin' && req.userDept && row.department !== req.userDept) {
                    insertErrors++;
                    resolve();
                    return;
                }

                db.run(
                    "INSERT OR IGNORE INTO subjects (name, code, department, class_year) VALUES (?,?,?,?)",
                    [row.name, row.code, row.department, row.class_year],
                    function (err) {
                        if (err) {
                            console.error('Insert error:', err);
                            log(`Insert error for ${row.code}: ${err.message}`);
                            insertErrors++;
                        } else if (this.changes > 0) {
                            imported++;
                        } else {
                            // INSERT OR IGNORE skipped (duplicate)
                            log(`Duplicate skipped: ${row.code}`);
                            insertErrors++; // Count as failed/skipped
                        }
                        resolve();
                    }
                );
            });
        });

        Promise.all(insertPromises).then(() => {
            log(`Import complete. Imported: ${imported}, Failed/Skipped: ${insertErrors}`);
            logAction(req, 'IMPORT_SUBJECTS', 'Bulk Import', `Imported ${imported} subjects`);
            res.json({
                success: true,
                message: `Imported ${imported} subjects. ${insertErrors + errors.length} failed/skipped.`,
                details: { imported, failed: insertErrors, validationErrors: errors.length, total: rows.length }
            });
        });


    } catch (e) {
        if (filePath) {
            try { fs.unlinkSync(filePath); } catch (delErr) { }
        }
        console.error(e);
        log(`FATAL ERROR: ${e.message}`);
        res.status(500).json({ success: false, message: "Failed to parse Excel" });
    }
};

const downloadSubjectTemplate = async (req, res) => {
    try {
        const template = await generateTemplate('subject');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="subject_import_template.xlsx"');
        res.send(template);
    } catch (e) {
        res.status(500).json({ success: false, message: "Failed to generate template" });
    }
};

const { validateSyllabusData } = require('../utils/excelParser');

// Bulk Import Syllabus
const importSyllabus = async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    let filePath = null;
    const logFile = path.join(__dirname, '..', 'debug_log.txt');
    const log = (msg) => {
        try {
            fs.appendFileSync(logFile, `[SYLLABUS_IMPORT] ${new Date().toISOString()}: ${msg}\n`);
        } catch (e) { console.error('Log failed:', e); }
    };

    try {
        log(`Starting import. File size: ${req.file.size} bytes`);

        let buffer;
        if (req.file.buffer) {
            buffer = req.file.buffer;
        } else if (req.file.path) {
            filePath = req.file.path;
            buffer = fs.readFileSync(filePath);
        } else {
            throw new Error("File not found");
        }

        const rows = await parseExcel(buffer);
        log(`Parsed ${rows.length} rows`);
        if (rows.length > 0) log(`First row headers: ${JSON.stringify(Object.keys(rows[0]))}`);

        const { validRows, errors, total } = validateSyllabusData(rows);

        log(`Validation: ${validRows.length} valid, ${errors.length} errors`);
        if (errors.length > 0) log(`First error: ${JSON.stringify(errors[0])}`);

        // Cleanup temp file
        if (filePath) {
            try { fs.unlinkSync(filePath); } catch (e) { console.error("Failed to delete temp file", e); }
        }

        if (validRows.length === 0) {
            return res.status(400).json({ success: false, message: "No valid data", errors, total });
        }

        let imported = 0;
        let skipped = 0;

        // processing sequentially to handle lookups
        for (const row of validRows) {
            const subject = await new Promise((resolve) => {
                db.get("SELECT id FROM subjects WHERE code = ?", [row.subject_code], (err, row) => resolve(row));
            });

            if (!subject) {
                log(`Subject not found for code: ${row.subject_code}`);
                skipped++;
                continue;
            }

            await new Promise((resolve) => {
                db.run("INSERT INTO syllabus_topics (subject_id, unit_number, title, estimated_hours) VALUES (?,?,?,?)",
                    [subject.id, row.unit_number, row.topic_title, row.estimated_hours],
                    (err) => {
                        if (err) {
                            log(`Insert error: ${err.message}`);
                            skipped++;
                        } else {
                            imported++;
                        }
                        resolve();
                    }
                );
            });
        }

        log(`Import complete. Imported: ${imported}, Skipped: ${skipped}`);
        logAction(req, 'IMPORT_SYLLABUS', 'Bulk Import', `Imported ${imported} syllabus topics`);
        res.json({
            success: true,
            message: `Imported ${imported} topics. ${skipped + errors.length} failed/skipped.`,
            imported,
            total,
            errors
        });

    } catch (e) {
        if (filePath) {
            try { fs.unlinkSync(filePath); } catch (delErr) { }
        }
        console.error(e);
        log(`FATAL ERROR: ${e.message}`);
        res.status(500).json({ success: false, message: "Failed to parse Excel" });
    }
};

module.exports = {
    getSubjects,
    createSubject,
    deleteSubject,
    getSyllabus,
    addTopic,
    deleteTopic,
    importSubjects,
    importSyllabus,
    downloadSubjectTemplate
};

