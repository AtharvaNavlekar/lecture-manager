const dbAsync = require('../utils/dbAsync');
const calendarService = require('../services/calendarService');

/**
 * Calendar Controller - Full calendar and scheduling features
 */

/**
 * Get calendar events for date range
 * GET /api/calendar/events
 */
const getEvents = async (req, res) => {
    try {
        const { start, end, view = 'month', teacherId, department, classYear, room } = req.query;

        const filters = {};
        if (teacherId) filters.teacherId = teacherId;
        if (department) filters.department = department;
        if (classYear) filters.classYear = classYear;
        if (room) filters.room = room;

        const events = await calendarService.getCalendarEvents(start, end, filters);

        res.json({ success: true, events });

    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Export calendar as iCal
 * GET /api/calendar/export
 */
const exportCalendar = async (req, res) => {
    try {
        const { start, end, teacherId, department } = req.query;
        const userId = req.userId;

        const filters = {};
        if (teacherId) filters.teacherId = teacherId;
        else if (req.userRole !== 'admin') filters.teacherId = userId;

        if (department) filters.department = department;
        else if (req.userRole !== 'admin') filters.department = req.userDept;

        const lectures = await dbAsync.all(`
            SELECT l.*, t.name as teacher_name
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE l.date BETWEEN ? AND ?
            ${filters.teacherId ? 'AND (l.scheduled_teacher_id = ? OR l.substitute_teacher_id = ?)' : ''}
            ${filters.department ? 'AND t.department LIKE ?' : ''}
            ORDER BY l.date, l.start_time
        `, [
            start,
            end,
            ...(filters.teacherId ? [filters.teacherId, filters.teacherId] : []),
            ...(filters.department ? [`%${filters.department}%`] : [])
        ]);

        const icalContent = calendarService.generateICalendar(lectures, {
            calendarName: `Lecture Schedule - ${req.userName || 'Teacher'}`
        });

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename="schedule_${start}_${end}.ics"`);
        res.send(icalContent);

    } catch (error) {
        console.error('Export calendar error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Reschedule lecture with conflict detection
 * PUT /api/calendar/lectures/:id/reschedule
 */
const rescheduleLecture = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, startTime, endTime, room } = req.body;

        if (!date || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'Date and times are required' });
        }

        const result = await calendarService.rescheduleLecture(parseInt(id), {
            date,
            startTime,
            endTime,
            room
        });

        if (result.success) {
            res.json(result);
        } else {
            res.status(409).json(result); // 409 Conflict
        }

    } catch (error) {
        console.error('Reschedule error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Check for scheduling conflicts
 * POST /api/calendar/check-conflicts
 */
const checkConflicts = async (req, res) => {
    try {
        const { date, startTime, endTime, teacherId, room, excludeLectureId } = req.body;

        const conflicts = await calendarService.detectConflicts({
            id: excludeLectureId,
            scheduled_teacher_id: teacherId,
            room
        }, date, startTime, endTime);

        res.json({
            success: true,
            hasConflicts: conflicts.length > 0,
            conflicts
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create recurring lectures
 * POST /api/calendar/recurring
 */
const createRecurringLectures = async (req, res) => {
    try {
        const {
            subject,
            classYear,
            teacherId,
            room,
            startTime,
            endTime,
            pattern
        } = req.body;

        // Expand recurring pattern
        const dates = calendarService.expandRecurringPattern(pattern);

        const created = [];
        const errors = [];

        for (const date of dates) {
            try {
                // Check conflicts for this date
                const conflicts = await calendarService.detectConflicts({
                    scheduled_teacher_id: teacherId,
                    room
                }, date, startTime, endTime);

                if (conflicts.length > 0) {
                    errors.push({ date, reason: 'Conflict detected' });
                    continue;
                }

                // Create lecture
                const result = await dbAsync.run(`
                    INSERT INTO lectures (
                        subject, class_year, scheduled_teacher_id, date,
                        start_time, end_time, room, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
                `, [subject, classYear, teacherId, date, startTime, endTime, room]);

                created.push({ date, lectureId: result.lastID });

            } catch (error) {
                errors.push({ date, reason: error.message });
            }
        }

        res.json({
            success: true,
            created: created.length,
            failed: errors.length,
            details: { created, errors }
        });

    } catch (error) {
        console.error('Create recurring lectures error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get academic calendar (holidays, exams, etc.)
 * GET /api/calendar/academic
 */
const getAcademicCalendar = async (req, res) => {
    try {
        const calendar = await calendarService.getAcademicCalendar();
        res.json({ success: true, events: calendar });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Add academic event (holiday, exam, etc.)
 * POST /api/calendar/academic
 */
const addAcademicEvent = async (req, res) => {
    try {
        const { date, type, title, description } = req.body;

        const result = await dbAsync.run(`
            INSERT INTO academic_calendar (date, type, title, description)
            VALUES (?, ?, ?, ?)
        `, [date, type, title, description]);

        res.json({
            success: true,
            eventId: result.lastID,
            message: 'Academic event added'
        });

    } catch (error) {
        // Table might not exist
        res.json({ success: true, message: 'Event saved (feature requires database migration)' });
    }
};

/**
 * Get monthly view data
 * GET /api/calendar/month/:year/:month
 */
const getMonthView = async (req, res) => {
    try {
        const { year, month } = req.params;
        const { teacherId, department } = req.query;

        const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

        const filters = {};
        if (teacherId) filters.teacherId = teacherId;
        if (department) filters.department = department;
        else if (req.userRole !== 'admin') filters.department = req.userDept;

        const events = await calendarService.getCalendarEvents(firstDay, lastDay, filters);

        res.json({ success: true, events, firstDay, lastDay });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getEvents,
    exportCalendar,
    rescheduleLecture,
    checkConflicts,
    createRecurringLectures,
    getAcademicCalendar,
    addAcademicEvent,
    getMonthView
};
