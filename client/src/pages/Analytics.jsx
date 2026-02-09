import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion } from 'framer-motion';
import {
    TrendUp,
    Users,
    BookOpen,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Medal
} from '@phosphor-icons/react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    LabelList
} from 'recharts';

const Analytics = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalLectures: 0,
        completedLectures: 0,
        totalAssignments: 0,
        gradedAssignments: 0,
        leaveRequests: { approved: 0, pending: 0, rejected: 0 },
        monthlyTrend: [],
        attendance: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch analytics summary
            const analyticsRes = await api.get('/analytics/summary');

            if (analyticsRes.data.success) {
                const data = analyticsRes.data.analytics;
                logger.debug('[Analytics] Received from backend:', data);

                // Fetch leave requests separately
                let leaves = [];
                try {
                    const leavesRes = await api.get('/leaves?teacher_id=' + (user?.id || ''));
                    leaves = leavesRes.data.leaves || [];
                } catch (leaveErr) {
                    logger.warn('[Analytics] Could not fetch leaves:', leaveErr.message);
                }

                // Fetch attendance trends for charts
                let monthlyTrend = [];
                try {
                    const trendsRes = await api.get('/analytics/attendance-trends');
                    if (trendsRes.data.success) {
                        monthlyTrend = trendsRes.data.data.monthlyTrend || [];
                        logger.debug('[Analytics] Monthly trend data:', monthlyTrend);
                    }
                } catch (trendErr) {
                    logger.warn('[Analytics] Could not fetch trends:', trendErr.message);
                }

                setStats({
                    totalLectures: data.totalLectures,
                    completedLectures: data.completedLectures,
                    totalAssignments: data.totalAssignments,
                    gradedAssignments: data.gradedAssignments,
                    leaveRequests: {
                        approved: leaves.filter(l => l.status === 'approved').length,
                        pending: leaves.filter(l => l.status === 'pending').length,
                        rejected: leaves.filter(l => l.status === 'rejected').length
                    },
                    monthlyTrend: monthlyTrend,
                    attendance: monthlyTrend
                });
            }
        } catch (err) {
            logger.error('Fetch analytics error:', err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    const completionRate = stats.totalLectures > 0
        ? ((stats.completedLectures / stats.totalLectures) * 100).toFixed(1)
        : 0;

    const assignmentGradingRate = stats.totalAssignments > 0
        ? ((stats.gradedAssignments / stats.totalAssignments) * 100).toFixed(1)
        : 0;

    const leaveData = [
        { name: 'Approved', value: stats.leaveRequests.approved, color: '#10b981' },
        { name: 'Pending', value: stats.leaveRequests.pending, color: '#f59e0b' },
        { name: 'Rejected', value: stats.leaveRequests.rejected, color: '#ef4444' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                    <TrendUp weight="fill" className="text-indigo-400" />
                    Department Analytics
                </h1>
                <p className="text-slate-400 mt-2 text-sm md:text-base">Performance insights and statistics</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatsCard
                    icon={<Calendar weight="fill" />}
                    title="Total Lectures"
                    value={stats.totalLectures}
                    subtitle={`${stats.completedLectures} completed`}
                    color="indigo"
                />
                <StatsCard
                    icon={<BookOpen weight="fill" />}
                    title="Assignments"
                    value={stats.totalAssignments}
                    subtitle={`${stats.gradedAssignments} graded`}
                    color="purple"
                />
                <StatsCard
                    icon={<CheckCircle weight="fill" />}
                    title="Completion Rate"
                    value={`${completionRate}%`}
                    subtitle="Lectures completed"
                    color="emerald"
                />
                <StatsCard
                    icon={<Medal weight="fill" />}
                    title="Grading Progress"
                    value={`${assignmentGradingRate}%`}
                    subtitle="Assignments graded"
                    color="amber"
                />
            </div>

            {/* Charts Section - Next Gen UI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lecture Trend - Premium Area Chart */}
                <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 shadow-2xl">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl rounded-[23px] z-0" />

                    <div className="relative z-10 p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <div className="w-1 h-6 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                    Lecture Velocity
                                </h3>
                                <p className="text-slate-400 text-sm mt-1 ml-3">Real-time completion metrics</p>
                            </div>
                            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-white/5">
                                <button className="px-3 py-1 text-xs font-bold text-cyan-400 bg-cyan-400/10 rounded-lg border border-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]">7 Days</button>
                                <button className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white transition-colors">30 Days</button>
                            </div>
                        </div>

                        {stats.monthlyTrend && stats.monthlyTrend.length > 0 ? (
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={stats.monthlyTrend}
                                        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#64748b"
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value) => `${value}`}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: '#22d3ee', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #1e293b',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                            }}
                                            itemStyle={{ color: '#22d3ee' }}
                                            formatter={(value) => [value, 'Lectures']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#22d3ee"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorTrend)"
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff', shadow: '0 0 10px #22d3ee' }}
                                        >
                                            <LabelList
                                                dataKey="total"
                                                position="top"
                                                offset={10}
                                                style={{ fill: '#22d3ee', fontSize: '12px', fontWeight: 'bold' }}
                                                formatter={(value) => value > 0 ? value : ''}
                                            />
                                        </Area>
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[320px] text-slate-500 gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                                    <Clock size={32} />
                                </div>
                                <p>No tracking data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Leave Status - Modern Donut */}
                <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 shadow-2xl">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl rounded-[23px] z-0" />

                    <div className="relative z-10 p-6 h-full flex flex-col">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                            <div className="w-1 h-6 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                            Leave Distribution
                        </h3>

                        {leaveData.some(item => item.value > 0) ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-full h-[250px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={leaveData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {leaveData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#0f172a',
                                                    border: '1px solid #334155',
                                                    borderRadius: '12px'
                                                }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <div className="text-3xl font-bold text-white">
                                            {leaveData.reduce((acc, curr) => acc + curr.value, 0)}
                                        </div>
                                        <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Total</div>
                                    </div>
                                </div>

                                {/* Custom Legend */}
                                <div className="flex gap-6 mt-6">
                                    {leaveData.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                                            <span className="text-sm font-medium text-slate-300">{item.name}</span>
                                            <span className="text-sm font-bold text-white">({item.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                                    <CheckCircle size={32} />
                                </div>
                                <p>No leave requests recorded</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="glass p-4 md:p-6 rounded-2xl border border-white/5">
                <h3 className="text-base md:text-lg font-bold text-white mb-4">Quick Stats</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle weight="fill" size={24} className="text-emerald-400" />
                            <span className="text-sm text-slate-400">Approved Leaves</span>
                        </div>
                        <div className="text-3xl font-bold text-emerald-400">{stats.leaveRequests.approved}</div>
                    </div>
                    <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock weight="fill" size={24} className="text-amber-400" />
                            <span className="text-sm text-slate-400">Pending Leaves</span>
                        </div>
                        <div className="text-3xl font-bold text-amber-400">{stats.leaveRequests.pending}</div>
                    </div>
                    <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <XCircle weight="fill" size={24} className="text-rose-400" />
                            <span className="text-sm text-slate-400">Rejected Leaves</span>
                        </div>
                        <div className="text-3xl font-bold text-rose-400">{stats.leaveRequests.rejected}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ icon, title, value, subtitle, color }) => {
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
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-slate-400">{title}</div>
            <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
        </motion.div>
    );
};

export default Analytics;
