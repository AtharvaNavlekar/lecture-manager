const dbAsync = require('../utils/dbAsync');

/**
 * Analytics Service - Predictive analytics and anomaly detection
 */

/**
 * Calculate moving average for trend analysis
 * @param {Array} data - Time series data [{date, value}]
 * @param {number} window - Window size for moving average
 * @returns {Array} Moving averages
 */
const calculateMovingAverage = (data, window = 7) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < window - 1) {
            result.push({ ...data[i], movingAvg: null });
            continue;
        }
        const sum = data.slice(i - window + 1, i + 1).reduce((acc, d) => acc + d.value, 0);
        result.push({
            ...data[i],
            movingAvg: sum / window
        });
    }
    return result;
};

/**
 * Detect anomalies using Z-score method
 * @param {Array} data - Data points
 * @param {number} threshold - Z-score threshold (default 2)
 * @returns {Array} Anomalies
 */
const detectAnomalies = (data, threshold = 2) => {
    if (data.length < 3) return [];

    // Calculate mean and standard deviation
    const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const variance = data.reduce((sum, d) => sum + Math.pow(d.value - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    // Find outliers
    const anomalies = [];
    data.forEach(point => {
        const zScore = Math.abs((point.value - mean) / stdDev);
        if (zScore > threshold) {
            anomalies.push({
                ...point,
                zScore,
                deviation: point.value - mean,
                severity: zScore > 3 ? 'high' : 'medium'
            });
        }
    });

    return anomalies;
};

/**
 * Forecast next values using simple linear regression
 * @param {Array} data - Historical data [{date, value}]
 * @param {number} periods - Number of periods to forecast
 * @returns {Array} Forecasted values
 */
const forecastLinear = (data, periods = 7) => {
    if (data.length < 2) return [];

    // Convert dates to numeric values (days from start)
    const startDate = new Date(data[0].date);
    const numericData = data.map(d => ({
        x: Math.floor((new Date(d.date) - startDate) / (1000 * 60 * 60 * 24)),
        y: d.value
    }));

    // Calculate linear regression coefficients
    const n = numericData.length;
    const sumX = numericData.reduce((sum, p) => sum + p.x, 0);
    const sumY = numericData.reduce((sum, p) => sum + p.y, 0);
    const sumXY = numericData.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = numericData.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecasts
    const forecasts = [];
    const lastX = numericData[numericData.length - 1].x;

    for (let i = 1; i <= periods; i++) {
        const x = lastX + i;
        const forecastValue = slope * x + intercept;
        const forecastDate = new Date(startDate);
        forecastDate.setDate(forecastDate.getDate() + x);

        forecasts.push({
            date: forecastDate.toISOString().split('T')[0],
            value: Math.max(0, Math.round(forecastValue * 100) / 100), // Ensure non-negative
            type: 'forecast'
        });
    }

    return forecasts;
};

/**
 * Analyze attendance trends for a student
 * @param {number} studentId - Student ID
 * @param {number} daysBack - Days to analyze
 * @returns {Promise<Object>} Trend analysis
 */
const analyzeStudentTrend = async (studentId, daysBack = 30) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);

        // Get daily attendance
        const query = `
            SELECT 
                l.date,
                SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
                COUNT(*) as total_classes
            FROM lectures l
            JOIN attendance_records ar ON l.id = ar.lecture_id
            WHERE ar.student_id = ? AND l.date >= ?
            GROUP BY l.date
            ORDER BY l.date ASC
        `;

        const dailyData = await dbAsync.all(query, [studentId, cutoffDate.toISOString().split('T')[0]]);

        // Calculate daily percentage
        const timeSeriesData = dailyData.map(d => ({
            date: d.date,
            value: d.total_classes > 0 ? (d.present_count / d.total_classes) * 100 : 0
        }));

        // Calculate moving average
        const withMovingAvg = calculateMovingAverage(timeSeriesData, 7);

        // Detect anomalies
        const anomalies = detectAnomalies(timeSeriesData, 1.5);

        // Forecast next 7 days
        const forecast = forecastLinear(timeSeriesData, 7);

        // Calculate trend direction
        const recentAvg = withMovingAvg.slice(-7).reduce((sum, d) => sum + (d.movingAvg || d.value), 0) / 7;
        const olderAvg = withMovingAvg.slice(0, 7).reduce((sum, d) => sum + (d.movingAvg || d.value), 0) / 7;
        const trendDirection = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';

        return {
            studentId,
            historical: withMovingAvg,
            anomalies,
            forecast,
            summary: {
                trendDirection,
                recentAverage: recentAvg.toFixed(2),
                changePercent: ((recentAvg - olderAvg) / olderAvg * 100).toFixed(2),
                anomalyCount: anomalies.length
            }
        };

    } catch (error) {
        console.error('Trend analysis error:', error);
        throw error;
    }
};

