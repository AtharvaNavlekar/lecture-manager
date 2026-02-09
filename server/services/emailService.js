const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        try {
            const nodemailer = require('nodemailer');

            // Using Gmail for demo (you can configure any SMTP)
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER || 'noreply@lecman.com',
                    pass: process.env.EMAIL_PASS || 'demo-password'
                }
            });
            console.log('✅ Email service initialized');
        } catch (err) {
            console.warn('⚠️ Email service disabled:', err.message);
            this.transporter = null;
        }
    }

    async sendLeaveRequestNotification(leave, hodEmail) {
        if (!this.transporter) {
            console.log('📧 Email skipped (service disabled)');
            return false;
        }

        try {
            const mailOptions = {
                from: 'LecMan System <noreply@lecman.com>',
                to: hodEmail,
                subject: '🔔 New Leave Request Pending Approval',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">New Leave Request</h2>
                        <p>A teacher has submitted a leave request requiring your approval.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Teacher:</strong> ${leave.teacher_name}</p>
                            <p><strong>Date:</strong> ${leave.start_date}</p>
                            <p><strong>Reason:</strong> ${leave.reason}</p>
                            <p><strong>Affected Lectures:</strong> ${leave.lecture_count}</p>
                        </div>

                        <p style="color: #dc2626;">
                            ⏰ <strong>Auto-approval in 30 minutes</strong> if no action taken.
                        </p>

                        <a href="http://localhost:5173/leave/approval" 
                           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                            Review Request
                        </a>

                        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                            This is an automated message from LecMan System.
                        </p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to HOD: ${hodEmail}`);
            return true;
        } catch (err) {
            console.error('❌ Email send failed:', err.message);
            return false;
        }
    }

    async sendSubstituteAssignmentNotification(assignment, teacherEmail) {
        if (!this.transporter) {
            console.log('📧 Email skipped (service disabled)');
            return false;
        }

        try {
            const mailOptions = {
                from: 'LecMan System <noreply@lecman.com>',
                to: teacherEmail,
                subject: '📚 You\'ve Been Assigned as Substitute Teacher',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #059669;">Substitute Assignment</h2>
                        <p>You have been assigned as a substitute teacher.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Subject:</strong> ${assignment.subject}</p>
                            <p><strong>Class:</strong> ${assignment.class_year}</p>
                            <p><strong>Date:</strong> ${assignment.date}</p>
                            <p><strong>Time:</strong> ${assignment.time_slot}</p>
                            <p><strong>Original Teacher:</strong> ${assignment.original_teacher_name}</p>
                        </div>

                        ${assignment.syllabus_notes ? `
                        <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                            <p style="margin: 0;"><strong>📝 Notes:</strong> ${assignment.syllabus_notes}</p>
                        </div>
                        ` : ''}

                        <a href="http://localhost:5173/timetable" 
                           style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                            View Timetable
                        </a>

                        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                            This is an automated message from LecMan System.
                        </p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to substitute: ${teacherEmail}`);
            return true;
        } catch (err) {
            console.error('❌ Email send failed:', err.message);
            return false;
        }
    }

    async sendAutoApprovalNotification(leave, teacherEmail) {
        if (!this.transporter) {
            console.log('📧 Email skipped (service disabled)');
            return false;
        }

        try {
            const mailOptions = {
                from: 'LecMan System <noreply@lecman.com>',
                to: teacherEmail,
                subject: '✅ Your Leave Request Has Been Auto-Approved',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #059669;">Leave Request Auto-Approved</h2>
                        <p>Your leave request has been automatically approved (30-minute timeout).</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Date:</strong> ${leave.start_date}</p>
                            <p><strong>Reason:</strong> ${leave.reason}</p>
                            <p><strong>Status:</strong> <span style="color: #059669;">Auto-Approved</span></p>
                        </div>

                        <p>Substitute teachers are being assigned to your lectures.</p>

                        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                            This is an automated message from LecMan System.
                        </p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Auto-approval email sent: ${teacherEmail}`);
            return true;
        } catch (err) {
            console.error('❌ Email send failed:', err.message);
            return false;
        }
    }
}

const emailService = new EmailService();

module.exports = emailService;
