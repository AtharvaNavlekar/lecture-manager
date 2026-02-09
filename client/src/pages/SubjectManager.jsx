import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useAcademicYears, useDepartments } from '../hooks/useConfig';
import {
    Books,
    Plus,
    Trash,
    CaretRight,
    ListBullets,
    CheckCircle,
    BookmarkSimple,
    Clock,
    Hash,
    UploadSimple,
    FileXls,
    MagnifyingGlass,
    DownloadSimple,
    Funnel,
    ChalkboardTeacher,
    Buildings
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../components/ui/CustomSelect';

const SubjectManager = () => {
    const { user } = useContext(AuthContext);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(null); // For Drilling Down
    const [syllabus, setSyllabus] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [newSubject, setNewSubject] = useState({ name: '', code: '', class_year: 'SY' });

    // Dynamic config
    const { data: academicYears } = useAcademicYears();
    const { data: departments } = useDepartments();

    // Import State
    const [showImport, setShowImport] = useState(false);
    const [importFile, setImportFile] = useState([]);
    const [importLog, setImportLog] = useState('');

    // Modal State
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [newTopic, setNewTopic] = useState({ unit_number: 1, title: '', estimated_hours: 10 });

    // Unit Import State
    const [showUnitImport, setShowUnitImport] = useState(false);
    const [unitImportFile, setUnitImportFile] = useState([]);
    const [unitImportLog, setUnitImportLog] = useState('');

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');

    // Filter Logic
    const filteredSubjects = subjects.filter(subject => {
        const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = classFilter === 'All' || subject.class_year === classFilter;
        const matchesDept = deptFilter === 'All' || subject.department === deptFilter;
        return matchesSearch && matchesClass && matchesDept;
    });

    const handleExport = () => {
        const headers = ['Name,Code,Class,Department'];
        const csvContent = filteredSubjects.map(s =>
            `${s.name},${s.code},${s.class_year},${s.department}`
        ).join('\n');

        const blob = new Blob([headers + '\n' + csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subjects_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleUnitImport = async (e) => {
        e.preventDefault();
        if (!unitImportFile || unitImportFile.length === 0) return;

        try {
            setUnitImportLog(`Processing ${unitImportFile.length} file(s)...`);
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < unitImportFile.length; i++) {
                const data = new FormData();
                data.append('file', unitImportFile[i]);

                try {
                    setUnitImportLog(`Processing file ${i + 1}/${unitImportFile.length}: ${unitImportFile[i].name}`);
                    const res = await api.post('/subjects/topics/import', data, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    successCount++;
                } catch (err) {
                    errorCount++;
                    logger.error(`Error in ${unitImportFile[i].name}:`, err);
                }
            }

            setUnitImportLog(`Completed! ✅ ${successCount} successful, ❌ ${errorCount} failed`);
            if (selectedSubject) fetchSyllabus(selectedSubject.id);
        } catch (err) {
            setUnitImportLog('Error: ' + (err.response?.data?.message || err.message));
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) fetchSyllabus(selectedSubject.id);
    }, [selectedSubject]);

    useEffect(() => {
        if (selectedSubject && syllabus.length > 0) {
            setNewTopic(prev => ({ ...prev, unit_number: syllabus.length + 1 }));
        }
    }, [syllabus, selectedSubject]);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            if (res.data.success) setSubjects(res.data.subjects);
        } catch (e) {
            logger.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSyllabus = async (subjectId) => {
        try {
            const res = await api.get(`/subjects/${subjectId}/topics`);
            if (res.data.success) setSyllabus(res.data.topics);
        } catch (e) {
            logger.error(e);
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/subjects', { ...newSubject, department: user.department });
            if (res.data.success) {
                fetchSubjects();
                setShowSubjectModal(false);
                setNewSubject({ name: '', code: '', class_year: 'SY' });
                toast.success('Subject added successfully');
            }
        } catch (err) {
            toast.error('Failed to add subject');
        }
    };

    const handleAddTopic = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/subjects/topics', { ...newTopic, subject_id: selectedSubject.id });
            if (res.data.success) {
                setShowTopicModal(false);
                fetchSyllabus(selectedSubject.id);
                setNewTopic({ unit_number: syllabus.length + 2, title: '', estimated_hours: 10 });
            }
        } catch (err) {
            toast.error('Failed to add topic');
        }
    };

    const confirmDeleteSubject = async (id) => {
        try {
            await api.delete(`/subjects/${id}`);
            fetchSubjects();
            setSelectedSubject(null); // Clear selected subject if it was the one deleted
            toast.success('Subject deleted successfully');
        } catch (err) {
            toast.error('Failed to delete subject');
        }
    };

    const handleDeleteSubject = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500/20 rounded-full text-rose-500">
                        <Trash size={20} weight="bold" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Delete Subject?</h4>
                        <p className="text-sm text-slate-400 mt-1">This will delete the entire syllabus. Undoing is not possible.</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white">Dismiss</button>
                    <button onClick={() => { toast.dismiss(t.id); confirmDeleteSubject(id); }} className="px-4 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold">Delete</button>
                </div>
            </div>
        ), { duration: 5000, style: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' } });
    };

    const handleDeleteTopic = async (id) => {
        try {
            await api.post('/subjects/topics/delete', { id });
            setSyllabus(prev => prev.filter(t => t.id !== id));
        } catch (err) { toast.error('Failed to delete topic'); }
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
                    const res = await api.post('/subjects/import', data, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    successCount++;
                } catch (err) {
                    errorCount++;
                    logger.error(`Error in ${importFile[i].name}:`, err);
                }
            }

            setImportLog(`Completed! ✅ ${successCount} successful, ❌ ${errorCount} failed`);
            fetchSubjects();
        } catch (err) {
            setImportLog('Error: ' + (err.response?.data?.message || err.message));
        }
    };

    const stats = {
        total: subjects.length,
        classes: [...new Set(subjects.map(s => s.class_year))].length,
        depts: [...new Set(subjects.map(s => s.department))].length
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-4 h-[calc(100vh-80px)] flex flex-col">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 shrink-0">
                <div className="glass p-3 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Subjects</p>
                        <h3 className="text-xl font-black text-white">{stats.total}</h3>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <Books size={22} weight="duotone" />
                    </div>
                </div>
                <div className="glass p-3 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Classes</p>
                        <h3 className="text-xl font-black text-white">{stats.classes}</h3>
                    </div>
                    <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:scale-110 transition-transform">
                        <ChalkboardTeacher size={22} weight="duotone" />
                    </div>
                </div>
                <div className="glass p-3 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Departments</p>
                        <h3 className="text-xl font-black text-white">{stats.depts}</h3>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                        <Buildings size={22} weight="duotone" />
                    </div>
                </div>
            </div>

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 px-1">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Books className="text-emerald-400" weight="duotone" />
                        Subject Directory
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Manage curriculum & syllabus definitions.</p>
                </div>

                {(user.role === 'admin' || user.is_hod === 1) && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowImport(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-emerald-500/10 to-teal-500/20 hover:from-emerald-500/20 hover:to-teal-500/30 text-emerald-400 rounded-xl font-bold border border-emerald-500/20 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-95 text-sm"
                        >
                            <UploadSimple size={18} weight="bold" />
                            <span className="hidden md:inline">Upload Bulk</span>
                        </button>
                        <button
                            onClick={() => setShowUnitImport(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-indigo-500/10 to-violet-500/20 hover:from-indigo-500/20 hover:to-violet-500/30 text-indigo-400 rounded-xl font-bold border border-indigo-500/20 transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/20 active:scale-95 text-sm"
                        >
                            <ListBullets size={18} weight="bold" />
                            <span className="hidden md:inline">Bulk Units</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-amber-500/10 to-orange-500/20 hover:from-amber-500/20 hover:to-orange-500/30 text-amber-400 rounded-xl font-bold border border-amber-500/20 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/20 active:scale-95 text-sm"
                        >
                            <DownloadSimple size={18} weight="bold" />
                            <span className="hidden md:inline">Export Record</span>
                        </button>
                        <button
                            onClick={() => setShowSubjectModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all border border-blue-500/20 hover:scale-105 active:scale-95 text-sm"
                        >
                            <Plus size={18} weight="bold" />
                            Add Subject
                        </button>
                    </div>
                )}
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[#0f172a]/40 backdrop-blur-xl p-3 rounded-2xl border border-white/5 relative z-20 shrink-0">
                <div className="relative group w-full md:flex-1 max-w-md">
                    <div className="absolute -inset-0.5 bg-emerald-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <div className="relative flex items-center bg-[#0B1221] rounded-xl border border-white/10 overflow-hidden">
                        <div className="pl-3 text-slate-400">
                            <MagnifyingGlass size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none text-white focus:ring-0 placeholder-slate-500 py-2.5 px-3 text-sm outline-none"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 w-full md:w-auto">
                    {/* Dept Filter */}
                    <div className="relative w-full md:w-48 z-[50]">
                        <CustomSelect
                            options={[{ value: 'All', label: 'All Depts' }, ...(departments || []).map(d => ({ value: d.name, label: d.name }))]}
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="h-full bg-[#0B1221] border-white/10 py-0"
                        />
                    </div>
                    {/* Class Filter */}
                    <div className="relative w-full md:w-40 z-[50]">
                        <CustomSelect
                            options={[{ value: 'All', label: 'All Classes' }, ...(academicYears || []).map(y => ({ value: y.code, label: y.name }))]}
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="h-full bg-[#0B1221] border-white/10 py-0"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
                {/* LEFT: Subject List */}
                <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-4">


                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {loading ? <div className="text-center p-10 text-slate-500 animate-pulse">Loading subjects...</div> : filteredSubjects.map(s => (
                            <motion.div
                                key={s.id}
                                onClick={() => setSelectedSubject(s)}
                                whileHover={{ x: 4 }}
                                className={`p-5 rounded-2xl cursor-pointer border transition-all relative overflow-hidden group ${selectedSubject?.id === s.id ? 'bg-gradient-to-r from-emerald-900/40 to-slate-900/60 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'glass border-white/5 hover:border-emerald-500/30'}`}
                            >
                                {selectedSubject?.id === s.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}

                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className={`font-bold text-lg ${selectedSubject?.id === s.id ? 'text-emerald-300' : 'text-white group-hover:text-emerald-200'} transition-colors`}>{s.name}</h4>
                                        <div className="flex gap-2 text-[10px] mt-2 font-bold uppercase tracking-wider">
                                            <span className={`px-2 py-1 rounded-lg ${selectedSubject?.id === s.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>{s.code}</span>
                                            <span className={`px-2 py-1 rounded-lg ${selectedSubject?.id === s.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>{s.class_year}</span>
                                        </div>
                                    </div>
                                    {selectedSubject?.id === s.id && <CaretRight className="text-emerald-400" weight="bold" />}
                                </div>
                            </motion.div>
                        ))}
                        {filteredSubjects.length === 0 && !loading && (
                            <div className="text-slate-500 text-center p-10 border-2 border-dashed border-white/5 rounded-2xl">
                                <MagnifyingGlass size={32} className="mx-auto mb-2 opacity-50" />
                                No subjects found matching filters.<br /><span className="text-xs">Try adjusting your search.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Syllabus Details */}
                <div className="flex-1 glass rounded-3xl flex flex-col overflow-hidden relative border border-white/5 shadow-2xl">
                    {!selectedSubject ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-10 relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                            <BookmarkSimple size={64} className="opacity-20 mb-6 text-emerald-500" weight="duotone" />
                            <p className="text-lg font-medium text-slate-400">No Subject Selected</p>
                            <p className="text-sm text-slate-500 mt-2">Select a subject from the left to view its syllabus.</p>
                        </div>
                    ) : (
                        <>
                            {/* Syllabus Header */}
                            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        {selectedSubject.name}
                                        <span className="text-emerald-400 text-xs font-mono border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-lg">{selectedSubject.code}</span>
                                    </h2>
                                    <p className="text-slate-400 text-xs mt-1 flex items-center gap-2">
                                        <ListBullets size={14} /> Syllabus & Curriculum Plan
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {(user.role === 'admin' || user.is_hod === 1) && (
                                        <>
                                            <button onClick={() => handleDeleteSubject(selectedSubject.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-rose-500/10 rounded-lg transition-colors border border-white/5" title="Delete Subject"><Trash size={18} /></button>
                                            <button onClick={() => setShowTopicModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-900/20 card-tilt text-sm">
                                                <Plus weight="bold" size={16} /> Add Unit
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Timeline / List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar relative">
                                {syllabus.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                                        <ListBullets size={48} className="mx-auto text-slate-700 mb-4" weight="thin" />
                                        <p className="text-slate-400 text-lg">Syllabus is empty.</p>
                                        <p className="text-slate-600 text-sm mt-2">Start adding units to define the curriculum.</p>
                                    </div>
                                ) : syllabus.map((topic, idx) => (
                                    <div key={topic.id} className="flex gap-6 group relative">
                                        {/* Timeline Line */}
                                        {idx !== syllabus.length - 1 && (
                                            <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/20 to-transparent group-hover:from-emerald-500/40 transition-colors"></div>
                                        )}

                                        <div className="flex flex-col items-center pt-1 z-10">
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.1)] group-hover:scale-110 transition-transform">
                                                {topic.unit_number}
                                            </div>
                                        </div>

                                        <div className="flex-1 pb-6">
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="glass p-5 rounded-2xl flex justify-between items-start group-hover:border-emerald-500/20 group-hover:bg-slate-800/60 transition-all"
                                            >
                                                <div>
                                                    <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                                        {topic.title}
                                                    </h4>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-xs text-slate-400 uppercase tracking-wide font-bold flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                                            <Clock size={14} className="text-amber-400" /> {topic.estimated_hours} Hours
                                                        </span>
                                                        {topic.covered_topics && (
                                                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                                                <CheckCircle weight="fill" /> Covered
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {(user.role === 'admin' || user.is_hod === 1) && (
                                                    <button onClick={() => handleDeleteTopic(topic.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                                                        <Trash size={18} />
                                                    </button>
                                                )}
                                            </motion.div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modals Portal */}
            {createPortal(
                <>
                    <AnimatePresence>
                        {showSubjectModal && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                                    <h3 className="text-white font-bold text-xl mb-4 relative z-10 flex items-center gap-2">
                                        <Books className="text-indigo-400" weight="duotone" size={24} /> New Subject
                                    </h3>
                                    <form onSubmit={handleAddSubject} className="space-y-4 relative z-10">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Subject Name</label>
                                            <input required placeholder="e.g. Advanced Databases" value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                                                className="w-full bg-slate-900 border border-white/10 p-2.5 rounded-lg text-sm text-white outline-none focus:border-indigo-500 transition-colors" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Subject Code</label>
                                                <input required placeholder="e.g. CS-401" value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value })}
                                                    className="w-full bg-slate-900 border border-white/10 p-2.5 rounded-lg text-sm text-white outline-none focus:border-indigo-500 transition-colors font-mono uppercase" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Class Year</label>
                                                <CustomSelect
                                                    disabled={yearsLoading}
                                                    options={academicYears.length > 0
                                                        ? academicYears.map(y => ({ value: y.code, label: y.name }))
                                                        : [
                                                            { value: "FY", label: "First Year" },
                                                            { value: "SY", label: "Second Year" },
                                                            { value: "TY", label: "Third Year" }
                                                        ]
                                                    }
                                                    value={newSubject.class_year}
                                                    onChange={e => setNewSubject({ ...newSubject, class_year: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2">
                                            <button type="button" onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-white font-bold px-4 py-2 text-sm">Cancel</button>
                                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl text-white font-bold text-sm shadow-lg shadow-indigo-900/20 transition-all">Create Subject</button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                        {showTopicModal && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                                    <h3 className="text-white font-bold text-xl mb-4 relative z-10 flex items-center gap-2">
                                        <ListBullets className="text-emerald-400" weight="duotone" size={24} /> Add Unit
                                    </h3>

                                    <form onSubmit={handleAddTopic} className="space-y-4 relative z-10">
                                        <div className="flex gap-4">
                                            <div className="w-1/3">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Unit #</label>
                                                <div className="relative">
                                                    <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                                                    <input type="number" value={newTopic.unit_number} onChange={e => setNewTopic({ ...newTopic, unit_number: e.target.value })}
                                                        className="w-full bg-slate-900 border border-white/10 p-2.5 pl-7 rounded-lg text-sm text-white outline-none focus:border-emerald-500 font-mono" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Est. Hours</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                                                    <input type="number" value={newTopic.estimated_hours} onChange={e => setNewTopic({ ...newTopic, estimated_hours: e.target.value })}
                                                        className="w-full bg-slate-900 border border-white/10 p-2.5 pl-7 rounded-lg text-sm text-white outline-none focus:border-emerald-500 font-mono" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Topic Title</label>
                                            <input required placeholder="e.g. Introduction to Graphs" value={newTopic.title} onChange={e => setNewTopic({ ...newTopic, title: e.target.value })}
                                                className="w-full bg-slate-900 border border-white/10 p-2.5 rounded-lg text-sm text-white outline-none focus:border-emerald-500 placeholder:text-slate-600" />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button type="button" onClick={() => setShowTopicModal(false)} className="text-slate-400 hover:text-white font-bold px-4 py-2 text-sm">Cancel</button>
                                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-xl text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all">Add Topic</button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </>,
                document.body
            )}

            {/* Import Modal Portal */}
            {createPortal(
                <AnimatePresence>
                    {showImport && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                            <div className="absolute inset-0" onClick={() => setShowImport(false)} />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10"
                            >
                                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <UploadSimple className="text-emerald-400" size={20} weight="duotone" />
                                    Import Subjects
                                </h2>
                                <p className="text-xs text-slate-400 mb-4 font-medium">
                                    Upload Excel sheet to bulk add subjects.
                                </p>

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
                                        <span>Required: Name, Code, Dept, Year</span>
                                        <a href="/api/subjects/template" target="_blank" className="text-blue-400 hover:underline">Download Template</a>
                                    </div>

                                    {importLog && (
                                        <div className={`p-4 rounded-xl text-xs font-mono font-bold ${importLog.startsWith('Error') ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                                            {importLog}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => { setShowImport(false); setImportLog(''); }} className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium">Close</button>
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

            {/* Bulk Unit Import Modal Portal */}
            {createPortal(
                <AnimatePresence>
                    {showUnitImport && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                            <div className="absolute inset-0" onClick={() => setShowUnitImport(false)} />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10"
                            >
                                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <ListBullets className="text-indigo-400" size={20} weight="duotone" />
                                    Import Syllabus Units
                                </h2>
                                <p className="text-xs text-slate-400 mb-4 font-medium">
                                    Bulk upload topics/units for multiple subjects.
                                </p>

                                <form onSubmit={handleUnitImport} className="space-y-4">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-500/30 rounded-2xl bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all cursor-pointer group">
                                        <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                            <UploadSimple className="w-8 h-8 mb-2 text-indigo-500 group-hover:scale-110 transition-transform" />
                                            <p className="mb-1 text-xs text-slate-300"><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</p>
                                            <p className="text-[10px] text-slate-500">{unitImportFile.length > 0 ? `${unitImportFile.length} file(s) selected` : '.XLSX files only (multiple allowed)'}</p>
                                        </div>
                                        <input type="file" multiple accept=".xlsx" onChange={e => setUnitImportFile(Array.from(e.target.files))} className="hidden" />
                                    </label>

                                    <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-900 p-3 rounded-lg border border-white/5">
                                        <div className="flex flex-col">
                                            <span>Required Cols: Subject Code, Unit #</span>
                                            <span>Topic Title, Est. Hours</span>
                                        </div>
                                    </div>

                                    {unitImportLog && (
                                        <div className={`p-4 rounded-xl text-xs font-mono font-bold ${unitImportLog.startsWith('Error') ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'}`}>
                                            {unitImportLog}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => { setShowUnitImport(false); setUnitImportLog(''); }} className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium">Close</button>
                                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all">
                                            <UploadSimple size={16} weight="bold" /> Upload Units
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

export default SubjectManager;
