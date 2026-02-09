const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { promisify } = require('util');
const automationService = require('../services/automationService');

const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbRun = promisify(db.run.bind(db));

// Middleware to check admin role (simplified for now, assumes auth middleware runs before)
// In a real app, you'd verify req.user.role === 'admin'

/**
 * GET /api/automation/status
 * Get overall system status and metrics
 */
router.get('/status', async (req, res) => {
    try {
        // System status
        const systemActive = automationService.started;

        // Leave Requests Stats
        const leaveStats = await dbGet(`
            SELECT 
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_approval,
                SUM(CASE WHEN status = 'auto-approved' THEN 1 ELSE 0 END) as auto_approved,
                SUM(CASE WHEN status = 'pending' AND datetime(submitted_at, '+30 minutes') <= datetime('now') THEN 1 ELSE 0 END) as awaiting_auto_approval
            FROM leave_requests
            WHERE strftime('%Y-%W', submitted_at) = strftime('%Y-%W', 'now')
        `);

        // Substitute Stats
        const subStats = await dbGet(`
            SELECT 
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_response,
                SUM(CASE WHEN status = 'auto-assigned' THEN 1 ELSE 0 END) as auto_assigned,
                SUM(CASE WHEN status = 'unassigned' THEN 1 ELSE 0 END) as unassigned
            FROM substitute_assignments
            WHERE strftime('%Y-%W', assigned_at) = strftime('%Y-%W', 'now')
        `);

        // Get oldest pending in minutes
        const oldestPending = await dbGet(`
            SELECT CAST((julianday('now') - julianday(assigned_at)) * 24 * 60 AS INTEGER) as minutes
            FROM substitute_assignments 
            WHERE status = 'pending' 
            ORDER BY assigned_at ASC 
            LIMIT 1
        `);

        res.json({
            success: true,
            status: {
                system_active: systemActive,
                last_check: new Date().toISOString(),
                leave_requests: {
                    pending_approval: leaveStats?.pending_approval || 0,
                    auto_approved_this_week: leaveStats?.auto_approved || 0,
                    awaiting_auto_approval: leaveStats?.awaiting_auto_approval || 0
                },
                assignments: {
                    pending_response: subStats?.pending_response || 0,
                    auto_assigned_this_week: subStats?.auto_assigned || 0,
                    unassigned: subStats?.unassigned || 0,
                    oldest_pending_minutes: oldestPending?.minutes || 0
                }
            }
        });
    } catch (err) {
        console.error('Error fetching automation status:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/automation/pending
 * Get list of pending assignments with details for countdown
 */
router.get('/pending', async (req, res) => {
    try {
        const assignments = await dbAll(`
            SELECT 
                sa.id, sa.lecture_id, sa.assigned_at, sa.response_deadline,
                l.subject, l.class_year, l.date, l.time_slot,
                t.name as original_teacher
            FROM substitute_assignments sa
            JOIN lectures l ON sa.lecture_id = l.id
            JOIN teachers t ON sa.original_teacher_id = t.id
            WHERE sa.status = 'pending'
            ORDER BY sa.response_deadline ASC
        `);

        // Add calculated time remaining
        const now = new Date();
        const assignmentsWithTime = assignments.map(a => {
            const deadline = new Date(a.response_deadline);
            // If response_deadline is null (legacy), assume +15 mins from assigned_at
            const effectiveDeadline = a.response_deadline ? deadline : new Date(new Date(a.assigned_at).getTime() + 15 * 60000);
            const remaining = Math.max(0, Math.floor((effectiveDeadline - now) / 1000));

            return {
                ...a,
                time_remaining_seconds: remaining
            };
        });

        res.json({ success: true, assignments: assignmentsWithTime });
    } catch (err) {
        console.error('Error fetching pending assignments:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/automation/override
 * Manually assign a substitute to a pending request
 */
router.post('/override', async (req, res) => {
    try {
        const { assignment_id, substitute_teacher_id } = req.body;

        if (!assignment_id || !substitute_teacher_id) {
            return res.status(400).json({ success: false, message: 'Missing assignment_id or substitute_teacher_id' });
        }

        // Verify Substitute exists
        const sub = await dbGet('SELECT name FROM teachers WHERE id = ?', [substitute_teacher_id]);
        if (!sub) return res.status(404).json({ success: false, message: 'Substitute teacher not found' });

        // Update Assignment
        await dbRun(`
            UPDATE substitute_assignments
            SET substitute_teacher_id = ?,
                status = 'assigned',
                assignment_type = 'manual_override'
            WHERE id = ?
        `, [substitute_teacher_id, assignment_id]);

        // Increment count
        await dbRun('UPDATE teachers SET substitute_count = substitute_count + 1 WHERE id = ?', [substitute_teacher_id]);

        // Get lecture details for logging/response
        const lecture = await dbGet(`
            SELECT l.subject, l.class_year 
            FROM substitute_assignments sa 
            JOIN lectures l ON sa.lecture_id = l.id 
            WHERE sa.id = ?
        `, [assignment_id]);

        console.log(`👨‍💼 Manual override: Assigned ${sub.name} to ${lecture?.subject} (Assignment #${assignment_id})`);

        res.json({ success: true, message: 'Manual assignment successful' });
    } catch (err) {
        console.error('Error in manual override:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/automation/logs
 * Get recent automation logs (from audit_logs or derived from updates)
 */
router.get('/logs', async (req, res) => {
    try {
        // Since we don't have a dedicated audit_logs table populated by automation yet,
        // we'll fetch recent assignments as a proxy for "Activity"
        const logs = await dbAll(`
            SELECT 
                sa.id, sa.status, sa.assignment_type, sa.assigned_at,
                t_sub.name as substitute_name,
                l.subject, l.class_year
            FROM substitute_assignments sa
            LEFT JOIN teachers t_sub ON sa.substitute_teacher_id = t_sub.id
            JOIN lectures l ON sa.lecture_id = l.id
            WHERE sa.status IN ('auto-assigned', 'assigned', 'unassigned')
            ORDER BY sa.assigned_at DESC
            LIMIT 20
        `);

        const formattedLogs = logs.map(log => ({
            id: log.id,
            timestamp: log.assigned_at,
            type: log.status === 'auto-assigned' ? 'AUTO_ASSIGN' : (log.assignment_type === 'manual_override' ? 'MANUAL_OVERRIDE' : 'ASSIGNMENT'),
            description: log.status === 'unassigned'
                ? `Failed to find substitute for ${log.subject} (${log.class_year})`
                : `Assigned ${log.substitute_name} to ${log.subject} (${log.class_year})`
        }));

        res.json({ success: true, logs: formattedLogs });
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
