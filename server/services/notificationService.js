const dbAsync = require('../utils/dbAsync');
const { sendEmail } = require('./emailService');

/**
 * Notification Service - Enhanced notification system with real-time capabilities
 */

// Store SSE connections for real-time notifications
const sseConnections = new Map();

/**
 * Register SSE connection for a user
 * @param {number} userId - User ID
 * @param {Response} res - Express response object
 */
const registerSSEConnection = (userId, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Store connection
    if (!sseConnections.has(userId)) {
        sseConnections.set(userId, []);
    }
    sseConnections.get(userId).push(res);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

    // Handle client disconnect
    res.on('close', () => {
        const connections = sseConnections.get(userId) || [];
        const index = connections.indexOf(res);
        if (index > -1) {
            connections.splice(index, 1);
        }
        if (connections.length === 0) {
            sseConnections.delete(userId);
        }
    });

    return res;
};

/**
 * Send real-time notification to user
 * @param {number} userId - User ID
 * @param {Object} notification - Notification data
 */
const sendRealTimeNotification = (userId, notification) => {
    const connections = sseConnections.get(userId);
    if (connections && connections.length > 0) {
        const data = `data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`;
        connections.forEach(res => {
            try {
                res.write(data);
            } catch (error) {
                console.error('SSE write error:', error);
            }
        });
    }
};

/**
 * Create notification with multi-channel delivery
 * @param {Object} notification - Notification details
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (notification) => {
    const {
        targetTeacherId,
        lectureId,
        type,
        title,
        message,
        priority = 'normal',
        actionUrl = null
    } = notification;

    try {
        // Create in-app notification
        const result = await dbAsync.run(`
            INSERT INTO notifications 
            (target_teacher_id, lecture_id, type, title, message, status, priority, action_url)
            VALUES (?, ?, ?, ?, ?, 'unread', ?, ?)
        `, [targetTeacherId, lectureId, type, title, message, priority, actionUrl]);

        const newNotification = {
            id: result.lastID,
            ...notification,
            status: 'unread',
            created_at: new Date().toISOString()
        };

        // Get user preferences
        const preferences = await getNotificationPreferences(targetTeacherId);

        // Send real-time notification
        sendRealTimeNotification(targetTeacherId, newNotification);

        // Send email if enabled
        if (preferences.email_enabled && shouldSendEmail(type, preferences)) {
            await sendEmailNotification(targetTeacherId, newNotification);
        }

        // SMS would go here if integrated
        if (preferences.sms_enabled && shouldSendSMS(type, preferences)) {
            // await sendSMSNotification(targetTeacherId, newNotification);
            console.log(`SMS notification queued for user ${targetTeacherId}`);
        }

        return newNotification;

    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

/**
 * Send email notification
 * @param {number} userId - User ID
 * @param {Object} notification - Notification data
 */
const sendEmailNotification = async (userId, notification) => {
    try {
        const user = await dbAsync.get('SELECT email, name FROM teachers WHERE id = ?', [userId]);
        if (!user || !user.email) return;

        const emailTemplate = getEmailTemplate(notification.type, notification);

        await sendEmail({
            to: user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html
        });

    } catch (error) {
        console.error('Email notification error:', error);
    }
};

/**
 * Get email template for notification type
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Object} Email template
 */
