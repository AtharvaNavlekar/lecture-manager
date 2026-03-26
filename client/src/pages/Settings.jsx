import logger from '@/utils/logger';
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gear,
    Globe,
    ShieldCheck,
    Database,
    FloppyDisk,
    ArrowCounterClockwise,
    UserCircle,
    Lock,
    Bell,
    Users,
    Buildings,
    SignOut,
    Palette,
    SpeakerHigh,
    CaretRight,
    WarningCircle,
    CheckCircle,
    Eye,
    EyeSlash,
    X,
    Moon,
    ArrowSquareOut,
    Warning,
} from '@phosphor-icons/react';

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS – change ONE place to retheme the whole page
───────────────────────────────────────────────────────────── */
const TAB_CONFIG = [
    { id: 'account', label: 'Account', icon: UserCircle, section: 'personal', adminOnly: false },
    { id: 'security', label: 'Security', icon: Lock, section: 'personal', adminOnly: false },
    { id: 'appearance', label: 'Appearance', icon: Palette, section: 'personal', adminOnly: false },
    { id: 'notifications', label: 'Notifications', icon: Bell, section: 'personal', adminOnly: false },
    { id: 'general', label: 'Organization', icon: Globe, section: 'admin', adminOnly: true },
    { id: 'academic', label: 'Academic', icon: Buildings, section: 'admin', adminOnly: true },
    { id: 'users', label: 'User Management', icon: Users, section: 'admin', adminOnly: true },
    { id: 'system', label: 'System', icon: Database, section: 'admin', adminOnly: true },
];

const THEMES = [
    { id: 'cosmic-blue', label: 'Cosmic Blue', from: 'from-indigo-500', to: 'to-violet-600' },
    { id: 'emerald-void', label: 'Emerald', from: 'from-emerald-400', to: 'to-teal-600' },
    { id: 'crimson-red', label: 'Crimson', from: 'from-rose-400', to: 'to-red-600' },
    { id: 'amber-gold', label: 'Amber', from: 'from-amber-400', to: 'to-orange-500' },
];

/* ────────────────────────────────────────────────────────────── */

