import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, EnvelopeOpen, WarningCircle, Info, Eye } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

const Inbox = () => {
    const { fetchUnreadCount } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();

        // Listen for real-time updates
        const handleNewNotification = (e) => {
            const notif = e.detail;
            toast((t) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-400">
                        <Bell weight="fill" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-white">{notif.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{notif.message}</p>
                    </div>
                </div>
            ), { position: 'bottom-right', style: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' } });

            fetchNotifications(); // Refresh list
        };

        window.addEventListener('new-notification', handleNewNotification);
        return () => window.removeEventListener('new-notification', handleNewNotification);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data.success) {
                setNotifications(res.data.notifications);
            }
            setLoading(false);
        } catch (e) {
            logger.error("Inbox Error", e);
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post('/notifications/read', { id });
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, status: 'read' } : n
            ));
            fetchUnreadCount();
        } catch (e) {
            logger.error("Mark Read Error", e);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read', {});
            setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
            fetchUnreadCount();
        } catch (e) {
            logger.error("Mark All Error", e);
        }
    };

    const unreadCount = notifications.filter(n => n.status !== 'read').length;

    const getIcon = (type) => {
        switch (type) {
            case 'auto_assign': return <WarningCircle size={24} className="text-amber-400" />;
            case 'info': return <Info size={24} className="text-blue-400" />;
            case 'success': return <CheckCircle size={24} className="text-emerald-400" />;
            default: return <Bell size={24} className="text-slate-400" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'urgent': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'urgent': return 'bg-red-500 text-white';
            case 'high': return 'bg-orange-500 text-white';
            default: return 'bg-blue-500 text-white';
        }
    };

    if (loading) return <div className="p-10 text-white">Loading Messages...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <header className="flex items-end justify-between border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Bell weight="fill" className="text-amber-400" />
                        Inbox
                    </h1>
                    <p className="text-slate-400 mt-2">Notifications, alerts, and system messages.</p>
                </div>
                <button
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                >
                    <EnvelopeOpen /> Mark All Read
                </button>
            </header>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-white/5 italic text-slate-500">
                        No messages in your inbox.
                    </div>
                ) : (
                    <AnimatePresence>
                        {notifications.map((notif) => (
                            <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => {
                                    if (notif.action_url) {
                                        navigate(notif.action_url);
                                        markAsRead(notif.id);
                                    }
                                }}
                                className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${notif.action_url ? 'cursor-pointer hover:bg-white/5' : ''} ${notif.status === 'unread'
                                    ? 'bg-slate-900/80 border-indigo-500/30 shadow-lg shadow-indigo-900/10'
                                    : 'bg-slate-950/40 border-white/5 opacity-70'
                                    }`}
                            >
                                <div className={`mt-1 p-2 rounded-lg border shadow-inner ${getPriorityColor(notif.priority)}`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-bold text-lg ${notif.status === 'unread' ? 'text-white' : 'text-slate-400'}`}>
                                                {notif.title}
                                            </h4>
                                            {notif.priority && notif.priority !== 'normal' && (
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getPriorityBadge(notif.priority)}`}>
                                                    {notif.priority}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 font-mono">
                                            {new Date(notif.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 mt-1 leading-relaxed">
                                        {notif.message}
                                    </p>

                                    {notif.status === 'unread' && (
                                        <button
                                            onClick={() => markAsRead(notif.id)}
                                            className="mt-3 text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                                        >
                                            <Eye /> Mark as Read
                                        </button>
                                    )}
                                </div>
                                {notif.status === 'unread' && (
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 animate-pulse"></div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default Inbox;
