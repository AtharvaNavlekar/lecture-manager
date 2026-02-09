import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    CalendarCheck,
    TrendUp,
    Users,
    Download
} from '@phosphor-icons/react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const AttendanceTrends = () => {
    const [attendanceData, setAttendanceData] = useState({
        overall: [],
        byClass: [],
        bySubject: [],
        monthlyTrend: []
    });
    const [selectedView, setSelectedView] = useState('overall');
    const [, setLoading] = useState(false);
    const [dateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchAttendanceData();
    }, [dateRange]);

    const fetchAttendanceData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/analytics/attendance-trends');
            if (res.data.success) {
                setAttendanceData(res.data.data);
            } else {
                toast.error(' Failed to load attendance trends');
            }
        } catch (err) {
            logger.error('Fetch attendance error:', err);
            toast.error(err.response?.data?.message || 'Failed to load attendance trends. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Legacy process function removed as data is now pre-processed by backend

    const handleExport = () => {
        const data = selectedView === 'overall' ? attendanceData.monthlyTrend :
            selectedView === 'class' ? attendanceData.byClass :
                attendanceData.bySubject;

        const csvContent = [
            ['Name', 'Attendance Rate'].join(','),
            ...data.map(d => [d.name || d.month, d.rate].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-trends-${selectedView}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <CalendarCheck weight="fill" className="text-indigo-400" />
                        Attendance Trends
                    </h1>
                    <p className="text-slate-400 mt-2">Track and analyze attendance patterns</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <Download size={20} />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedView('overall')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${selectedView === 'overall'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Overall Trend
                    </button>
                    <button
                        onClick={() => setSelectedView('class')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${selectedView === 'class'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        By Class
                    </button>
                    <button
                        onClick={() => setSelectedView('subject')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${selectedView === 'subject'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        By Subject
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatsCard
                    title="Average Attendance"
                    value={`${attendanceData.monthlyTrend.length > 0
                        ? Math.round(attendanceData.monthlyTrend.reduce((acc, curr) => acc + (curr.rate || 0), 0) / attendanceData.monthlyTrend.length)
                        : 0}%`}
                    subtitle="Overall"
                    color="indigo"
                    icon={<Users weight="fill" />}
                />
                <StatsCard
                    title="Trend"
                    value={`${(() => {
                        if (attendanceData.monthlyTrend.length < 2) return "0.0%";
                        const last = attendanceData.monthlyTrend[attendanceData.monthlyTrend.length - 1].rate;
                        const prev = attendanceData.monthlyTrend[attendanceData.monthlyTrend.length - 2].rate;
                        const diff = last - prev;
                        return (diff > 0 ? "+" : "") + diff + "%";
                    })()}`}
                    subtitle="vs last month"
                    color="emerald"
                    icon={<TrendUp weight="fill" />}
                />
                <StatsCard
                    title="Best Class"
                    value={attendanceData.byClass[0]?.name || 'N/A'}
                    subtitle={`${attendanceData.byClass[0]?.rate || 0}% attendance`}
                    color="purple"
                    icon={<CalendarCheck weight="fill" />}
                />
                <StatsCard
                    title="Total Sessions"
                    value={attendanceData.monthlyTrend.reduce((sum, m) => sum + m.total, 0)}
                    subtitle="This period"
                    color="amber"
                    icon={<CalendarCheck weight="fill" />}
                />
            </div>

            {/* Main Chart */}
            <div className="glass p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/50 to-slate-900/80 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white mb-6">
                    {selectedView === 'overall' && 'Attendance Trend'}
                    {selectedView === 'class' && 'Class-wise Attendance'}
                    {selectedView === 'subject' && 'Subject-wise Attendance'}
                </h3>

                <ResponsiveContainer width="100%" height={400}>
                    {selectedView === 'overall' ? (
                        <BarChart data={attendanceData.monthlyTrend}>
                            <defs>
                                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                                labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                                formatter={(value) => [`${value}%`, 'Attendance Rate']}
                            />
                            <Bar dataKey="rate" fill="url(#colorBar)" radius={[8, 8, 0, 0]} barSize={50} />
                        </BarChart>
                    ) : (
                        <BarChart data={selectedView === 'class' ? attendanceData.byClass : attendanceData.bySubject}>
                            <defs>
                                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.4} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" angle={-15} textAnchor="end" height={60} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                                labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                                formatter={(value) => [`${value}%`, 'Attendance Rate']}
                            />
                            <Bar dataKey="rate" fill="url(#colorBar)" radius={[8, 8, 0, 0]} barSize={50} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Distribution */}
            {selectedView === 'class' && (
                <div className="glass p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/50 to-slate-900/80 backdrop-blur-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Attendance Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={attendanceData.byClass}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, rate }) => `${name}: ${rate}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="rate"
                                paddingAngle={5}
                            >
                                {attendanceData.byClass.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

const StatsCard = ({ title, value, subtitle, color, icon }) => {
    const colorClasses = {
        indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass p-6 rounded-2xl border ${colorClasses[color]}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-slate-400">{title}</div>
            <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
        </motion.div>
    );
};

export default AttendanceTrends;
