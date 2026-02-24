import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import CustomDropdown from '../components/CustomDropdown';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChalkboardTeacher,
    Crown,
    UserSwitch,
    ChartBar,
    ShieldCheck,
    TrendUp,
    ChartPieSlice,
    Warning,
    Books,
    Users,
    Table,
    GridFour,
    ListBullets,
    CheckCircle,
    Student,
    Clock
} from '@phosphor-icons/react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';

const HodDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [actingHod, setActingHod] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

    const fetchHodData = React.useCallback(async () => {
        try {
            const [statsRes, analyticsRes] = await Promise.all([
                api.get('/hod/stats'),
                api.get('/hod/analytics')
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
                setTeachers(statsRes.data.teachers);
                const currentActing = statsRes.data.teachers.find(t => t.is_acting_hod === 1);
                if (currentActing) {
                    setActingHod(currentActing);
                    setSelectedTeacher(currentActing.id);
                } else {
                    setActingHod(null);
                    setSelectedTeacher('');
                }
            }
            if (analyticsRes.data.success) {
                console.log('[HOD Dashboard] Analytics received:', analyticsRes.data.analytics);
                console.log('[HOD Dashboard] Syllabus Data:', analyticsRes.data.analytics?.syllabusData);
                setAnalytics(analyticsRes.data.analytics);
            }
            setLoading(false);
        } catch (e) {
            logger.error('Failed to fetch HOD data:', e);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHodData();
    }, [fetchHodData]);

    const delegatePrivileges = async () => {
        // If revoking (actingHod exists), we send null/empty or handle logic
        const target = actingHod ? null : selectedTeacher;

        if (!target && !actingHod) return; // Must have target if delegating

        setActionLoading(true);
        try {
            const res = await api.post('/hod/delegate', { targetTeacherId: target });
            if (res.data.success) {
                setMessage({ type: 'success', text: res.data.message });
                fetchHodData();
            }
        } catch (e) {
            setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to delegate' });
        }
        setActionLoading(false);
        setTimeout(() => setMessage(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading HOD Dashboard...</p>
                </div>
            </div>
        );
    }

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Stats Overview Row (Unifies with Faculty Directory) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCardNew
                    title="Department Strength"
                    value={stats?.facultyCount || 0}
                    icon={ChalkboardTeacher}
                    color="blue"
                />
                <StatCardNew
                    title="Daily Throughput"
                    value={stats?.dailyClasses || 0}
                    icon={ChartBar}
                    color="emerald"
                />
                <StatCardNew
                    title="Occupation Status"
                    value={stats?.occupationRate ? 'Vacant' : 'Active'}
                    icon={Crown}
                    color="amber"
                />
                <StatCardNew
                    title="Student Enrollment"
                    value={stats?.studentCount || 0}
                    icon={Users}
                    color="purple"
                />
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <Crown weight="fill" className="text-amber-400" />
                        Executive Console
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm">Departmental Oversight & Intelligence</p>
                </div>
                <div className="text-left md:text-right">
                    <p className="text-xs md:text-sm text-slate-500 uppercase tracking-wider font-bold">Acting as</p>
                    <p className="text-base md:text-lg font-bold text-amber-400">{user?.name}</p>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Syllabus Completion */}
                <ChartCard title="Syllabus Completion" icon={Books} delay={0.1}>
                    {!analytics?.syllabusData || analytics.syllabusData.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-12 flex flex-col items-center">
                            <Clock size={40} className="mb-3 opacity-50" />
                            <p className="font-semibold">No syllabus data available</p>
                            <p className="text-xs mt-2 text-slate-500">
                                {!analytics?.syllabusData
                                    ? 'Analytics data not loaded yet'
                                    : 'No subjects found for this department'}
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart
                                data={analytics.syllabusData.map(item => ({
                                    name: item.subject,
                                    completion: item.total_topics > 0
                                        ? Math.round((item.covered_topics / item.total_topics) * 100)
                                        : 0,
                                    covered: item.covered_topics,
                                    total: item.total_topics,
                                    year: item.class_year
                                }))}
                                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#64748b"
                                    style={{ fontSize: '10px' }}
                                    tickLine={false}
                                    axisLine={false}
                                    angle={-15}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    style={{ fontSize: '11px' }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                    ticks={[0, 25, 50, 75, 100]}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: '#ffffff10' }}
                                    formatter={(value, name, props) => {
                                        if (name === 'completion') {
                                            return [
                                                `${value}% (${props.payload.covered}/${props.payload.total} topics)`,
                                                'Completion'
                                            ];
                                        }
                                        return [value, name];
                                    }}
                                    labelFormatter={(label) => `${label}`}
                                />
                                <Bar
                                    dataKey="completion"
                                    fill="url(#colorCompletion)"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={50}
                                />
                                <defs>
                                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Lecture Execution Rate */}
                <ChartCard title="Lecture Execution Rate" icon={ChartPieSlice} delay={0.2}>
                    {analytics?.executionData && analytics.executionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={analytics.executionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {analytics.executionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-slate-400 text-sm py-12 bg-black/20 rounded-2xl border border-white/5">
                            Real-time status breakdown of today's schedule
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Attendance Trends */}
            <ChartCard title="Attendance Trends (7 Days)" icon={TrendUp} delay={0.3}>
                {analytics?.attendanceData && analytics.attendanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={analytics.attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                style={{ fontSize: '11px' }}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#64748b"
                                style={{ fontSize: '11px' }}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ stroke: '#ffffff20' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="attendance"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-slate-400 text-sm py-8 bg-black/20 rounded-2xl border border-white/5">
                        No attendance data available for the past 7 days
                    </div>
                )}
            </ChartCard>

            {/* At-Risk Students Section (Upgraded) */}
            <div className="glass rounded-3xl p-1 border border-white/5">
                <div className="p-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Warning weight="fill" className="text-rose-400" />
                            At-Risk Students Watchlist
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Students with CRITICAL ATTENDANCE (&lt; 75% ABSENT)</p>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-[#0B1221] p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            <GridFour size={16} weight="bold" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            <ListBullets size={16} weight="bold" />
                        </button>
                    </div>
                </div>

                <div className="p-2">
                    {analytics?.atRiskStudents && analytics.atRiskStudents.length > 0 ? (
                        <AnimatePresence mode='wait'>
                            {viewMode === 'grid' ? (
                                <motion.div
                                    key="grid"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 p-2"
                                >
                                    {analytics.atRiskStudents.map((student, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 rounded-2xl p-4 text-center hover:bg-rose-500/20 transition-all cursor-pointer group"
                                        >
                                            <div className="text-2xl font-bold text-rose-400 group-hover:scale-110 transition-transform">{student.attendance}%</div>
                                            <div className="text-sm font-bold text-white mt-2 truncate">{student.name}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{student.year}</div>
                                            <div className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-1 rounded-full inline-block mt-3 border border-rose-500/20">
                                                {student.missedClasses} Classes Missed
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="table"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="overflow-hidden rounded-2xl border border-white/5 bg-[#0B1221]"
                                >
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-white/5 text-left">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Name</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year/Sem</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classes Missed</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {analytics.atRiskStudents.map((student, idx) => (
                                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-bold text-white flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs">
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            {student.name}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-slate-400">{student.year}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-rose-400 font-bold">{student.attendance}%</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-slate-300">{student.missedClasses}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                                <Warning size={12} weight="fill" /> Critical
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    ) : (
                        <div className="text-center py-12 bg-black/20 rounded-2xl m-2 border border-white/5 border-dashed">
                            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3 opacity-50" />
                            <h4 className="text-white font-bold">All Good!</h4>
                            <p className="text-slate-400 text-sm mt-1">No students currently at risk.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delegate Authority - Premium Console */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-amber-500/30 via-orange-500/10 to-transparent shadow-2xl shadow-black/50"
            >
                {/* Background & Glow */}
                <div className="absolute inset-0 bg-[#0B1221] rounded-[23px] z-0" />
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none z-0" />

                <div className="relative z-10 p-6 md:p-8 flex flex-col xl:flex-row items-center gap-8 justify-between">
                    {/* Header Info */}
                    <div className="flex items-center gap-5 w-full xl:w-auto">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)] shrink-0">
                            <ShieldCheck weight="fill" className="text-amber-400 text-3xl drop-shadow-sm" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                                Delegate Authority
                                {actingHod && <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Acting HOD Active</span>}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
                                Temporarily transfer HOD privileges or appoint an Acting HOD during absence.
                            </p>
                        </div>
                    </div>

                    {/* Actions Console */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-stretch sm:items-end bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="min-w-[280px] sm:w-[320px]">
                            <CustomDropdown
                                label="SELECT SENIOR FACULTY"
                                value={selectedTeacher}
                                onChange={setSelectedTeacher}
                                options={teachers
                                    .filter(t => !t.is_hod && !t.is_acting_hod)
                                    .map(t => ({
                                        value: t.id,
                                        label: `${t.name} - ${t.post}`
                                    }))}
                                placeholder="Select Senior Faculty..."
                                disabled={!!actingHod}
                                className="w-full"
                                buttonClassName="h-[52px] bg-[#0F1623] border-white/10 hover:border-amber-500/30 text-base shadow-inner focus:ring-2 focus:ring-amber-500/50"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(245, 158, 11, 0.4)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={delegatePrivileges}
                            disabled={(!selectedTeacher && !actingHod) || actionLoading}
                            className={`h-[52px] px-8 font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border flex items-center justify-center gap-2.5 text-base whitespace-nowrap ${actingHod
                                ? 'bg-gradient-to-r from-rose-600 to-red-600 border-rose-500/30 text-white shadow-rose-900/30'
                                : 'bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400/30 text-white shadow-amber-900/30'
                                }`}
                        >
                            {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                <>
                                    {actingHod ? (
                                        <>
                                            <Warning weight="fill" size={20} />
                                            Revoke Power
                                        </>
                                    ) : (
                                        <>
                                            <Crown weight="fill" size={20} />
                                            Execute Power
                                        </>
                                    )}
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 shadow-xl z-20 ${message.type === 'success' ? 'bg-emerald-500/90 border-emerald-500/50 text-white' : 'bg-red-500/90 border-red-500/50 text-white'}`}
                    >
                        {message.type === 'success' ? <CheckCircle weight="fill" size={16} /> : <Warning weight="fill" size={16} />}
                        {message.text}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

// Reusable Components
const StatCardNew = ({ title, value, icon, color }) => {
    const Icon = icon;
    const colors = {
        blue: 'text-blue-400 bg-blue-500/10',
        emerald: 'text-emerald-400 bg-emerald-500/10',
        amber: 'text-amber-400 bg-amber-500/10',
        purple: 'text-purple-400 bg-purple-500/10',
    };

    return (
        <div className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-white mt-1 truncate">{value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[color]}`}>
                <Icon size={20} weight="fill" />
            </div>
        </div>
    );
};

const ChartCard = ({ title, icon, children, delay }) => {
    const Icon = icon;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="glass rounded-3xl p-6 border border-white/5"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Icon weight="fill" className="text-slate-300 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            {children}
        </motion.div>
    );
};

export default HodDashboard;
