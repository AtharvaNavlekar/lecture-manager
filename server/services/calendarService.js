const dbAsync = require('../utils/dbAsync');

/**
 * Calendar Service - iCal generation, conflict detection, recurring patterns
 */

/**
 * Generate iCal format calendar
 * @param {Array} lectures - Array of lecture objects
 * @param {Object} options - Calendar metadata
 * @returns {string} iCal formatted string
 */
const generateICalendar = (lectures, options = {}) => {
    const { calendarName = 'Lecture Schedule', timezone = 'Asia/Kolkata' } = options;

    const ical = [];

    // Calendar header
    ical.push('BEGIN:VCALENDAR');
    ical.push('VERSION:2.0');
    ical.push('PRODID:-//Lecture Manager//EN');
    ical.push(`X-WR-CALNAME:${calendarName}`);
    ical.push(`X-WR-TIMEZONE:${timezone}`);
    ical.push('CALSCALE:GREGORIAN');

    // Add events
    lectures.forEach(lecture => {
        const uid = `lecture-${lecture.id}@lecture-manager.local`;
        const dtstamp = formatICalDate(new Date());
        const dtstart = formatICalDate(new Date(`${lecture.date}T${lecture.start_time}`));
        const dtend = formatICalDate(new Date(`${lecture.date}T${lecture.end_time}`));

        ical.push('BEGIN:VEVENT');
        ical.push(`UID:${uid}`);
        ical.push(`DTSTAMP:${dtstamp}`);
        ical.push(`DTSTART:${dtstart}`);
        ical.push(`DTEND:${dtend}`);
        ical.push(`SUMMARY:${lecture.subject} - ${lecture.class_year}`);
        ical.push(`DESCRIPTION:Teacher: ${lecture.teacher_name || 'TBD'}\\nRoom: ${lecture.room || 'TBD'}`);
        ical.push(`LOCATION:${lecture.room || ''}`);
        ical.push(`STATUS:${lecture.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`);

        if (lecture.substitute_teacher_id) {
            ical.push(`COMMENT:Substitute assigned`);
        }

        ical.push('END:VEVENT');
    });

    ical.push('END:VCALENDAR');

    return ical.join('\r\n');
};

/**
 * Format date for iCal (YYYYMMDDTHHMMSSZ)
 */
const formatICalDate = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
};

/**
 * Detect scheduling conflicts
 * @param {Object} lecture - Lecture to check
 * @param {string} newDate - New date (if rescheduling)
 * @param {string} newStartTime - New start time
 * @param {string} newEndTime - New end time
 * @returns {Promise<Array>} Array of conflicts
 */
const detectConflicts = async (lecture, newDate, newStartTime, newEndTime) => {
    const conflicts = [];

    // Check teacher conflicts
    const teacherId = lecture.scheduled_teacher_id || lecture.substitute_teacher_id;
    if (teacherId) {
        const teacherConflicts = await dbAsync.all(`
            SELECT l.*, t.name as teacher_name
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE (l.scheduled_teacher_id = ? OR l.substitute_teacher_id = ?)
                AND l.date = ?
                AND l.id != ?
                AND l.status != 'cancelled'
                AND (
                    (l.start_time < ? AND l.end_time > ?) OR
                    (l.start_time < ? AND l.end_time > ?) OR
                    (l.start_time >= ? AND l.end_time <= ?)
                )
        `, [teacherId, teacherId, newDate, lecture.id || 0,
            newEndTime, newStartTime, newStartTime, newStartTime,
            newStartTime, newEndTime]);

        if (teacherConflicts.length > 0) {
            conflicts.push({
                type: 'teacher',
                message: `Teacher already has ${teacherConflicts.length} lecture(s) during this time`,
                details: teacherConflicts
            });
        }
    }

    // Check room conflicts
    if (lecture.room) {
        const roomConflicts = await dbAsync.all(`
            SELECT l.*, t.name as teacher_name
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE l.room = ?
                AND l.date = ?
                AND l.id != ?
                AND l.status != 'cancelled'
                AND (
                    (l.start_time < ? AND l.end_time > ?) OR
                    (l.start_time < ? AND l.end_time > ?) OR
                    (l.start_time >= ? AND l.end_time <= ?)
                )
        `, [lecture.room, newDate, lecture.id || 0,
            newEndTime, newStartTime, newStartTime, newStartTime,
            newStartTime, newEndTime]);

        if (roomConflicts.length > 0) {
            conflicts.push({
                type: 'room',
                message: `Room ${lecture.room} is already booked during this time`,
                details: roomConflicts
            });
        }
    }

    return conflicts;
};

/**
 * Expand recurring pattern into individual lectures
 * @param {Object} pattern - Recurring pattern definition
 * @returns {Array} Array of lecture dates
 */
