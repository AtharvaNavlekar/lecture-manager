import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, FileText, Star, Timer } from '@phosphor-icons/react';
import toast from 'react-hot-toast';

const SubmissionCard = ({ submission, maxMarks, onGrade, index }) => {
    const [grading, setGrading] = useState(false);
    const [marks, setMarks] = useState(submission.marks !== undefined ? submission.marks : '');
    const [feedback, setFeedback] = useState(submission.feedback || '');

    const handleSubmitGrade = () => {
        if (marks === '' || marks < 0 || marks > maxMarks) {
            toast.error(`Marks must be between 0 and ${maxMarks}`);
            return;
        }
        onGrade(submission.id, marks, feedback);
        setGrading(false);
    };

    // Generate avatar from initials
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const avatarColors = [
        'from-blue-500 to-cyan-500',
        'from-purple-500 to-pink-500',
        'from-emerald-500 to-teal-500',
        'from-amber-500 to-orange-500',
        'from-rose-500 to-pink-500',
    ];
    const avatarColor = avatarColors[submission.id % avatarColors.length];

    // Status Badge Logic
    const isGraded = submission.status === 'graded' || (submission.marks !== undefined && submission.marks !== null);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold shadow-lg`}>
                        {getInitials(submission.student_name || 'Student')}
                    </div>
                    <div>
                        <h4 className="font-bold text-white">{submission.student_name}</h4>
                        <p className="text-xs text-slate-500">Roll: {submission.roll_no}</p>
                    </div>
                </div>
                <div className="text-right">
                    {isGraded ? (
                        <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-bold flex items-center gap-1.5">
                            <Check weight="bold" size={16} />
                            {submission.marks}/{maxMarks}
                        </div>
                    ) : (
                        <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1.5">
                            <Timer size={14} />
                            Pending
                        </span>
                    )}
                </div>
            </div>

            <div className="text-xs text-slate-400 mb-4 flex items-center gap-2">
                <Clock size={14} />
                Submitted: {new Date(submission.submitted_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>

            {/* File attachment link would go here */}
            {submission.file_path && (
                <div className="mb-4">
                    <a
                        href={`http://localhost:5000/${submission.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        <FileText size={16} />
                        View Submission File
                    </a>
                </div>
            )}

            {grading ? (
                <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-400 text-xs mb-2 font-medium">Marks (out of {maxMarks})</label>
                            <input
                                type="number"
                                value={marks}
                                onChange={(e) => setMarks(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-white text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                max={maxMarks}
                                min="0"
                                placeholder="Enter marks"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs mb-2 font-medium">Feedback</label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all"
                            rows="3"
                            placeholder="Add feedback for the student..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSubmitGrade}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg"
                        >
                            Submit Grade
                        </button>
                        <button
                            onClick={() => setGrading(false)}
                            className="px-4 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {submission.feedback && (
                        <div className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl mb-3 border border-white/10">
                            <div className="flex items-start gap-2">
                                <FileText size={16} className="text-indigo-400 mt-0.5" />
                                <div>
                                    <strong className="text-indigo-400">Feedback:</strong>
                                    <p className="mt-1">{submission.feedback}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setGrading(true)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        <Star weight="bold" />
                        {isGraded ? 'Update Grade' : 'Grade Submission'}
                    </button>
                </>
            )}
        </motion.div>
    );
};

export default SubmissionCard;
