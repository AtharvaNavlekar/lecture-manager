const { db } = require('../config/db');
const cache = require('../utils/cache');

// Get aggregated HOD analytics
const getHodAnalytics = (req, res) => {
    const teacherId = req.userId;
    const userRole = req.userRole;

    const cacheKey = `hod_analytics_${teacherId}_${userRole}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    console.log(`[Analytics] Endpoint hit - userId: ${teacherId}, userRole: ${userRole}`);

    if (!teacherId) {
        console.error('[Analytics] ERROR: req.userId is undefined! Auth middleware may have failed.');
        return res.status(401).json({ success: false, error: 'User ID not found. Please login again.' });
    }

    // ADMIN BYPASS: Admin doesn't need to exist in teachers table
    if (userRole === 'admin') {
        console.log('[Analytics] Admin detected - querying all departments');

        db.all('SELECT id FROM teachers', [], (err, teachers) => {
            if (err) {
                console.error('[Analytics] Error fetching teachers:', err);
                return res.status(500).json({ success: false, error: err.message });
            }

            const teacherIds = teachers.map(t => t.id);
            console.log(`[Analytics] Found ${teachers.length} teachers for admin view`);

            if (teacherIds.length === 0) {
                return res.json({
                    success: true,
                    analytics: { totalLectures: 0, completedLectures: 0, totalAssignments: 0, gradedAssignments: 0 }
                });
            }

            const placeholders = teacherIds.map(() => '?').join(',');

            db.get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                FROM lectures 
                WHERE scheduled_teacher_id IN (${placeholders})
            `, teacherIds, (err2, lectureStats) => {
                if (err2) {
                    console.error('[Analytics] Error fetching lecture stats:', err2);
                    return res.status(500).json({ success: false, error: err2.message });
                }

                const analytics = {
                    totalLectures: lectureStats.total || 0,
                    completedLectures: lectureStats.completed || 0,
                    totalAssignments: 0,
                    gradedAssignments: 0
                };

                console.log('[Analytics] Admin result:', analytics);
                const response = { success: true, analytics };
                cache.set(cacheKey, response);
                res.json(response);
            });
        });
        return;
    }

    // For non-admin, lookup their teacher record
    db.get("SELECT department, is_hod FROM teachers WHERE id = ?", [teacherId], (err, me) => {
        if (err || !me) {
            console.error('[Analytics] Teacher not found for ID:', teacherId, 'Error:', err);
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const dept = me.department;
        console.log(`[Analytics] Request from teacher ${teacherId}, dept: ${dept}, is_hod: ${me.is_hod}, role: ${userRole}`);

        // Admin sees all departments, others see only their department
        const whereClause = userRole === 'admin' ? '' : 'WHERE department = ?';
        const params = userRole === 'admin' ? [] : [dept];

        // Get all teacher IDs in scope
        db.all(`SELECT id FROM teachers ${whereClause}`, params, (err1, teachers) => {
            if (err1) {
                console.error('[Analytics] Error fetching teachers:', err1);
                return res.status(500).json({ success: false, error: err1.message });
            }

            const teacherIds = teachers.map(t => t.id);
            const placeholders = teacherIds.map(() => '?').join(',');

            console.log(`[Analytics] Found ${teachers.length} teachers, IDs: ${teacherIds.slice(0, 5).join(', ')}${teacherIds.length > 5 ? '...' : ''}`);

            if (teacherIds.length === 0) {
                return res.json({
                    success: true,
                    analytics: {
                        totalLectures: 0,
                        completedLectures: 0,
                        totalAssignments: 0,
                        gradedAssignments: 0
                    }
                });
            }

            // Get lecture stats
            db.get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                FROM lectures 
                WHERE scheduled_teacher_id IN (${placeholders})
            `, teacherIds, (err2, lectureStats) => {
                if (err2) {
                    console.error('[Analytics] Error fetching lecture stats:', err2);
                    return res.status(500).json({ success: false, error: err2.message });
                }

                // Get assignment stats
                db.get(`
                    SELECT 
                        COUNT(*) as total,
                        0 as graded
                    FROM assignments 
                    WHERE teacher_id IN (${placeholders})
                `, teacherIds, (err3, assignmentStats) => {
                    if (err3) {
                        console.error('[Analytics] Error fetching assignment stats:', err3);
                        return res.status(500).json({ success: false, error: err3.message });
                    }

                    const analytics = {
                        totalLectures: lectureStats.total || 0,
                        completedLectures: lectureStats.completed || 0,
                        totalAssignments: assignmentStats.total || 0,
                        gradedAssignments: assignmentStats.graded || 0
                    };

                    console.log('[Analytics] Returning:', analytics);
                    const response = { success: true, analytics };
                    cache.set(cacheKey, response);
                    res.json(response);
                });
            });
        });
    });
};

// Get Attendance Trends (Real Data)
const getAttendanceTrends = (req, res) => {
    // 1. Monthly Trend
    const monthlyQuery = `
        SELECT 
            date as month_key,
            SUM(attendance_count) as total_attended,
            SUM(total_students) as total_possible,
            COUNT(*) as lecture_count
        FROM lectures 
        WHERE status = 'completed'
        GROUP BY date
        ORDER BY date ASC
    `;

    // 2. By Class
    const classQuery = `
        SELECT 
            class_year as name,
            SUM(attendance_count) as total_attended,
            SUM(total_students) as total_possible,
            COUNT(*) as lecture_count
        FROM lectures 
        WHERE status = 'completed'
        GROUP BY class_year
    `;

    // 3. By Subject
    const subjectQuery = `
        SELECT 
            subject as name,
            SUM(attendance_count) as total_attended,
            SUM(total_students) as total_possible,
            COUNT(*) as lecture_count
        FROM lectures 
        WHERE status = 'completed'
        GROUP BY subject
        ORDER BY total_possible DESC
        LIMIT 10
    `;

    db.all(monthlyQuery, [], (err, monthlyRows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        db.all(classQuery, [], (err2, classRows) => {
            if (err2) return res.status(500).json({ success: false, error: err2.message });

            db.all(subjectQuery, [], (err3, subjectRows) => {
                if (err3) return res.status(500).json({ success: false, error: err3.message });

                // Format Data
                // Format Data with Gap Filling (Last 14 Days)
                const dataMap = new Map();
                monthlyRows.forEach(row => {
                    dataMap.set(row.month_key, row);
                });

                const monthlyTrend = [];
                const today = new Date();

                for (let i = 13; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const dateKey = d.toISOString().split('T')[0];

                    const row = dataMap.get(dateKey);

                    if (row) {
                        monthlyTrend.push({
                            month: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            total: row.lecture_count,
                            rate: row.total_possible > 0 ? Math.round((row.total_attended / row.total_possible) * 100) : 0
                        });
                    } else {
                        monthlyTrend.push({
                            month: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            total: 0,
                            rate: 0
                        });
                    }
                }

                const byClass = classRows.map(row => ({
                    name: row.name,
                    rate: row.total_possible > 0 ? Math.round((row.total_attended / row.total_possible) * 100) : 0
                }));

                const bySubject = subjectRows.map(row => ({
                    name: row.name,
                    rate: row.total_possible > 0 ? Math.round((row.total_attended / row.total_possible) * 100) : 0
                }));

                res.json({
                    success: true,
                    data: {
                        monthlyTrend,
                        byClass,
                        bySubject,
                        overall: [] // Deprecated or mapped to monthly
                    }
                });
            });
        });
    });
};

module.exports = { getHodAnalytics, getAttendanceTrends };
