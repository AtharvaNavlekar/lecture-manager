import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import {
    ChartBar,
    TrendUp,
    UsersThree,
    Clock,
    CalendarCheck,
    DownloadSimple
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
    Area
} from 'recharts';
import axios from 'axios';

const SubstituteAnalytics = () => {
    const [stats, setStats] = useState({
        totalSubstitutions: 0,
        coverageRate: 0,
        topSubstitute: '',
        busiestDay: ''
    });
    const [monthlyData, setMonthlyData] = useState([]);
    const [deptData, setDeptData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Mock data for demonstration - relying on backend API in prod
            setStats({
                totalSubstitutions: 145,
                coverageRate: 98,
                topSubstitute: 'Sarah Wilson',
                busiestDay: 'Monday'
            });

            setMonthlyData([
                { name: 'Jan', requests: 12, filled: 12 },
                { name: 'Feb', requests: 19, filled: 18 },
                { name: 'Mar', requests: 15, filled: 15 },
                { name: 'Apr', requests: 22, filled: 20 },
                { name: 'May', requests: 28, filled: 28 },
                { name: 'Jun', requests: 14, filled: 14 },
            ]);

            setDeptData([
                { name: 'Science', value: 35 },
                { name: 'Math', value: 25 },
                { name: 'English', value: 20 },
                { name: 'History', value: 15 },
                { name: 'Art', value: 5 },
            ]);

            setLoading(false);
        } catch (err) {
            logger.error('Error fetching analytics:', err);
            setLoading(false);
        }
    };

    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

    const StatCard = ({ icon: Icon, label, value, sub, color, bg, border }) => (
        <div className={`glass p-6 rounded-3xl border ${border} relative overflow-hidden group`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${bg} blur-xl opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${bg} ${color}`}>
                    <Icon weight="duotone" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white tracking-tighter mb-1">{value}</div>
                <div className="text-sm text-slate-400 font-medium">{label}</div>
                {sub && <div className={`text-[10px] mt-2 inline-block px-2 py-1 rounded bg-white/5 border border-white/5 ${color} bg-opacity-10`}>{sub}</div>}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <ChartBar className="text-purple-400" weight="duotone" />
                        Substitute Analytics
                    </h1>
                    <p className="text-slate-400 mt-2">Data-driven insights into substitution trends.</p>
                </div>
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-white/5 shadow-lg transition-all flex items-center gap-2">
                    <DownloadSimple size={20} weight="bold" /> Generate Report
                </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatCard
                    icon={TrendUp}
                    label="Total Substitutions"
                    value={loading ? '...' : stats.totalSubstitutions}
                    sub="+12% from last month"
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    border="border-emerald-500/20"
                />
                <StatCard
                    icon={CalendarCheck}
                    label="Coverage Rate"
                    value={loading ? '...' : `${stats.coverageRate}%`}
                    sub="Optimal Performance"
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    border="border-blue-500/20"
                />
                <StatCard
                    icon={UsersThree}
                    label="Top Substitute"
                    value={loading ? '...' : stats.topSubstitute}
                    sub="24 classes covered"
                    color="text-purple-400"
                    bg="bg-purple-500/10"
                    border="border-purple-500/20"
                />
                <StatCard
                    icon={Clock}
                    label="Busiest Day"
                    value={loading ? '...' : stats.busiestDay}
                    sub="Avg 8 requests"
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                    border="border-amber-500/20"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-3xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendUp className="text-emerald-400" weight="duotone" /> Monthly Trends
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorFilled" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" name="Requests" />
                                <Area type="monotone" dataKey="filled" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFilled)" name="Covered" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-8 rounded-3xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <UsersThree className="text-blue-400" weight="duotone" /> Department Distribution
                    </h3>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deptData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {deptData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text Overlay */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <div className="text-2xl md:text-3xl font-bold text-white">{stats.totalSubstitutions}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest">Total</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubstituteAnalytics;
