import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { motion } from 'framer-motion';
import {
    Gear,
    Globe,
    ShieldCheck,
    Database,
    FloppyDisk,
    ArrowCounterClockwise,
    User,
    Lock,
    Bell,
    Users,
    Buildings,
    SignOut
} from '@phosphor-icons/react';
import CustomSelect from '../components/ui/CustomSelect';

const Settings = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [settings, setSettings] = useState({});
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async (retryCount = 0) => {
        try {
            const res = await api.get('/settings');
            if (res.data.success) setSettings(res.data.settings);
            setLoading(false);
        } catch (e) {
            if (e.response?.status === 403 && retryCount < 2) {
                setTimeout(() => fetchSettings(retryCount + 1), 1000 * (retryCount + 1));
            } else {
                logger.error('Settings fetch failed:', e);
                setLoading(false);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.post('/settings', settings);
            if (res.data.success) {
                toast.success('Settings updated successfully!');
            }
        } catch (error) {
            toast.error('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key, val) => {
        setSettings(prev => ({ ...prev, [key]: val }));
    };

    const handleBackup = () => {
        window.open('http://localhost:3000/api/admin/backup', '_blank');
    };

    const isAdmin = user?.role === 'admin';

    if (loading) return <div className="text-white p-10">Loading settings...</div>;

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Gear className="text-indigo-400" weight="duotone" />
                Settings & Preferences
            </h1>
            <p className="text-slate-400 mb-8 ml-11">Manage your account, preferences, and system configuration.</p>

            <div className="flex flex-wrap gap-2 border-b border-white/10 mb-8 overflow-x-auto pb-2">
                <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={Globe} label="General" />
                <TabButton active={activeTab === 'academic'} onClick={() => setActiveTab('academic')} icon={Buildings} label="Academic" />
                {isAdmin && <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="User Roles" />}
                <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={Database} label="System" />
                <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={User} label="Account" />
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* --- 1. GENERAL SETTINGS --- */}
                {activeTab === 'general' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Globe size={24} className="text-indigo-400" />
                                Application Preferences
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2">Organization Name</label>
                                    <input
                                        value={settings.org_name || ''}
                                        onChange={e => handleChange('org_name', e.target.value)}
                                        disabled={!isAdmin}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {!isAdmin && <p className="text-xs text-slate-500 mt-1">Contact Admin to change</p>}
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2">Theme Color</label>
                                    <CustomSelect
                                        options={[
                                            { value: "blue", label: "Cosmic Blue" },
                                            { value: "emerald", label: "Emerald & Void" },
                                            { value: "rose", label: "Crimson Red" }
                                        ]}
                                        value={settings.theme_color || 'blue'}
                                        onChange={e => handleChange('theme_color', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- 2. ACADEMIC CONFIGURATION --- */}
                {activeTab === 'academic' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Buildings size={24} className="text-indigo-400" />
                                Academic Details
                            </h3>

                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">Current Academic Year</label>
                                <input
                                    value={settings.academic_year || ''}
                                    onChange={e => handleChange('academic_year', e.target.value)}
                                    disabled={!isAdmin}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                                    placeholder="e.g. 2025-2026"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <h4 className="font-bold text-white">Maintenance Mode</h4>
                                    <p className="text-xs text-slate-400">Lock access for students and teachers.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.maintenance_mode === 'true'}
                                        onChange={e => handleChange('maintenance_mode', e.target.checked ? 'true' : 'false')}
                                        disabled={!isAdmin}
                                    />
                                    <div className={`w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} peer-checked:bg-indigo-600`}></div>
                                </label>
                            </div>

                            {isAdmin && (
                                <div className="bg-gradient-to-r from-indigo-500/10 to-blue-600/10 p-6 rounded-xl border border-indigo-500/20 mt-6">
                                    <h4 className="font-bold text-indigo-300 mb-2">Advanced Academic Configuration</h4>
                                    <p className="text-sm text-slate-400 mb-4">Manage Departments, Divisions, Time Slots, Rooms, and Designations.</p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/admin/settings')}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-indigo-900/20"
                                    >
                                        Manage Structure
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* --- 3. USER MANAGEMENT (ADMIN ONLY) --- */}
                {activeTab === 'users' && isAdmin && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users size={24} className="text-indigo-400" />
                                User Management
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-800/50 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-center gap-3 mb-3 text-indigo-400">
                                        <ShieldCheck size={28} weight="duotone" />
                                        <h4 className="font-bold text-white">Role Management</h4>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-4">Assign Admins, HODs, and Teachers. Manage delegation.</p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/admin/user-roles')}
                                        className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg font-bold text-sm transition-all"
                                    >
                                        Manage Roles
                                    </button>
                                </div>

                                <div className="p-6 bg-slate-800/50 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all">
                                    <div className="flex items-center gap-3 mb-3 text-emerald-400">
                                        <User size={28} weight="duotone" />
                                        <h4 className="font-bold text-white">Faculty Directory</h4>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-4">View and edit registered faculty profiles and details.</p>
                                    <button
                                        type="button"
                                        onClick={() => navigate(user.role === 'admin' ? '/admin/faculty' : '/faculty')}
                                        className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg font-bold text-sm transition-all"
                                    >
                                        View Directory
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- 4. SYSTEM MAINTENANCE --- */}
                {activeTab === 'system' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Database size={24} className="text-indigo-400" />
                                System Maintenance
                            </h3>

                            {/* Backup Section */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <h4 className="font-bold text-white">Data Backup</h4>
                                    <p className="text-xs text-slate-400">Export the full database as a SQL file.</p>
                                </div>
                                <button type="button" onClick={handleBackup} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <Database weight="fill" /> Download SQL Dump
                                </button>
                            </div>

                            {/* Additional Admin Tools */}
                            {isAdmin && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div onClick={() => navigate('/admin/audit')} className="cursor-pointer p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-indigo-500/50 transition-all group">
                                            <h4 className="font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">Audit Logs</h4>
                                            <p className="text-xs text-slate-500">Track all system changes and user activities.</p>
                                        </div>
                                        <div onClick={() => navigate('/admin/settings')} className="cursor-pointer p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-emerald-500/50 transition-all group">
                                            <h4 className="font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">Configuration Templates</h4>
                                            <p className="text-xs text-slate-500">Apply department presets and structures.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-rose-500/10 rounded-xl border border-rose-500/20 mt-4">
                                        <div>
                                            <h4 className="font-bold text-rose-400">Factory Reset</h4>
                                            <p className="text-xs text-rose-300/70">Wipe all data and restore defaults.</p>
                                        </div>
                                        <button type="button" className="px-4 py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-bold transition-all">
                                            Reset System
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* --- 5. ACCOUNT & PROFILE --- */}
                {activeTab === 'account' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <User size={24} className="text-indigo-400" />
                                My Account
                            </h3>

                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                    {user?.name?.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">{user?.name}</h4>
                                    <p className="text-slate-400 text-sm">{user?.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider">{user?.role}</span>
                                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{user?.department}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button type="button" onClick={() => toast('Feature coming soon!')} className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/5 transition-all text-left group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-700 rounded-lg text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <Lock size={20} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-200">Change Password</h5>
                                            <p className="text-xs text-slate-500">Update your login credentials</p>
                                        </div>
                                    </div>
                                </button>

                                <button type="button" onClick={() => navigate(user.role === 'admin' ? '/admin/notifications' : '/notifications')} className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/5 transition-all text-left group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-700 rounded-lg text-slate-300 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                            <Bell size={20} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-200">Notification Preferences</h5>
                                            <p className="text-xs text-slate-500">Manage your alerts and inbox</p>
                                        </div>
                                    </div>
                                </button>

                                <button type="button" onClick={logout} className="w-full flex items-center justify-between p-4 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl border border-rose-500/10 transition-all text-left group mt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                            <SignOut size={20} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-rose-400">Sign Out</h5>
                                            <p className="text-xs text-rose-400/60">End your current session</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Save Button (Only show if there are editable fields in current tab) */}
                {['general', 'academic'].includes(activeTab) && (
                    <div className="flex justify-end pt-4 border-t border-white/10">
                        <button type="submit" disabled={saving || !isAdmin} className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {saving ? <ArrowCounterClockwise className="animate-spin" /> : <FloppyDisk weight="fill" />}
                            Save Changes
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button type="button" onClick={onClick} className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 border-b-2 transition-all ${active ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'} rounded-t-lg`}>
        <Icon weight={active ? 'duotone' : 'regular'} size={20} />
        <span className="font-bold text-sm uppercase tracking-wide">{label}</span>
    </button>
);

export default Settings;
