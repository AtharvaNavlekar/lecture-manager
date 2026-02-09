const dbAsync = require('../utils/dbAsync');

/**
 * Query Parser Service - Natural language query processing
 */

/**
 * Parse natural language query and convert to structured query
 * @param {string} query - User's natural language query
 * @param {Object} context - User context (userId, userDept, userRole)
 * @returns {Promise<Object>} Parsed query and results
 */
const parseAndExecuteQuery = async (query, context) => {
    const lowerQuery = query.toLowerCase().trim();

    // Define query patterns with their SQL equivalents
    const patterns = [
        {
            pattern: /who (?:is|are) teaching (\w+)/i,
            handler: async (match) => {
                const subject = match[1];
                const results = await dbAsync.all(`
                    SELECT DISTINCT t.name, t.email, t.department
                    FROM teachers t
                    JOIN lectures l ON l.scheduled_teacher_id = t.id
                    WHERE l.subject LIKE ?
                `, [`%${subject}%`]);
                return { type: 'teachers', intent: 'teaching_subject', results };
            }
        },
        {
            pattern: /(?:show|get|find) (?:my |the )?schedule (?:for |on )?(.+)?/i,
            handler: async (match) => {
                const dateStr = match[1] || 'today';
                const date = parseDateString(dateStr);
                const results = await dbAsync.all(`
                    SELECT l.*, t.name as teacher_name
                    FROM lectures l
                    JOIN teachers t ON l.scheduled_teacher_id = t.id
                    WHERE l.date = ? AND (l.scheduled_teacher_id = ? OR l.substitute_teacher_id = ?)
                    ORDER BY l.start_time
                `, [date, context.userId, context.userId]);
                return { type: 'schedule', intent: 'my_schedule', date, results };
            }
        },
        {
            pattern: /(?:how many|count) (?:students|lectures|classes) (.+)/i,
            handler: async (match) => {
                const filters = match[1];
                let query = 'SELECT COUNT(*) as count FROM ';
                let params = [];

                if (filters.includes('student')) {
                    query += 'students';
                    if (filters.includes('class')) {
                        const classMatch = filters.match(/class (\w+)/i);
                        if (classMatch) {
                            query += ' WHERE class_year = ?';
                            params.push(classMatch[1]);
                        }
                    }
                } else if (filters.includes('lecture') || filters.includes('class')) {
                    query += 'lectures WHERE status != "cancelled"';
                }

                const result = await dbAsync.get(query, params);
                return { type: 'count', intent: 'count_entities', results: result };
            }
        },
        {
            pattern: /(?:who|which students?) (?:have|has) low attendance/i,
            handler: async () => {
                const results = await dbAsync.all(`
                    SELECT 
                        s.id,
                        s.name,
                        s.roll_no,
                        s.class_year,
                        COUNT(ar.id) as total_classes,
                        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
                        ROUND((CAST(SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(ar.id)) * 100, 2) as attendance_percentage
                    FROM students s
                    LEFT JOIN attendance_records ar ON s.id = ar.student_id
                    WHERE s.department = ?
                    GROUP BY s.id
                    HAVING attendance_percentage < 75
                    ORDER BY attendance_percentage ASC
                    LIMIT 20
                `, [context.userDept]);
                return { type: 'students', intent: 'low_attendance', results };
            }
        },
        {
            pattern: /(?:show|get|list) (?:all )?teachers? in (\w+)/i,
            handler: async (match) => {
                const dept = match[1].toUpperCase();
                const results = await dbAsync.all(`
                    SELECT id, name, email, post, is_hod
                    FROM teachers
                    WHERE department = ?
                    ORDER BY name
                `, [dept]);
                return { type: 'teachers', intent: 'list_by_department', department: dept, results };
            }
        },
        {
            pattern: /(?:what|when) (?:is|are) (?:my |the )?(?:next |upcoming )?(?:class|lecture)/i,
            handler: async () => {
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                const currentTime = now.toTimeString().slice(0, 5);

                const results = await dbAsync.all(`
                    SELECT l.*, t.name as teacher_name
                    FROM lectures l
                    JOIN teachers t ON l.scheduled_teacher_id = t.id
                    WHERE (l.scheduled_teacher_id = ? OR l.substitute_teacher_id = ?)
                        AND ((l.date = ? AND l.start_time > ?) OR l.date > ?)
                        AND l.status != 'cancelled'
                    ORDER BY l.date, l.start_time
                    LIMIT 5
                `, [context.userId, context.userId, today, currentTime, today]);
                return { type: 'schedule', intent: 'upcoming_lectures', results };
            }
        },
        {
            pattern: /(?:average|avg) attendance (?:for |in |of )?(.+)?/i,
            handler: async (match) => {
                const filter = match[1] || 'department';
                let whereClause = '1=1';
                let params = [];

                if (filter.includes('class')) {
                    const classMatch = filter.match(/class (\w+)/i);
                    if (classMatch) {
                        whereClause = 's.class_year = ?';
                        params.push(classMatch[1]);
                    }
                } else if (context.userDept) {
                    whereClause = 's.department = ?';
                    params.push(context.userDept);
                }

                const result = await dbAsync.get(`
                    SELECT 
                        AVG(CASE WHEN ar.status = 'present' THEN 100.0 ELSE 0.0 END) as avg_attendance
                    FROM attendance_records ar
                    JOIN students s ON ar.student_id = s.id
                    WHERE ${whereClause}
                `, params);

                return { type: 'statistics', intent: 'average_attendance', results: result };
            }
        }
    ];

    // Try to match query against patterns
    for (const { pattern, handler } of patterns) {
        const match = lowerQuery.match(pattern);
        if (match) {
            try {
                const result = await handler(match);
                return {
                    success: true,
                    originalQuery: query,
                    ...result
                };
            } catch (error) {
                console.error('Query execution error:', error);
                return {
                    success: false,
                    originalQuery: query,
                    error: error.message
                };
            }
        }
    }

    // No pattern matched
    return {
        success: false,
        originalQuery: query,
        error: 'Query not understood. Try asking about schedules, attendance, teachers, or students.'
    };
};

