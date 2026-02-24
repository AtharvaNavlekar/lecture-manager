const { db } = require('../config/db');

// Get department stats (HOD only)
const getHodStats = (req, res) => {
    const teacherId = req.userId;

    db.get("SELECT department FROM teachers WHERE id = ?", [teacherId], (err, me) => {
        if (err) {
            console.error('[HOD Stats] Error finding teacher:', err);
            return res.status(500).json({ success: false, error: err.message });
        }

        if (!me) {
            console.error('[HOD Stats] Teacher not found:', teacherId);
            return res.status(404).json({ success: false, error: 'Teacher not found' });
        }

        const dept = me.department;
        console.log(`[HOD Stats] Request from teacher ${teacherId}, dept: ${dept}`);

        // Use simple direct queries instead of complex subqueries
        db.get('SELECT COUNT(*) as facultyCount FROM teachers WHERE department = ?', [dept], (err1, teachers) => {
            if (err1) {
                console.error('[HOD Stats] Teachers query error:', err1);
                return res.status(500).json({ success: false, error: err1.message });
            }

            db.get('SELECT COUNT(*) as studentCount FROM students WHERE department = ?', [dept], (err2, students) => {
                if (err2) {
                    console.error('[HOD Stats] Students query error:', err2);
                    return res.status(500).json({ success: false, error: err2.message });
                }

                // Get today's date
                const today = new Date().toISOString().split('T')[0];
                db.get(`
                    SELECT COUNT(*) as dailyClasses 
                    FROM lectures l
                    JOIN teachers t ON l.scheduled_teacher_id = t.id
                    WHERE t.department = ? AND l.date = ?
                `, [dept, today], (err3, todayLectures) => {
                    if (err3) {
                        console.error('[HOD Stats] Today lectures query error:', err3);
                        return res.status(500).json({ success: false, error: err3.message });
                    }

                    // Get list of teachers for delegation
                    db.all('SELECT id, name, post, is_acting_hod FROM teachers WHERE department = ? AND id != ?',
                        [dept, teacherId], (err4, teachersList) => {
                            if (err4) {
                                console.error('[HOD Stats] Teachers list error:', err4);
                                return res.status(500).json({ success: false, error: err4.message });
                            }

                            const stats = {
                                facultyCount: teachers.facultyCount || 0,
                                studentCount: students.studentCount || 0,
                                dailyClasses: todayLectures.dailyClasses || 0,
                                occupationRate: 0 // Can be calculated based on requirements
                            };

                            console.log('[HOD Stats] Returning:', stats);
                            res.json({ success: true, stats, teachers: teachersList });
                        });
                });
            });
        });
    });
};

// Delegate Authority
const delegateAuthority = (req, res) => {
    const { targetTeacherId } = req.body;
    const currentHodId = req.userId;

    // 1. Verify requester is actual HOD (or maybe we allow chain delegation? No, let's stick to true HOD)
    db.get("SELECT is_hod, department FROM teachers WHERE id = ?", [currentHodId], (err, me) => {
        if (me.is_hod !== 1) return res.status(403).json({ success: false, message: "Only the permanent HOD can delegate." });

        // 2. Reset any existing acting HOD in this department
        db.run("UPDATE teachers SET is_acting_hod = 0 WHERE department LIKE ?", [`%${me.department}%`], (err) => {

            // 3. Set new acting HOD if target provided (if null, it's just a revoke)
            if (targetTeacherId) {
                db.run("UPDATE teachers SET is_acting_hod = 1 WHERE id = ?", [targetTeacherId], (err) => {
                    res.json({ success: true, message: "Authority Delegated" });
                });
            } else {
                res.json({ success: true, message: "Authority Revoked" });
            }
        });
    });
};

