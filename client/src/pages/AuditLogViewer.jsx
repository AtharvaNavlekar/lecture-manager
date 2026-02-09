import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ShieldCheck, Clock, User, Fingerprint, CaretDown, Funnel } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/admin/audit-logs');
                if (res.data.success) setLogs(res.data.logs);
            } catch (e) {
                logger.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">
                        <ShieldCheck className="text-emerald-400" weight="duotone" /> Security Audit Log
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Track sensitive actions, access control, and system events.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 border border-white/5 hover:bg-slate-700 transition-colors">
                        <Funnel /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 border border-white/5 hover:bg-slate-700 transition-colors">
                        Export <CaretDown size={12} weight="bold" />
                    </button>
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="p-6 font-bold">Timestamp</th>
                                <th className="p-6 font-bold">User / Role</th>
                                <th className="p-6 font-bold">Action</th>
                                <th className="p-6 font-bold">Target</th>
                                <th className="p-6 font-bold">Details</th>
                                <th className="p-6 font-bold text-right">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-slate-500 animate-pulse">
                                        Loading audit trails...
                                    </td>
                                </tr>
                            ) : logs.map((log, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={log.id}
                                    className="hover:bg-white/[0.02] transition-colors group"
                                >
                                    <td className="p-6 text-slate-300 whitespace-nowrap font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-6 text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                                                <User weight="bold" />
                                            </div>
                                            <div>
                                                <div className="font-bold">User {log.user_id}</div>
                                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{log.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${log.action.includes('DELETE') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                log.action.includes('ADD') || log.action.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    log.action.includes('UPDATE') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-6 text-slate-300 font-medium">{log.target || '-'}</td>
                                    <td className="p-6 text-slate-400 max-w-xs truncate group-hover:text-slate-200 transition-colors" title={log.details}>
                                        {log.details}
                                    </td>
                                    <td className="p-6 text-slate-500 font-mono text-xs text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Fingerprint size={14} className="opacity-50" /> {log.ip_address || 'N/A'}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {logs.length === 0 && !loading && (
                    <div className="p-20 text-center text-slate-500">
                        <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No audit logs found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogViewer;
