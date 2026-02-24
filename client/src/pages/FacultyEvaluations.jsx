import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import CustomDropdown from '../components/CustomDropdown';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star,
    Plus,
    User,
    PaperPlaneRight,
    X
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';

const FacultyEvaluations = () => {
    const { user } = useContext(AuthContext);
    const [evaluations, setEvaluations] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        teacher_id: '',
        academic_year: '2025-2026',
        performance_score: 5,
        teaching_quality: 5,
        punctuality: 5,
        student_feedback_score: 5,
        comments: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [evalRes, teachersRes] = await Promise.all([
                api.get('/evaluations/department'),
                api.get('/teachers')
            ]);

            if (evalRes.data.success) setEvaluations(evalRes.data.evaluations);
            if (teachersRes.data.success) {
                setTeachers(teachersRes.data.teachers.filter(t => t.department === user.department));
            }
        } catch (err) {
            logger.error('Fetch error:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/evaluations', formData);
            if (res.data.success) {
                toast.success('Evaluation submitted successfully!');
                setShowCreateModal(false);
                setFormData({
                    teacher_id: '',
                    academic_year: '2025-2026',
                    performance_score: 5,
                    teaching_quality: 5,
                    punctuality: 5,
                    student_feedback_score: 5,
                    comments: ''
                });
                fetchData();
            }
        } catch (err) {
            logger.error(err);
            toast.error('Failed to submit evaluation');
        }
    };

    const getRatingColor = (score) => {
        if (score >= 8) return 'text-emerald-400';
        if (score >= 6) return 'text-amber-400';
        return 'text-rose-400';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <Star weight="fill" className="text-indigo-400" />
                        Faculty Evaluations
                    </h1>
                    <p className="text-slate-400 mt-2">Performance reviews and assessments</p>
                </div>
                {(user.is_hod || user.role === 'admin') && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
                    >
                        <Plus weight="bold" size={20} />
                        New Evaluation
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {evaluations.length === 0 ? (
                    <div className="glass p-20 rounded-3xl border border-white/5 text-center">
                        <Star size={64} className="mx-auto mb-4 opacity-20 text-slate-500" />
                        <p className="text-slate-500">No evaluations yet</p>
                    </div>
                ) : (
                    evaluations.map((evaluation) => (
                        <motion.div
                            key={evaluation.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass p-6 rounded-2xl border border-white/5"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{evaluation.teacher_name}</h3>
                                    <p className="text-sm text-slate-400">Academic Year: {evaluation.academic_year}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">Evaluated by</div>
                                    <div className="text-sm text-white">{evaluation.evaluator_name}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4">
                                <div className="bg-white/5 p-4 rounded-xl text-center">
                                    <div className="text-xs text-slate-500 mb-1">Performance</div>
                                    <div className={`text-2xl font-bold ${getRatingColor(evaluation.performance_score)}`}>
                                        {evaluation.performance_score}/10
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl text-center">
                                    <div className="text-xs text-slate-500 mb-1">Teaching Quality</div>
                                    <div className={`text-2xl font-bold ${getRatingColor(evaluation.teaching_quality)}`}>
                                        {evaluation.teaching_quality}/10
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl text-center">
                                    <div className="text-xs text-slate-500 mb-1">Punctuality</div>
                                    <div className={`text-2xl font-bold ${getRatingColor(evaluation.punctuality)}`}>
                                        {evaluation.punctuality}/10
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl text-center">
                                    <div className="text-xs text-slate-500 mb-1">Student Feedback</div>
                                    <div className={`text-2xl font-bold ${getRatingColor(evaluation.student_feedback_score)}`}>
                                        {evaluation.student_feedback_score}/10
                                    </div>
                                </div>
                            </div>

                            {evaluation.comments && (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 mb-2">Comments:</div>
                                    <p className="text-sm text-slate-300">{evaluation.comments}</p>
                                </div>
                            )}

                            <div className="text-xs text-slate-600 mt-3">
                                Submitted on {new Date(evaluation.created_at).toLocaleDateString()}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass p-8 rounded-3xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">New Evaluation</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                                >
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Teacher</label>
                                    <CustomDropdown
                                        label="Teacher"
                                        value={formData.teacher_id}
                                        onChange={(val) => setFormData({ ...formData, teacher_id: val })}
                                        options={teachers.map(teacher => ({
                                            value: teacher.id,
                                            label: teacher.name
                                        }))}
                                        placeholder="Select teacher..."
                                        icon={<User size={14} />}
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Academic Year</label>
                                    <input
                                        type="text"
                                        value={formData.academic_year}
                                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'performance_score', label: 'Performance Score' },
                                        { key: 'teaching_quality', label: 'Teaching Quality' },
                                        { key: 'punctuality', label: 'Punctuality' },
                                        { key: 'student_feedback_score', label: 'Student Feedback' }
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <label className="block text-slate-400 text-sm mb-2">{label} (1-10)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={formData[key]}
                                                onChange={(e) => setFormData({ ...formData, [key]: parseInt(e.target.value) })}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white  outline-none focus:border-indigo-500"
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Comments</label>
                                    <textarea
                                        value={formData.comments}
                                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 resize-none"
                                        rows="4"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all"
                                    >
                                        Submit Evaluation
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FacultyEvaluations;
