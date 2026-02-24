import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone,
    Plus,
    Trash,
    PencilSimple,
    PushPin,
    Calendar,
    X,
    TextT,
    TextAlignLeft,
    CalendarBlank,
    Sparkle
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import CustomDropdown from '../components/CustomDropdown';
import CustomDatePicker from '../components/CustomDatePicker';

const Announcements = () => {
    const { user } = useContext(AuthContext);
    const [announcements, setAnnouncements] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal',
        target_audience: 'all',
        expires_at: ''
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            if (res.data.success) {
                setAnnouncements(res.data.announcements);
            }
        } catch (err) {
            logger.error('Fetch announcements error:', err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/announcements', formData);
            if (res.data.success) {
                toast.success('Announcement created successfully!');
                setFormData({ title: '', content: '', priority: 'normal', target_audience: 'all', expires_at: '' });
                fetchAnnouncements();
            }
        } catch (error) {
            toast.error('Failed to create announcement');
        }
    };

    const confirmDelete = async (id) => {
        try {
            await api.delete(`/announcements/${id}`);
            fetchAnnouncements();
            toast.success('Announcement deleted');
        } catch (error) {
            toast.error('Failed to delete announcement');
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500/20 rounded-full text-rose-500">
                        <Trash size={20} weight="bold" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Delete Announcement?</h4>
                        <p className="text-sm text-slate-400 mt-1">This action cannot be undone.</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white">Dismiss</button>
                    <button onClick={() => { toast.dismiss(t.id); confirmDelete(id); }} className="px-4 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold">Delete</button>
                </div>
            </div>
        ), { duration: 5000, style: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' } });
    };

    const handlePin = async (id, currentlyPinned) => {
        try {
            const res = await api.put(`/announcements/${id}`, { is_pinned: currentlyPinned ? 0 : 1 });
            if (res.data.success) {
                fetchAnnouncements();
                toast.success('Announcement updated');
            }
        } catch (error) {
            toast.error('Failed to update announcement');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_-3px_rgba(244,63,94,0.1)]';
            case 'high': return 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(251,191,36,0.1)]';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]';
        }
    };

    const getPriorityGradient = (priority) => {
        switch (priority) {
            case 'urgent': return 'from-rose-500/5 to-transparent';
            case 'high': return 'from-amber-500/5 to-transparent';
            default: return 'from-blue-500/5 to-transparent';
        }
    };

    const isHOD = user.is_hod === 1 || user.is_acting_hod === 1;

    return (
        <div className="min-h-screen flex flex-col pb-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Megaphone weight="fill" className="text-indigo-400" />
                    Department Announcements
                </h1>
                <p className="text-slate-400 mt-2">Stay updated with important notices and updates</p>
            </div>

            {/* Main Content - Side by Side Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* Left Column: Create Form (Sticky) - Only for HODs */}
                {isHOD && (
                    <div className="lg:col-span-5 xl:col-span-4 h-full overflow-y-auto custom-scrollbar">
                        <div className="sticky top-0 bg-gradient-to-br from-slate-900/60 to-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">

                            {/* Header */}
                            <div className="p-4 md:p-6 border-b border-white/5">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                                        <Sparkle weight="fill" className="text-indigo-400" size={20} />
                                    </div>
                                    Create Announcement
                                </h2>
                                <p className="text-xs text-slate-400 mt-2">Broadcast updates instantly</p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleCreate} className="p-4 md:p-6 space-y-4">
                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Title</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                                            <PencilSimple size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Enter title..."
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Message</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                                            <TextAlignLeft size={16} />
                                        </div>
                                        <textarea
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            placeholder="Write your message..."
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                                            rows="4"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Priority & Target in Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <CustomDropdown
                                        label="Priority"
                                        value={formData.priority}
                                        onChange={(val) => setFormData({ ...formData, priority: val })}
                                        options={[
                                            { value: 'normal', label: 'Normal' },
                                            { value: 'high', label: 'High' },
                                            { value: 'urgent', label: 'Urgent' }
                                        ]}
                                    />

                                    <CustomDropdown
                                        label="Audience"
                                        value={formData.target_audience}
                                        onChange={(val) => setFormData({ ...formData, target_audience: val })}
                                        options={[
                                            { value: 'all', label: 'All' },
                                            { value: 'teachers', label: 'Teachers' },
                                            { value: 'students', label: 'Students' }
                                        ]}
                                    />
                                </div>

                                {/* Expiry Date */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expires (Optional)</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                                            <CalendarBlank size={16} />
                                        </div>
                                        <CustomDatePicker
                                            value={formData.expires_at}
                                            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                            placeholder="Select Expiry"
                                            showTime={true}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Megaphone weight="bold" />
                                    Post Announcement
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Right Column: Announcements Feed */}
                <div className={`${isHOD ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} h-full overflow-y-auto custom-scrollbar pr-2`}>
                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass p-20 rounded-3xl border border-white/5 text-center"
                            >
                                <Megaphone size={64} className="mx-auto mb-4 opacity-20 text-slate-500" />
                                <p className="text-slate-500 text-lg font-medium">No announcements yet</p>
                                {isHOD && (
                                    <p className="text-slate-600 text-sm mt-2">Create your first announcement to get started</p>
                                )}
                            </motion.div>
                        ) : (
                            announcements.map((announcement) => (
                                <motion.div
                                    key={announcement.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`group relative p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${announcement.is_pinned
                                        ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900/40'
                                        : `border-white/5 bg-gradient-to-br ${getPriorityGradient(announcement.priority)} bg-slate-900/20`
                                        }`}
                                >
                                    {/* Priority Glow Effect */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full blur-3xl -z-10 ${announcement.priority === 'urgent' ? 'from-rose-500' :
                                        announcement.priority === 'high' ? 'from-amber-500' : 'from-blue-500'
                                        }`} />

                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {announcement.is_pinned && (
                                                    <div className="p-1 bg-amber-500/20 rounded-lg text-amber-400 animate-pulse">
                                                        <PushPin size={14} weight="fill" />
                                                    </div>
                                                )}
                                                <h2 className={`text-lg font-bold tracking-tight ${announcement.priority === 'urgent' ? 'text-white' : 'text-slate-100'
                                                    }`}>
                                                    {announcement.title}
                                                </h2>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getPriorityColor(announcement.priority)}`}>
                                                    {announcement.priority}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                                                <span className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 text-[10px] font-bold">
                                                        {announcement.creator_name?.charAt(0)}
                                                    </div>
                                                    {announcement.creator_name}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} className="text-slate-500" />
                                                    {new Date(announcement.created_at).toLocaleDateString(undefined, {
                                                        month: 'short', day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {isHOD && (
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handlePin(announcement.id, announcement.is_pinned)}
                                                    className={`p-1.5 rounded-lg transition-all ${announcement.is_pinned
                                                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                                                        }`}
                                                    title={announcement.is_pinned ? 'Unpin' : 'Pin'}
                                                >
                                                    <PushPin weight={announcement.is_pinned ? 'fill' : 'regular'} size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(announcement.id)}
                                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-all border border-rose-500/10"
                                                    title="Delete"
                                                >
                                                    <Trash weight="bold" size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    {announcement.message && announcement.message.trim().length > 0 && (
                                        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-950/30 p-4 rounded-xl border border-white/5 shadow-inner mb-3">
                                            {announcement.message}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/5">
                                            <span className="text-slate-500">Target:</span>
                                            <span className="capitalize font-medium text-slate-300">{announcement.target_audience}</span>
                                        </div>

                                        {announcement.expires_at && (
                                            <div className={`flex items-center gap-1.5 font-medium ${new Date(announcement.expires_at) < new Date() ? 'text-rose-400' : 'text-emerald-400'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${new Date(announcement.expires_at) < new Date() ? 'bg-rose-400' : 'bg-emerald-400'
                                                    } animate-pulse`} />
                                                Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Announcements;
