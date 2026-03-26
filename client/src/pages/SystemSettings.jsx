import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
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
    FilePlus,
    Warning,
    MagnifyingGlass,
    Sliders,
    Database,
    Lightning,
    ArrowsClockwise,
    ShieldCheck,
    CaretRight
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Color Themes per Category ───
const CATEGORY_THEMES = {
    departments: { gradient: 'from-blue-600 to-cyan-500', accent: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', ring: 'ring-blue-500/30' },
    'academic-years': { gradient: 'from-violet-600 to-purple-500', accent: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', ring: 'ring-violet-500/30' },
    'time-slots': { gradient: 'from-amber-600 to-orange-500', accent: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', ring: 'ring-amber-500/30' },
    divisions: { gradient: 'from-emerald-600 to-teal-500', accent: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', ring: 'ring-emerald-500/30' },
    rooms: { gradient: 'from-rose-600 to-pink-500', accent: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', ring: 'ring-rose-500/30' },
    designations: { gradient: 'from-indigo-600 to-blue-500', accent: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', ring: 'ring-indigo-500/30' },
    system: { gradient: 'from-slate-600 to-zinc-500', accent: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', ring: 'ring-slate-500/30' },
    templates: { gradient: 'from-fuchsia-600 to-pink-500', accent: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20', ring: 'ring-fuchsia-500/30' },
    audit: { gradient: 'from-cyan-600 to-sky-500', accent: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', ring: 'ring-cyan-500/30' },
};

// ─── Skeleton Loader ───
const SkeletonCard = () => (
    <div className="bg-slate-800/40 rounded-2xl p-5 border border-white/5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-700/60 rounded-xl" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700/60 rounded w-2/3" />
                <div className="h-3 bg-slate-700/40 rounded w-1/3" />
            </div>
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-slate-700/30 rounded w-full" />
            <div className="h-3 bg-slate-700/30 rounded w-4/5" />
        </div>
    </div>
);

// ─── Main Component ───
const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState('departments');
    const [sidebarCollapsed] = useState(false);

    const tabs = [
        { id: 'departments', label: 'Departments', icon: Buildings, description: 'Manage college departments' },
        { id: 'academic-years', label: 'Class Years', icon: GraduationCap, description: 'Academic year configuration' },
        { id: 'time-slots', label: 'Time Slots', icon: Clock, description: 'Lecture time slot definitions' },
        { id: 'divisions', label: 'Divisions', icon: GridFour, description: 'Class divisions & sections' },
        { id: 'rooms', label: 'Rooms', icon: MapPin, description: 'Room & venue management' },
        { id: 'designations', label: 'Designations', icon: IdentificationBadge, description: 'Faculty designations' },
        { id: 'system', label: 'System Config', icon: Sliders, description: 'Core system settings' },
        { id: 'templates', label: 'Templates', icon: FilePlus, description: 'Quick setup presets' },
        { id: 'audit', label: 'Audit Log', icon: ClockCounterClockwise, description: 'Change history tracker' }
    ];

    const theme = CATEGORY_THEMES[activeTab] || CATEGORY_THEMES.departments;

    return (
        <div className="max-w-[1600px] mx-auto pb-10">
            {/* ─── Hero Header ─── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-r ${theme.gradient} rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl mb-8`}
            >
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform origin-bottom-right" />
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
                            <Gear className="text-white/80" weight="duotone" size={36} />
                            System Settings
                        </h1>
                        <p className="text-white/70 mt-2 text-sm md:text-base">
                            Configure and manage your institution's core settings
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-white/90 text-sm font-medium">
                            <ShieldCheck size={18} weight="fill" />
                            Admin Access
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ─── Main Layout: Sidebar + Content ─── */}
            <div className="flex gap-6">
                {/* Vertical Sidebar Navigation */}
                <motion.nav
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`hidden md:flex flex-col gap-1.5 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 sticky top-6 self-start transition-all duration-300`}
                >
                    <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-3 shadow-xl">
                        {tabs.map((tab, idx) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const tabTheme = CATEGORY_THEMES[tab.id];
                            return (
                                <motion.button
                                    key={tab.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium transition-all text-left group relative ${isActive
                                        ? `bg-gradient-to-r ${tabTheme.gradient} text-white shadow-lg`
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                                    title={sidebarCollapsed ? tab.label : undefined}
                                >
                                    <Icon size={20} weight={isActive ? 'fill' : 'regular'} className="flex-shrink-0" />
                                    {!sidebarCollapsed && (
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-sm font-semibold truncate">{tab.label}</span>
                                            {isActive && <span className="block text-[10px] text-white/60 mt-0.5 truncate">{tab.description}</span>}
                                        </div>
                                    )}
                                    {isActive && !sidebarCollapsed && (
                                        <CaretRight size={14} weight="bold" className="text-white/50 flex-shrink-0" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.nav>

                {/* Mobile Tab Selector */}
                <div className="md:hidden w-full mb-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const tabTheme = CATEGORY_THEMES[tab.id];
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap text-sm ${isActive
                                        ? `bg-gradient-to-r ${tabTheme.gradient} text-white shadow-lg`
                                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Panel */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 min-w-0"
                >
                    {activeTab === 'departments' && <DepartmentsPanel />}
                    {activeTab === 'academic-years' && <AcademicYearsPanel />}
                    {activeTab === 'time-slots' && <TimeSlotsPanel />}
                    {activeTab === 'divisions' && <DivisionsPanel />}
                    {activeTab === 'rooms' && <RoomsPanel />}
                    {activeTab === 'designations' && <DesignationsPanel />}
                    {activeTab === 'system' && <SystemConfigPanel />}
                    {activeTab === 'templates' && <TemplatesPanel />}
                    {activeTab === 'audit' && <AuditLogPanel />}
                </motion.div>
            </div>
        </div>
    );
};

// ─── Generic CRUD Panel (Card-Based) ───
const CrudPanel = ({ title, endpoint, columns, icon: Icon, defaultValues = {} }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const theme = CATEGORY_THEMES[endpoint] || CATEGORY_THEMES.departments;

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/config/${endpoint}`);
            if (res.data.success) {
                setItems(res.data[endpoint] || []);
            }
        } catch {
            toast.error(`Failed to fetch ${title}`);
        } finally {
            setLoading(false);
        }
    }, [endpoint, title]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ ...item });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const res = await api.delete(`/config/${endpoint}/${id}`);
            if (res.data.success) {
                toast.success('Item deleted successfully');
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete item');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const res = await api.put(`/config/${endpoint}/${editingItem.id}`, formData);
                if (res.data.success) {
                    toast.success('Item updated successfully');
                    setShowModal(false);
                    fetchItems();
                }
            } else {
                const res = await api.post(`/config/${endpoint}`, formData);
                if (res.data.success) {
                    toast.success('Item created successfully');
                    setShowModal(false);
                    fetchItems();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setFormData(defaultValues);
        setShowModal(true);
    };

    const filteredItems = items.filter(item =>
        columns.some(col =>
            String(item[col.key] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div>
            {/* Panel Header */}
            <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-6 mb-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.accent}`}>
                            {Icon && <Icon size={24} weight="duotone" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                            <p className="text-slate-400 text-sm">
                                {loading ? 'Loading...' : `${items.length} item${items.length !== 1 ? 's' : ''} configured`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 sm:flex-initial">
                            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full sm:w-48 bg-slate-800/80 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all"
                            />
                        </div>
                        {/* Add New Button */}
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleAddNew}
                            className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-semibold transition-all shadow-lg text-sm whitespace-nowrap`}
                        >
                            <Plus size={16} weight="bold" />
                            Add New
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Items Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filteredItems.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-dashed border-white/10"
                >
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${theme.bg} ${theme.accent} mb-4`}>
                        {Icon ? <Icon size={32} weight="duotone" /> : <Database size={32} weight="duotone" />}
                    </div>
                    <p className="text-slate-400 font-medium mb-1">
                        {searchTerm ? 'No matching items found' : 'No items configured yet'}
                    </p>
                    <p className="text-slate-500 text-sm mb-6">
                        {searchTerm ? 'Try adjusting your search term' : `Get started by adding your first ${title.toLowerCase().slice(0, -1)}`}
                    </p>
                    {!searchTerm && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddNew}
                            className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-semibold shadow-lg`}
                        >
                            <Plus size={18} weight="bold" />
                            Add First Item
                        </motion.button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredItems.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03, duration: 0.3 }}
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                            className={`backdrop-blur-xl bg-slate-900/50 border ${theme.border} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden`}
                        >
                            {/* Accent stripe */}
                            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${theme.gradient} rounded-l-2xl opacity-60`} />

                            <div className="flex items-start justify-between pl-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme.bg} ${theme.accent} flex-shrink-0`}>
                                            {Icon && <Icon size={18} weight="duotone" />}
                                        </div>
                                        <h3 className="text-white font-bold text-base truncate">
                                            {item[columns[0]?.key] || `Item #${item.id}`}
                                        </h3>
                                    </div>

                                    <div className="space-y-1.5 pl-0.5">
                                        {columns.slice(1).map(col => (
                                            <div key={col.key} className="flex items-center gap-2 text-sm">
                                                <span className="text-slate-500 font-medium text-xs uppercase tracking-wider min-w-[60px]">{col.label}</span>
                                                <span className="text-slate-300 truncate">{item[col.key] || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                    <motion.button
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleEdit(item)}
                                        className="p-2 text-indigo-400 hover:bg-indigo-500/15 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={16} />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash size={16} />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ─── Modal ─── */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#0c1222] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Gradient Header */}
                            <div className={`bg-gradient-to-r ${theme.gradient} p-5 flex justify-between items-center`}>
                                <div className="flex items-center gap-3">
                                    {Icon && <Icon size={22} weight="fill" className="text-white/80" />}
                                    <h3 className="text-lg font-bold text-white">
                                        {editingItem ? `Edit ${title.slice(0, -1)}` : `Add New ${title.slice(0, -1)}`}
                                    </h3>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {columns.map(col => (
                                    <div key={col.key} className="group">
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{col.label}</label>
                                        <input
                                            required
                                            type={col.type || 'text'}
                                            value={formData[col.key] || ''}
                                            onChange={e => setFormData({ ...formData, [col.key]: e.target.value })}
                                            className={`w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:${theme.border} focus:ring-1 ${theme.ring} outline-none transition-all placeholder-slate-600`}
                                            placeholder={`Enter ${col.label.toLowerCase()}`}
                                        />
                                    </div>
                                ))}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className={`flex-1 px-4 py-3 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-semibold transition-all text-sm shadow-lg flex items-center justify-center gap-2`}
                                    >
                                        <Check size={16} weight="bold" />
                                        {editingItem ? 'Update' : 'Create'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Specific Panels ───

const DepartmentsPanel = () => (
    <CrudPanel
        title="Departments"
        endpoint="departments"
        icon={Buildings}
        columns={[
            { key: 'name', label: 'Name' },
            { key: 'code', label: 'Code' }
        ]}
    />
);

const AcademicYearsPanel = () => (
    <CrudPanel
        title="Academic Years"
        endpoint="academic-years"
        icon={GraduationCap}
        columns={[
            { key: 'name', label: 'Name' },
            { key: 'code', label: 'Code' },
            { key: 'sort_order', label: 'Sort Order', type: 'number' }
        ]}
    />
);

const TimeSlotsPanel = () => (
    <CrudPanel
        title="Time Slots"
        endpoint="time-slots"
        icon={Clock}
        columns={[
            { key: 'name', label: 'Label' },
            { key: 'start_time', label: 'Start Time', type: 'time' },
            { key: 'end_time', label: 'End Time', type: 'time' },
            { key: 'slot_type', label: 'Type' }
        ]}
    />
);

const DivisionsPanel = () => (
    <CrudPanel
        title="Divisions"
        endpoint="divisions"
        icon={GridFour}
        columns={[
            { key: 'name', label: 'Name' },
            { key: 'code', label: 'Code' }
        ]}
    />
);

const RoomsPanel = () => (
    <CrudPanel
        title="Rooms"
        endpoint="rooms"
        icon={MapPin}
        columns={[
            { key: 'name', label: 'Name' },
            { key: 'code', label: 'Code' },
            { key: 'capacity', label: 'Capacity', type: 'number' }
        ]}
    />
);

const DesignationsPanel = () => (
    <CrudPanel
        title="Designations"
        endpoint="designations"
        icon={IdentificationBadge}
        columns={[
            { key: 'title', label: 'Title' },
            { key: 'rank', label: 'Rank Level', type: 'number' }
        ]}
    />
);

const SystemConfigPanel = () => (
    <CrudPanel
        title="System Configuration"
        endpoint="system-config"
        icon={Sliders}
        columns={[
            { key: 'key', label: 'Config Key' },
            { key: 'value', label: 'Value' },
            { key: 'description', label: 'Description' }
        ]}
    />
);

// ─── Templates Panel ───
const TemplatesPanel = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const theme = CATEGORY_THEMES.templates;

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await api.get('/config/templates');
            if (res.data.success) {
                setTemplates(res.data.templates);
            }
        } catch {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const applyTemplate = (id, merge = false) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full backdrop-blur-2xl bg-slate-900/90 shadow-2xl rounded-2xl border border-white/10 pointer-events-auto flex flex-col p-5`}>
                <div className="flex gap-4">
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${merge ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {merge ? <Download weight="duotone" size={20} /> : <ArrowsClockwise weight="duotone" size={20} />}
                    </div>
                    <div>
                        <p className="text-white font-semibold">
                            {merge ? 'Merge Template?' : 'Replace All Configurations?'}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                            {merge
                                ? 'This will add new configurations. Existing data will not be touched unless there is an exact conflict.'
                                : 'WARNING: This will obliterate all existing configurations and replace them with the template default. This action cannot be undone.'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 mt-5">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-2 border border-white/10 text-slate-300 rounded-lg text-sm font-medium hover:bg-white/5 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const loadingToast = toast.loading('Applying template...');
                            try {
                                const res = await api.post(`/config/templates/${id}/apply`, { merge });
                                if (res.data.success) {
                                    toast.success('Template applied successfully!', { id: loadingToast });
                                    setTimeout(() => window.location.reload(), 1500);
                                }
                            } catch {
                                toast.error('Failed to apply template', { id: loadingToast });
                            }
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg transition-transform hover:scale-[1.02] active:scale-95 ${merge
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600'
                            }`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const TEMPLATE_GRADIENTS = [
        'from-emerald-600/20 to-teal-600/10 border-emerald-500/20',
        'from-violet-600/20 to-purple-600/10 border-violet-500/20',
        'from-amber-600/20 to-orange-600/10 border-amber-500/20',
        'from-rose-600/20 to-pink-600/10 border-rose-500/20',
        'from-cyan-600/20 to-sky-600/10 border-cyan-500/20',
    ];

    return (
        <div>
            {/* Panel Header */}
            <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-6 mb-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.accent}`}>
                        <FilePlus size={24} weight="duotone" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Configuration Templates</h2>
                        <p className="text-slate-400 text-sm">Quick setup presets for different institution types</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : templates.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-dashed border-white/10"
                >
                    <FilePlus size={40} weight="duotone" className="mx-auto text-fuchsia-400 mb-4" />
                    <p className="text-slate-400 font-medium">No templates available</p>
                    <p className="text-slate-500 text-sm mt-1">Templates will appear here once configured</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {templates.map((template, idx) => (
                        <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                            className={`backdrop-blur-xl bg-gradient-to-br ${TEMPLATE_GRADIENTS[idx % TEMPLATE_GRADIENTS.length]} border rounded-2xl p-6 shadow-lg relative overflow-hidden`}
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 mr-4">
                                        <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-2">
                                            <Lightning className="text-amber-400" weight="fill" size={20} />
                                            {template.name}
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{template.description}</p>
                                    </div>
                                    <span className="inline-block px-3 py-1.5 bg-white/10 text-white/70 rounded-lg text-xs font-bold uppercase tracking-wider flex-shrink-0">
                                        {template.type}
                                    </span>
                                </div>

                                <div className="flex gap-3 mt-5">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => applyTemplate(template.id, false)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-semibold transition-all text-sm shadow-lg"
                                    >
                                        <ArrowsClockwise size={16} weight="bold" />
                                        Replace All
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => applyTemplate(template.id, true)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold transition-all text-sm shadow-lg"
                                    >
                                        <Download size={16} weight="bold" />
                                        Merge
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Audit Log Panel (Timeline Style) ───
const AuditLogPanel = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const theme = CATEGORY_THEMES.audit;

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? `?table_name=${filter}` : '';
            const res = await api.get(`/config/audit-logs${params}`);
            if (res.data.success) {
                setLogs(res.data.logs);
            }
        } catch {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getActionStyle = (action) => {
        switch (action) {
            case 'CREATE': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: <Plus size={14} weight="bold" /> };
            case 'UPDATE': return { color: 'text-amber-400', bg: 'bg-amber-500/15', icon: <Pencil size={14} weight="bold" /> };
            case 'DELETE': return { color: 'text-rose-400', bg: 'bg-rose-500/15', icon: <Trash size={14} weight="bold" /> };
            default: return { color: 'text-slate-400', bg: 'bg-slate-500/15', icon: <Gear size={14} /> };
        }
    };

    const filterTabs = ['all', 'departments', 'academic_years', 'time_slots', 'divisions', 'rooms', 'designations'];

    return (
        <div>
            {/* Panel Header */}
            <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-6 mb-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.accent}`}>
                            <ClockCounterClockwise size={24} weight="duotone" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Configuration Audit Log</h2>
                            <p className="text-slate-400 text-sm">
                                {loading ? 'Loading...' : `${logs.length} change${logs.length !== 1 ? 's' : ''} recorded`}
                            </p>
                        </div>
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-cyan-500/50 outline-none transition-all"
                    >
                        {filterTabs.map(f => (
                            <option key={f} value={f}>{f === 'all' ? 'All Tables' : f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : logs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-dashed border-white/10"
                >
                    <ClockCounterClockwise size={40} weight="duotone" className="mx-auto text-cyan-400 mb-4" />
                    <p className="text-slate-400 font-medium">No audit logs found</p>
                    <p className="text-slate-500 text-sm mt-1">Changes to configurations will appear here</p>
                </motion.div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/30 via-slate-700/30 to-transparent" />

                    <div className="space-y-3">
                        {logs.map((log, idx) => {
                            const style = getActionStyle(log.action);
                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                                    className="relative flex items-start gap-4 pl-3"
                                >
                                    {/* Timeline dot */}
                                    <div className={`relative z-10 w-7 h-7 rounded-full ${style.bg} ${style.color} flex items-center justify-center flex-shrink-0 ring-4 ring-slate-950`}>
                                        {style.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 backdrop-blur-xl bg-slate-900/50 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${style.color} ${style.bg}`}>
                                                {log.action}
                                            </span>
                                            <span className="text-slate-400 text-sm font-mono bg-slate-800/50 px-2 py-0.5 rounded">
                                                {log.table_name}
                                            </span>
                                            <span className="text-slate-600 text-xs">ID: {log.record_id}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                                    {(log.changed_by_name || 'S')[0].toUpperCase()}
                                                </div>
                                                {log.changed_by_name || 'System'}
                                            </span>
                                            <span>•</span>
                                            <span>{new Date(log.changed_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
