import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Calendar,
    Star,
    Student,
    ChartBar,
    Trash,
    Warning,
    Clock,
    CheckCircle,
    DownloadSimple,
    FileText
} from '@phosphor-icons/react';

import api from '../utils/api';
import logger from '@/utils/logger';
import SubmissionCard from '../components/SubmissionCard';
import StatusBadge from '../components/StatusBadge';

const AssignmentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignmentDetails();
    }, [id]);

    const fetchAssignmentDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/assignments/${id}`);
            if (res.data.success) {
                setAssignment(res.data.assignment);
                setSubmissions(res.data.submissions);
            }
        } catch (err) {
            logger.error('Fetch details error:', err);
            toast.error('Failed to load assignment details');
            navigate('/assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleGradeSubmission = async (submissionId, marks, feedbackText) => {
        try {
            const res = await api.post(`/assignments/submissions/${submissionId}/grade`, {
                marks: marks,
                feedback: feedbackText || ''
            });

            if (res.data.success) {
                toast.success('Submission graded successfully!');
                fetchAssignmentDetails(); // Refresh to show updated status
            }
        } catch (error) {
            logger.error(error);
            toast.error('Failed to grade submission');
        }
    };

    const handleDeleteAssignment = async () => {
        if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) return;

        try {
            await api.delete(`/assignments/${id}`);
            toast.success('Assignment deleted');
            navigate('/assignments');
        } catch (error) {
            logger.error(error);
            toast.error('Failed to delete assignment');
        }
    };

    // Get assignment status logic (duplicated for independence)
    const getAssignmentStatus = (assignment) => {
        if (!assignment) return { label: 'Unknown', color: 'slate', icon: Warning };

        const dueDate = new Date(assignment.due_date);
        const now = new Date();
        const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) return { label: 'Overdue', color: 'rose', icon: Warning };
        if (daysDiff <= 3) return { label: 'Due Soon', color: 'amber', icon: Clock };
        return { label: 'Upcoming', color: 'emerald', icon: CheckCircle };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!assignment) return null;

    const status = getAssignmentStatus(assignment);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-10">
            {/* Header & Back Button */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-4"
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/assignments')}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={24} weight="bold" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <span className="hover:text-indigo-400 cursor-pointer" onClick={() => navigate('/assignments')}>
                                Assignments
                            </span>
                            <span>/</span>
                            <span className="text-slate-400">Details</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDeleteAssignment}
                        className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all hover:scale-105"
                        title="Delete Assignment"
                    >
                        <Trash weight="bold" size={20} />
                    </button>
                </div>
            </motion.div>

            {/* Assignment Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass p-6 md:p-8 rounded-3xl border border-white/5"
            >
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm font-bold">
                            {assignment.class_year}
                        </span>
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-sm font-bold">
                            {assignment.subject}
                        </span>
                        <StatusBadge status={status} />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-white/5 to-white/10 p-6 rounded-2xl mb-6 border border-white/10">
                    <p className="text-slate-300 mb-6 leading-relaxed whitespace-pre-wrap">{assignment.description}</p>

                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={20} className="text-indigo-400" />
                            <span>Due: <span className="text-white font-medium">{new Date(assignment.due_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Star size={20} className="text-amber-400" weight="fill" />
                            <span>Max Marks: <span className="text-white font-medium">{assignment.max_marks}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Student size={20} className="text-emerald-400" />
                            <span>Submissions: <span className="text-white font-medium">{submissions.length}</span></span>
                        </div>
                    </div>

                    {/* File Attachment (if any) */}
                    {assignment.file_path && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <a
                                href={`http://localhost:5000/${assignment.file_path}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-all"
                            >
                                <FileText size={20} />
                                View Attached File
                                <DownloadSimple size={16} />
                            </a>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Submissions Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <ChartBar size={24} className="text-purple-400" />
                    Submissions ({submissions.length})
                </h3>

                <div className="space-y-4">
                    {submissions.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                            <Student size={56} className="mx-auto mb-4 opacity-20 text-slate-500" />
                            <p className="text-slate-400">No submissions yet</p>
                            <p className="text-slate-500 text-sm mt-2">Students haven't submitted their work</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {submissions.map((submission, index) => (
                                <SubmissionCard
                                    key={submission.id}
                                    submission={submission}
                                    maxMarks={assignment.max_marks}
                                    onGrade={handleGradeSubmission}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AssignmentDetails;
