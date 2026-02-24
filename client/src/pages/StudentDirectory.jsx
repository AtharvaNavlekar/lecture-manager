import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useDepartments, useAcademicYears } from '../hooks/useConfig';
import { getYearColors } from '../utils/yearColors';
import {
    Student,
    Funnel,
    MagnifyingGlass,
    Trash,
    Pencil,
    DownloadSimple,
    UserPlus,
    UploadSimple,
    CheckCircle,
    CaretDown,
    Users,
    UserCheck,
    ChalkboardTeacher,
    Buildings
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../components/ui/CustomSelect';

const StudentDirectory = () => {
    const { user } = useContext(AuthContext);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('All');
    const [showClassDropdown, setShowClassDropdown] = useState(false);

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [importFile, setImportFile] = useState([]);
    const [importLog, setImportLog] = useState('');

    const [isEditMode, setIsEditMode] = useState(false);

    // Dynamic config
    const { data: departments, loading: deptLoading } = useDepartments();
    const { data: academicYears, loading: yearsLoading } = useAcademicYears();

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        email: '',
        roll_no: '',
        department: user.department || '',
        class_year: 'SY',
    });

    useEffect(() => {
        fetchStudents();
    }, [classFilter]);

    const fetchStudents = async () => {
        try {
            // Build query params
            const params = new URLSearchParams();
            if (classFilter && classFilter !== 'All') params.append('class_year', classFilter);
            // Request all students (high limit to avoid pagination)
            params.append('limit', '5000');

            const queryString = params.toString();
            const url = `/students?${queryString}`;

            const res = await api.get(url);
            if (res.data.success) {
                setStudents(res.data.students);
            }
        } catch (error) {
            logger.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({ name: '', email: '', roll_no: '', department: user.department || '', class_year: 'SY' });
        setShowModal(true);
    };

    const handleOpenEdit = (student) => {
        setIsEditMode(true);
        setFormData({
            id: student.id,
            name: student.name,
            email: student.email,
            roll_no: student.roll_no,
            department: student.department,
            class_year: student.class_year
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isEditMode ? `/students/${formData.id}` : '/students';
            const method = isEditMode ? 'put' : 'post';
            const res = await api[method](endpoint, formData);
            if (res.data.success) {
                toast.success(`Student ${isEditMode ? 'updated' : 'added'} successfully!`);
                setShowModal(false);
                fetchStudents();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const confirmDelete = async (id) => {
        try {
            await api.delete(`/students/${id}`);
            fetchStudents();
            toast.success('Student deleted successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
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
                        <h4 className="font-bold text-white">Delete Student?</h4>
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

    const handleImport = async (e) => {
        e.preventDefault();
        if (!importFile || importFile.length === 0) return;

        try {
            setImportLog(`Processing ${importFile.length} file(s)...`);
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < importFile.length; i++) {
                const data = new FormData();
                data.append('file', importFile[i]);

                try {
                    setImportLog(`Processing file ${i + 1}/${importFile.length}: ${importFile[i].name}`);
                    const res = await api.post('/students/import', data, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    successCount++;
                } catch (err) {
                    errorCount++;
                    logger.error(`Error in ${importFile[i].name}:`, err);
                }
            }

            setImportLog(`Completed! ✅ ${successCount} successful, ❌ ${errorCount} failed`);
            fetchStudents();
        } catch (err) {
            setImportLog('Error: ' + (err.response?.data?.message || err.message));
        }
    };

    const filteredStudents = students.filter(s => {
        if (classFilter && classFilter !== 'All' && s.class_year !== classFilter) return false;
        if (user.role !== 'admin' && s.department !== user.department) return false;

        return s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.roll_no?.toString().includes(search) ||
            s.email.toLowerCase().includes(search.toLowerCase());
    });

    const stats = {
        total: filteredStudents.length,
        active: filteredStudents.filter(s => s.status === 'active').length,
        classes: [...new Set(filteredStudents.map(s => s.class_year))].length,
        depts: [...new Set(filteredStudents.map(s => s.department))].length
    };

    const exportCSV = async () => {
        try {
            const params = (classFilter && classFilter !== 'All') ? `?class_year=${classFilter}` : '';
            const res = await api.get(`/students/export${params}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            toast.error('Export failed');
        }
    };

    // Build class filter options
    const classFilterOptions = ['All', 'FY', 'SY', 'TY'];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Stats */}
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Students</p>
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
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Classes</p>
                        <h3 className="text-2xl font-black text-white">{stats.classes}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:scale-110 transition-transform">
                        <ChalkboardTeacher size={24} weight="duotone" />
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

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Student className="text-blue-400" weight="duotone" />
                        Student Directory
                    </h1>
                    <p className="text-slate-400 mt-2">Manage student records & enrollment.</p>
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
                        Add Student
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0f172a]/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 relative z-20">
                <div className="relative group w-full md:flex-1 max-w-md">
                    <div className="absolute -inset-0.5 bg-indigo-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <div className="relative flex items-center bg-[#0B1221] rounded-xl border border-white/10 overflow-hidden">
                        <div className="pl-4 text-slate-400">
                            <MagnifyingGlass size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none text-white focus:ring-0 placeholder-slate-500 py-3 px-3 text-sm outline-none"
                        />
                    </div>
                </div>
                {/* Class Filter Dropdown */}
                <div className="relative w-full md:w-64 z-[50]">
                    <button
                        onClick={() => setShowClassDropdown(!showClassDropdown)}
                        onBlur={() => setTimeout(() => setShowClassDropdown(false), 200)}
                        className={`w-full bg-[#0B1221] border ${showClassDropdown ? 'border-indigo-500/50' : 'border-white/10'} rounded-2xl pl-4 pr-10 py-3 text-left text-white focus:outline-none hover:bg-white/5 transition-all relative group flex items-center gap-3`}
                    >
                        <Funnel className={`transition-colors ${showClassDropdown ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`} size={18} />
                        <span className={classFilter === 'All' ? 'text-slate-400 text-sm' : 'text-white text-sm font-medium'}>
                            {classFilter === 'All' ? 'Filter by Class' : classFilterOptions.find(o => o === classFilter)}
                        </span>
                        <CaretDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-300 ${showClassDropdown ? 'rotate-180' : ''}`} size={16} />
                    </button>

                    <AnimatePresence>
                        {showClassDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full mt-2 w-full bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl z-50 p-1.5"
                            >
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {classFilterOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => { setClassFilter(opt); setShowClassDropdown(false); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group mb-0.5 ${classFilter === opt
                                                ? 'bg-indigo-500/10 text-indigo-400'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            {opt === 'All' ? 'All Classes' : opt}
                                            {classFilter === opt && <CheckCircle weight="fill" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Student List */}
            <AnimatePresence mode='wait'>
                import Lottie from 'lottie-react';
                import loadingAnimation from '../assets/Sandy Loading.json';

                // ... (in component)

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        {/* Animated Rose-themed Spinner */}
                        <div className="relative w-32 h-32 mb-6">
                            {/* Outer spinning ring */}
                            <div className="absolute inset-0 border-4 border-rose-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-rose-500 rounded-full animate-spin"></div>

                            {/* Middle spinning ring */}
                            <div className="absolute inset-3 border-4 border-pink-500/20 rounded-full"></div>
                            <div className="absolute inset-3 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}></div>

                            {/* Inner pulsing circle */}
                            <div className="absolute inset-8 bg-gradient-to-br from-rose-500/30 to-pink-500/30 rounded-full animate-pulse"></div>

                            {/* Center glow */}
                            <div className="absolute inset-12 bg-rose-500/50 rounded-full blur-xl"></div>
                        </div>

                        <p className="text-rose-400 font-bold animate-pulse">Loading students...</p>
                        <p className="text-slate-500 text-sm mt-2">Please wait</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Student size={32} className="text-slate-500" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">No Students Found</h3>
                        <p className="text-slate-400">Try adjusting your filters or add new students.</p>
                    </div>
                ) : (
                    <div className="glass rounded-3xl overflow-hidden border border-white/5">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#0f172a]/50 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Roll No</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Class</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredStudents.map((student, idx) => (
                                        <motion.tr
                                            key={student.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="group hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-6 py-4 text-center">
                                                <div>
                                                    <div className="font-bold text-white text-sm">{student.name}</div>
                                                    <div className="text-xs text-slate-500">{student.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 text-sm text-center">{student.roll_no || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getYearColors(student.class_year).bg} ${getYearColors(student.class_year).text} ${getYearColors(student.class_year).border}`}>
                                                    {student.class_year}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 text-sm text-center">{student.department}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(student)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/30 transition-all"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} weight="bold" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(student.id)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash size={16} weight="bold" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Student Form Modal */}
            {createPortal(
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                            <div className="absolute inset-0" onClick={() => setShowModal(false)} />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10">
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#131c31]">
                                    <div>
                                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                            {isEditMode ? <Pencil className="text-amber-400" /> : <UserPlus className="text-blue-400" />}
                                            {isEditMode ? 'Edit Student' : 'New Student'}
                                        </h2>
                                        <p className="text-slate-400 text-xs mt-1">Enter student details below.</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">&times;</button>
                                </div>

                                <form onSubmit={handleSave} className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Full Name</label>
                                            <input required type="text" className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. John Doe" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase  mb-1 ml-1">Email Address</label>
                                            <input required type="email" className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="student@university.edu" />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Roll Number</label>
                                            <input type="text" className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                                                value={formData.roll_no} onChange={e => setFormData({ ...formData, roll_no: e.target.value })} placeholder="e.g. 2024001" />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Class Year</label>
                                            <CustomSelect
                                                options={[{ value: 'FY', label: 'FY' }, { value: 'SY', label: 'SY' }, { value: 'TY', label: 'TY' }]}
                                                value={formData.class_year}
                                                onChange={e => setFormData({ ...formData, class_year: e.target.value })}
                                                disabled={yearsLoading}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Department</label>
                                            <CustomSelect
                                                disabled={user.role !== 'admin' || deptLoading}
                                                options={departments.map(d => ({ value: d.name, label: d.name }))}
                                                value={formData.department}
                                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all text-sm">Cancel</button>
                                        <button type="submit" className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold shadow-lg transition-all text-sm ${isEditMode ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}>
                                            {isEditMode ? 'Update Student' : 'Add Student'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Import Modal */}
            {createPortal(
                <AnimatePresence>
                    {showImport && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                            <div className="absolute inset-0" onClick={() => setShowImport(false)} />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10">
                                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <UploadSimple className="text-emerald-400" size={20} weight="duotone" />
                                    Import Students
                                </h2>
                                <p className="text-xs text-slate-400 mb-4 font-medium">Upload Excel sheet to bulk add students.</p>

                                <form onSubmit={handleImport} className="space-y-4">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-500/30 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all cursor-pointer group">
                                        <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                            <UploadSimple className="w-8 h-8 mb-2 text-emerald-500 group-hover:scale-110 transition-transform" />
                                            <p className="mb-1 text-xs text-slate-300"><span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop</p>
                                            <p className="text-[10px] text-slate-500">{importFile.length > 0 ? `${importFile.length} file(s) selected` : '.XLSX files only (multiple allowed)'}</p>
                                        </div>
                                        <input type="file" multiple accept=".xlsx" onChange={e => setImportFile(Array.from(e.target.files))} className="hidden" />
                                    </label>

                                    <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-900 p-3 rounded-lg border border-white/5">
                                        <span>Required: Name, Email, Class, Dept</span>
                                        <a href="/api/students/template" target="_blank" className="text-blue-400 hover:underline">Download Template</a>
                                    </div>

                                    {importLog && (
                                        <div className={`p-4 rounded-xl text-xs font-mono font-bold ${importLog.startsWith('Error') ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                                            {importLog}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium">Close</button>
                                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">
                                            <UploadSimple size={16} weight="bold" /> Upload
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default StudentDirectory;
