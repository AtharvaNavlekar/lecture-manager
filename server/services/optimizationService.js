const dbAsync = require('../utils/dbAsync');

/**
 * Optimization Service - Timetable optimization and resource allocation
 */

/**
 * Find scheduling conflicts
 * @param {string} date - Date to check
 * @param {string} department - Department filter (optional)
 * @returns {Promise<Array>} Conflicts found
 */
const findSchedulingConflicts = async (date, department = null) => {
    try {
        let whereClause = 'l1.date = ?';
        const params = [date];

        if (department) {
            whereClause += ' AND t.department = ?';
            params.push(department);
        }

        // Find room conflicts
        const roomConflicts = await dbAsync.all(`
            SELECT 
                l1.id as lecture1_id,
                l2.id as lecture2_id,
                l1.room,
                l1.start_time,
                l1.end_time,
                l1.subject as subject1,
                l2.subject as subject2,
                t1.name as teacher1,
                t2.name as teacher2
            FROM lectures l1
            JOIN lectures l2 ON l1.room = l2.room 
                AND l1.date = l2.date
                AND l1.id < l2.id
                AND l1.status != 'cancelled'
                AND l2.status != 'cancelled'
            JOIN teachers t1 ON l1.scheduled_teacher_id = t1.id
            JOIN teachers t2 ON l2.scheduled_teacher_id = t2.id
            WHERE (
                (l1.start_time < l2.end_time AND l1.end_time > l2.start_time)
            ) AND ${whereClause}
        `, params);

        // Find teacher double-booking
        const teacherConflicts = await dbAsync.all(`
            SELECT 
                l1.id as lecture1_id,
                l2.id as lecture2_id,
                t.id as teacher_id,
                t.name as teacher_name,
                l1.start_time,
                l1.end_time,
                l1.subject as subject1,
                l2.subject as subject2,
                l1.room as room1,
                l2.room as room2
            FROM lectures l1
            JOIN lectures l2 ON l1.scheduled_teacher_id = l2.scheduled_teacher_id
                AND l1.date = l2.date
                AND l1.id < l2.id
                AND l1.status != 'cancelled'
                AND l2.status != 'cancelled'
            JOIN teachers t ON l1.scheduled_teacher_id = t.id
            WHERE (
                (l1.start_time < l2.end_time AND l1.end_time > l2.start_time)
            ) AND ${whereClause}
        `, params);

        return {
            roomConflicts,
            teacherConflicts,
            totalConflicts: roomConflicts.length + teacherConflicts.length
        };

    } catch (error) {
        console.error('Conflict detection error:', error);
        throw error;
    }
};

/**
 * Suggest optimal distribution of workload across teachers
 * @param {string} department - Department code
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Object>} Load balancing suggestions
 */
const suggestLoadBalancing = async (department, startDate, endDate) => {
    try {
        // Get current workload distribution
        const workload = await dbAsync.all(`
            SELECT 
                t.id,
                t.name,
                COUNT(DISTINCT l.id) as lecture_count,
                COUNT(DISTINCT CASE WHEN l.substitute_teacher_id = t.id THEN l.id END) as substitute_count,
                COUNT(DISTINCT l.subject) as subject_variety
            FROM teachers t
            LEFT JOIN lectures l ON (l.scheduled_teacher_id = t.id OR l.substitute_teacher_id = t.id)
                AND l.date BETWEEN ? AND ?
                AND l.status != 'cancelled'
            WHERE t.department = ?
            GROUP BY t.id
            ORDER BY lecture_count DESC
        `, [startDate, endDate, department]);

        if (workload.length === 0) {
            return { balanced: true, suggestions: [] };
        }

        // Calculate statistics
        const totalLectures = workload.reduce((sum, t) => sum + t.lecture_count, 0);
        const avgLectures = totalLectures / workload.length;
        const stdDev = Math.sqrt(
            workload.reduce((sum, t) => sum + Math.pow(t.lecture_count - avgLectures, 2), 0) / workload.length
        );

        // Find under and overloaded teachers
        const overloaded = workload.filter(t => t.lecture_count > avgLectures + stdDev);
        const underloaded = workload.filter(t => t.lecture_count < avgLectures - stdDev);

        const suggestions = [];
        if (overloaded.length > 0 && underloaded.length > 0) {
            overloaded.forEach(over => {
                underloaded.forEach(under => {
                    const transferCount = Math.floor((over.lecture_count - avgLectures) / 2);
                    if (transferCount > 0) {
                        suggestions.push({
                            from: over.name,
                            to: under.name,
                            suggestedTransfer: transferCount,
                            reason: `Balance workload (${over.name}: ${over.lecture_count}, ${under.name}: ${under.lecture_count})`
                        });
                    }
                });
            });
        }

        return {
            balanced: stdDev < avgLectures * 0.2, // Within 20% is considered balanced
            workload,
            statistics: {
                totalLectures,
                avgLectures: avgLectures.toFixed(2),
                stdDev: stdDev.toFixed(2)
            },
            suggestions
        };

    } catch (error) {
        console.error('Load balancing error:', error);
        throw error;
    }
};

