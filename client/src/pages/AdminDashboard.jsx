import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Student,
    ChalkboardTeacher,
    BookOpen,
    ChartBar,
    TrendUp,
    Warning,
    CheckCircle,
    Clock,
    CalendarCheck,
    UserPlus,
    Trash,
    ShieldCheck,
    FileXls,
    DownloadSimple,
    Gear,
    Plus,
    CaretRight
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        teachers: 0,
        students: 0,
        departments: 0,
        attendance_rate: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentLogs, setRecentLogs] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Use allSettled to prevent one failure from breaking the entire dashboard
            const results = await Promise.allSettled([
                api.get('/teachers'),
                api.get('/students'),
                api.get('/admin/audit-logs'),
                api.get('/config/departments')
            ]);

            const [teachersRes, studentsRes, logsRes, deptsRes] = results;

            setStats(prev => ({
                ...prev,
                teachers: teachersRes.status === 'fulfilled' && teachersRes.value.data.success
                    ? teachersRes.value.data.teachers.length
                    : 0,
                students: studentsRes.status === 'fulfilled' && studentsRes.value.data.success
                    ? (studentsRes.value.data.pagination?.total || studentsRes.value.data.students.length)
                    : 0,
                departmentsData: deptsRes.status === 'fulfilled' && deptsRes.value.data.success
                    ? deptsRes.value.data.departments.map(d => ({ name: d.name, active: true }))
                    : []
            }));

            if (logsRes.status === 'fulfilled' && logsRes.value.data.success) {
                setRecentLogs(logsRes.value.data.logs.slice(0, 5));
            }
        } catch (e) {
            logger.error('Dashboard fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                    <ShieldCheck className="text-indigo-400" weight="duotone" />
                    Admin Command Center
                </h1>
                <p className="text-slate-400 mt-2 text-sm md:text-lg">System-wide monitoring and control hub.</p>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatCard
                    icon={ChalkboardTeacher}
                    label="Total Faculty"
                    value={loading ? '...' : stats.teachers}
                    sub="Active Staff"
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    border="border-blue-500/20"
                />
                <StatCard
                    icon={Student}
                    label="Total Students"
                    value={loading ? '...' : stats.students}
                    sub="Enrolled"
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    border="border-emerald-500/20"
                />
                <StatCard
                    icon={ChartBar}
                    label="System Health"
                    value="100%"
                    sub="Operational"
                    color="text-indigo-400"
                    bg="bg-indigo-500/10"
                    border="border-indigo-500/20"
                />
                <StatCard
                    icon={Warning}
                    label="Alerts"
                    value={loading ? '...' : recentLogs.filter(l => l.action.includes('error') || l.action.includes('warn')).length}
                    sub="Recent Issues"
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                    border="border-amber-500/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Main Content (2/3) */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">

                    {/* Department Health Overview */}
                    <div className="glass rounded-3xl p-5 md:p-8 border border-white/5 relative overflow-hidden">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                            <ChartBar className="text-indigo-400" /> Department Health
                        </h3>
                        {stats.departmentsData && stats.departmentsData.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stats.departmentsData.map((dept, i) => (
                                    <div key={dept.name} className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-indigo-500/30 transition-all group">
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{dept.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1">Status: <span className="text-emerald-400 font-bold">Active</span></p>
                                        </div>
                                        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                                            {dept.active ? 'On' : 'Off'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 py-6">No department data available.</div>
                        )}
                    </div>

                    {/* Live Audit Feed */}
                    <div className="glass rounded-3xl p-5 md:p-8 border border-white/5 relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="text-emerald-400" /> Live Activity Feed
                            </h3>
                            <Link to="/audit" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-wider">
                                View All Logs <CaretRight weight="bold" />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {loading ? <div className="text-center text-slate-500 animate-pulse">Loading feed...</div> :
                                recentLogs.length === 0 ? <div className="text-center text-slate-500 py-10">No recent activity.</div> :
                                    recentLogs.map((log) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
                                        >
                                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${log.action.includes('DELETE') ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                                log.action.includes('ADD') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                    'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                                }`} />
                                            <div>
                                                <p className="text-sm text-slate-300">
                                                    <span className="font-bold text-white">User {log.user_id}</span> {log.action.toLowerCase()} <span className="font-mono text-xs bg-black/30 px-1 py-0.5 rounded text-slate-400 border border-white/5">{log.target}</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-1">{new Date(log.timestamp).toLocaleString()} • {log.details}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar (1/3) */}
                <div className="space-y-8">
                    {/* Quick Actions Hub */}
                    <div className="glass rounded-3xl p-6 border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/faculty" className="flex flex-col items-center justify-center p-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-900/20">
                                <Plus size={24} weight="bold" className="mb-2" />
                                <span className="text-xs font-bold">Add Faculty</span>
                            </Link>
                            <Link to="/students" className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/20">
                                <FileXls size={24} weight="duotone" className="mb-2" />
                                <span className="text-xs font-bold">Import Data</span>
                            </Link>
                            <button className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-white/5">
                                <DownloadSimple size={24} className="mb-2" />
                                <span className="text-xs font-bold">Backup DB</span>
                            </button>
                            <Link to="/settings" className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-white/5">
                                <Gear size={24} className="mb-2" />
                                <span className="text-xs font-bold">Settings</span>
                            </Link>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="glass rounded-3xl p-6 border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-4">System Service Status</h3>
                        <div className="space-y-4">
                            <StatusRow label="Database" status="Online" color="green" />
                            <StatusRow label="Auth Server" status="Online" color="green" />
                            <StatusRow label="Email Gateway" status="Idle" color="yellow" />
                            <StatusRow label="Backup Service" status="Ready" color="blue" />
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="glass rounded-3xl p-6 border border-rose-500/20 bg-rose-500/5">
                        <h3 className="text-lg font-bold text-rose-400 mb-2 flex items-center gap-2">
                            <Warning weight="fill" /> Danger Zone
                        </h3>
                        <p className="text-xs text-rose-300/80 mb-4">Destructive actions cannot be undone.</p>

                        <button onClick={handleSystemReset} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all border border-rose-500/20 font-bold text-sm">
                            Initialize Factory Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const confirmReset = async () => {
    const toastId = toast.loading('Reseting system...');
    try {
        const res = await api.post('/admin/factory-reset');
        if (res.data.success) {
            toast.success('System reset complete. Redirecting to login...', { id: toastId });
            setTimeout(() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }, 2000);
        }
    } catch (err) {
        toast.error('Reset failed: ' + err.message, { id: toastId });
    }
};

const handleSystemReset = () => {
    toast((t) => (
        <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-start gap-3">
                <div className="p-3 bg-red-500/20 rounded-full text-red-500 animate-pulse">
                    <Warning size={32} weight="bold" />
                </div>
                <div>
                    <h4 className="font-bold text-white text-lg">CRITICAL WARNING</h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                        This will <strong className="text-red-400">WIPE ALL DATA</strong> and reset the system to its initial state.
                        <br /><br />
                        This action is <span className="underline decoration-red-500 underline-offset-2">irreversible</span>.
                    </p>
                </div>
            </div>
            <div className="flex gap-3 justify-end mt-2">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors border border-white/5"
                >
                    Cancel
                </button>
                <button
                    onClick={() => { toast.dismiss(t.id); confirmReset(); }}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg font-bold shadow-lg shadow-red-900/30 transition-all flex items-center gap-2"
                >
                    <Trash size={16} weight="bold" /> Confirm Wipe
                </button>
            </div>
        </div>
    ), {
        duration: 10000,
        style: {
            background: '#0f172a',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            padding: '20px',
            minWidth: '400px'
        }
    });
};

const StatCard = ({ icon: Icon, label, value, sub, color, bg, border }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className={`glass p-6 rounded-3xl relative overflow-hidden group border ${border}`}
    >
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${bg} blur-xl opacity-50 group-hover:opacity-100 transition-opacity`} />

        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${bg} ${color}`}>
                <Icon weight="duotone" />
            </div>
            <div className="text-3xl font-bold text-white tracking-tighter mb-1">{value}</div>
            <div className="text-sm text-slate-400 font-medium">{label}</div>
            <div className={`text-[10px] mt-2 inline-block px-2 py-1 rounded bg-white/5 border border-white/5 ${color} bg-opacity-10`}>{sub}</div>
        </div>
    </motion.div>
);

const StatusRow = ({ label, status, color }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
        <span className="text-sm font-bold text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color === 'green' ? 'bg-emerald-500 animate-pulse' : color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'}`} />
            <span className={`text-xs font-mono font-bold ${color === 'green' ? 'text-emerald-400' : color === 'blue' ? 'text-blue-400' : 'text-amber-400'}`}>{status}</span>
        </div>
    </div>
);

export default AdminDashboard;
