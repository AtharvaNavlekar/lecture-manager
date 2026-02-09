import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import CustomDropdown from '../components/CustomDropdown';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Plus,
    Trash,
    Download,
    Lock,
    Globe,
    FileText,
    Video,
    Link as LinkIcon,
    X,
    DownloadSimple
} from '@phosphor-icons/react';

const ResourceLibrary = () => {
    const { user } = useContext(AuthContext);
    const [resources, setResources] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'notes',
        subject: '',
        class_year: '',
        is_public: 0,
        file_path: '',
        file_type: 'pdf'
    });

    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const res = await api.get('/resources');
            if (res.data.success) {
                setResources(res.data.resources);
            }
        } catch (err) {
            logger.error('Fetch resources error:', err);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const uploadFormData = new FormData();

        if (file) {
            uploadFormData.append('file', file);
        }

        // Append all formData fields
        Object.keys(formData).forEach(key => {
            uploadFormData.append(key, formData[key]);
        });

        try {
            const res = await api.post('/resources/upload', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                toast.success('Resource uploaded successfully!');
                setFile(null);
                setFormData({
                    title: '',
                    description: '',
                    category: 'notes',
                    subject: '',
                    class_year: '',
                    is_public: 0,
                    file_path: '',
                    file_type: 'pdf'
                });
                setShowCreateModal(false);
                fetchResources();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload resource');
            logger.error('Upload error:', error);
        }
    };

    const confirmDelete = async (id) => {
        try {
            await api.delete(`/resources/${id}`);
            fetchResources();
            toast.success('Resource deleted');
        } catch (error) {
            toast.error('Failed to delete resource');
            logger.error('Delete error:', error);
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
                        <h4 className="font-bold text-white">Delete Resource?</h4>
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

    const handleDownload = async (filename, title) => {
        try {
            const res = await api.get(`/resources/download/${filename}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(`Downloaded: ${title}`);
        } catch (error) {
            logger.error(error);
            toast.error('Failed to download resource');
        }
    };

    const filteredResources = filterCategory === 'all'
        ? resources
        : resources.filter(r => r.category === filterCategory);

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'notes': return <FileText weight="fill" />;
            case 'video': return <Video weight="fill" />;
            case 'link': return <LinkIcon weight="bold" />;
            default: return <BookOpen weight="fill" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BookOpen weight="fill" className="text-indigo-400" />
                        Resource Library
                    </h1>
                    <p className="text-slate-400 mt-2">Teaching materials and resources</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
                >
                    <Plus weight="bold" size={20} />
                    Upload Resource
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                {['all', 'notes', 'video', 'assignment', 'link', 'other'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px - 4 py - 2 rounded - xl font - bold text - sm capitalize transition - all ${filterCategory === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            } `}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {filteredResources.length === 0 ? (
                    <div className="col-span-full glass p-20 rounded-3xl border border-white/5 text-center">
                        <BookOpen size={64} className="mx-auto mb-4 opacity-20 text-slate-500" />
                        <p className="text-slate-500">No resources found</p>
                    </div>
                ) : (
                    filteredResources.map((resource) => (
                        <motion.div
                            key={resource.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass p-4 md:p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
                                    {getCategoryIcon(resource.category)}
                                </div>
                                <div className="flex items-center gap-2">
                                    {resource.is_public ? (
                                        <Globe size={16} className="text-emerald-400" title="Public" />
                                    ) : (
                                        <Lock size={16} className="text-amber-400" title="Private" />
                                    )}
                                    {resource.teacher_id === user.id && (
                                        <button
                                            onClick={() => handleDelete(resource.id)}
                                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash weight="bold" size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <h3 className="font-bold text-white mb-2 line-clamp-2">{resource.title}</h3>

                            {resource.description && (
                                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{resource.description}</p>
                            )}

                            <div className="flex flex-wrap gap-2 mb-4">
                                {resource.subject && (
                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-xs border border-indigo-500/20">
                                        {resource.subject}
                                    </span>
                                )}
                                {resource.class_year && (
                                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs border border-purple-500/20">
                                        {resource.class_year}
                                    </span>
                                )}
                                <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs capitalize">
                                    {resource.category}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                <div className="text-xs text-slate-500">
                                    By {resource.teacher_name}
                                </div>
                                <button
                                    onClick={() => handleDownload(resource.id, resource.title)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                                >
                                    <Download weight="bold" size={14} />
                                    {resource.downloads || 0}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass p-4 md:p-4 md:p-6 lg:p-8 rounded-3xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Upload Resource</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                                >
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 resize-none"
                                        rows="3"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <div>
                                            <CustomDropdown
                                                label="Category"
                                                value={formData.category}
                                                onChange={(val) => setFormData({ ...formData, category: val })}
                                                options={[
                                                    { value: 'notes', label: 'Notes' },
                                                    { value: 'video', label: 'Video' },
                                                    { value: 'assignment', label: 'Assignment' },
                                                    { value: 'link', label: 'Link' },
                                                    { value: 'other', label: 'Other' }
                                                ]}
                                            />
                                        </div>
                                        <div>
                                            <CustomDropdown
                                                label="File Type"
                                                value={formData.file_type}
                                                onChange={(val) => setFormData({ ...formData, file_type: val })}
                                                options={[
                                                    { value: 'pdf', label: 'PDF' },
                                                    { value: 'doc', label: 'Document' },
                                                    { value: 'ppt', label: 'Presentation' },
                                                    { value: 'video', label: 'Video' },
                                                    { value: 'link', label: 'Link' }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-2">Subject</label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-2">Class</label>
                                        <input
                                            type="text"
                                            value={formData.class_year}
                                            onChange={(e) => setFormData({ ...formData, class_year: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Upload File</label>
                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <DownloadSimple size={24} className="text-indigo-400 mb-2" />
                                        <p className="text-sm text-white font-medium">
                                            {file ? file.name : 'Click to select or drag file here'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">Supports PDF, DOC, PPT, MP4</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="is_public"
                                        checked={formData.is_public === 1}
                                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked ? 1 : 0 })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <label htmlFor="is_public" className="text-slate-300 text-sm">
                                        Make this resource public (visible to all teachers)
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all"
                                    >
                                        Upload Resource
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default ResourceLibrary;