const getEmailTemplate = (type, data) => {
    const templates = {
        'auto_assign': {
            subject: `Urgent: Substitution Assignment - ${data.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">${data.title}</h2>
                    <p>${data.message}</p>
                    <p style="margin-top: 20px;">
                        <a href="${process.env.APP_URL || 'http://localhost:5173'}" 
                           style="background-color: #2563eb; color: white; padding: 10px 20px; 
                                  text-decoration: none; border-radius: 5px;">
                            View in Dashboard
                        </a>
                    </p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated notification from Lecture Manager System.
                    </p>
                </div>
            `
        },
        'leave_approved': {
            subject: `Leave Request Approved`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">✓ ${data.title}</h2>
                    <p>${data.message}</p>
                    <p style="margin-top: 20px; color: #6b7280;">
                        Your leave request has been approved. Substitutes have been assigned for your lectures.
                    </p>
                </div>
            `
        },
        'leave_rejected': {
            subject: `Leave Request Status Update`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ef4444;">✗ ${data.title}</h2>
                    <p>${data.message}</p>
                </div>
            `
        },
        'default': {
            subject: data.title,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>${data.title}</h2>
                    <p>${data.message}</p>
                </div>
            `
        }
    };

    return templates[type] || templates['default'];
};

/**
 * Get user notification preferences or defaults
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Preferences
 */
const getNotificationPreferences = async (userId) => {
    try {
        const prefs = await dbAsync.get(`
            SELECT * FROM notification_preferences WHERE user_id = ?
        `, [userId]);

        if (prefs) return prefs;

        // Return defaults if no preferences set
        return {
            email_enabled: true,
            sms_enabled: false,
            push_enabled: true,
            auto_assign: true,
            leave_updates: true,
            announcements: true,
            reminders: true
        };
    } catch (error) {
        // Table might not exist yet, return defaults
        return {
            email_enabled: true,
            sms_enabled: false,
            push_enabled: true,
            auto_assign: true,
            leave_updates: true,
            announcements: true,
            reminders: true
        };
    }
};

/**
 * Check if email should be sent for notification type
 */
const shouldSendEmail = (type, preferences) => {
    const typeMapping = {
        'auto_assign': preferences.auto_assign,
        'leave_approved': preferences.leave_updates,
        'leave_rejected': preferences.leave_updates,
        'announcement': preferences.announcements,
        'reminder': preferences.reminders
    };
    return typeMapping[type] !== false;
};

/**
 * Check if SMS should be sent for notification type
 */
const shouldSendSMS = (type, preferences) => {
    // Only send SMS for urgent notifications
    return ['auto_assign', 'urgent'].includes(type);
};

/**
 * Batch create notifications
 * @param {Array} notifications - Array of notification objects
 */
const batchCreateNotifications = async (notifications) => {
    const results = [];
    for (const notification of notifications) {
        try {
            const created = await createNotification(notification);
            results.push({ success: true, notification: created });
        } catch (error) {
            results.push({ success: false, error: error.message });
        }
    }
    return results;
};

/**
 * Mark notifications as read
 * @param {Array} notificationIds - Array of notification IDs
 * @param {number} userId - User ID (for verification)
 */
const markAsRead = async (notificationIds, userId) => {
    try {
        const placeholders = notificationIds.map(() => '?').join(',');
        await dbAsync.run(`
            UPDATE notifications 
            SET status = 'read', read_at = datetime('now')
            WHERE id IN (${placeholders}) AND target_teacher_id = ?
        `, [...notificationIds, userId]);

        return { success: true, count: notificationIds.length };
    } catch (error) {
        console.error('Mark as read error:', error);
        throw error;
    }
};

/**
 * Broadcast notification to a specific department
 * @param {string} department - Department name (e.g. 'CS', 'IT')
 * @param {Object} notification - Notification details (title, message, type)
 */
const notifyDepartment = async (department, notification) => {
    try {
        // Find all teachers in the department
        // Note: We might need to filter out the creator if senderId is provided
        const teachers = await dbAsync.all('SELECT id FROM teachers WHERE department = ?', [department]);

        if (!teachers || teachers.length === 0) return { success: true, count: 0 };

        const notifications = teachers.map(t => ({
            ...notification,
            targetTeacherId: t.id
        }));

        const results = await batchCreateNotifications(notifications);
        return { success: true, count: results.length };

    } catch (error) {
        console.error('Department notification error:', error);
        throw error; // Let controller handle it
    }
};

/**
 * Delete notifications
 * @param {Array} notificationIds - Array of notification IDs
 * @param {number} userId - User ID (for verification)
 */
const deleteNotifications = async (notificationIds, userId) => {
    try {
        const placeholders = notificationIds.map(() => '?').join(',');
        const result = await dbAsync.run(`
            DELETE FROM notifications 
            WHERE id IN (${placeholders}) AND target_teacher_id = ?
        `, [...notificationIds, userId]);

        return { success: true, count: result.changes };
    } catch (error) {
        console.error('Delete notifications error:', error);
        throw error;
    }
};

module.exports = {
    registerSSEConnection,
    sendRealTimeNotification,
    createNotification,
    batchCreateNotifications,
    getNotificationPreferences,
    markAsRead,
    deleteNotifications,
    sendEmailNotification,
    notifyDepartment
};
