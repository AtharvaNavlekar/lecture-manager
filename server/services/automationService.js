const cron = require('node-cron');
const { db } = require('../config/db');
const { promisify } = require('util');

const dbRun = promisify(db.run.bind(db));
const dbAll = promisify(db.all.bind(db));

class AutomationService {
    constructor() {
        this.pendingTimers = new Map();
        this.started = false;
    }

    start() {
        if (this.started) return;
        this.started = true;

        console.log('🤖 Automation Service Started');

        // Check for pending leave approvals every 1 minute
        cron.schedule('* * * * *', () => {
            this.checkPendingLeaveApprovals();
        });

        // Check for pending substitute assignments every 1 minute
        cron.schedule('* * * * *', () => {
            this.checkPendingSubstituteAssignments();
        });

        console.log('✅ Cron jobs scheduled');
    }

    async checkPendingLeaveApprovals() {
        try {
            // Find leave requests pending for more than 30 minutes
            const pendingLeaves = await dbAll(`
                SELECT id, teacher_id, submitted_at, affected_lectures
                FROM leave_requests
                WHERE status = 'pending'
                AND datetime(submitted_at, '+30 minutes') <= datetime('now')
            `);

            for (const leave of pendingLeaves) {
                await this.autoApproveLeave(leave);
            }
        } catch (err) {
            console.error('Error checking pending leaves:', err);
        }
    }

    async autoApproveLeave(leave) {
        try {
            console.log(`⏰ Auto-approving leave request ${leave.id} (30 min timeout)`);

            await dbRun(`
                UPDATE leave_requests
                SET status = 'auto-approved',
                    hod_decision_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [leave.id]);

            // TODO: Send email notification
            console.log(`✅ Leave ${leave.id} auto-approved`);

            // Trigger substitute assignment process
            await this.createSubstituteAssignments(leave);
        } catch (err) {
            console.error(`Error auto-approving leave ${leave.id}:`, err);
        }
    }

    async createSubstituteAssignments(leave) {
        try {
            const lectures = JSON.parse(leave.affected_lectures || '[]');

            for (const lectureId of lectures) {
                // Check if already assigned
                const existing = await dbAll(`
                    SELECT id FROM substitute_assignments
                    WHERE lecture_id = ? AND status IN ('assigned', 'pending')
                `, [lectureId]);

                if (existing.length === 0) {
                    // Create pending assignment
                    await dbRun(`
                        INSERT INTO substitute_assignments (
                            lecture_id, original_teacher_id, leave_request_id,
                            assignment_type, status, assigned_at, response_deadline
                        ) VALUES (?, ?, ?, 'auto', 'pending', CURRENT_TIMESTAMP, datetime('now', '+15 minutes'))
                    `, [lectureId, leave.teacher_id, leave.id]);

                    console.log(`📝 Created pending substitute assignment for lecture ${lectureId}`);
                }
            }
        } catch (err) {
            console.error('Error creating substitute assignments:', err);
        }
    }

    async checkPendingSubstituteAssignments() {
        try {
            // Find assignments pending for more than 15 minutes
            const pendingAssignments = await dbAll(`
                SELECT sa.*, l.date, l.time_slot, l.subject, t.department
                FROM substitute_assignments sa
                JOIN lectures l ON sa.lecture_id = l.id
                JOIN teachers t ON sa.original_teacher_id = t.id
                WHERE sa.status = 'pending'
                AND datetime(sa.assigned_at, '+15 minutes') <= datetime('now')
            `);

            for (const assignment of pendingAssignments) {
                await this.autoAssignSubstitute(assignment);
            }
        } catch (err) {
            console.error('Error checking pending assignments:', err);
        }
    }

    async autoAssignSubstitute(assignment) {
        try {
            console.log(`⏰ Auto-assigning substitute for assignment ${assignment.id} (15 min timeout)`);

            // Find available teachers
            const available = await dbAll(`
                SELECT t.id, t.name, t.substitute_count
                FROM teachers t
                WHERE t.department = ?
                AND t.id != ?
                AND t.is_active = 1
                AND t.id NOT IN (
                    SELECT scheduled_teacher_id
                    FROM lectures
                    WHERE date = ? AND time_slot = ?
                )
                ORDER BY t.substitute_count ASC, t.name ASC
                LIMIT 1
            `, [assignment.department, assignment.original_teacher_id, assignment.date, assignment.time_slot]);

            if (available.length > 0) {
                const substitute = available[0];

                await dbRun(`
                    UPDATE substitute_assignments
                    SET substitute_teacher_id = ?,
                        status = 'auto-assigned',
                        assignment_type = 'auto'
                    WHERE id = ?
                `, [substitute.id, assignment.id]);

                await dbRun(`
                    UPDATE teachers
                    SET substitute_count = substitute_count + 1
                    WHERE id = ?
                `, [substitute.id]);

                console.log(`✅ Auto-assigned ${substitute.name} to lecture ${assignment.lecture_id}`);

                // TODO: Send email notification to substitute
            } else {
                console.log(`⚠️ No available teacher for assignment ${assignment.id}`);

                await dbRun(`
                    UPDATE substitute_assignments
                    SET status = 'unassigned',
                        syllabus_notes = 'No available teachers found'
                    WHERE id = ?
                `, [assignment.id]);
            }
        } catch (err) {
            console.error(`Error auto-assigning substitute for ${assignment.id}:`, err);
        }
    }

    stop() {
        this.started = false;
        console.log('🛑 Automation Service Stopped');
    }
}

const automationService = new AutomationService();

module.exports = automationService;