const expandRecurringPattern = (pattern) => {
    const {
        startDate,
        endDate,
        frequency, // 'daily', 'weekly', 'biweekly', 'monthly'
        daysOfWeek = [], // [0-6] for Sunday-Saturday
        interval = 1
    } = pattern;

    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
        const dayOfWeek = current.getDay();

        let shouldInclude = false;

        switch (frequency) {
            case 'daily':
                shouldInclude = true;
                break;
            case 'weekly':
                shouldInclude = daysOfWeek.includes(dayOfWeek);
                break;
            case 'biweekly':
                const weeksDiff = Math.floor((current - start) / (7 * 24 * 60 * 60 * 1000));
                shouldInclude = weeksDiff % 2 === 0 && daysOfWeek.includes(dayOfWeek);
                break;
            case 'monthly':
                shouldInclude = current.getDate() === start.getDate();
                break;
        }

        if (shouldInclude) {
            dates.push(current.toISOString().split('T')[0]);
        }

        current.setDate(current.getDate() + interval);
    }

    return dates;
};

/**
 * Get calendar events for a date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @param {Object} filters - Additional filters (teacherId, department, etc.)
 * @returns {Promise<Array>} Calendar events
 */
const getCalendarEvents = async (startDate, endDate, filters = {}) => {
    let whereClause = 'l.date BETWEEN ? AND ?';
    const params = [startDate, endDate];

    if (filters.teacherId) {
        whereClause += ' AND (l.scheduled_teacher_id = ? OR l.substitute_teacher_id = ?)';
        params.push(filters.teacherId, filters.teacherId);
    }

    if (filters.department) {
        whereClause += ' AND t.department = ?';
        params.push(filters.department);
    }

    if (filters.classYear) {
        whereClause += ' AND l.class_year = ?';
        params.push(filters.classYear);
    }

    if (filters.room) {
        whereClause += ' AND l.room = ?';
        params.push(filters.room);
    }

    const query = `
        SELECT 
            l.*,
            t.name as teacher_name,
            sub.name as substitute_name
        FROM lectures l
        JOIN teachers t ON l.scheduled_teacher_id = t.id
        LEFT JOIN teachers sub ON l.substitute_teacher_id = sub.id
        WHERE ${whereClause}
        ORDER BY l.date, l.start_time
    `;

    const events = await dbAsync.all(query, params);

    // Transform to calendar event format
    return events.map(event => ({
        id: event.id,
        title: `${event.subject} - ${event.class_year}`,
        start: `${event.date}T${event.start_time}`,
        end: `${event.date}T${event.end_time}`,
        description: event.topic_covered || '',
        location: event.room,
        status: event.status,
        teacher: event.teacher_name,
        substitute: event.substitute_name,
        classYear: event.class_year,
        subject: event.subject,
        allDay: false,
        backgroundColor: getEventColor(event.status),
        borderColor: getEventColor(event.status)
    }));
};

/**
 * Get color for event based on status
 */
const getEventColor = (status) => {
    const colors = {
        'scheduled': '#3b82f6',
        'sub_assigned': '#f59e0b',
        'completed': '#10b981',
        'cancelled': '#ef4444',
        'ongoing': '#8b5cf6'
    };
    return colors[status] || '#6b7280';
};

/**
 * Reschedule lecture with conflict checking
 * @param {number} lectureId - Lecture ID
 * @param {Object} newSchedule - New date/time
 * @returns {Promise<Object>} Result with conflicts
 */
const rescheduleLecture = async (lectureId, newSchedule) => {
    const { date, startTime, endTime, room } = newSchedule;

    // Get current lecture
    const lecture = await dbAsync.get('SELECT * FROM lectures WHERE id = ?', [lectureId]);
    if (!lecture) {
        throw new Error('Lecture not found');
    }

    // Check for conflicts
    const conflicts = await detectConflicts({
        ...lecture,
        room: room || lecture.room
    }, date, startTime, endTime);

    if (conflicts.length > 0) {
        return {
            success: false,
            conflicts,
            message: 'Conflicts detected. Please resolve before rescheduling.'
        };
    }

    // Update lecture
    await dbAsync.run(`
        UPDATE lectures 
        SET date = ?, start_time = ?, end_time = ?, room = ?
        WHERE id = ?
    `, [date, startTime, endTime, room || lecture.room, lectureId]);

    return {
        success: true,
        message: 'Lecture rescheduled successfully'
    };
};

/**
 * Get academic calendar (holidays, semesters, etc.)
 * @returns {Promise<Array>} Academic events
 */
const getAcademicCalendar = async () => {
    try {
        const holidays = await dbAsync.all(`
            SELECT * FROM academic_calendar
            WHERE type IN ('holiday', 'semester_start', 'semester_end', 'exam')
            ORDER BY date
        `);
        return holidays;
    } catch (error) {
        // Table might not exist, return empty array
        return [];
    }
};

module.exports = {
    generateICalendar,
    detectConflicts,
    expandRecurringPattern,
    getCalendarEvents,
    rescheduleLecture,
    getAcademicCalendar,
    formatICalDate
};
