import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    useDepartments,
    useAcademicYears,
    useTimeSlots,
    useDivisions,
    useRooms,
    useDesignations,
    useSystemConfig
} from '../hooks/useConfig';
import {
    Gear,
    Buildings,
    GraduationCap,
    Clock,
    GridFour,
    MapPin,
    IdentificationBadge,
    Plus,
    Pencil,
    Trash,
    Check,
    X,
    CalendarBlank,
    Download,
    Upload,
    ClockCounterClockwise,
    FilePlus
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState('departments');

    const tabs = [
        { id: 'departments', label: 'Departments', icon: Buildings },
        { id: 'academic-years', label: 'Class Years', icon: GraduationCap },
        { id: 'time-slots', label: 'Time Slots', icon: Clock },
        { id: 'divisions', label: 'Divisions', icon: GridFour },
        { id: 'rooms', label: 'Rooms', icon: MapPin },
        { id: 'designations', label: 'Designations', icon: IdentificationBadge },
        { id: 'system', label: 'System', icon: Gear },
        { id: 'templates', label: 'Templates', icon: FilePlus },
        { id: 'audit', label: 'Audit Log', icon: ClockCounterClockwise }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Gear className="text-blue-400" weight="duotone" size={36} />
                    System Settings
                </h1>
                <p className="text-slate-400 mt-2">Manage system-wide configuration & dynamic values</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            <Icon size={20} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                {activeTab === 'departments' && <DepartmentsPanel />}
                {activeTab === 'academic-years' && <AcademicYearsPanel />}
                {activeTab === 'time-slots' && <TimeSlotsPanel />}
                {activeTab === 'divisions' && <DivisionsPanel />}
                {activeTab === 'rooms' && <RoomsPanel />}
                {activeTab === 'designations' && <DesignationsPanel />}
                {activeTab === 'system' && <SystemConfigPanel />}
                {activeTab === 'templates' && <TemplatesPanel />}
                {activeTab === 'audit' && <AuditLogPanel />}
            </div>
        </div>
    );
};

// [Previous CrudPanel and individual panels code remains the same...]
// I'll add the new panels for Templates and Audit

const TemplatesPanel = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/config/templates');
            if (res.data.success) {
                setTemplates(res.data.templates);
            }
        } catch (err) {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const applyTemplate = async (id, merge = false) => {
        if (!confirm(`Apply this template? ${merge ? 'Configurations will be merged.' : 'Existing configurations will be replaced.'}`)) return;

        try {
            const res = await api.post(`/config/templates/${id}/apply`, { merge });
            if (res.data.success) {
                toast.success('Template applied successfully!');
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (err) {
            toast.error('Failed to apply template');
        }
    };

    return (
        <div className="p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Configuration Templates</h2>
                <p className="text-slate-400 text-sm mt-1">Quick setup presets for different institution types</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading templates...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map(template => (
                        <div key={template.id} className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        <FilePlus className="text-emerald-400" size={24} />
                                        {template.name}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-2">{template.description}</p>
                                    <span className="inline-block mt-3 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold">
                                        {template.type}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => applyTemplate(template.id, false)}
                                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all text-sm"
                                >
                                    Replace All
                                </button>
                                <button
                                    onClick={() => applyTemplate(template.id, true)}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all text-sm"
                                >
                                    Merge
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AuditLogPanel = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        try {
            const params = filter !== 'all' ? `?table_name=${filter}` : '';
            const res = await api.get(`/config/audit-logs${params}`);
            if (res.data.success) {
                setLogs(res.data.logs);
            }
        } catch (err) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'text-emerald-400 bg-emerald-500/10';
            case 'UPDATE': return 'text-amber-400 bg-amber-500/10';
            case 'DELETE': return 'text-rose-400 bg-rose-500/10';
            default: return 'text-slate-400 bg-slate-500/10';
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Configuration Audit Log</h2>
                    <p className="text-slate-400 text-sm mt-1">Track all configuration changes</p>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                >
                    <option value="all">All Tables</option>
                    <option value="departments">Departments</option>
                    <option value="academic_years">Academic Years</option>
                    <option value="time_slots">Time Slots</option>
                    <option value="divisions">Divisions</option>
                    <option value="rooms">Rooms</option>
                    <option value="designations">Designations</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading audit logs...</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20 text-slate-500">No audit logs found</div>
            ) : (
                <div className="space-y-3">
                    {logs.map((log, idx) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="bg-slate-800/50 rounded-xl p-4 border border-white/5"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                        <span className="text-slate-400 text-sm font-mono">{log.table_name}</span>
                                        <span className="text-slate-500 text-xs">ID: {log.record_id}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span>👤 {log.changed_by_name || 'System'}</span>
                                        <span>📅 {new Date(log.changed_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Export and maintain all previous panels...
// [Include all the previous CrudPanel, individual panels code here - DepartmentsPanel, AcademicYearsPanel, etc.]

export default SystemSettings;