/**
 * Detect pattern deviations across the department
 * @param {string} department - Department code
 * @returns {Promise<Array>} Detected deviations
 */
const detectPatternDeviations = async (department) => {
    try {
        // Get average attendance by day of week for the past 90 days
        const query = `
            SELECT 
                strftime('%w', l.date) as day_of_week,
                l.date,
                AVG(CASE WHEN ar.status = 'present' THEN 100.0 ELSE 0.0 END) as attendance_percentage
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            LEFT JOIN attendance_records ar ON l.id = ar.lecture_id
            WHERE t.department = ? 
                AND l.date >= date('now', '-90 days')
                AND l.status = 'completed'
            GROUP BY l.date
            ORDER BY l.date
        `;

        const data = await dbAsync.all(query, [department]);

        // Group by day of week to find baseline
        const byDayOfWeek = {};
        data.forEach(d => {
            if (!byDayOfWeek[d.day_of_week]) {
                byDayOfWeek[d.day_of_week] = [];
            }
            byDayOfWeek[d.day_of_week].push(d.attendance_percentage);
        });

        // Calculate baselines
        const baselines = {};
        Object.keys(byDayOfWeek).forEach(dow => {
            const values = byDayOfWeek[dow];
            baselines[dow] = {
                mean: values.reduce((a, b) => a + b, 0) / values.length,
                stdDev: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - baselines[dow]?.mean || 0, 2), 0) / values.length)
            };
        });

        // Find deviations
        const deviations = [];
        data.forEach(d => {
            const baseline = baselines[d.day_of_week];
            if (baseline) {
                const zScore = Math.abs((d.attendance_percentage - baseline.mean) / baseline.stdDev);
                if (zScore > 2) {
                    deviations.push({
                        date: d.date,
                        actual: d.attendance_percentage.toFixed(2),
                        expected: baseline.mean.toFixed(2),
                        deviation: (d.attendance_percentage - baseline.mean).toFixed(2),
                        severity: zScore > 3 ? 'high' : 'medium'
                    });
                }
            }
        });

        return deviations;

    } catch (error) {
        console.error('Pattern deviation detection error:', error);
        throw error;
    }
};

/**
 * Predict resource needs based on historical patterns
 * @param {string} department - Department code
 * @param {number} weeksAhead - Weeks to forecast
 * @returns {Promise<Object>} Resource predictions
 */
const predictResourceNeeds = async (department, weeksAhead = 4) => {
    try {
        // Analyze past 12 weeks
        const query = `
            SELECT 
                strftime('%Y-%W', l.date) as week,
                COUNT(DISTINCT l.id) as lecture_count,
                COUNT(DISTINCT CASE WHEN l.substitute_teacher_id IS NOT NULL THEN l.id END) as substitution_count,
                AVG(l.total_students) as avg_class_size
            FROM lectures l
            JOIN teachers t ON l.scheduled_teacher_id = t.id
            WHERE t.department = ? 
                AND l.date >= date('now', '-84 days')
            GROUP BY week
            ORDER BY week
        `;

        const weeklyData = await dbAsync.all(query, [department]);

        // Calculate trends
        const avgLecturesPerWeek = weeklyData.reduce((sum, w) => sum + w.lecture_count, 0) / weeklyData.length;
        const avgSubsPerWeek = weeklyData.reduce((sum, w) => sum + w.substitution_count, 0) / weeklyData.length;
        const avgClassSize = weeklyData.reduce((sum, w) => sum + w.avg_class_size, 0) / weeklyData.length;

        // Simple forecast (using average with slight growth factor)
        const growthFactor = 1.02; // 2% growth assumption
        const predictions = [];

        for (let i = 1; i <= weeksAhead; i++) {
            predictions.push({
                week: i,
                expectedLectures: Math.round(avgLecturesPerWeek * Math.pow(growthFactor, i)),
                expectedSubstitutions: Math.round(avgSubsPerWeek * Math.pow(growthFactor, i)),
                expectedClassSize: Math.round(avgClassSize)
            });
        }

        return {
            department,
            historical: weeklyData,
            predictions,
            recommendations: {
                teachersNeeded: Math.ceil(avgLecturesPerWeek / 20), // Assuming 20 lectures per teacher per week
                substitutePool: Math.ceil(avgSubsPerWeek * 1.5) // 50% buffer
            }
        };

    } catch (error) {
        console.error('Resource prediction error:', error);
        throw error;
    }
};

module.exports = {
    calculateMovingAverage,
    detectAnomalies,
    forecastLinear,
    analyzeStudentTrend,
    detectPatternDeviations,
    predictResourceNeeds
};