const Settings = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const [settings, setSettings] = useState({});
    const [originalSettings, setOriginalSettings] = useState({});
    const [localPrefs, setLocalPrefs] = useState({
        theme: localStorage.getItem('theme') || 'cosmic-blue',
        notifications: localStorage.getItem('notifications') !== 'false',
        sound: localStorage.getItem('sound') !== 'false',
    });
    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSynced, setLastSynced] = useState(null);

    /* Track unsaved changes */
    const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings);

    /* Password-change state */
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwVisible, setPwVisible] = useState({ current: false, next: false, confirm: false });
    const [pwErrors, setPwErrors] = useState({});

    const fetchSettings = useCallback(async (retry = 0) => {
        try {
            const res = await api.get('/settings');
            if (res.data.success) {
                setSettings(res.data.settings);
                setOriginalSettings(res.data.settings);
                setLastSynced(new Date());
            }
        } catch (e) {
            if (e.response?.status === 403 && retry < 2)
                setTimeout(() => fetchSettings(retry + 1), 1000 * (retry + 1));
            else logger.error('Settings fetch failed:', e);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    /* Tab-aware labels for toast messages */
    const TAB_LABELS = { general: 'Organization', academic: 'Academic', users: 'User', system: 'System' };

    const saveGlobal = async () => {
        setSaving(true);
        try {
            const res = await api.post('/settings', settings);
            if (res.data.success) {
                toast.success(`${TAB_LABELS[activeTab] || 'Settings'} settings saved successfully.`);
                await fetchSettings(); /* re-sync from DB */
            } else {
                toast.error(res.data.message || 'Some settings failed to save.');
            }
        } catch { toast.error('Failed to save settings. Check your connection.'); }
        finally { setSaving(false); }
    };

    const saveLocal = () => {
        setSaving(true);
        setTimeout(() => {
            localStorage.setItem('theme', localPrefs.theme);
            localStorage.setItem('notifications', localPrefs.notifications);
            localStorage.setItem('sound', localPrefs.sound);
            toast.success('Preferences saved.');
            setSaving(false);
        }, 500);
    };

    /* Password validation */
    const validatePw = () => {
        const errs = {};
        if (!pwForm.current) errs.current = 'Current password is required.';
        if (pwForm.next.length < 8) errs.next = 'Must be at least 8 characters.';
        if (pwForm.next !== pwForm.confirm) errs.confirm = 'Passwords do not match.';
        setPwErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submitPasswordChange = async () => {
        if (!validatePw()) return;
        setSaving(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: pwForm.current,
                newPassword: pwForm.next,
            });
            toast.success('Password updated successfully.');
            setPwForm({ current: '', next: '', confirm: '' });
        } catch (e) {
            const msg = e.response?.data?.message || 'Failed to update password.';
            toast.error(msg);
        } finally { setSaving(false); }
    };

    const handleBackup = () => window.open('/api/v1/admin/backup', '_blank');

    const TABS = TAB_CONFIG.filter(t => !t.adminOnly || isAdmin);
    const current = TABS.find(t => t.id === activeTab);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 pb-24">

            {/* ── Page Header ── */}
            <div className="py-8 mb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2.5">
                            <Gear size={24} weight="duotone" className="text-slate-400" />
                            Settings
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Manage your account preferences and system configuration.
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                        {lastSynced && (
                            <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1.5">
                                <CheckCircle size={12} weight="fill" className="text-emerald-500" />
                                Synced {lastSynced.toLocaleTimeString()}
                            </span>
                        )}
                        {isDirty && (
                            <span className="text-[11px] text-amber-400/80 font-semibold flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                <WarningCircle size={12} weight="fill" />
                                Unsaved changes
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-8">

                {/* ═══════════════════════ SIDEBAR ═══════════════════════ */}
                <aside className="w-56 flex-shrink-0 hidden lg:block">
                    <nav className="sticky top-8 space-y-6">

                        {/* Personal */}
                        <div>
                            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2 px-3">Personal</p>
                            {TABS.filter(t => t.section === 'personal').map(tab => (
                                <NavItem key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
                            ))}
                        </div>

                        {/* Admin */}
                        {isAdmin && (
                            <div>
                                <p className="text-[10px] font-semibold text-emerald-600/70 uppercase tracking-widest mb-2 px-3 flex items-center gap-1.5">
                                    <ShieldCheck size={12} weight="fill" /> Admin
                                </p>
                                {TABS.filter(t => t.section === 'admin').map(tab => (
                                    <NavItem key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} accent="emerald" />
                                ))}
                            </div>
                        )}

                        {/* Sign out */}
                        <div className="pt-4 border-t border-white/5">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                            >
                                <SignOut size={16} weight="duotone" />
                                Sign out
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* ═══════════════════════ CONTENT ═══════════════════════ */}
                <main className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            {/* Card wrapper */}
                            <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl overflow-hidden shadow-xl">

                                {/* Card Header */}
                                <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {current && (
                                            <current.icon
                                                size={20}
                                                weight="duotone"
                                                className={current.section === 'admin' ? 'text-emerald-400' : 'text-slate-400'}
                                            />
                                        )}
                                        <h2 className="text-base font-semibold text-white">{current?.label}</h2>
                                    </div>
                                    {isDirty && current?.section === 'admin' && (
                                        <button
                                            onClick={saveGlobal}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                                        >
                                            <FloppyDisk size={12} weight="fill" />
                                            {saving ? 'Saving…' : 'Quick Save'}
                                        </button>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="px-8 py-7">

                                    {/* ── ACCOUNT ── */}
                                    {activeTab === 'account' && (
                                        <AccountTab user={user} />
                                    )}

                                    {/* ── SECURITY ── */}
                                    {activeTab === 'security' && (
                                        <SecurityTab
                                            pwForm={pwForm}
                                            setPwForm={setPwForm}
                                            pwVisible={pwVisible}
                                            setPwVisible={setPwVisible}
                                            pwErrors={pwErrors}
                                            onSubmit={submitPasswordChange}
                                            saving={saving}
                                        />
                                    )}

                                    {/* ── APPEARANCE ── */}
                                    {activeTab === 'appearance' && (
                                        <AppearanceTab
                                            prefs={localPrefs}
                                            onChange={(k, v) => setLocalPrefs(p => ({ ...p, [k]: v }))}
                                            onSave={saveLocal}
                                            saving={saving}
                                        />
                                    )}

                                    {/* ── NOTIFICATIONS ── */}
                                    {activeTab === 'notifications' && (
                                        <NotificationsTab
                                            prefs={localPrefs}
                                            onChange={(k, v) => setLocalPrefs(p => ({ ...p, [k]: v }))}
                                            onSave={saveLocal}
                                            saving={saving}
                                        />
                                    )}

                                    {/* ── ORGANIZATION (admin) ── */}
                                    {activeTab === 'general' && isAdmin && (
                                        <OrgTab settings={settings} onChange={(k, v) => setSettings(p => ({ ...p, [k]: v }))} onSave={saveGlobal} saving={saving} />
                                    )}

                                    {/* ── ACADEMIC (admin) ── */}
                                    {activeTab === 'academic' && isAdmin && (
                                        <AcademicTab settings={settings} onChange={(k, v) => setSettings(p => ({ ...p, [k]: v }))} onSave={saveGlobal} saving={saving} navigate={navigate} />
                                    )}

                                    {/* ── USERS (admin) ── */}
                                    {activeTab === 'users' && isAdmin && (
                                        <UsersTab settings={settings} onChange={(k, v) => setSettings(p => ({ ...p, [k]: v }))} onSave={saveGlobal} saving={saving} navigate={navigate} />
                                    )}

                                    {/* ── SYSTEM (admin) ── */}
                                    {activeTab === 'system' && isAdmin && (
                                        <SystemTab settings={settings} onChange={(k, v) => setSettings(p => ({ ...p, [k]: v }))} onSave={saveGlobal} saving={saving} navigate={navigate} onBackup={handleBackup} />
                                    )}

                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   NAV ITEM
───────────────────────────────────────────────────────────── */
const NavItem = ({ tab, active, onClick, accent = 'indigo' }) => {
    const activeClass = accent === 'emerald'
        ? 'bg-emerald-500/10 text-emerald-400'
        : 'bg-indigo-500/10 text-indigo-400';
    const dotClass = accent === 'emerald' ? 'bg-emerald-400' : 'bg-indigo-400';

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5 ${active ? `${activeClass} font-medium` : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <tab.icon size={16} weight={active ? 'fill' : 'regular'} />
            {tab.label}
            {active && <span className={`ml-auto w-1.5 h-1.5 rounded-full ${dotClass}`} />}
        </button>
    );
};

/* ─────────────────────────────────────────────────────────────
   ACCOUNT TAB
───────────────────────────────────────────────────────────── */
const AccountTab = ({ user }) => (
    <div className="space-y-8">
        {/* Avatar + Info */}
        <div className="flex items-center gap-5">
            <div className="relative">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {user?.name?.charAt(0)?.toUpperCase()}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-white">{user?.name}</h3>
                <p className="text-sm text-slate-400">{user?.email}</p>
                <div className="flex gap-2 mt-2">
                    <Badge label={user?.role} variant="indigo" />
                    <Badge label={user?.department} variant="slate" />
                </div>
            </div>
        </div>

        <Divider />

        {/* Read-only info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoField label="Full Name" value={user?.name} />
            <InfoField label="Email" value={user?.email} />
            <InfoField label="Role" value={user?.role} />
            <InfoField label="Department" value={user?.department || '—'} />
            <InfoField label="Employee ID" value={user?.id || '—'} />
        </div>

        <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 px-5 py-4 text-sm text-slate-400 flex items-center gap-3">
            <WarningCircle size={18} className="text-indigo-400 flex-shrink-0" />
            To update your name, email, or department, contact your system administrator.
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   SECURITY TAB
───────────────────────────────────────────────────────────── */
const SecurityTab = ({ pwForm, setPwForm, pwVisible, setPwVisible, pwErrors, onSubmit, saving }) => (
    <div className="space-y-8">
        <div>
            <h3 className="text-sm font-semibold text-white mb-1">Change Password</h3>
            <p className="text-xs text-slate-500 mb-6">Use a strong password of at least 8 characters.</p>

            <div className="space-y-4 max-w-md">
                <PasswordField
                    label="Current password"
                    value={pwForm.current}
                    visible={pwVisible.current}
                    error={pwErrors.current}
                    onChange={v => setPwForm(p => ({ ...p, current: v }))}
                    onToggle={() => setPwVisible(p => ({ ...p, current: !p.current }))}
                />
                <PasswordField
                    label="New password"
                    value={pwForm.next}
                    visible={pwVisible.next}
                    error={pwErrors.next}
                    onChange={v => setPwForm(p => ({ ...p, next: v }))}
                    onToggle={() => setPwVisible(p => ({ ...p, next: !p.next }))}
                />
                <PasswordField
                    label="Confirm new password"
                    value={pwForm.confirm}
                    visible={pwVisible.confirm}
                    error={pwErrors.confirm}
                    onChange={v => setPwForm(p => ({ ...p, confirm: v }))}
                    onToggle={() => setPwVisible(p => ({ ...p, confirm: !p.confirm }))}
                />
            </div>
        </div>

        {/* Password strength hints */}
        <div className="grid grid-cols-2 gap-2 max-w-md">
            {[
                { label: '8+ characters', pass: pwForm.next.length >= 8 },
                { label: 'Contains a number', pass: /\d/.test(pwForm.next) },
                { label: 'Uppercase letter', pass: /[A-Z]/.test(pwForm.next) },
                { label: 'Special character', pass: /[^A-Za-z0-9]/.test(pwForm.next) },
            ].map(rule => (
                <div key={rule.label} className={`flex items-center gap-2 text-xs ${rule.pass ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle size={13} weight={rule.pass ? 'fill' : 'regular'} />
                    {rule.label}
                </div>
            ))}
        </div>

        <Divider />
        <div className="flex justify-end">
            <SaveBtn onClick={onSubmit} saving={saving} label="Update Password" />
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   APPEARANCE TAB
───────────────────────────────────────────────────────────── */
const AppearanceTab = ({ prefs, onChange, onSave, saving }) => (
    <div className="space-y-8">
        <div>
            <Label>Theme</Label>
            <p className="text-xs text-slate-500 mb-5">Choose a color scheme for the interface.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {THEMES.map(t => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => onChange('theme', t.id)}
                        className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${prefs.theme === t.id
                                ? 'border-white/20 bg-white/5'
                                : 'border-white/[0.05] hover:border-white/10 hover:bg-white/[0.03]'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.from} ${t.to} shadow-md`} />
                        <span className="text-xs text-slate-400 font-medium">{t.label}</span>
                        {prefs.theme === t.id && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>

        <Divider />
        <div className="flex justify-end">
            <SaveBtn onClick={onSave} saving={saving} label="Save Appearance" />
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   NOTIFICATIONS TAB
───────────────────────────────────────────────────────────── */
const NotificationsTab = ({ prefs, onChange, onSave, saving }) => (
    <div className="space-y-5">
        <ToggleRow
            icon={Bell}
            title="Push Notifications"
            desc="Real-time alerts for leave requests, messages, and approvals."
            checked={prefs.notifications}
            onChange={v => onChange('notifications', v)}
        />
        <ToggleRow
            icon={SpeakerHigh}
            title="Sound Effects"
            desc="Play a chime for high-priority incoming notifications."
            checked={prefs.sound}
            onChange={v => onChange('sound', v)}
        />
        <Divider />
        <div className="flex justify-end">
            <SaveBtn onClick={onSave} saving={saving} label="Save Notifications" />
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   ORG TAB (admin) — Institution identity & contact settings
───────────────────────────────────────────────────────────── */
const OrgTab = ({ settings, onChange, onSave, saving }) => (
    <div className="space-y-6">
        <Label>Institution Identity</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
                label="Organization Name"
                value={settings.org_name || ''}
                onChange={v => onChange('org_name', v)}
                placeholder="e.g. LecMan"
                hint="Displayed in the sidebar, header, and all exported reports."
            />
            <Field
                label="Organization Code"
                value={settings.org_code || ''}
                onChange={v => onChange('org_code', v)}
                placeholder="e.g. MEC-2025"
                hint="Used in generated roll numbers and document headers."
            />
        </div>

        <Divider />
        <Label>Contact Information</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
                label="Admin Email"
                value={settings.admin_email || ''}
                onChange={v => onChange('admin_email', v)}
                placeholder="admin@college.edu"
                hint="Receives system alerts, backup notifications, and error reports."
            />
            <Field
                label="Support Phone"
                value={settings.support_phone || ''}
                onChange={v => onChange('support_phone', v)}
                placeholder="+91 00000 00000"
                hint="Shown on the login page and error screens for user assistance."
            />
        </div>

        <Divider />
        <Label>System Notifications</Label>
        <SelectField
            label="Notification Digest Frequency"
            value={settings.notification_frequency || 'daily'}
            onChange={v => onChange('notification_frequency', v)}
            options={[
                { value: 'instant', label: 'Instant — Send immediately' },
                { value: 'daily', label: 'Daily — Digest at end of day' },
                { value: 'weekly', label: 'Weekly — Digest every Monday' },
            ]}
            hint="Controls how pending notifications are batched and delivered to faculty."
        />

        <Divider />
        <div className="flex justify-end">
            <SaveBtn onClick={onSave} saving={saving} label="Save Organization" accent="emerald" />
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   ACADEMIC TAB (admin) — academic year, grading, attendance
───────────────────────────────────────────────────────────── */
const AcademicTab = ({ settings, onChange, onSave, saving, navigate }) => (
    <div className="space-y-6">
        <Label>Term Configuration</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
                label="Academic Year"
                value={settings.academic_year || ''}
                onChange={v => onChange('academic_year', v)}
                placeholder="e.g. 2025-2026"
                hint="Shown on dashboards, reports, and filters. Change this at the start of each academic cycle."
            />
            <Field
                label="Current Semester"
                value={settings.current_semester || ''}
                onChange={v => onChange('current_semester', v)}
                placeholder="e.g. Even Semester"
                hint="Used in schedule generation, report headers, and student filtering."
            />
        </div>

        <Divider />
        <Label>Attendance & Grading</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
                label="Minimum Attendance Threshold (%)"
                value={settings.attendance_threshold || '75'}
                onChange={v => onChange('attendance_threshold', v)}
                type="number"
                placeholder="75"
                hint="Students below this percentage are flagged as 'at-risk' on the dashboard and in student reports."
            />
            <SelectField
                label="Grading Scale"
                value={settings.grading_scale || 'standard'}
                onChange={v => onChange('grading_scale', v)}
                options={[
                    { value: 'standard', label: 'Standard (A, B, C, D, F)' },
                    { value: 'gpa', label: 'GPA Scale (10-point)' },
                    { value: 'cgpa', label: 'CGPA Scale (cumulative)' },
                    { value: 'percentage', label: 'Percentage Based' },
                ]}
                hint="Determines the grading format used in evaluations, transcripts, and student reports."
            />
        </div>

        <Divider />
        <Label>Leave & Substitution Automation</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
                label="Auto-Approval Timer (minutes)"
                value={settings.auto_approval_minutes || '30'}
                onChange={v => onChange('auto_approval_minutes', v)}
                type="number"
                placeholder="30"
                hint="Leave requests pending beyond this time are auto-approved if no HOD action is taken."
            />
            <Field
                label="Auto-Assignment Timer (minutes)"
                value={settings.auto_assignment_minutes || '15'}
                onChange={v => onChange('auto_assignment_minutes', v)}
                type="number"
                placeholder="15"
                hint="After a leave is approved, substitutes are auto-assigned if no manual assignment is made within this window."
            />
        </div>

        <Divider />

        {/* Blueprint card */}
        <div className="flex items-center justify-between p-5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <div>
                <p className="text-sm font-medium text-white mb-0.5">Academic Blueprint</p>
                <p className="text-xs text-slate-500">Configure departments, divisions, rooms, time slots, and designations.</p>
            </div>
            <button
                type="button"
                onClick={() => navigate('/admin/settings')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-all"
            >
                Open <ArrowSquareOut size={13} />
            </button>
        </div>

        <div className="flex justify-end">
            <SaveBtn onClick={onSave} saving={saving} label="Save Academic Settings" accent="emerald" />
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   USERS TAB (admin) — access controls & user management
───────────────────────────────────────────────────────────── */
const UsersTab = ({ settings, onChange, onSave, saving, navigate }) => (
    <div className="space-y-6">
        <Label>Access Control</Label>

        <ToggleRow
            icon={Users}
            title="Allow Self-Registration"
            desc="When enabled, new faculty can create accounts via /register. When disabled, only admins can add users."
            checked={settings.allow_registrations === 'true'}
            onChange={v => onChange('allow_registrations', v ? 'true' : 'false')}
        />

        <Divider />
        <Label>Management Shortcuts</Label>
        {[
            {
                title: 'Role Architecture',
                desc: 'Configure admin, HOD, and faculty roles with granular permission mapping.',
                icon: ShieldCheck,
                color: 'emerald',
                action: () => navigate('/admin/user-roles'),
                label: 'Manage Roles',
            },
            {
                title: 'Faculty Directory',
                desc: 'View and manage all authorized faculty members in the workspace.',
                icon: Users,
                color: 'indigo',
                action: () => navigate('/admin/faculty'),
                label: 'Open Directory',
            },
            {
                title: 'User Credentials',
                desc: 'Reset passwords, deactivate accounts, and manage login access.',
                icon: Lock,
                color: 'amber',
                action: () => navigate('/admin/users-credentials'),
                label: 'Manage Credentials',
            },
        ].map(card => (
            <div
                key={card.title}
                className="flex items-center justify-between p-5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg ${
                        card.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                        card.color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-indigo-500/10 text-indigo-400'
                    }`}>
                        <card.icon size={20} weight="duotone" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">{card.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-sm">{card.desc}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={card.action}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 border border-white/[0.07] rounded-lg hover:bg-white/5 transition-all ml-4"
                >
                    {card.label} <CaretRight size={12} />
                </button>
            </div>
        ))}

        <Divider />
        <div className="flex justify-end">
            <SaveBtn onClick={onSave} saving={saving} label="Save User Settings" accent="emerald" />
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   SYSTEM TAB (admin) — maintenance, backup, danger zone
───────────────────────────────────────────────────────────── */
const SystemTab = ({ settings, onChange, onSave, saving, navigate, onBackup }) => (
    <div className="space-y-6">
        <Label>System Controls</Label>

        {/* Maintenance mode */}
        <ToggleRow
            icon={Warning}
            title="Maintenance Mode"
            desc="Lock the entire application for all non-admin users. Active sessions will receive a 503 error. Only admins can access the system."
            checked={settings.maintenance_mode === 'true'}
            onChange={v => onChange('maintenance_mode', v ? 'true' : 'false')}
            destructive
        />

        <Divider />
        <Label>Data Operations</Label>
        {[
            {
                title: 'Audit Logs',
                desc: 'Inspect all user actions — logins, changes, deletions — in chronological order.',
                icon: Moon,
                color: 'indigo',
                action: () => navigate('/admin/audit'),
                label: 'View Logs',
            },
            {
                title: 'Database Backup',
                desc: 'Export a complete SQLite snapshot. Includes all tables, settings, and user data.',
                icon: FloppyDisk,
                color: 'teal',
                action: onBackup,
                label: 'Download Backup',
            },
            {
                title: 'Data Management',
                desc: 'Bulk import/export data, manage file uploads, and clean orphaned records.',
                icon: Database,
                color: 'violet',
                action: () => navigate('/admin/data-management'),
                label: 'Manage Data',
            },
        ].map(card => (
            <div
                key={card.title}
                className="flex items-center justify-between p-5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg ${
                        card.color === 'teal' ? 'bg-teal-500/10 text-teal-400' :
                        card.color === 'violet' ? 'bg-violet-500/10 text-violet-400' :
                        'bg-indigo-500/10 text-indigo-400'
                    }`}>
                        <card.icon size={20} weight="duotone" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">{card.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-sm">{card.desc}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={card.action}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 border border-white/[0.07] rounded-lg hover:bg-white/5 transition-all ml-4"
                >
                    {card.label} <CaretRight size={12} />
                </button>
            </div>
        ))}

        <Divider />
        <div className="flex justify-end">
            <SaveBtn onClick={onSave} saving={saving} label="Save System Settings" accent="emerald" />
        </div>

        {/* Factory Reset – danger zone */}
        <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-4">Danger Zone</p>
            <div className="flex items-center justify-between p-5 rounded-xl border border-red-500/15 bg-red-500/[0.03]">
                <div>
                    <p className="text-sm font-medium text-red-400">Factory Reset</p>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
                        Permanently erase all dynamic data (attendance, leave requests, schedules) and revert settings to defaults. This cannot be undone.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => toast.error('Factory reset is disabled in production.')}
                    className="flex-shrink-0 px-4 py-2 text-xs font-semibold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-all ml-4 uppercase tracking-wider"
                >
                    Reset
                </button>
            </div>
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   SHARED MICRO-COMPONENTS
───────────────────────────────────────────────────────────── */

const Divider = () => <hr className="border-white/[0.06]" />;

const Label = ({ children }) => (
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{children}</p>
);

const Badge = ({ label, variant }) => {
    const cls = variant === 'indigo'
        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
        : 'bg-white/5 text-slate-400 border-white/10';
    return (
        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${cls}`}>
            {label}
        </span>
    );
};

const InfoField = ({ label, value }) => (
    <div>
        <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm text-slate-300 bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2">{value}</p>
    </div>
);

const Field = ({ label, value, onChange, placeholder, type = 'text', hint }) => (
    <div>
        <p className="text-xs font-semibold text-slate-400 mb-1.5">{label}</p>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
        />
        {hint && <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
);

const SelectField = ({ label, value, onChange, options, hint }) => (
    <div>
        <p className="text-xs font-semibold text-slate-400 mb-1.5">{label}</p>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' fill=\'none\'%3E%3Cpath d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2394a3b8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', paddingRight: '2.5rem' }}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
            ))}
        </select>
        {hint && <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
);

const PasswordField = ({ label, value, visible, error, onChange, onToggle }) => (
    <div>
        <p className="text-xs font-semibold text-slate-400 mb-1.5">{label}</p>
        <div className="relative">
            <input
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`w-full bg-white/[0.04] border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 transition-all pr-10 ${error ? 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20' : 'border-white/[0.08] focus:border-indigo-500/50 focus:ring-indigo-500/30'
                    }`}
                placeholder="••••••••"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
                {visible ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
);

const ToggleRow = ({ icon: Icon, title, desc, checked, onChange, destructive = false }) => (
    <div className="flex items-center justify-between p-5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${destructive ? 'bg-red-500/10 text-red-400' : 'bg-slate-700/60 text-slate-400'}`}>
                <Icon size={18} weight="duotone" />
            </div>
            <div>
                <p className={`text-sm font-medium ${destructive ? 'text-red-300' : 'text-white'}`}>{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 max-w-sm">{desc}</p>
            </div>
        </div>
        <Toggle checked={checked} onChange={onChange} destructive={destructive} />
    </div>
);

const Toggle = ({ checked, onChange, destructive }) => {
    const track = destructive
        ? checked ? 'bg-red-500' : 'bg-slate-700'
        : checked ? 'bg-indigo-500' : 'bg-slate-700';
    return (
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            <div className={`w-11 h-6 rounded-full transition-all ${track} relative`}>
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </div>
        </label>
    );
};

const SaveBtn = ({ onClick, saving, label, accent = 'indigo' }) => {
    const base = accent === 'emerald'
        ? 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500/30'
        : 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500/30';
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={saving}
            className={`${base} text-white text-sm font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
        >
            {saving
                ? <ArrowCounterClockwise size={15} className="animate-spin" />
                : <FloppyDisk size={15} weight="fill" />
            }
            {saving ? 'Saving…' : label}
        </button>
    );
};

export default Settings;