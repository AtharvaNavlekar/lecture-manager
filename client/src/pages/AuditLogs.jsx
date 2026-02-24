import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import CustomDropdown from '../components/CustomDropdown';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Calendar, User, Activity, Filter, Search, ChevronDown } from 'lucide-react';
import api from '../utils/api';

import CustomDatePicker from '../components/ui/CustomDatePicker';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        user_type: '',
        action: '',
        resource: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const res = await api.get(`/audit?${params.toString()}`);
            if (res.data.success) {
                setLogs(res.data.logs || []);
            } else {
                toast.error('Failed to load audit logs');
            }
        } catch (error) {
            logger.error('Failed to fetch audit logs:', error);
            toast.error(error.response?.data?.message || 'Failed to load audit logs. The service may be temporarily unavailable.');
        } finally {
            setLoading(false);
        }
    };

    const actionColors = {
        CREATE: 'emerald',
        UPDATE: 'blue',
        DELETE: 'rose',
        LOGIN: 'purple',
        APPROVE: 'green',
        REJECT: 'red',
        CANCEL: 'amber'
    };

    const resourceIcons = {
        teachers: '👨‍🏫',
        students: '🎓',
        lectures: '📚',
        leave_requests: '🏖️',
        assignments: '📝',
        resources: '📁',
        settings: '⚙️'
    };

    const clearFilters = () => {
        setFilters({
            user_type: '',
            action: '',
            resource: '',
            start_date: '',
            end_date: ''
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
                <p className="text-slate-400">Track all system activities and user actions</p>
            </div>

            {/* Filters */}
            <div className="glass p-4 md:p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-3 mb-4">
                    <Filter className="text-indigo-400" size={20} />
                    <h3 className="text-white font-bold">Filters</h3>
                    <button
                        onClick={clearFilters}
                        className="ml-auto text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Clear All
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* User Type */}
                    <div>
                        <CustomDropdown
                            label="User Type"
                            value={filters.user_type}
                            onChange={(val) => setFilters({ ...filters, user_type: val })}
                            options={[
                                { value: '', label: 'All Users' },
                                { value: 'teacher', label: 'Teachers' },
                                { value: 'admin', label: 'Admins' }
                            ]}
                            placeholder="All Users"
                        />
                    </div>

                    {/* Action */}
                    <div>
                        <CustomDropdown
                            label="Action"
                            value={filters.action}
                            onChange={(val) => setFilters({ ...filters, action: val })}
                            options={[
                                { value: '', label: 'All Actions' },
                                { value: 'CREATE', label: 'Create' },
                                { value: 'UPDATE', label: 'Update' },
                                { value: 'DELETE', label: 'Delete' },
                                { value: 'LOGIN', label: 'Login' },
                                { value: 'APPROVE', label: 'Approve' },
                                { value: 'REJECT', label: 'Reject' }
                            ]}
                            placeholder="All Actions"
                        />
                    </div>

                    {/* Resource */}
                    <div>
                        <CustomDropdown
                            label="Resource"
                            value={filters.resource}
                            onChange={(val) => setFilters({ ...filters, resource: val })}
                            options={[
                                { value: '', label: 'All Resources' },
                                { value: 'teachers', label: 'Teachers' },
                                { value: 'students', label: 'Students' },
                                { value: 'lectures', label: 'Lectures' },
                                { value: 'leave_requests', label: 'Leaves' },
                                { value: 'assignments', label: 'Assignments' },
                                { value: 'settings', label: 'Settings' }
                            ]}
                            placeholder="All Resources"
                        />
                    </div>

                    {/* Start Date */}
                    <div>
                        <CustomDatePicker
                            label="Start Date"
                            value={filters.start_date}
                            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                            placeholder="Start Date"
                            max={filters.end_date}
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <CustomDatePicker
                            label="End Date"
                            value={filters.end_date}
                            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                            placeholder="End Date"
                            min={filters.start_date}
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="glass p-4 rounded-2xl">
                    <div className="text-sm text-slate-400 mb-1">Total Logs</div>
                    <div className="text-2xl font-bold text-white">{logs.length}</div>
                </div>
                <div className="glass p-4 rounded-2xl">
                    <div className="text-sm text-slate-400 mb-1">Actions Today</div>
                    <div className="text-2xl font-bold text-emerald-400">
                        {logs.filter(l => l.created_at?.startsWith(new Date().toISOString().split('T')[0])).length}
                    </div>
                </div>
                <div className="glass p-4 rounded-2xl">
                    <div className="text-sm text-slate-400 mb-1">Unique Users</div>
                    <div className="text-2xl font-bold text-blue-400">
                        {new Set(logs.map(l => l.user_id)).size}
                    </div>
                </div>
                <div className="glass p-4 rounded-2xl">
                    <div className="text-sm text-slate-400 mb-1">Resources Modified</div>
                    <div className="text-2xl font-bold text-purple-400">
                        {new Set(logs.map(l => l.resource)).size}
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="glass rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900/50 border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Resource
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Details
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    IP Address
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No audit logs found. Logs will appear here as users perform actions.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log, idx) => (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {log.user_id}
                                                </div>
                                                <div>
                                                    <div className="text-sm text-white font-medium">User #{log.user_id}</div>
                                                    <div className="text-xs text-slate-500 capitalize">{log.user_type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-${actionColors[log.action] || 'gray'}-500/10 text-${actionColors[log.action] || 'gray'}-400 border border-${actionColors[log.action] || 'gray'}-500/30`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            <div className="flex items-center gap-2">
                                                <span>{resourceIcons[log.resource] || '📄'}</span>
                                                <span className="capitalize">{log.resource?.replace('_', ' ')}</span>
                                                {log.resource_id && (
                                                    <span className="text-slate-500">#{log.resource_id}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 max-w-md truncate">
                                            {log.details || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                            {log.ip_address || '—'}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Note */}
            <div className="glass p-4 rounded-xl border-l-4 border-blue-500">
                <p className="text-sm text-slate-300">
                    <span className="font-bold text-blue-400">Note:</span> Audit logs are retained for compliance and security purposes. They cannot be modified or deleted by regular users.
                </p>
            </div>
        </div>
    );
};

export default AuditLogs;
