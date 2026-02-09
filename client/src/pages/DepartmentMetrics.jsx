import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    Buildings,
    ChartBar,
    Download,
    TrendUp
} from '@phosphor-icons/react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const DepartmentMetrics = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        fetchDepartmentData();
    }, []);

    const fetchDepartmentData = async () => {
        try {
            const [teachersRes, lecturesRes, deptsRes] = await Promise.all([
                api.get('/teachers'),
                api.get('/schedule'),
                api.get('/config/departments')
            ]);

            if (teachersRes.data.success && deptsRes.data.success) {
                const teachers = teachersRes.data.teachers;
                const lectures = lecturesRes.data.schedule || [];
                const allDepts = deptsRes.data.departments || [];

                // Initialize map with ALL departments (USE CODE AS KEY!)
                const deptMap = {};
                allDepts.forEach(d => {
                    deptMap[d.code] = {
                        name: d.name,
                        code: d.code,
                        faculty: 0,
                        lectures: 0,
                        completionRate: 0,
                        rawLectures: []
                    };
                });


                // Map teachers to departments
                teachers.forEach(teacher => {
                    // Find the config department that matches this teacher
                    const configDept = allDepts.find(d =>
                        d.name === teacher.department || d.code === teacher.department
                    );

                    // Use the code from config, or fallback to teacher.department
                    const deptKey = configDept ? configDept.code : teacher.department;

                    // If this dept doesn't exist yet (shouldn't happen), create it
                    if (!deptMap[deptKey]) {
                        deptMap[deptKey] = {
                            name: configDept ? configDept.name : teacher.department,
                            code: deptKey,
                            faculty: 0,
                            lectures: 0,
                            completionRate: 0,
                            rawLectures: []
                        };
                    }
                    deptMap[deptKey].faculty++;
                });


                lectures.forEach(lecture => {
                    const teacher = teachers.find(t => t.id === lecture.scheduled_teacher_id);
                    if (teacher) {
                        const configDept = allDepts.find(d =>
                            d.name === teacher.department || d.code === teacher.department
                        );
                        const deptKey = configDept ? configDept.code : teacher.department;

                        if (deptMap[deptKey]) {
                            deptMap[deptKey].lectures++;
                            deptMap[deptKey].rawLectures.push(lecture);
                            if (lecture.status === 'completed') {
                                deptMap[deptKey].completionRate++;
                            }
                        }
                    }
                });


                Object.values(deptMap).forEach(dept => {
                    dept.completionRate = dept.lectures > 0
                        ? Math.floor((dept.completionRate / dept.lectures) * 100)
                        : 0;
                });

                // Filter out administrative departments (not academic)
                const academicDepts = Object.values(deptMap).filter(d =>
                    d.code !== 'Admin' && d.code !== 'Administration'
                );

                setDepartments(academicDepts);
            }
        } catch (err) {
            logger.error('Fetch department data error:', err);
            toast.error(err.response?.data?.message || 'Failed to load department metrics. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDept = (dept) => {
        setSelectedDept(dept);

        // Dynamically Calculate Detailed Metrics
        // 1. Monthly Trend for this Dept
        const monthlyMap = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Init last 6 months
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = d.toLocaleDateString('en-US', { month: 'short' });
            monthlyMap[key] = { month: key, lectures: 0 };
        }

        if (dept.rawLectures) {
            dept.rawLectures.forEach(l => {
                const m = new Date(l.date).toLocaleDateString('en-US', { month: 'short' });
                if (monthlyMap[m]) monthlyMap[m].lectures++;
            });
        }

        // 2. Real Performance Metrics (Calculated)
        const totalLec = dept.lectures || 0;
        const attended = dept.rawLectures ? dept.rawLectures.reduce((acc, l) => acc + (l.attendance_count || 0), 0) : 0;
        const possible = dept.rawLectures ? dept.rawLectures.reduce((acc, l) => acc + (l.total_students || 0), 0) : 0;

        const avgAttendance = possible > 0 ? Math.round((attended / possible) * 100) : 0;
        const completion = dept.completionRate || 0;

        // Mocking only what we absolutely don't represent yet (Feedback/Research)
        // But favoring real metrics where possible
        const realMetrics = {
            performance: [
                { metric: 'Completion', score: completion },
                { metric: 'Attendance', score: avgAttendance },
                { metric: 'Feedback', score: 0 }, // Placeholder until feedback module
                { metric: 'Research', score: 0 }, // Placeholder
                { metric: 'Collab', score: 0 }    // Placeholder
            ],
            monthlyTrend: Object.values(monthlyMap)
        };

        setMetrics(realMetrics);
    };

    const handleExport = () => {
        const csvContent = [
            ['Department', 'Faculty Count', 'Total Lectures', 'Completion Rate'].join(','),
            ...departments.map(d => [d.name, d.faculty, d.lectures, `${d.completionRate}%`].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `department-metrics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <Buildings weight="fill" className="text-indigo-400" />
                        Department Metrics
                    </h1>
                    <p className="text-slate-400 mt-2">Performance analytics across departments</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <Download size={20} />
                    Export Report
                </button>
            </div>

            {/* Department Comparison */}
            <div className="glass p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/50 to-slate-900/80 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white mb-6">Department Comparison</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={departments}>
                        <defs>
                            <linearGradient id="colorFaculty" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.4} />
                            </linearGradient>
                            <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="code" stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                            labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar yAxisId="left" dataKey="faculty" fill="url(#colorFaculty)" radius={[8, 8, 0, 0]} name="Faculty Count" barSize={40} />
                        <Bar yAxisId="right" dataKey="completionRate" fill="url(#colorCompletion)" radius={[8, 8, 0, 0]} name="Completion Rate %" barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Department Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                {departments.map((dept) => (
                    <motion.div
                        key={dept.code}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleSelectDept(dept)}
                        className={`glass p-6 rounded-2xl border cursor-pointer transition-all ${selectedDept?.code === dept.code
                            ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                            : 'border-white/5 bg-slate-800/20 hover:bg-slate-800/40 hover:border-indigo-500/30'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">{dept.name}</h3>
                                <p className="text-sm text-slate-400 mt-1 font-medium">{dept.faculty} Faculty Members</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${selectedDept?.name === dept.name ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-indigo-400'
                                }`}>
                                <Buildings weight={selectedDept?.name === dept.name ? "fill" : "duotone"} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Lectures</div>
                                <div className="text-xl font-bold text-white">{dept.lectures}</div>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <div className="text-xs text-emerald-500/70 font-bold uppercase tracking-wider mb-1">Completion</div>
                                <div className="text-xl font-bold text-emerald-400">{dept.completionRate}%</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Metrics */}
            {selectedDept && metrics && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                    <div className="glass p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/50 to-slate-900/80 backdrop-blur-xl">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <ChartBar className="text-indigo-400" />
                            {selectedDept.name} Performance
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart data={metrics.performance}>
                                <PolarGrid stroke="#ffffff10" />
                                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.3} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#8b5cf6' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/50 to-slate-900/80 backdrop-blur-xl">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <TrendUp className="text-emerald-400" />
                            Lecture Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={metrics.monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                />
                                <Line type="monotone" dataKey="lectures" stroke="#10b981" strokeWidth={4} dot={{ fill: '#064e3b', stroke: '#10b981', strokeWidth: 2, r: 6 }} activeDot={{ r: 8, fill: '#10b981' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default DepartmentMetrics;
