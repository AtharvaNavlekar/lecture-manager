// Helper function for admin to get all analytics
const getAllAnalytics = (req, res) => {
    const { db } = require('../config/db');

    db.all('SELECT id FROM teachers', [], (err, teachers) => {
        if (err) {
            console.error('[Analytics] Error fetching all teachers:', err);
            return res.status(500).json({ success: false, error: err.message });
        }

        const teacherIds = teachers.map(t => t.id);
        console.log(`[Analytics] Admin query: ${teachers.length} teachers found`);

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
                console.error('[Analytics] Lecture stats error:', err2);
                return res.status(500).json({ success: false, error: err2.message });
            }

            const analytics = {
                totalLectures: lectureStats.total || 0,
                completedLectures: lectureStats.completed || 0,
                totalAssignments: 0,
                gradedAssignments: 0
            };

            console.log('[Analytics] Admin result:', analytics);
            res.json({ success: true, analytics });
        });
    });
};

module.exports = { getAllAnalytics };
