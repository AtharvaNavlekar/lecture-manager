import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion } from 'framer-motion';
import {
    ChalkboardTeacher,
    Download,
    Star,
    TrendUp
} from '@phosphor-icons/react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from 'recharts';

const TeacherAnalytics = () => {
    const { user } = useContext(AuthContext);
    const [analytics, setAnalytics] = useState({
        lecturesCompleted: 0,
        assignmentsCreated: 0,
        evaluationScore: 0,
        performanceMetrics: []
    });

    useEffect(() => {
        fetchTeacherAnalytics();
    }, []);

    const fetchTeacherAnalytics = async () => {
        try {
            const [lecturesRes, assignmentsRes, evaluationsRes, teachersRes] = await Promise.all([
                api.get('/schedule'),
                api.get('/assignments'),
                api.get(`/evaluations/teacher/${user.id}`),
                api.get('/teachers')
            ]);

            const lectures = lecturesRes.data.schedule || [];
            const teachers = teachersRes.data.teachers || [];

            // HODs see department-wide data
            let myLectures;
            if (user.is_hod || user.role === 'admin') {
                const deptTeacherIds = teachers
                    .filter(t => t.department === user.department)
                    .map(t => t.id);
                myLectures = lectures.filter(l => deptTeacherIds.includes(l.scheduled_teacher_id));
            } else {
                myLectures = lectures.filter(l => l.scheduled_teacher_id === user.id);
            }

            const completed = myLectures.filter(l => l.status === 'completed').length;

            const assignments = assignmentsRes.data.assignments || [];
            let myAssignments;
            if (user.is_hod || user.role === 'admin') {
                const deptTeacherIds = teachers
                    .filter(t => t.department === user.department)
                    .map(t => t.id);
                myAssignments = assignments.filter(a => deptTeacherIds.includes(a.teacher_id));
            } else {
                myAssignments = assignments.filter(a => a.teacher_id === user.id);
            }

            const evaluations = evaluationsRes.data.evaluations || [];
            const avgScore = evaluations.length > 0
                ? evaluations.reduce((sum, e) => sum + e.performance_score, 0) / evaluations.length
                : 0;

            // Calculate real average metrics from evaluations
            let metrics = {
                'Teaching Quality': 0,
                'Punctuality': 0,
                'Student Engagement': 0,
                'Course Coverage': 0, // Not yet in DB, default 0
                'Innovation': 0       // Not yet in DB, default 0
            };

            if (evaluations.length > 0) {
                metrics['Teaching Quality'] = evaluations.reduce((sum, e) => sum + (e.teaching_quality || 0), 0) / evaluations.length;
                metrics['Punctuality'] = evaluations.reduce((sum, e) => sum + (e.punctuality || 0), 0) / evaluations.length;
                metrics['Student Engagement'] = evaluations.reduce((sum, e) => sum + (e.student_feedback_score || 0), 0) / evaluations.length;
                // Course Coverage & Innovation are placeholders until db schema update, stay 0
            }

            const performanceMetrics = [
                { metric: 'Teaching Quality', score: Math.round(metrics['Teaching Quality']) },
                { metric: 'Punctuality', score: Math.round(metrics['Punctuality']) },
                { metric: 'Student Engagement', score: Math.round(metrics['Student Engagement']) },
                { metric: 'Course Coverage', score: 0 },
                { metric: 'Innovation', score: 0 }
            ];

            setAnalytics({
                lecturesCompleted: completed,
                assignmentsCreated: myAssignments.length,
                evaluationScore: avgScore.toFixed(1),
                performanceMetrics
            });
        } catch (err) {
            logger.error('Fetch teacher analytics error:', err);
        }
    };

    const handleExport = () => {
        const csvContent = [
            ['Metric', 'Value'].join(','),
            ['Lectures Completed', analytics.lecturesCompleted].join(','),
            ['Assignments Created', analytics.assignmentsCreated].join(','),
            ['Evaluation Score', analytics.evaluationScore].join(','),
            '',
            ['Performance Metrics', 'Score'].join(','),
            ...analytics.performanceMetrics.map(m => [m.metric, m.score].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teacher-analytics-${user.name.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <ChalkboardTeacher weight="fill" className="text-indigo-400" />
                        My Performance Analytics
                    </h1>
                    <p className="text-slate-400 mt-2">Track your teaching performance and growth</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <Download size={20} />
                    Export Report
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5"
                >
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                        <ChalkboardTeacher weight="fill" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">{analytics.lecturesCompleted}</div>
                    <div className="text-sm text-slate-400">Lectures Completed</div>
                    <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                        <TrendUp size={12} />
                        Great pace!
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5"
                >
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                        📚
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">{analytics.assignmentsCreated}</div>
                    <div className="text-sm text-slate-400">Assignments Created</div>
                    <div className="text-xs text-slate-500 mt-2">This semester</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5"
                >
                    <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                        <Star weight="fill" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">{analytics.evaluationScore}/10</div>
                    <div className="text-sm text-slate-400">Evaluation Score</div>
                    <div className="text-xs text-amber-400 mt-2">Excellent performance!</div>
                </motion.div>
            </div>

            {/* Performance Radar */}
            <div className="glass p-8 rounded-3xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-6">Performance Metrics</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={analytics.performanceMetrics}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" />
                        <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-2xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <TrendUp className="text-emerald-400" />
                        Strengths
                    </h3>
                    <ul className="space-y-3">
                        {analytics.performanceMetrics
                            .filter(m => m.score >= 80)
                            .map((metric, idx) => (
                                <li key={idx} className="flex items-center justify-between bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                    <span className="text-sm text-white">{metric.metric}</span>
                                    <span className="text-emerald-400 font-bold">{metric.score}%</span>
                                </li>
                            ))}
                    </ul>
                </div>

                <div className="glass p-6 rounded-2xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Growth Opportunities</h3>
                    <ul className="space-y-3">
                        {analytics.performanceMetrics
                            .filter(m => m.score < 80)
                            .map((metric, idx) => (
                                <li key={idx} className="flex items-center justify-between bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                                    <span className="text-sm text-white">{metric.metric}</span>
                                    <span className="text-amber-400 font-bold">{metric.score}%</span>
                                </li>
                            ))}
                        {analytics.performanceMetrics.filter(m => m.score < 80).length === 0 && (
                            <p className="text-emerald-400 text-sm">All metrics above 80%! Excellent work!</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TeacherAnalytics;
