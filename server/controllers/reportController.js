const dbAsync = require('../utils/dbAsync');
const { exportData } = require('../services/exportService');

/**
 * Report Controller - Comprehensive reporting and analytics
 */

// ==================== ATTENDANCE REPORTS ====================

/**
 * Get attendance report by student
 * GET /api/reports/attendance/student/:studentId
 */
const getAttendanceByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate, format } = req.query;

        let whereClause = 'ar.student_id = ?';
        const params = [studentId];

        if (startDate) {
            whereClause += ' AND l.date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND l.date <= ?';
            params.push(endDate);
        }

        const query = `
            SELECT 
                s.name as student_name,
                s.roll_no,
                s.class_year,
                l.date,
                l.subject,
                l.start_time,
                l.end_time,
                t.name as teacher_name,
                ar.status,
                ar.note
            FROM attendance_records ar
            JOIN students s ON ar.student_id = s.id
            JOIN lectures l ON ar.lecture_id = l.id
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE ${whereClause}
            ORDER BY l.date DESC, l.start_time DESC
        `;

        const records = await dbAsync.all(query, params);

        // Calculate summary stats
        const totalClasses = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const attendancePercentage = totalClasses > 0 ? ((present / totalClasses) * 100).toFixed(2) : 0;

        const summary = {
            student: records[0] || {},
            totalClasses,
            present,
            absent,
            attendancePercentage
        };

        // Export if format specified
        if (format) {
            const exported = await exportData(records, format, {
                filename: `attendance_student_${studentId}`,
                title: `Attendance Report - ${summary.student.student_name}`,
                subtitle: `${startDate || 'All'} to ${endDate || 'All'}`,
                metadata: {
                    'Total Classes': totalClasses,
                    'Present': present,
                    'Absent': absent,
                    'Attendance %': attendancePercentage + '%'
                },
                columns: [
                    { key: 'date', header: 'Date' },
                    { key: 'subject', header: 'Subject' },
                    { key: 'start_time', header: 'Time' },
                    { key: 'teacher_name', header: 'Teacher' },
                    { key: 'status', header: 'Status' },
                    { key: 'note', header: 'Note' }
                ]
            });

            res.setHeader('Content-Type', exported.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
            return res.send(exported.buffer);
        }

        res.json({ success: true, summary, records });

    } catch (error) {
        console.error('Attendance by student error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get attendance report by teacher
 * GET /api/reports/attendance/teacher/:teacherId
 */
const getAttendanceByTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { startDate, endDate, format } = req.query;

        let whereClause = '(l.scheduled_teacher_id = ? OR l.substitute_teacher_id = ?)';
        const params = [teacherId, teacherId];

        if (startDate) {
            whereClause += ' AND l.date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND l.date <= ?';
            params.push(endDate);
        }

        const query = `
            SELECT 
                l.id as lecture_id,
                l.date,
                l.subject,
                l.class_year,
                l.start_time,
                l.end_time,
                l.status as lecture_status,
                l.total_students,
                l.attendance_count,
                CASE 
                    WHEN l.substitute_teacher_id = ? THEN 'Substitute'
                    ELSE 'Scheduled'
                END as teaching_mode
            FROM lectures l
            WHERE ${whereClause}
            ORDER BY l.date DESC, l.start_time DESC
        `;

        const lectures = await dbAsync.all(query, [teacherId, ...params]);

        // Calculate summary
        const totalLectures = lectures.length;
        const completed = lectures.filter(l => l.lecture_status === 'completed').length;
        const asSubstitute = lectures.filter(l => l.teaching_mode === 'Substitute').length;
        const avgAttendance = lectures.reduce((sum, l) => {
            if (l.total_students > 0) {
                return sum + (l.attendance_count / l.total_students) * 100;
            }
            return sum;
        }, 0) / (lectures.length || 1);

        const summary = {
            totalLectures,
            completed,
            asSubstitute,
            asScheduled: totalLectures - asSubstitute,
            avgAttendancePercentage: avgAttendance.toFixed(2)
        };

        if (format) {
            const exported = await exportData(lectures, format, {
                filename: `attendance_teacher_${teacherId}`,
                title: `Teaching Report - Teacher ID ${teacherId}`,
                subtitle: `${startDate || 'All'} to ${endDate || 'All'}`,
                metadata: summary,
                columns: [
                    { key: 'date', header: 'Date' },
                    { key: 'subject', header: 'Subject' },
                    { key: 'class_year', header: 'Class' },
                    { key: 'start_time', header: 'Time' },
                    { key: 'teaching_mode', header: 'Mode' },
                    { key: 'attendance_count', header: 'Present' },
                    { key: 'total_students', header: 'Total' },
                    { key: 'lecture_status', header: 'Status' }
                ]
            });

            res.setHeader('Content-Type', exported.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
            return res.send(exported.buffer);
        }

        res.json({ success: true, summary, lectures });

    } catch (error) {
        console.error('Attendance by teacher error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get attendance report by class
 * GET /api/reports/attendance/class/:classYear
 */
const getAttendanceByClass = async (req, res) => {
    try {
        const { classYear } = req.params;
        const { startDate, endDate, subject, format } = req.query;

        // Build filters
        let whereClause = 'l.class_year = ?';
        const params = [classYear];

        if (startDate) {
            whereClause += ' AND l.date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND l.date <= ?';
            params.push(endDate);
        }
        if (subject) {
            whereClause += ' AND l.subject = ?';
            params.push(subject);
        }

        // Get student-wise attendance
        const query = `
            SELECT 
                s.id as student_id,
                s.name as student_name,
                s.roll_no,
                COUNT(ar.id) as total_classes,
                SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                ROUND(
                    (CAST(SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS FLOAT) / 
                    COUNT(ar.id)) * 100, 2
                ) as attendance_percentage
            FROM students s
            LEFT JOIN attendance_records ar ON s.id = ar.student_id
            LEFT JOIN lectures l ON ar.lecture_id = l.id
            WHERE s.class_year = ? AND (l.id IS NULL OR (${whereClause}))
            GROUP BY s.id, s.name, s.roll_no
            ORDER BY s.roll_no ASC
        `;

        const students = await dbAsync.all(query, [classYear, ...params]);

        // Calculate class summary
        const classAvgAttendance = students.reduce((sum, s) => sum + (parseFloat(s.attendance_percentage) || 0), 0) / (students.length || 1);
        const riskStudents = students.filter(s => parseFloat(s.attendance_percentage) < 75).length;

        const summary = {
            class_year: classYear,
            totalStudents: students.length,
            avgAttendance: classAvgAttendance.toFixed(2),
            riskStudents
        };

        if (format) {
            const exported = await exportData(students, format, {
                filename: `attendance_class_${classYear}`,
                title: `Class Attendance Report - ${classYear}`,
                subtitle: `${startDate || 'All'} to ${endDate || 'All'}`,
                metadata: summary,
                columns: [
                    { key: 'roll_no', header: 'Roll No' },
                    { key: 'student_name', header: 'Student Name' },
                    { key: 'total_classes', header: 'Total Classes' },
                    { key: 'present_count', header: 'Present' },
                    { key: 'absent_count', header: 'Absent' },
                    { key: 'attendance_percentage', header: 'Attendance %' }
                ]
            });

            res.setHeader('Content-Type', exported.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
            return res.send(exported.buffer);
        }

        res.json({ success: true, summary, students });

    } catch (error) {
        console.error('Attendance by class error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== PERFORMANCE REPORTS ====================

/**
 * Get performance report for students
 * GET /api/reports/performance/students
 */
const getStudentPerformance = async (req, res) => {
    try {
        const { classYear, department, format } = req.query;

        let whereClause = '1=1';
        const params = [];

        if (classYear) {
            whereClause += ' AND s.class_year = ?';
            params.push(classYear);
        }
        if (department) {
            whereClause += ' AND s.department = ?';
            params.push(department);
        }

        // Get student performance metrics
        const query = `
            SELECT 
                s.id,
                s.name,
                s.roll_no,
                s.class_year,
                s.department,
                COUNT(DISTINCT l.id) as total_lectures_conducted,
                COUNT(ar.id) as attendance_records,
                SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as classes_attended,
                ROUND(
                    (CAST(SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS FLOAT) / 
                    NULLIF(COUNT(ar.id), 0)) * 100, 2
                ) as attendance_percentage
            FROM students s
            LEFT JOIN attendance_records ar ON s.id = ar.student_id
            LEFT JOIN lectures l ON ar.lecture_id = l.id
            WHERE ${whereClause}
            GROUP BY s.id
            ORDER BY s.class_year, s.roll_no
        `;

        const students = await dbAsync.all(query, params);

        if (format) {
            const exported = await exportData(students, format, {
                filename: 'student_performance',
                title: 'Student Performance Report',
                columns: [
                    { key: 'roll_no', header: 'Roll No' },
                    { key: 'name', header: 'Name' },
                    { key: 'class_year', header: 'Class' },
                    { key: 'department', header: 'Department' },
                    { key: 'classes_attended', header: 'Attended' },
                    { key: 'total_lectures_conducted', header: 'Total' },
                    { key: 'attendance_percentage', header: 'Attendance %' }
                ]
            });

            res.setHeader('Content-Type', exported.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
            return res.send(exported.buffer);
        }

        res.json({ success: true, students, count: students.length });

    } catch (error) {
        console.error('Student performance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== SYLLABUS REPORTS ====================

/**
 * Get syllabus completion report
 * GET /api/reports/syllabus/completion
 */
const getSyllabusCompletion = async (req, res) => {
    try {
        const { subject, teacherId, department, format } = req.query;

        let whereClause = '1=1';
        const params = [];

        if (subject) {
            whereClause += ' AND l.subject = ?';
            params.push(subject);
        }
        if (teacherId) {
            whereClause += ' AND l.scheduled_teacher_id = ?';
            params.push(teacherId);
        }
        if (department) {
            whereClause += ' AND t.department = ?';
            params.push(department);
        }

        // Get syllabus coverage
        const query = `
            SELECT 
                l.subject,
                t.name as teacher_name,
                t.department,
                COUNT(DISTINCT l.id) as lectures_conducted,
                COUNT(DISTINCT l.syllabus_topic_id) as topics_covered,
                GROUP_CONCAT(DISTINCT l.topic_covered) as covered_topics
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE ${whereClause} AND l.status = 'completed'
            GROUP BY l.subject, t.id
            ORDER BY t.department, l.subject
        `;

        const completion = await dbAsync.all(query, params);

        if (format) {
            const exported = await exportData(completion, format, {
                filename: 'syllabus_completion',
                title: 'Syllabus Completion Report',
                columns: [
                    { key: 'subject', header: 'Subject' },
                    { key: 'teacher_name', header: 'Teacher' },
                    { key: 'department', header: 'Department' },
                    { key: 'lectures_conducted', header: 'Lectures' },
                    { key: 'topics_covered', header: 'Topics Covered' }
                ]
            });

            res.setHeader('Content-Type', exported.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
            return res.send(exported.buffer);
        }

        res.json({ success: true, completion });

    } catch (error) {
        console.error('Syllabus completion error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== DEPARTMENT & WORKLOAD REPORTS ====================

/**
 * Get department workload report
 * GET /api/reports/department/workload
 */
const getDepartmentWorkload = async (req, res) => {
    try {
        const { department, startDate, endDate, format } = req.query;
        const userDept = req.userDept;
        const userRole = req.userRole;

        // Security: Non-admin can only view their own department
        const targetDept = (userRole === 'admin' && department) ? department : userDept;

        if (!targetDept) {
            return res.status(400).json({ success: false, message: 'Department required' });
        }

        let whereClause = 't.department = ?';
        const params = [targetDept];

        if (startDate) {
            whereClause += ' AND l.date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND l.date <= ?';
            params.push(endDate);
        }

        const query = `
            SELECT 
                t.id,
                t.name as teacher_name,
                t.post,
                COUNT(DISTINCT CASE WHEN l.scheduled_teacher_id = t.id THEN l.id END) as scheduled_lectures,
                COUNT(DISTINCT CASE WHEN l.substitute_teacher_id = t.id THEN l.id END) as substitute_lectures,
                COUNT(DISTINCT l.id) as total_lectures,
                COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.id END) as completed_lectures
            FROM teachers t
            LEFT JOIN lectures l ON (l.scheduled_teacher_id = t.id OR l.substitute_teacher_id = t.id)
                AND (${whereClause})
            WHERE t.department = ?
            GROUP BY t.id
            ORDER BY total_lectures DESC
        `;

        const workload = await dbAsync.all(query, [...params, targetDept]);

        const summary = {
            department: targetDept,
            totalTeachers: workload.length,
            avgLecturesPerTeacher: (workload.reduce((sum, t) => sum + t.total_lectures, 0) / (workload.length || 1)).toFixed(2)
        };

        if (format) {
            const exported = await exportData(workload, format, {
                filename: `department_workload_${targetDept}`,
                title: `Department Workload Report - ${targetDept}`,
                subtitle: `${startDate || 'All'} to ${endDate || 'All'}`,
                metadata: summary,
                columns: [
                    { key: 'teacher_name', header: 'Teacher' },
                    { key: 'post', header: 'Designation' },
                    { key: 'scheduled_lectures', header: 'Scheduled' },
                    { key: 'substitute_lectures', header: 'Substitutes' },
                    { key: 'total_lectures', header: 'Total' },
                    { key: 'completed_lectures', header: 'Completed' }
                ]
            });

            res.setHeader('Content-Type', exported.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
            return res.send(exported.buffer);
        }

        res.json({ success: true, summary, workload });

    } catch (error) {
        console.error('Department workload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get risk students report (low attendance)
 * GET /api/reports/department/risk-students
 */
const getRiskStudents = async (req, res) => {
    try {
        const { department, threshold = 75, format } = req.query;
        const userDept = req.userDept;
        const userRole = req.userRole;

        const targetDept = (userRole === 'admin' && department) ? department : userDept;

        const query = `
            SELECT 
                s.id,
                s.name,
                s.roll_no,
                s.class_year,
                s.email,
                COUNT(ar.id) as total_classes,
                SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
                ROUND(
                    (CAST(SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS FLOAT) / 
                    NULLIF(COUNT(ar.id), 0)) * 100, 2
                ) as attendance_percentage
            FROM students s
            LEFT JOIN attendance_records ar ON s.id = ar.student_id
            WHERE s.department = ?
            GROUP BY s.id
            HAVING attendance_percentage < ? OR attendance_percentage IS NULL
            ORDER BY attendance_percentage ASC
        `;

        const riskStudents = await dbAsync.all(query, [targetDept, threshold]);

        if (format) {
            const exported = await exportData(riskStudents, format, {
                filename: `risk_students_${targetDept}`,
                title: `Risk Students Report - ${targetDept}`,
                subtitle: `Attendance Below ${threshold}%`,
                metadata: {
                    'Department': targetDept,
                    'Risk Threshold': threshold + '%',
                    'Students at Risk': riskStudents.length
                },
                columns: [
                    { key: 'roll_no', header: 'Roll No' },
                    { key: 'name', header: 'Name' },
                    { key: 'class_year', header: 'Class' },
                    { key: 'email', header: 'Email' },
                    { key: 'present_count', header: 'Present' },
                    { key: 'total_classes', header: 'Total' },
                    { key: 'attendance_percentage', header: 'Attendance %' }
                ]
            });

            res.setHeader('Content-Type', exported.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
            return res.send(exported.buffer);
        }

        res.json({ success: true, riskStudents, count: riskStudents.length });

    } catch (error) {
        console.error('Risk students error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get HOD monthly summary
 * GET /api/reports/hod/monthly-summary
 */
const getHODMonthlySummary = async (req, res) => {
    try {
        const { month, year, format } = req.query;
        const department = req.userDept;

        if (!department) {
            return res.status(403).json({ success: false, message: 'HOD access only' });
        }

        // Default to current month if not specified
        const now = new Date();
        const targetMonth = month || (now.getMonth() + 1);
        const targetYear = year || now.getFullYear();
        const monthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

        // Get various metrics for the month
        const metrics = {};

        // Total lectures
        const lectureQuery = `
            SELECT COUNT(*) as total
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE t.department = ? AND strftime('%Y-%m', l.date) = ?
        `;
        const lectureData = await dbAsync.get(lectureQuery, [department, monthStr]);
        metrics.totalLectures = lectureData.total;

        // Completed lectures
        const completedQuery = `
            SELECT COUNT(*) as completed
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE t.department = ? AND strftime('%Y-%m', l.date) = ? AND l.status = 'completed'
        `;
        const completedData = await dbAsync.get(completedQuery, [department, monthStr]);
        metrics.completedLectures = completedData.completed;

        // Substitutions
        const subsQuery = `
            SELECT COUNT(*) as subs
            FROM lectures l
            JOIN teachers t ON l.substitute_teacher_id = t.id
            WHERE t.department = ? AND strftime('%Y-%m', l.date) = ? AND l.substitute_teacher_id IS NOT NULL
        `;
        const subsData = await dbAsync.get(subsQuery, [department, monthStr]);
        metrics.substitutions = subsData.subs;

        // Average attendance
        const attQuery = `
            SELECT AVG(l.attendance_count * 100.0 / l.total_students) as avg_att
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE t.department = ? AND strftime('%Y-%m', l.date) = ? AND l.total_students > 0
        `;
        const attData = await dbAsync.get(attQuery, [department, monthStr]);
        metrics.avgAttendance = (attData.avg_att || 0).toFixed(2);

        const summary = {
            department,
            month: targetMonth,
            year: targetYear,
            ...metrics
        };

        if (format) {
            const reportData = [summary];
            const exported = await exportData(reportData, format, {
                filename: `hod_summary_${department}_${monthStr}`,
                title: `HOD Monthly Summary - ${department}`,
                subtitle: `${monthStr}`,
                metadata: summary
            });

            res.setHeader('Content-Type', exported.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
            return res.send(exported.buffer);
        }

        res.json({ success: true, summary });

    } catch (error) {
        console.error('HOD summary error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAttendanceByStudent,
    getAttendanceByTeacher,
    getAttendanceByClass,
    getStudentPerformance,
    getSyllabusCompletion,
    getDepartmentWorkload,
    getRiskStudents,
    getHODMonthlySummary
};
