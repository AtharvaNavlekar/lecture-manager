const { db } = require('../config/db');

// Global search across all entities
const globalSearch = (req, res) => {
    const { query, types, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
        return res.json({
            success: true,
            query: query || '',
            results: {},
            totalResults: 0
        });
    }

    const searchTerm = `%${query.trim()}%`;
    const maxLimit = Math.min(parseInt(limit) || 10, 50);
    const results = {
        teachers: [],
        students: [],
        lectures: [],
        subjects: []
    };

    const searchTypes = types ? types.split(',') : ['teacher', 'student', 'lecture', 'subject'];

    // Security: Check user permissions
    const userDept = req.userDept;
    const isAdmin = req.userRole === 'admin';

    try {
        // Search Teachers
        if (searchTypes.includes('teacher')) {
            let sql = `
                SELECT id, name, email, department, post, is_hod, is_acting_hod
                FROM teachers 
                WHERE (name LIKE ? OR email LIKE ? OR department LIKE ?)
            `;
            const params = [searchTerm, searchTerm, searchTerm];

            // Department isolation for non-admins
            if (!isAdmin && userDept) {
                sql += ' AND department = ?';
                params.push(userDept);
            }

            sql += ` LIMIT ${maxLimit}`;

            results.teachers = db.prepare(sql).all(...params);
        }

        // Search Students
        if (searchTypes.includes('student')) {
            let sql = `
                SELECT id, name, roll_no, email, department, class_year
                FROM students 
                WHERE (name LIKE ? OR roll_no LIKE ? OR email LIKE ?)
            `;
            const params = [searchTerm, searchTerm, searchTerm];

            if (!isAdmin && userDept) {
                sql += ' AND department = ?';
                params.push(userDept);
            }

            sql += ` LIMIT ${maxLimit}`;

            results.students = db.prepare(sql).all(...params);
        }

        // Search Lectures
        if (searchTypes.includes('lecture')) {
            let sql = `
                SELECT l.id, l.subject, l.class_year, l.date, l.start_time, l.end_time, 
                       l.room, l.status, t.name as teacher_name, t.department
                FROM lectures l
                JOIN teachers t ON l.scheduled_teacher_id = t.id
                WHERE (l.subject LIKE ? OR t.name LIKE ? OR l.room LIKE ?)
            `;
            const params = [searchTerm, searchTerm, searchTerm];

            if (!isAdmin && userDept) {
                sql += ' AND t.department LIKE ?';
                params.push(`%${userDept}%`);
            }

            sql += ` ORDER BY l.date DESC LIMIT ${maxLimit}`;

            results.lectures = db.prepare(sql).all(...params);
        }

        // Search Subjects
        if (searchTypes.includes('subject')) {
            let sql = `
                SELECT DISTINCT subject as name, class_year, 
                       COUNT(*) as lecture_count
                FROM lectures
                WHERE subject LIKE ?
            `;
            const params = [searchTerm];

            if (!isAdmin && userDept) {
                sql += ` AND EXISTS (
                    SELECT 1 FROM teachers t 
                    WHERE t.id = lectures.scheduled_teacher_id 
                    AND t.department LIKE ?
                )`;
                params.push(`%${userDept}%`);
            }

            sql += ` GROUP BY subject, class_year LIMIT ${maxLimit}`;

            results.subjects = db.prepare(sql).all(...params);
        }

        const totalResults =
            results.teachers.length +
            results.students.length +
            results.lectures.length +
            results.subjects.length;

        console.log(`🔍 Search: "${query}" - ${totalResults} results`);

        res.json({
            success: true,
            query,
            results,
            totalResults
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed',
            error: error.message
        });
    }
};

module.exports = {
    globalSearch
};