/**
 * Optimize room utilization
 * @param {string} department - Department code
 * @param {string} date - Date to optimize
 * @returns {Promise<Object>} Room utilization analysis
 */
const analyzeRoomUtilization = async (department, date) => {
    try {
        // Get all lectures for the day
        const lectures = await dbAsync.all(`
            SELECT 
                l.room,
                l.start_time,
                l.end_time,
                l.subject,
                l.class_year,
                t.name as teacher_name
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE t.department = ? AND l.date = ? AND l.status != 'cancelled'
            ORDER BY l.room, l.start_time
        `, [department, date]);

        // Group by room
        const byRoom = {};
        lectures.forEach(lec => {
            if (!byRoom[lec.room]) {
                byRoom[lec.room] = [];
            }
            byRoom[lec.room].push(lec);
        });

        // Calculate utilization
        const workingHours = 8; // 9 AM to 5 PM
        const utilization = {};

        Object.keys(byRoom).forEach(room => {
            const roomLectures = byRoom[room];
            const totalMinutes = roomLectures.reduce((sum, lec) => {
                const start = new Date(`2000-01-01 ${lec.start_time}`);
                const end = new Date(`2000-01-01 ${lec.end_time}`);
                return sum + (end - start) / (1000 * 60);
            }, 0);

            const utilizationPercent = (totalMinutes / (workingHours * 60)) * 100;

            // Find gaps
            const gaps = [];
            for (let i = 0; i < roomLectures.length - 1; i++) {
                const currentEnd = new Date(`2000-01-01 ${roomLectures[i].end_time}`);
                const nextStart = new Date(`2000-01-01 ${roomLectures[i + 1].start_time}`);
                const gapMinutes = (nextStart - currentEnd) / (1000 * 60);
                if (gapMinutes > 15) { // Only report gaps > 15 minutes
                    gaps.push({
                        start: roomLectures[i].end_time,
                        end: roomLectures[i + 1].start_time,
                        duration: gapMinutes
                    });
                }
            }

            utilization[room] = {
                lectureCount: roomLectures.length,
                totalMinutes,
                utilizationPercent: utilizationPercent.toFixed(2),
                efficiency: utilizationPercent > 70 ? 'high' : utilizationPercent > 40 ? 'medium' : 'low',
                gaps
            };
        });

        return {
            date,
            department,
            roomCount: Object.keys(utilization).length,
            utilization,
            avgUtilization: (Object.values(utilization).reduce((sum, r) => sum + parseFloat(r.utilizationPercent), 0) / Object.keys(utilization).length).toFixed(2)
        };

    } catch (error) {
        console.error('Room utilization error:', error);
        throw error;
    }
};

/**
 * Generate smart scheduling recommendations
 * @param {string} department - Department code
 * @returns {Promise<Array>} Scheduling recommendations
 */
const generateSchedulingRecommendations = async (department) => {
    try {
        const recommendations = [];

        // Check for teachers with consecutive lectures (no breaks)
        const noBreaks = await dbAsync.all(`
            SELECT 
                t.id,
                t.name,
                COUNT(*) as consecutive_count
            FROM (
                SELECT 
                    l1.scheduled_teacher_id,
                    l1.date,
                    l1.end_time as end1,
                    l2.start_time as start2
                FROM lectures l1
                JOIN lectures l2 ON l1.scheduled_teacher_id = l2.scheduled_teacher_id
                    AND l1.date = l2.date
                    AND l1.end_time = l2.start_time
                    AND l1.status != 'cancelled'
                    AND l2.status != 'cancelled'
            ) consec
            JOIN teachers t ON consec.scheduled_teacher_id = t.id
            WHERE t.department = ?
            GROUP BY t.id
            HAVING consecutive_count > 3
        `, [department]);

        noBreaks.forEach(teacher => {
            recommendations.push({
                type: 'workload',
                priority: 'medium',
                teacher: teacher.name,
                issue: `${teacher.consecutive_count} instances of back-to-back lectures`,
                suggestion: 'Schedule breaks between lectures to prevent fatigue'
            });
        });

        // Check for underutilized teachers
        const underutilized = await dbAsync.all(`
            SELECT 
                t.id,
                t.name,
                COUNT(l.id) as lecture_count
            FROM teachers t
            LEFT JOIN lectures l ON l.scheduled_teacher_id = t.id
                AND l.date >= date('now', '-30 days')
                AND l.status != 'cancelled'
            WHERE t.department = ?
            GROUP BY t.id
            HAVING lecture_count < 10
        `, [department]);

        underutilized.forEach(teacher => {
            recommendations.push({
                type: 'resource',
                priority: 'low',
                teacher: teacher.name,
                issue: `Only ${teacher.lecture_count} lectures in past 30 days`,
                suggestion: 'Consider increasing workload or cross-department assignments'
            });
        });

        return recommendations;

    } catch (error) {
        console.error('Recommendations error:', error);
        throw error;
    }
};

module.exports = {
    findSchedulingConflicts,
    suggestLoadBalancing,
    analyzeRoomUtilization,
    generateSchedulingRecommendations
};