/**
 * Parse date string to ISO date
 * @param {string} dateStr - Date string (today, tomorrow, monday, etc.)
 * @returns {string} ISO date string
 */
const parseDateString = (dateStr) => {
    const lower = dateStr.toLowerCase().trim();
    const now = new Date();

    if (lower === 'today' || lower === '') {
        return now.toISOString().split('T')[0];
    }

    if (lower === 'tomorrow') {
        now.setDate(now.getDate() + 1);
        return now.toISOString().split('T')[0];
    }

    if (lower === 'yesterday') {
        now.setDate(now.getDate() - 1);
        return now.toISOString().split('T')[0];
    }

    // Days of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = days.indexOf(lower);
    if (dayIndex !== -1) {
        const currentDay = now.getDay();
        let daysToAdd = dayIndex - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
        now.setDate(now.getDate() + daysToAdd);
        return now.toISOString().split('T')[0];
    }

    // Try parsing as ISO date
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // Default to today
    return new Date().toISOString().split('T')[0];
};

/**
 * Get query suggestions based on context
 * @param {Object} context - User context
 * @returns {Array} Suggested queries
 */
const getSuggestedQueries = (context) => {
    const suggestions = [
        "Show my schedule for today",
        "Who is teaching Mathematics",
        "Find students with low attendance",
        "What is my next lecture",
        "How many students in FY class",
        "Average attendance for my department"
    ];

    if (context.userRole === 'admin' || context.userRole === 'hod') {
        suggestions.push(
            "List all teachers in CS",
            "Show upcoming lectures",
            "Count lectures this week"
        );
    }

    return suggestions;
};

module.exports = {
    parseAndExecuteQuery,
    getSuggestedQueries,
    parseDateString
};
