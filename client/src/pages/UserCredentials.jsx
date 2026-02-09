import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    MagnifyingGlass,
    ShieldCheck,
    Crown,
    User,
    Copy,
    Key,
    Funnel,
    Eye,
    EyeSlash,
    LockKey,
    ShieldWarning,
    CheckCircle,
    TrendUp
} from '@phosphor-icons/react';

const UserCredentials = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');

    // Stats
    const [stats, setStats] = useState({ total: 0, vaulted: 0, legacy: 0 });

    // Modal State
    const [showSetPassModal, setShowSetPassModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [passStrength, setPassStrength] = useState(0);
    const [showDeptDropdown, setShowDeptDropdown] = useState(false);

    const departments = ['All', ...new Set(users.map(u => u.department).filter(Boolean))];

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
        // Calculate stats
        const total = users.length;
        const vaulted = users.filter(u => u.has_encrypted_password).length;
        setStats({
            total,
            vaulted,
            legacy: total - vaulted
        });
    }, [searchTerm, deptFilter, users]);

    useEffect(() => {
        // Simple password strength calc
        let s = 0;
        if (newPassword.length > 5) s++;
        if (newPassword.length > 9) s++;
        if (/[A-Z]/.test(newPassword)) s++;
        if (/[0-9]/.test(newPassword)) s++;
        if (/[^A-Za-z0-9]/.test(newPassword)) s++;
        setPassStrength(s);
    }, [newPassword]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users-credentials');
            if (res.data.success) {
                setUsers(res.data.users);
            }
        } catch (err) {
            logger.error('Fetch users error:', err);
            toast.error('Failed to load credentials. Server might be offline.');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let res = [...users];
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(u =>
                u.name.toLowerCase().includes(lower) ||
                u.email.toLowerCase().includes(lower) ||
                u.department?.toLowerCase().includes(lower)
            );
        }
        if (deptFilter !== 'All') {
            res = res.filter(u => u.department === deptFilter);
        }
        setFilteredUsers(res);
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`, { icon: '📋' });
    };

    const handleReveal = async (id, name) => {
        const toastId = toast.loading('Decrypting...', { style: { background: '#1e293b', color: '#fff' } });
        try {
            const res = await api.get(`/admin/users-credentials/${id}/reveal`);
            toast.dismiss(toastId);
            if (res.data.success) {
                toast((t) => (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-white/10 pb-2">
                            <Key weight="duotone" /> Credentials Revealed
                        </div>
                        <div className="bg-black/40 p-3 rounded-lg border border-emerald-500/20 text-center">
                            <p className="text-xs text-slate-400 mb-1">Password for {name}</p>
                            <p className="font-mono text-xl tracking-wider text-white select-all">{res.data.password}</p>
                        </div>
                        <button
                            onClick={() => { navigator.clipboard.writeText(res.data.password); toast.dismiss(t.id); toast.success('Copied to clipboard!'); }}
                            className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 py-1.5 rounded transition-colors"
                        >
                            Copy & Close
                        </button>
                    </div>
                ), { duration: 8000, style: { background: '#0f172a', border: '1px solid #334155', borderRadius: '16px' } });
            }
        } catch (error) {
            toast.dismiss(toastId);
            toast.error(error.response?.data?.message || 'Decryption failed');
        }
    };

    const handleSetPassword = async (e) => {
        e.preventDefault();
        if (passStrength < 2) return toast.error('Password is too weak');

        const toastId = toast.loading('Updating vault...');
        try {
            const res = await api.post('/admin/users-credentials/set-temp', {
                teacher_id: selectedUser.id,
                temp_password: newPassword
            });
            if (res.data.success) {
                toast.success(`Password updated for ${selectedUser.name}`, { id: toastId });
                setShowSetPassModal(false);
                fetchUsers();
            }
        } catch (error) {
            toast.error('Failed to update', { id: toastId });
        }
    };

    const StatusCard = ({ label, value, icon: Icon, color }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex items-center gap-4 p-4 rounded-2xl glass border border-white/5 relative overflow-hidden group hover:bg-white/5 transition-colors"
        >
            <div className={`p-3 rounded-xl bg-[#020617] border border-white/5 ${color} shadow-lg`}>
                <Icon size={24} weight="duotone" />
            </div>
            <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-black text-white">{value}</h2>
                    {label.includes('Vaulted') && stats.total > 0 && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 rounded-full">{(value / stats.total * 100).toFixed(0)}%</span>}
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 flex items-center gap-3">
                        <ShieldCheck className="text-rose-500" weight="fill" />
                        Credentials Vault
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Securely manage user access and encrypted keys.</p>
                </div>

                <div className="flex gap-2">
                    {/* Refresh Button (Replaced TrendUp with ArrowsClockwise and made it smaller/clearer) */}
                    {/* User wanted 'Graph Icon' gone. I will remove it entirely or replace with a clear Refresh if needed. User context implies removal. */}
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                <StatusCard label="Total Users" value={stats.total} icon={User} color="text-indigo-400" />
                <StatusCard label="Vaulted (Secure)" value={stats.vaulted} icon={LockKey} color="text-emerald-400" />
                <StatusCard label="Legacy (Needs Update)" value={stats.legacy} icon={ShieldWarning} color="text-amber-400" />
            </div>

            {/* Main Content Glass */}
            <div className="glass p-4 md:p-6 rounded-[2.5rem] border border-white/5 shadow-2xl shadow-rose-900/10">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1 group">
                        <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-400 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#020617]/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:border-rose-500/50 focus:bg-[#020617]/80 outline-none transition-all"
                        />
                    </div>
                    {/* Custom Dropdown */}
                    <div className="w-full md:w-64 relative">
                        <button
                            onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                            onBlur={() => setTimeout(() => setShowDeptDropdown(false), 200)}
                            className={`w-full bg-[#020617]/50 border ${showDeptDropdown ? 'border-rose-500/50' : 'border-white/10'} rounded-2xl pl-12 pr-10 py-4 text-left text-white focus:outline-none hover:bg-[#020617]/80 transition-all relative group`}
                        >
                            <Funnel className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${showDeptDropdown ? 'text-rose-400' : 'text-slate-500 group-hover:text-rose-400'}`} size={20} />
                            <span className={deptFilter === 'All' ? 'text-slate-400' : 'text-white font-medium'}>
                                {deptFilter === 'All' ? 'Filter by Dept' : deptFilter}
                            </span>
                            <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition-transform duration-300 ${showDeptDropdown ? 'rotate-180' : ''}`}>▼</div>
                        </button>

                        <AnimatePresence>
                            {showDeptDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full mt-2 w-full bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl z-20 p-1.5"
                                >
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {departments.map((dept) => (
                                            <button
                                                key={dept}
                                                onClick={() => { setDeptFilter(dept); setShowDeptDropdown(false); }}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group mb-0.5 ${deptFilter === dept
                                                        ? 'bg-rose-500/10 text-rose-400'
                                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                {dept}
                                                {deptFilter === dept && <CheckCircle weight="fill" />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                                <th className="pb-4 pl-4">User Identity</th>
                                <th className="pb-4">Access ID</th>
                                <th className="pb-4">Role & Dept</th>
                                <th className="pb-4">Vault Status</th>
                                <th className="pb-4 pr-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-500 animate-pulse">Establishing secure connection...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-500">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                        className="group transition-colors"
                                    >
                                        <td className="py-4 pl-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold text-white border border-white/10 shadow-inner">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-200">{u.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">UID: {u.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="group/copy flex items-center gap-2 cursor-pointer w-fit" onClick={() => copyToClipboard(u.email, 'Email')}>
                                                <code className="bg-[#020617] px-2 py-1 rounded text-slate-400 font-mono text-xs border border-white/5 group-hover/copy:border-rose-500/30 group-hover/copy:text-rose-300 transition-all">
                                                    {u.email}
                                                </code>
                                                <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 text-slate-500" />
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    {u.role === 'admin' ? <ShieldCheck size={14} className="text-rose-400" weight="fill" /> :
                                                        u.role === 'hod' ? <Crown size={14} className="text-amber-400" weight="fill" /> :
                                                            <User size={14} className="text-indigo-400" weight="fill" />}
                                                    <span className={`text-xs font-bold ${u.role === 'admin' ? 'text-rose-300' : 'text-slate-300'} capitalize`}>{u.role}</span>
                                                </div>
                                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wide">
                                                    {u.department}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            {u.has_encrypted_password ? (
                                                <div className="flex items-center gap-2 text-emerald-400">
                                                    <div className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </div>
                                                    <span className="text-xs font-bold">Secure</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-500/60" title="Legacy Password (Hash only)">
                                                    <div className="h-2 w-2 rounded-full bg-amber-500/40"></div>
                                                    <span className="text-xs">Legacy</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 pr-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {u.has_encrypted_password ? (
                                                    <button
                                                        onClick={() => handleReveal(u.id, u.name)}
                                                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:scale-105 transition-all"
                                                        title="Reveal Password"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                ) : (
                                                    <button disabled className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-800/50 text-slate-600 border border-white/5 cursor-not-allowed">
                                                        <EyeSlash size={18} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(u);
                                                        setNewPassword('');
                                                        setPassStrength(0);
                                                        setShowSetPassModal(true);
                                                    }}
                                                    className="h-9 px-4 flex items-center gap-2 rounded-xl bg-white/5 hover:bg-rose-500 hover:text-white text-slate-300 border border-white/10 hover:border-rose-500 transition-all text-xs font-bold group/btn"
                                                >
                                                    <Key size={14} className="group-hover/btn:rotate-45 transition-transform" />
                                                    <span>Reset</span>
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Modal */}
            <AnimatePresence>
                {showSetPassModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowSetPassModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-4 md:p-4 md:p-6 lg:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                    <LockKey size={24} weight="fill" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Reset Credentials</h3>
                                    <p className="text-slate-400 text-xs">For {selectedUser?.name}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSetPassword} className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                                        <span className={`text-[10px] font-bold ${passStrength < 3 ? 'text-rose-400' : passStrength < 5 ? 'text-amber-400' : 'text-emerald-400'
                                            }`}>
                                            {passStrength < 3 ? 'WEAK' : passStrength < 5 ? 'MODERATE' : 'STRONG'}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 text-white text-lg font-mono tracking-wider outline-none focus:border-indigo-500 transition-all text-center"
                                            placeholder="••••••••"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setNewPassword(Math.random().toString(36).slice(-10) + '!A')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"
                                            title="Generate Random"
                                        >
                                            <TrendUp size={16} />
                                        </button>
                                    </div>
                                    {/* Strength Meter Bar */}
                                    <div className="flex gap-1 mt-2 h-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={`flex-1 rounded-full transition-colors duration-300 ${i <= passStrength ? (passStrength < 3 ? 'bg-rose-500' : passStrength < 5 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-white/5'}`} />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowSetPassModal(false)}
                                        className="flex-1 py-3.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-slate-400 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={passStrength < 2}
                                        className="flex-1 py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle weight="fill" size={18} />
                                        Save & Vault
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserCredentials;
