import logger from '@/utils/logger';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, Clock, UserPlus, AlertCircle, RefreshCw, Smartphone,
    Settings, FileText, CheckCircle2
} from 'lucide-react';
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
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const { status, pending, logs } = data;

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 md:p-4 md:p-6 lg:p-8 text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Smartphone className="text-blue-500" />
                        Automation Dashboard
                    </h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
                        <span className={`inline-block w-2 h-2 rounded-full ${status?.system_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        System Status: {status?.system_active ? 'Active & Monitoring' : 'Stopped'}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => fetchData()}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} className={`text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center gap-2">
                        <Settings size={18} />
                        Configure
                    </button>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
                <AutomationStatusCard
                    title="Pending Approvals"
                    value={status?.leave_requests?.pending_approval || 0}
                    subtext={`${status?.leave_requests?.auto_approved_this_week || 0} auto-approved this week`}
                    icon={<FileText size={24} className="text-blue-400" />}
                    color="blue"
                />
                <AutomationStatusCard
                    title="Pending Response"
                    value={status?.assignments?.pending_response || 0}
                    subtext={`Avg wait: ${status?.assignments?.oldest_pending_minutes || 0} mins`}
                    icon={<Clock size={24} className="text-amber-400" />}
                    color="amber"
                />
                <AutomationStatusCard
                    title="Auto-Assigned"
                    value={status?.assignments?.auto_assigned_this_week || 0}
                    subtext="Total this week"
                    icon={<CheckCircle2 size={24} className="text-emerald-400" />}
                    color="green"
                />
                <AutomationStatusCard
                    title="Unassigned"
                    value={status?.assignments?.unassigned || 0}
                    subtext="Manual intervention needed"
                    icon={<AlertCircle size={24} className="text-red-400" />}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Pending Assignments List (Main Column) */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-xl">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Clock className="text-amber-400" />
                            Pending Substitute Assignments
                        </h2>

                        {pending.length === 0 ? (
                            <div className="p-4 md:p-4 md:p-6 lg:p-8 text-center border border-dashed border-white/10 rounded-xl">
                                <p className="text-slate-500">No pending assignments currently needing response.</p>
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
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-xl h-full">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Activity className="text-slate-400" />
                            Recent Activity
                        </h2>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {logs.map((log) => (
                                <div key={log.id} className="flex gap-3 text-sm pb-3 border-b border-white/5 last:border-0">
                                    <div className={`mt-1 min-w-2 h-2 rounded-full ${log.type === 'AUTO_ASSIGN' ? 'bg-emerald-400' :
                                        log.type === 'MANUAL_OVERRIDE' ? 'bg-blue-400' :
                                            'bg-slate-400'
                                        }`} />
                                    <div>
                                        <p className="text-slate-300">{log.description}</p>
                                        <span className="text-xs text-slate-500 block mt-1">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <p className="text-slate-500 text-sm">No recent activity logs found.</p>
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
