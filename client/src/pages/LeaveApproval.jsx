import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    Clock,
    Funnel,
    MagnifyingGlass,
    CalendarCheck,
    User,
    ChalkboardTeacher,
    CaretRight,
    WarningCircle,
    DownloadSimple
} from '@phosphor-icons/react';
import api from '../utils/api';

const LeaveApproval = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, denied, all
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, leaveId: null, action: null, teacherName: '' });

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/leaves');
            setLeaves(res.data.leaves || []);
        } catch (err) {
            logger.error('Error fetching leaves:', err);
        } finally {
            setLoading(false);
        }
    };

    const showConfirmation = (leave, action) => {
        setConfirmModal({
            show: true,
            leaveId: leave.id,
            action,
            teacherName: leave.teacher_name
        });
    };

    const handleAction = async () => {
        try {
            await api.put(`/leaves/${confirmModal.leaveId}/review`, { status: confirmModal.action });
            setConfirmModal({ show: false, leaveId: null, action: null, teacherName: '' });
            fetchLeaves(); // Refresh
        } catch (err) {
            logger.error('Update status error:', err);
            setConfirmModal({ show: false, leaveId: null, action: null, teacherName: '' });
        }
    };

    const handleExport = () => {
        if (!leaves.length) return;

        const headers = ['Faculty Name', 'Faculty ID', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Submitted At'];
        const csvContent = [
            headers.join(','),
            ...leaves.map(l => [
                `"${l.teacher_name}"`,
                l.teacher_id,
                `"${l.department}"`,
                l.leave_type || 'Casual',
                new Date(l.start_date).toLocaleDateString(),
                new Date(l.end_date).toLocaleDateString(),
                l.total_days,
                `"${l.reason}"`,
                l.status,
                new Date(l.submitted_at).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leave_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const filteredLeaves = leaves.filter(leave => {
        const matchesFilter = filter === 'all' || leave.status === filter;
        const matchesSearch = leave.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            leave.reason?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        denied: leaves.filter(l => l.status === 'denied').length,
        total: leaves.length
    };

    // eslint-disable-next-line no-unused-vars
    const StatCard = ({ icon: IconComponent, label, value, color, bg, border }) => (
        <div className={`glass p-6 rounded-3xl relative overflow-hidden group border ${border}`}
        >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${bg} blur-xl opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${bg} ${color}`}>
                    <IconComponent weight="duotone" />
                </div>
                <div className="text-3xl font-bold text-white tracking-tighter mb-1">{value}</div>
                <div className="text-sm text-slate-400 font-medium">{label}</div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <CheckCircle className="text-emerald-400" weight="duotone" />
                        Leave Approvals
                    </h1>
                    <p className="text-slate-400 mt-2">Review and process faculty leave requests.</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={loading || leaves.length === 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2"
                >
                    <DownloadSimple size={20} weight="bold" /> Export CSV
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Clock}
                    label="Pending Review"
                    value={stats.pending}
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                    border="border-amber-500/20"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Approved"
                    value={stats.approved}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    border="border-emerald-500/20"
                />
                <StatCard
                    icon={XCircle}
                    label="Denied"
                    value={stats.denied}
                    color="text-rose-400"
                    bg="bg-rose-500/10"
                    border="border-rose-500/20"
                />
                <StatCard
                    icon={CalendarCheck}
                    label="Total Requests"
                    value={stats.total}
                    color="text-indigo-400"
                    bg="bg-indigo-500/10"
                    border="border-indigo-500/20"
                />
            </div>

            {/* Filters */}
            <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
                    {['pending', 'approved', 'denied', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === f
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search faculty..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm font-medium"
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="glass rounded-3xl border border-white/5 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredLeaves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <div className="p-4 bg-white/5 rounded-full mb-4">
                            <Clock size={32} weight="duotone" opacity={0.5} />
                        </div>
                        <p>No leave requests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Duration</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Reason</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>

                                {filteredLeaves.map((leave) => (
                                    <tr
                                        key={leave.id}
                                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                    <User weight="duotone" size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{leave.teacher_name}</div>
                                                    <div className="text-xs text-slate-500">ID: {leave.teacher_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium text-slate-200">
                                                    {new Date(leave.start_date).toLocaleDateString()}
                                                    {leave.start_date !== leave.end_date && ` - ${new Date(leave.end_date).toLocaleDateString()}`}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock size={12} /> {leave.total_days} day(s)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-white/5">
                                                {leave.reason}
                                            </span>
                                            {leave.notes && <p className="text-xs text-slate-500 mt-2 max-w-xs truncate">{leave.notes}</p>}
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${leave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                leave.status === 'denied' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${leave.status === 'approved' ? 'bg-emerald-500' :
                                                    leave.status === 'denied' ? 'bg-rose-500' :
                                                        'bg-amber-500 animate-pulse'
                                                    }`} />
                                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            {leave.status === 'pending' ? (
                                                <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => showConfirmation(leave, 'approved')}
                                                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={20} weight="bold" />
                                                    </button>
                                                    <button
                                                        onClick={() => showConfirmation(leave, 'denied')}
                                                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 hover:shadow-lg hover:shadow-rose-500/20"
                                                        title="Deny"
                                                    >
                                                        <XCircle size={20} weight="bold" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-mono text-slate-500">Protected</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Custom Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.show && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmModal({ show: false, leaveId: null, action: null, teacherName: '' })}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="glass p-8 rounded-3xl border border-white/10 max-w-md w-full pointer-events-auto relative overflow-hidden"
                            >
                                {/* Decorative gradient */}
                                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 ${confirmModal.action === 'approved' ? 'bg-emerald-500/30' : 'bg-rose-500/30'
                                    }`} />

                                <div className="relative z-10">
                                    {/* Icon */}
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${confirmModal.action === 'approved'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-rose-500/20 text-rose-400'
                                        }`}>
                                        {confirmModal.action === 'approved' ? (
                                            <CheckCircle size={32} weight="duotone" />
                                        ) : (
                                            <WarningCircle size={32} weight="duotone" />
                                        )}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-2xl font-black text-white mb-2">
                                        {confirmModal.action === 'approved' ? 'Approve Request?' : 'Deny Request?'}
                                    </h3>

                                    {/* Message */}
                                    <p className="text-slate-400 mb-6">
                                        Are you sure you want to <span className="font-bold text-white">{confirmModal.action}</span> the leave request from <span className="font-bold text-white">{confirmModal.teacherName}</span>?
                                    </p>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setConfirmModal({ show: false, leaveId: null, action: null, teacherName: '' })}
                                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-all border border-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAction}
                                            className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all shadow-lg ${confirmModal.action === 'approved'
                                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                                                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                                                }`}
                                        >
                                            {confirmModal.action === 'approved' ? 'Approve' : 'Deny'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeaveApproval;
