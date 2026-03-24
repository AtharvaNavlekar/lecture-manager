import logger from '@/utils/logger';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChartLineUp, Clock, WarningCircle, ArrowsClockwise, DeviceMobile,
    Gear, FileText, CheckCircle, Robot
} from '@phosphor-icons/react';
import api from '../utils/api';
import AutomationStatusCard from '../components/automation/AutomationStatusCard';
import PendingAssignmentRow from '../components/automation/PendingAssignmentRow';
import ManualOverrideModal from '../components/automation/ManualOverrideModal';
import { toast } from 'react-hot-toast';

const AutomationDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        status: null,
        pending: [],
        logs: []
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [overrideModalOpen, setOverrideModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const fetchData = useCallback(async (isBackground = false) => {
        if (!isBackground) setIsRefreshing(true);
        try {
            const [statusRes, pendingRes, logsRes] = await Promise.all([
                api.get('/automation/status'),
                api.get('/automation/pending'),
                api.get('/automation/logs')
            ]);

            setData({
                status: statusRes.data.status,
                pending: pendingRes.data.assignments,
                logs: logsRes.data.logs
            });
        } catch (err) {
            logger.error('Failed to fetch dashboard data:', err);
            toast.error('Failed to update dashboard data');
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(true);
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleOverrideClick = (assignment) => {
        setSelectedAssignment(assignment);
        setOverrideModalOpen(true);
    };

    const handleOverrideSuccess = () => {
        toast.success('Substitute assigned successfully');
        fetchData(); // Refresh data immediately
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                    <p className="text-slate-400 font-medium animate-pulse">Initializing Automation Core...</p>
                </div>
            </div>
        );
    }

    const { status, pending, logs } = data;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 flex items-center gap-3">
                        <Robot className="text-indigo-400" weight="fill" />
                        Automation Core
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full shadow-lg ${status?.system_active ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' : 'bg-rose-500 shadow-rose-500/50'}`} />
                        System Status: {status?.system_active ? 'Active & Monitoring' : 'Stopped'}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => fetchData()}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center group"
                        title="Refresh Data"
                    >
                        <ArrowsClockwise size={20} className={`text-slate-300 group-hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`} weight="bold" />
                    </button>
                    <button className="px-5 py-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5">
                        <Gear size={20} weight="fill" />
                        Configure
                    </button>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <AutomationStatusCard
                    title="Pending Approvals"
                    value={status?.leave_requests?.pending_approval || 0}
                    subtext={`${status?.leave_requests?.auto_approved_this_week || 0} auto-approved this week`}
                    icon={<FileText size={24} weight="duotone" />}
                    color="blue"
                />
                <AutomationStatusCard
                    title="Pending Response"
                    value={status?.assignments?.pending_response || 0}
                    subtext={`Avg wait: ${status?.assignments?.oldest_pending_minutes || 0} mins`}
                    icon={<Clock size={24} weight="duotone" />}
                    color="amber"
                />
                <AutomationStatusCard
                    title="Auto-Assigned"
                    value={status?.assignments?.auto_assigned_this_week || 0}
                    subtext="Total this week"
                    icon={<CheckCircle size={24} weight="duotone" />}
                    color="green"
                />
                <AutomationStatusCard
                    title="Unassigned"
                    value={status?.assignments?.unassigned || 0}
                    subtext="Manual intervention needed"
                    icon={<WarningCircle size={24} weight="duotone" />}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Pending Assignments List (Main Column) */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass border border-white/5 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                <Clock size={20} weight="fill" />
                            </div>
                            <h2 className="text-lg font-bold text-white tracking-wide">
                                Pending Substitute Assignments
                            </h2>
                        </div>

                        {pending.length === 0 ? (
                            <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-black/20">
                                <CheckCircle size={48} weight="duotone" className="text-emerald-500/50 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-300 mb-1">All Caught Up</h3>
                                <p className="text-sm text-slate-500">No pending assignments currently needing response.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pending.map(item => (
                                    <PendingAssignmentRow
                                        key={item.id}
                                        assignment={item}
                                        onOverride={handleOverrideClick}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Log (Side Column) */}
                <div className="space-y-6">
                    <div className="glass border border-white/5 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4 shrink-0">
                            <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400">
                                <ChartLineUp size={20} weight="bold" />
                            </div>
                            <h2 className="text-lg font-bold text-white tracking-wide">
                                Recent Activity
                            </h2>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {logs.map((log) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={log.id}
                                    className="flex gap-4 text-sm p-3 rounded-2xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5"
                                >
                                    <div className="relative mt-1 py-1">
                                        <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${log.type === 'AUTO_ASSIGN' ? 'bg-emerald-400 shadow-emerald-400/50' :
                                            log.type === 'MANUAL_OVERRIDE' ? 'bg-indigo-400 shadow-indigo-400/50' :
                                                'bg-rose-400 shadow-rose-400/50'
                                            }`} />
                                        {/* Line connecting nodes */}
                                        <div className="absolute top-4 bottom-[-20px] left-1/2 -translate-x-1/2 w-[1px] bg-white/5 group-last:hidden" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-300 font-medium leading-relaxed">{log.description}</p>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-1.5 flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-slate-500 text-sm font-medium">No recent activity logs found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {overrideModalOpen && (
                <ManualOverrideModal
                    assignment={selectedAssignment}
                    onClose={() => setOverrideModalOpen(false)}
                    onSuccess={handleOverrideSuccess}
                />
            )}
        </div>
    );
};

export default AutomationDashboard;