// Deep Analytics for HOD
const getAnalytics = (req, res) => {
    const teacherId = req.userId;

    db.get("SELECT department FROM teachers WHERE id = ?", [teacherId], (err, me) => {
        if (err || !me) {
            console.error('[HOD Analytics] Error finding teacher:', err);
            return res.status(404).json({ success: false });
        }

        const dept = me.department;
        console.log(`[HOD Analytics] Request from User: ${teacherId}, Dept: ${dept}`);

        // Simplified parallel execution
        const analytics = {};

        // 1. Lecture Status (for pie chart)
        db.all(`
            SELECT l.status, COUNT(*) as value
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE t.department = ?
            GROUP BY l.status
        `, [dept], (err1, statusData) => {
            if (err1) {
                console.error('[HOD Analytics] Status query error:', err1);
            }

            // Format for pie chart: [{name: 'scheduled', value: 150}]
            analytics.executionData = (statusData || []).map(item => ({
                name: item.status,
                value: item.value
            }));

            // 2. Attendance Trends
            db.all(`
                SELECT l.date, AVG(CAST(l.attendance_count AS FLOAT)) as attendance
                FROM lectures l
                JOIN teachers t ON l.scheduled_teacher_id = t.id
                WHERE t.department = ? AND l.status = 'completed'
                GROUP BY l.date
                ORDER BY l.date DESC
                LIMIT 7
            `, [dept], (err2, attendanceData) => {
                if (err2) {
                    console.error('[HOD Analytics] Attendance query error:', err2);
                }

                analytics.attendanceData = (attendanceData || []).map(item => ({
                    date: item.date,
                    attendance: Math.round(item.attendance || 0)
                })).reverse(); // Oldest first for chart

                // 3. At-Risk Students (attendance < 75%)
                db.all(`
                    SELECT 
                        s.name,
                        s.class_year as year,
                        COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
                        COUNT(*) as total_count,
                        COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as missedClasses,
                        COALESCE(
                            ROUND(
                                (CAST(COUNT(CASE WHEN ar.status = 'present' THEN 1 END) AS FLOAT) / 
                                NULLIF(COUNT(*), 0)) * 100
                            ), 
                            0
                        ) as attendance
                    FROM students s
                    JOIN attendance_records ar ON s.id = ar.student_id
                    JOIN lectures l ON ar.lecture_id = l.id
                    JOIN teachers t ON l.scheduled_teacher_id = t.id
                    WHERE t.department = ? AND s.department = ?
                    GROUP BY s.id
                    HAVING attendance < 75
                    ORDER BY attendance ASC
                    LIMIT 10
                `, [dept, dept], (err3, riskData) => {
                    if (err3) {
                        console.log('[HOD Analytics] Risk students query error (may not have attendance data):', err3.message);
                    }

                    analytics.atRiskStudents = (riskData || []).map(student => ({
                        name: student.name,
                        year: student.year,
                        attendance: student.attendance,
                        missedClasses: student.missedClasses
                    }));

                    // 4. Syllabus Data
                    db.all(`
                        SELECT 
                            s.name as subject,
                            s.class_year,
                            COUNT(DISTINCT st.id) as total_topics,
                            COUNT(DISTINCT CASE WHEN l.syllabus_topic_id IS NOT NULL THEN l.syllabus_topic_id END) as covered_topics
                        FROM subjects s
                        LEFT JOIN syllabus_topics st ON st.subject_id = s.id
                        LEFT JOIN lectures l ON l.subject = s.name AND l.status = 'completed'
                        WHERE s.department = ?
                        GROUP BY s.id
                    `, [dept], (err4, syllabusData) => {
                        if (err4) {
                            console.log('[HOD Analytics] Syllabus query error:', err4.message);
                        }

                        analytics.syllabusData = syllabusData || [];

                        console.log(`[HOD Analytics] Syllabus Data Count: ${analytics.syllabusData.length}`, analytics.syllabusData);
                        console.log(`[HOD Analytics] Returning - Execution: ${analytics.executionData?.length || 0}, Attendance: ${analytics.attendanceData?.length || 0}, Risk: ${analytics.atRiskStudents?.length || 0}, Syllabus: ${analytics.syllabusData?.length || 0}`);
                        res.json({ success: true, analytics });
                    });
                });
            });
        });
    });
};

module.exports = { getHodStats, delegateAuthority, getAnalytics };
