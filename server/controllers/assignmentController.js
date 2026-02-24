const { getDB } = require('../config/db');
const fileService = require('../services/fileServiceEnhanced');

// Create assignment
const createAssignment = async (req, res) => {
    try {
        const { subject, class_year, title, description, due_date, max_marks } = req.body;
        const teacher_id = req.user.id;

        if (!subject || !class_year || !title) {
            return res.status(400).json({ success: false, message: 'Subject, class, and title are required' });
        }

        let filePath = null;
        if (req.file) {
            const fileResult = await fileService.uploadDocument(req.file, {
                uploadedBy: teacher_id,
                subject: subject,
                classYear: class_year,
                description: `Assignment: ${title}`,
                isPublic: false
            });
            filePath = fileResult.url;
        }

        const db = getDB();
        db.run(
            `INSERT INTO assignments (teacher_id, subject, class_year, title, description, due_date, max_marks, file_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [teacher_id, subject, class_year, title, description, due_date, max_marks || 100, filePath],
            function (err) {
                if (err) {
                    console.error('Create assignment error:', err);
                    return res.status(500).json({ success: false, message: 'Failed to create assignment' });
                }
                res.json({ success: true, message: 'Assignment created successfully', id: this.lastID });
            }
        );
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ success: false, message: 'Server error during assignment creation' });
    }
};

// Get assignments (filter by teacher, subject, class)
const getAssignments = (req, res) => {
    const { subject, class_year } = req.query;
    const teacher_id = req.user.id;
    const db = getDB();

    let query = `SELECT * FROM assignments WHERE teacher_id = ?`;
    const params = [teacher_id];

    if (subject) {
        query += ` AND subject = ?`;
        params.push(subject);
    }
    if (class_year) {
        query += ` AND class_year = ?`;
        params.push(class_year);
    }

    query += ` ORDER BY created_at DESC`;

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Get assignments error:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
        }
        res.json({ success: true, assignments: rows });
    });
};

// Get single assignment with submissions
const getAssignmentDetails = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.get(
        `SELECT * FROM assignments WHERE id = ?`,
        [id],
        (err, assignment) => {
            if (err) {
                console.error('Get assignment error:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch assignment' });
            }
            if (!assignment) {
                return res.status(404).json({ success: false, message: 'Assignment not found' });
            }

            // Get submissions
            db.all(
                `SELECT s.*, st.name as student_name, st.roll_no
                 FROM submissions s
                 JOIN students st ON s.student_id = st.id
                 WHERE s.assignment_id = ?`,
                [id],
                (err, submissions) => {
                    if (err) {
                        console.error('Get submissions error:', err);
                        return res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
                    }
                    res.json({ success: true, assignment, submissions });
                }
            );
        }
    );
};

// Update assignment
const updateAssignment = (req, res) => {
    const { id } = req.params;
    const { title, description, due_date, max_marks } = req.body;

    const db = getDB();
    db.run(
        `UPDATE assignments 
         SET title = COALESCE(?, title), 
             description = COALESCE(?, description),
             due_date = COALESCE(?, due_date),
             max_marks = COALESCE(?, max_marks)
         WHERE id = ? AND teacher_id = ?`,
        [title, description, due_date, max_marks, id, req.user.id],
        function (err) {
            if (err) {
                console.error('Update assignment error:', err);
                return res.status(500).json({ success: false, message: 'Failed to update assignment' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Assignment not found or unauthorized' });
            }
            res.json({ success: true, message: 'Assignment updated successfully' });
        }
    );
};

// Delete assignment
const deleteAssignment = (req, res) => {
    const { id } = req.params;
    const db = getDB();

    db.run(
        `DELETE FROM assignments WHERE id = ? AND teacher_id = ?`,
        [id, req.user.id],
        function (err) {
            if (err) {
                console.error('Delete assignment error:', err);
                return res.status(500).json({ success: false, message: 'Failed to delete assignment' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Assignment not found or unauthorized' });
            }
            res.json({ success: true, message: 'Assignment deleted successfully' });
        }
    );
};

// Grade submission
const gradeSubmission = (req, res) => {
    const { id } = req.params;
    const { marks, feedback } = req.body;

    const db = getDB();
    db.run(
        `UPDATE submissions 
         SET marks = ?, feedback = ?, status = 'graded'
         WHERE id = ?`,
        [marks, feedback, id],
        function (err) {
            if (err) {
                console.error('Grade submission error:', err);
                return res.status(500).json({ success: false, message: 'Failed to grade submission' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Submission not found' });
            }
            res.json({ success: true, message: 'Submission graded successfully' });
        }
    );
};

module.exports = {
    createAssignment,
    getAssignments,
    getAssignmentDetails,
    updateAssignment,
    deleteAssignment,
    gradeSubmission
};
