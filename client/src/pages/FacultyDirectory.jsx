import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useDepartments, useDesignations } from '../hooks/useConfig';
import {
    Users,
    UserPlus,
    MagnifyingGlass,
    Trash,
    Pencil,
    ChalkboardTeacher,
    Crown,
    Funnel,
    Plus,
    Buildings,
    CheckCircle,
    UserCheck,
    PencilSimple,
    FileXls,
    DownloadSimple,
    User,
    IdentificationBadge,
    Key,
    Phone,
    Calendar,
    GraduationCap,
    UploadSimple,
    Table,
    GridFour,
    DotsThree,
    ListBullets,
    XCircle
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../components/ui/CustomSelect';

const FacultyDirectory = () => {
    const { user } = useContext(AuthContext);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('facultyViewMode') || 'grid');
    const [showModal, setShowModal] = useState(false);

    // Dynamic config data
    const { data: departments, loading: deptLoading } = useDepartments();
    const { data: designations, loading: desigLoading } = useDesignations();

    // Defensive initialization - ensure these are always arrays
    const safeDepartments = Array.isArray(departments) ? departments : [];
    const safeDesignations = Array.isArray(designations) ? designations : [];

    // Import State
    const [showImport, setShowImport] = useState(false);
    const [importFiles, setImportFiles] = useState([]);
    const [importLog, setImportLog] = useState('');
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    // Form State
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        email: '',
        department: user.department || 'CS',
        post: 'Assistant Professor',
        is_hod: false,
        password: '' // Optional for updates
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    useEffect(() => {
        localStorage.setItem('facultyViewMode', viewMode);
    }, [viewMode]);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/teachers');
            if (res.data.success) {
                setTeachers(res.data.teachers);
            }
        } catch (error) {
            logger.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({
            id: null,
            name: '',
            email: '',
            department: user.department || 'CS',
            post: 'Assistant Professor',
            is_hod: false,
            password: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (teacher) => {
        setIsEditMode(true);
        setFormData({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            department: teacher.department,
            post: teacher.post || 'Assistant Professor',
            is_hod: teacher.is_acting_hod === 1 || teacher.is_hod === 1,
            password: '',
            max_lectures: teacher.max_lectures || 14
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isEditMode ? `/teachers/${formData.id}` : '/teachers';
            const method = isEditMode ? 'put' : 'post';

            const res = await api[method](endpoint, formData);
            if (res.data.success) {
                toast.success(`Faculty ${isEditMode ? 'Updated' : 'Added'} Successfully!`);
                setShowModal(false);
                fetchTeachers();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation Failed');
        }
    };

    const confirmDelete = async (id) => {
        try {
            await api.delete(`/teachers/${id}`);
            fetchTeachers();
            toast.success('Faculty deleted successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete Failed');
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
                        <h4 className="font-bold text-white">Delete Faculty?</h4>
                        <p className="text-sm text-slate-400 mt-1">This will delete the teacher AND their scheduled lectures.</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white">Dismiss</button>
                    <button onClick={() => { toast.dismiss(t.id); confirmDelete(id); }} className="px-4 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold">Delete</button>
                </div>
            </div>
        ), { duration: 5000, style: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' } });
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (importFiles.length === 0) return;

        setUploadProgress({ current: 0, total: importFiles.length });
        const results = [];

        for (let i = 0; i < importFiles.length; i++) {
            const file = importFiles[i];
            setUploadProgress({ current: i + 1, total: importFiles.length });
            setImportLog(`Processing ${i + 1}/${importFiles.length}: ${file.name}...`);

            const data = new FormData();
            data.append('file', file);

            try {
                const res = await api.post('/teachers/import', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                results.push(`✅ ${file.name}: ${res.data.message}`);
            } catch (err) {
                results.push(`❌ ${file.name}: ${err.response?.data?.message || err.message}`);
            }
        }

        setImportLog(results.join('\n'));
        fetchTeachers();
        setUploadProgress({ current: 0, total: 0 });
    };

    // Filter Logic
    // Filter Logic
    const filteredTeachers = teachers.filter(t => {
        if (user.role !== 'admin' && t.department !== user.department) return false;
        return t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.department.toLowerCase().includes(search.toLowerCase());
    });

    // Stats
    const stats = {
        total: filteredTeachers.length,
        active: filteredTeachers.filter(t => t.is_active === 1 || t.status === 'active').length,
        hods: filteredTeachers.filter(t => t.is_acting_hod || t.is_hod).length,
        depts: [...new Set(filteredTeachers.map(t => t.department))].length
    };

    const exportCSV = async () => {
        try {
            const res = await api.get('/teachers/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `teachers_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            toast.error('Export failed');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Stats Overview */}
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Faculty</p>
                        <h3 className="text-2xl font-black text-white">{stats.total}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <Users size={24} weight="duotone" />
                    </div>
                </div>
                <div className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Active</p>
                        <h3 className="text-2xl font-black text-white">{stats.active}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                        <UserCheck size={24} weight="duotone" />
                    </div>
                </div>
                <div className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">HODs</p>
                        <h3 className="text-2xl font-black text-white">{stats.hods}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:scale-110 transition-transform">
                        <Crown size={24} weight="duotone" />
                    </div>
                </div>
                <div className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Departments</p>
                        <h3 className="text-2xl font-black text-white">{stats.depts}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                        <Buildings size={24} weight="duotone" />
                    </div>
                </div>
            </div>

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <IdentificationBadge className="text-blue-400" weight="duotone" />
                        Faculty Directory
                    </h1>
                    <p className="text-slate-400 mt-2">Manage academic staff access & roles.</p>
                </div>

                <div className="flex gap-3">
                    {(user.role === 'admin' || user.is_hod === 1) && (
                        <button
                            onClick={() => setShowImport(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/20 hover:from-emerald-500/20 hover:to-teal-500/30 text-emerald-400 rounded-xl font-bold border border-emerald-500/20 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-95"
                        >
                            <UploadSimple size={20} weight="bold" />
                            <span className="hidden md:inline">Upload Bulk</span>
                        </button>
                    )}
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-amber-500/10 to-orange-500/20 hover:from-amber-500/20 hover:to-orange-500/30 text-amber-400 rounded-xl font-bold border border-amber-500/20 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/20 active:scale-95"
                    >
                        <DownloadSimple size={20} weight="bold" />
                        <span className="hidden md:inline">Export Record</span>
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all border border-blue-500/20 hover:scale-105 active:scale-95"
                    >
                        <UserPlus size={20} weight="bold" />
                        Add Faculty
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0f172a]/40 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
                {/* Search */}
                <div className="relative group max-w-md w-full">
                    <div className="absolute -inset-0.5 bg-indigo-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <div className="relative flex items-center bg-[#0B1221] rounded-xl border border-white/10 overflow-hidden">
                        <div className="pl-4 text-slate-400">
                            <MagnifyingGlass size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search faculty..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none text-white focus:ring-0 placeholder-slate-500 py-3 px-3 text-sm outline-none"
                        />
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex bg-[#0B1221] p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <GridFour size={20} weight="bold" />
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ListBullets size={20} weight="bold" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode='wait'>
                {loading ? (
                    <div className="text-center py-20 text-slate-500 animate-pulse">Loading directory...</div>
                ) : viewMode === 'grid' ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredTeachers.map((teacher, idx) => (
                            <FacultyCard
                                key={teacher.id}
                                teacher={teacher}
                                onEdit={() => handleOpenEdit(teacher)}
                                onDelete={() => handleDelete(teacher.id)}
                                idx={idx}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="table"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="glass rounded-3xl overflow-hidden border border-white/5"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#0f172a]/50 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Member</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role & Post</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredTeachers.map((teacher, idx) => (
                                        <FacultyRow
                                            key={teacher.id}
                                            teacher={teacher}
                                            onEdit={() => handleOpenEdit(teacher)}
                                            onDelete={() => handleDelete(teacher.id)}
                                            idx={idx}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!loading && filteredTeachers.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-slate-500" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">No Faculty Found</h3>
                    <p className="text-slate-400">Try adjusting your search criteria.</p>
                </div>
            )}

            {/* Modal Portals */}
            {createPortal(
                <AnimatePresence>
                    {showModal && (
                        <ModalBackdrop onClose={() => setShowModal(false)}>
                            <FacultyForm
                                isEditMode={isEditMode}
                                formData={formData}
                                setFormData={setFormData}
                                onSubmit={handleSave}
                                onClose={() => setShowModal(false)}
                                user={user}
                                safeDepartments={safeDepartments}
                                safeDesignations={safeDesignations}
                                deptLoading={deptLoading}
                                desigLoading={desigLoading}
                            />
                        </ModalBackdrop>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {createPortal(
                <AnimatePresence>
                    {showImport && (
                        <ModalBackdrop onClose={() => setShowImport(false)}>
                            <ImportForm
                                importFiles={importFiles}
                                setImportFiles={setImportFiles}
                                importLog={importLog}
                                setImportLog={setImportLog}
                                uploadProgress={uploadProgress}
                                onSubmit={handleImport}
                                onClose={() => { setShowImport(false); setImportLog(''); setImportFiles([]); }}
                            />
                        </ModalBackdrop>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

// Sub-Components
const FacultyCard = ({ teacher, onEdit, onDelete, idx }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="glass p-6 rounded-3xl relative group hover:border-blue-500/30 transition-all card-tilt border border-white/5 bg-[#0f172a]/40"
    >
        {/* Badges */}
        <div className="absolute top-4 right-4 flex gap-2">
            {teacher.is_acting_hod === 1 && (
                <div className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse">
                    Acting HOD
                </div>
            )}
            {teacher.is_hod === 1 && (
                <div className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-amber-500/20 text-amber-300 border-amber-500/30">
                    HOD
                </div>
            )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4 mb-5 mt-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${teacher.is_hod ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20'
                : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-blue-500/20'
                }`}>
                {teacher.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors truncate">
                    {teacher.name}
                </h3>
                <div className="text-xs text-slate-400 font-medium truncate">{teacher.email}</div>
            </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#0B1221] rounded-xl p-2.5 border border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Department</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ChalkboardTeacher size={14} className="text-indigo-400" />
                    {teacher.department}
                </div>
            </div>
            <div className="bg-[#0B1221] rounded-xl p-2.5 border border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Role</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-purple-400" />
                    <span className="truncate">{teacher.post}</span>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/5 flex gap-2">
            <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-white/5 py-2 text-xs font-bold"
            >
                <PencilSimple size={14} />
                Edit Profile
            </button>
            <button
                onClick={onDelete}
                className="w-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-white/5 group/del"
            >
                <Trash size={14} className="group-hover/del:fill-rose-400 transition-colors" />
            </button>
        </div>
    </motion.div>
);

const FacultyRow = ({ teacher, onEdit, onDelete, idx }) => (
    <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: idx * 0.02 }}
        className="group hover:bg-white/[0.02] transition-colors"
    >
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${teacher.is_hod ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                    : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
                    }`}>
                    {teacher.name.charAt(0)}
                </div>
                <div>
                    <div className="font-bold text-white text-sm">{teacher.name}</div>
                    <div className="text-xs text-slate-500">{teacher.email}</div>
                </div>
            </div>
        </td>
        <td className="px-6 py-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {teacher.department}
            </span>
        </td>
        <td className="px-6 py-4">
            <div className="flex flex-col items-start gap-1">
                <div className="text-sm text-slate-300">{teacher.post}</div>
                {(teacher.is_hod === 1 || teacher.is_acting_hod === 1) && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        <Crown size={12} weight="fill" />
                        {teacher.is_hod ? 'Head of Dept' : 'Acting HOD'}
                    </div>
                )}
            </div>
        </td>
        <td className="px-6 py-4">
            <div className="text-xs text-slate-400">
                {teacher.contact_number ? (
                    <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-emerald-400" />
                        {teacher.contact_number}
                    </div>
                ) : <span className="text-slate-600">-</span>}
            </div>
        </td>
        <td className="px-6 py-4">
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${teacher.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                <span className={`text-xs font-medium ${teacher.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {teacher.status === 'active' ? 'Active' : 'Inactive'}
                </span>
            </div>
        </td>
        <td className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={onEdit}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/30 transition-all"
                    title="Edit"
                >
                    <PencilSimple size={16} weight="bold" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 transition-all"
                    title="Delete"
                >
                    <Trash size={16} weight="bold" />
                </button>
            </div>
        </td>
    </motion.tr>
);

const ModalBackdrop = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0" onClick={onClose} />
        {children}
    </div>
);

const FacultyForm = ({ isEditMode, formData, setFormData, onSubmit, onClose, user, safeDepartments, safeDesignations, deptLoading, desigLoading }) => (
    <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#0f172a] border border-white/10 rounded-3xl w-[95%] md:w-full max-w-lg overflow-hidden shadow-2xl relative z-10"
    >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#131c31]">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    {isEditMode ? <Pencil className="text-amber-400" /> : <UserPlus className="text-blue-400" />}
                    {isEditMode ? 'Edit Profile' : 'New Faculty'}
                </h2>
                <p className="text-slate-400 text-xs mt-1">Enter staff details below.</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">&times;</button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2 group">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Full Name</label>
                    <input required type="text" className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Alan Turing" />
                </div>

                <div className="col-span-2 group">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Email Address</label>
                    <input required type="email" className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="university@edu.com" />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Department</label>
                    <CustomSelect
                        disabled={user.role !== 'admin' || deptLoading}
                        options={safeDepartments.map(d => ({ value: d.name, label: d.name }))}
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Role</label>
                    <CustomSelect
                        disabled={desigLoading}
                        options={safeDesignations.map(d => ({ value: d.name, label: d.name }))}
                        value={formData.post}
                        onChange={e => setFormData({ ...formData, post: e.target.value })}
                    />
                </div>

                <div className="col-span-2 pt-3 border-t border-white/5">
                    <label className="block text-[10px] font-bold text-amber-500/80 uppercase mb-1 ml-1 flex items-center gap-1">
                        <Key size={12} /> {isEditMode ? 'Reset Password (Optional)' : 'Initial Password'}
                    </label>
                    <input type="password" className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-600"
                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder={isEditMode ? "Leave empty to keep current" : "Leave empty to use User ID"} />
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all text-sm">Cancel</button>
                <button type="submit" className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold shadow-lg transition-all text-sm ${isEditMode ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}>
                    {isEditMode ? 'Update Profile' : 'Create Account'}
                </button>
            </div>
        </form>
    </motion.div >
);

const ImportForm = ({ importFiles, setImportFiles, importLog, setImportLog, uploadProgress, onSubmit, onClose }) => (
    <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0f172a] border border-white/10 rounded-3xl w-[95%] md:w-full max-w-md p-6 shadow-2xl relative z-10"
    >
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <UploadSimple className="text-emerald-400" size={20} weight="duotone" />
            Import Faculty
        </h2>
        <p className="text-xs text-slate-400 mb-4 font-medium">
            Upload Excel sheet to bulk add faculty.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-500/30 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all cursor-pointer group">
                <div className="flex flex-col items-center justify-center pt-4 pb-5">
                    <UploadSimple className="w-8 h-8 mb-2 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <p className="mb-1 text-xs text-slate-300"><span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop</p>
                    <p className="text-[10px] text-slate-500">.XLSX files only</p>
                </div>
                <input
                    type="file"
                    required
                    accept=".xlsx"
                    multiple
                    onChange={e => setImportFiles(Array.from(e.target.files))}
                    className="hidden"
                />
            </label>

            {importFiles.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-blue-300">📎 {importFiles.length} file(s) selected</span>
                        {uploadProgress.total > 0 && (
                            <span className="text-blue-400 font-mono">{uploadProgress.current}/{uploadProgress.total}</span>
                        )}
                    </div>
                    <div className="text-[10px] text-blue-400/70 space-y-0.5">
                        {importFiles.slice(0, 3).map((file, idx) => (
                            <div key={idx}>• {file.name}</div>
                        ))}
                        {importFiles.length > 3 && <div>• ... and {importFiles.length - 3} more</div>}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-900 p-3 rounded-lg border border-white/5">
                <span>Required: Name, Email, Dept, Post</span>
                <a href="/api/teachers/template" target="_blank" className="text-blue-400 hover:underline">Download Template</a>
            </div>

            {importLog && (
                <div className={`p-4 rounded-xl text-xs font-mono max-h-48 overflow-y-auto ${importLog.includes('❌') ? 'bg-slate-900 border border-white/10' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                    {importLog.split('\n').map((line, idx) => (
                        <div key={idx} className={line.startsWith('❌') ? 'text-rose-300' : line.startsWith('✅') ? 'text-emerald-300' : 'text-blue-300'}>
                            {line}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium">Close</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">
                    <UploadSimple size={16} weight="bold" /> Upload
                </button>
            </div>
        </form>
    </motion.div>
);

export default FacultyDirectory;
