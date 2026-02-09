const { db } = require('../config/db');
const dbAsync = require('../utils/dbAsync');
const analyticsService = require('../services/analyticsService');
const optimizationService = require('../services/optimizationService');
const queryParserService = require('../services/queryParserService');

// ==================== ENHANCED RISK PREDICTION ====================

/**
 * Get AI-powered risk forecast with enhanced algorithms
 * GET /api/ai/forecast
 */
const getRiskForecast = async (req, res) => {
    try {
        const { date, department } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

        // Get today's schedule
        const lectures = await dbAsync.all(`
            SELECT l.id as lecture_id, l.subject, l.start_time, l.class_year
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE l.date = ? AND t.department = ?
        `, [targetDate.toISOString().split('T')[0], department || req.userDept]);

        if (!lectures || lectures.length === 0) {
            return res.json({ success: true, predictions: [] });
        }

        const predictions = [];

        for (const lecture of lectures) {
            const students = await dbAsync.all(
                "SELECT id, name, photo_url FROM students WHERE class_year = ?",
                [lecture.class_year]
            );

            for (const student of students) {
                const riskData = await calculateStudentRisk(student, lecture, dayOfWeek);
                if (riskData.riskScore > 70) {
                    predictions.push({
                        student: student,
                        lecture: { subject: lecture.subject, time: lecture.start_time },
                        risk: riskData
                    });
                }
            }
        }

        // Sort by highest risk
        predictions.sort((a, b) => b.risk.riskScore - a.risk.riskScore);

        res.json({ success: true, predictions: predictions.slice(0, 20) });

    } catch (error) {
        console.error('Risk forecast error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Enhanced risk calculation with multiple factors
 */
async function calculateStudentRisk(student, lecture, targetDay) {
    try {
        const records = await dbAsync.all(`
            SELECT l.date, l.subject, ar.status
            FROM attendance_records ar
            JOIN lectures l ON ar.lecture_id = l.id
            WHERE ar.student_id = ? AND l.status = 'completed'
        `, [student.id]);

        if (!records || records.length < 1) {
            return { riskScore: 0, reason: "Insufficient Data" };
        }

        const total = records.length;
        const absent = records.filter(r => r.status === 'absent').length;
        const baseAbsentRate = absent / total;

        // Subject-specific rate
        const subjectRecords = records.filter(r => r.subject === lecture.subject);
        const subjectAbsentRate = subjectRecords.length > 0
            ? subjectRecords.filter(r => r.status === 'absent').length / subjectRecords.length
            : baseAbsentRate;

        // Day-specific rate
        const dayRecords = records.filter(r => {
            const d = new Date(r.date);
            return d.toLocaleDateString('en-US', { weekday: 'long' }) === targetDay;
        });
        const dayAbsentRate = dayRecords.length > 0
            ? dayRecords.filter(r => r.status === 'absent').length / dayRecords.length
            : baseAbsentRate;

        // Enhanced: Recent trend (last 10 records)
        const recentRecords = records.slice(-10);
        const recentAbsentRate = recentRecords.filter(r => r.status === 'absent').length / recentRecords.length;

        // Weighted calculation with trend factor
        const weightedProbability =
            (subjectAbsentRate * 0.4) +
            (dayAbsentRate * 0.25) +
            (baseAbsentRate * 0.15) +
            (recentAbsentRate * 0.2);

        const riskScore = Math.round(weightedProbability * 100);

        let reason = "General Pattern";
        if (recentAbsentRate > 0.6) reason = "Recent declining trend";
        else if (subjectAbsentRate > 0.5) reason = `Frequently skips ${lecture.subject}`;
        else if (dayAbsentRate > 0.5) reason = `Often absent on ${targetDay}s`;

        return {
            riskScore,
            reason,
            details: {
                base: baseAbsentRate,
                subject: subjectAbsentRate,
                day: dayAbsentRate,
                recent: recentAbsentRate
            }
        };

    } catch (error) {
        console.error('Risk calculation error:', error);
        return { riskScore: 0, reason: "Calculation Error" };
    }
}

// ==================== SMART SUBSTITUTE RECOMMENDATIONS ====================

/**
 * Get smart substitute teacher recommendations
 * POST /api/ai/substitute-recommendations
 */
const getSubstituteRecommendations = async (req, res) => {
    try {
        const { teacherId, date, lectureIds } = req.body;

        // Get teacher and department info
        const teacher = await dbAsync.get("SELECT * FROM teachers WHERE id = ?", [teacherId]);
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        // Get lectures that need substitutes
        const lectures = await dbAsync.all(`
            SELECT * FROM lectures
            WHERE scheduled_teacher_id = ? AND date = ? AND status != 'completed'
            ${lectureIds ? 'AND id IN (?)' : ''}
        `, [teacherId, date, lectureIds]);

        const recommendations = [];

        for (const lecture of lectures) {
            // Find best substitutes with multi-factor scoring
            const candidates = await dbAsync.all(`
                SELECT 
                    t.id,
                    t.name,
                    t.post,
                    t.department,
                    (SELECT COUNT(*) FROM lectures l 
                     WHERE (l.scheduled_teacher_id = t.id OR l.substitute_teacher_id = t.id) 
                     AND l.status != 'completed') as current_workload,
                    (SELECT COUNT(*) FROM lectures l
                     WHERE l.substitute_teacher_id = t.id 
                     AND l.subject = ?) as subject_experience,
                    (SELECT COUNT(*) FROM lectures l
                     WHERE l.substitute_teacher_id = t.id
                     AND l.status = 'completed') as past_substitutions
                FROM teachers t
                WHERE t.department = ? AND t.id != ?
                AND t.id NOT IN (
                    SELECT scheduled_teacher_id FROM lectures 
                    WHERE date = ? AND start_time = ? AND status != 'cancelled'
                    UNION
                    SELECT substitute_teacher_id FROM lectures 
                    WHERE date = ? AND start_time = ? AND substitute_teacher_id IS NOT NULL
                )
            `, [lecture.subject, teacher.department, teacherId, date, lecture.start_time, date, lecture.start_time]);

            // Calculate scores for each candidate
            const scoredCandidates = candidates.map(c => {
                const workloadScore = Math.max(0, 100 - (c.current_workload * 5)); // Lower workload = higher score
                const experienceScore = Math.min(100, c.subject_experience * 20); // Subject experience
                const reliabilityScore = Math.min(100, c.past_substitutions * 10); // Past performance

                const totalScore =
                    (workloadScore * 0.4) +
                    (experienceScore * 0.35) +
                    (reliabilityScore * 0.25);

                return {
                    ...c,
                    score: Math.round(totalScore),
                    breakdown: {
                        workload: workloadScore.toFixed(0),
                        experience: experienceScore.toFixed(0),
                        reliability: reliabilityScore.toFixed(0)
                    }
                };
            });

            // Sort by score
            scoredCandidates.sort((a, b) => b.score - a.score);

            recommendations.push({
                lecture: {
                    id: lecture.id,
                    subject: lecture.subject,
                    time: lecture.start_time,
                    classYear: lecture.class_year
                },
                candidates: scoredCandidates.slice(0, 5) // Top 5 candidates
            });
        }

        res.json({ success: true, recommendations });

    } catch (error) {
        console.error('Substitute recommendations error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== TREND ANALYSIS ====================

/**
 * Get student attendance trend analysis
 * GET /api/ai/student-trend/:studentId
 */
const getStudentTrend = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { daysBack = 30 } = req.query;

        const analysis = await analyticsService.analyzeStudentTrend(parseInt(studentId), parseInt(daysBack));

        res.json({ success: true, analysis });

    } catch (error) {
        console.error('Student trend error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Detect anomalies in department attendance
 * GET /api/ai/anomalies
 */
const detectAnomalies = async (req, res) => {
    try {
        const { department } = req.query;
        const targetDept = department || req.userDept;

        const deviations = await analyticsService.detectPatternDeviations(targetDept);

        res.json({ success: true, anomalies: deviations });

    } catch (error) {
        console.error('Anomaly detection error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Predict resource needs
 * GET /api/ai/resource-forecast
 */
const getResourceForecast = async (req, res) => {
    try {
        const { department, weeks = 4 } = req.query;
        const targetDept = department || req.userDept;

        const forecast = await analyticsService.predictResourceNeeds(targetDept, parseInt(weeks));

        res.json({ success: true, forecast });

    } catch (error) {
        console.error('Resource forecast error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== OPTIMIZATION ====================

/**
 * Find scheduling conflicts
 * GET /api/ai/conflicts
 */
const findConflicts = async (req, res) => {
    try {
        const { date, department } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const targetDept = department || req.userDept;

        const conflicts = await optimizationService.findSchedulingConflicts(targetDate, targetDept);

        res.json({ success: true, conflicts });

    } catch (error) {
        console.error('Conflicts detection error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get load balancing suggestions
 * GET /api/ai/load-balancing
 */
const getLoadBalancing = async (req, res) => {
    try {
        const { department, startDate, endDate } = req.query;
        const targetDept = department || req.userDept;

        const start = startDate || new Date().toISOString().split('T')[0];
        const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const analysis = await optimizationService.suggestLoadBalancing(targetDept, start, end);

        res.json({ success: true, analysis });

    } catch (error) {
        console.error('Load balancing error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Analyze room utilization
 * GET /api/ai/room-utilization
 */
const getRoomUtilization = async (req, res) => {
    try {
        const { date, department } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const targetDept = department || req.userDept;

        const analysis = await optimizationService.analyzeRoomUtilization(targetDept, targetDate);

        res.json({ success: true, analysis });

    } catch (error) {
        console.error('Room utilization error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get scheduling recommendations
 * GET /api/ai/scheduling-recommendations
 */
const getSchedulingRecommendations = async (req, res) => {
    try {
        const { department } = req.query;
        const targetDept = department || req.userDept;

        const recommendations = await optimizationService.generateSchedulingRecommendations(targetDept);

        res.json({ success: true, recommendations });

    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== NATURAL LANGUAGE QUERIES ====================

/**
 * Process natural language query
 * POST /api/ai/query
 */
const processNaturalQuery = async (req, res) => {
    try {
        const { query } = req.body;
        const context = {
            userId: req.userId,
            userDept: req.userDept,
            userRole: req.userRole
        };

        const result = await queryParserService.parseAndExecuteQuery(query, context);

        res.json(result);

    } catch (error) {
        console.error('Query processing error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get query suggestions
 * GET /api/ai/query-suggestions
 */
const getQuerySuggestions = (req, res) => {
    const context = {
        userId: req.userId,
        userDept: req.userDept,
        userRole: req.userRole
    };

    const suggestions = queryParserService.getSuggestedQueries(context);

    res.json({ success: true, suggestions });
};

module.exports = {
    getRiskForecast,
    getSubstituteRecommendations,
    getStudentTrend,
    detectAnomalies,
    getResourceForecast,
    findConflicts,
    getLoadBalancing,
    getRoomUtilization,
    getSchedulingRecommendations,
    processNaturalQuery,
    getQuerySuggestions
};
