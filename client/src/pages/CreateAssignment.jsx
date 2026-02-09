import logger from '@/utils/logger';

import React, { useState, useContext } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CustomDropdown from '../components/CustomDropdown';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { useAcademicYears } from '../hooks/useConfig';
import { motion } from 'framer-motion';
import {
    BookmarkSimple,
    ArrowLeft,
    FileText,
    GraduationCap,
    ClipboardText,
    Calendar,
    Star,
    Check,
    UploadSimple,
    Trash
} from '@phosphor-icons/react';

const CreateAssignment = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        subject: '',
        class_year: '',
        title: '',
        description: '',
        due_date: '',
        max_marks: 100
    });
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic config
    const { data: academicYears, loading: yearsLoading } = useAcademicYears();

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            if (file) {
                data.append('file', file);
            }

            console.log('Submitting assignment:', Object.fromEntries(data));
            const res = await api.post('/assignments', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('Response:', res.data);

            if (res.data.success) {
                toast.success('Assignment created successfully!');
                navigate('/assignments');
            } else {
                toast.error(res.data.message || 'Failed to create assignment');
            }
        } catch (error) {
            console.error('Create assignment error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create assignment';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-10">
            {/* Breadcrumb & Back Button */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
            >
                <button
                    onClick={() => navigate('/assignments')}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={24} weight="bold" />
                </button>
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <span className="hover:text-indigo-400 cursor-pointer" onClick={() => navigate('/assignments')}>
                            Assignments
                        </span>
                        <span>/</span>
                        <span className="text-slate-400">Create New</span>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                        <BookmarkSimple size={40} weight="fill" className="text-indigo-400" />
                        Create New Assignment
                    </h1>
                </div>
            </motion.div>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-slate-400 text-lg"
            >
                Fill in the details below to create a new assignment for your students
            </motion.p>

            {/* Form Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-8 md:p-10 rounded-3xl border border-white/10"
            >
                <form onSubmit={handleCreateAssignment} className="space-y-8">
                    {/* Section 1: Basic Information */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Basic Information</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Subject Field */}
                            <div className="group">
                                <label className="flex items-center gap-2 text-slate-300 text-sm mb-3 font-medium">
                                    <FileText size={18} className="text-indigo-400" />
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base"
                                    placeholder="e.g., Mathematics"
                                    required
                                />
                            </div>

                            {/* Class Field */}
                            <div className="group">
                                <label className="flex items-center gap-2 text-slate-300 text-sm mb-3 font-medium">
                                    <GraduationCap size={18} className="text-purple-400" />
                                    Class Year
                                </label>
                                <CustomDropdown
                                    value={formData.class_year}
                                    onChange={(val) => setFormData({ ...formData, class_year: val })}
                                    options={academicYears.length > 0
                                        ? academicYears.map(y => ({ value: y.code, label: y.name }))
                                        : [
                                            { value: 'FY', label: 'First Year' },
                                            { value: 'SY', label: 'Second Year' },
                                            { value: 'TY', label: 'Third Year' }
                                        ]
                                    }
                                    placeholder="Select class"
                                    disabled={yearsLoading}
                                />
                            </div>
                        </div>

                        {/* Title Field */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-slate-300 text-sm mb-3 font-medium">
                                <ClipboardText size={18} className="text-emerald-400" />
                                Assignment Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base"
                                placeholder="e.g., Chapter 5 Problems - Quadratic Equations"
                                required
                            />
                        </div>

                        {/* Description Field */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-slate-300 text-sm mb-3 font-medium">
                                <FileText size={18} className="text-cyan-400" />
                                Description
                                <span className="text-xs text-slate-500">(Optional)</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all text-base"
                                rows="5"
                                placeholder="Describe the assignment details, requirements, learning objectives, and submission guidelines..."
                            />
                        </div>
                    </div>

                    {/* Section 2: Assignment Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Assignment Settings</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Due Date Field */}
                            <div className="group">
                                <label className="flex items-center gap-2 text-slate-300 text-sm mb-3 font-medium">
                                    <Calendar size={18} className="text-rose-400" />
                                    Due Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base"
                                    required
                                />
                            </div>

                            {/* Maximum Marks Field */}
                            <div className="group">
                                <label className="flex items-center gap-2 text-slate-300 text-sm mb-3 font-medium">
                                    <Star size={18} weight="fill" className="text-amber-400" />
                                    Maximum Marks
                                </label>
                                <input
                                    type="number"
                                    value={formData.max_marks}
                                    onChange={(e) => setFormData({ ...formData, max_marks: parseInt(e.target.value) })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base"
                                    min="1"
                                    placeholder="100"
                                    required
                                />
                            </div>
                        </div>
                        {/* Section 3: Attachments */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Attachments</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                            </div>

                            <div className="group">
                                <label className="flex items-center gap-2 text-slate-300 text-sm mb-3 font-medium">
                                    <UploadSimple size={18} className="text-cyan-400" />
                                    Attach File
                                    <span className="text-xs text-slate-500">(Optional - PDF, Word, Images max 50MB)</span>
                                </label>

                                {!file ? (
                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all cursor-pointer relative">
                                        <input
                                            type="file"
                                            onChange={(e) => e.target.files[0] && setFile(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        />
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full">
                                                <UploadSimple size={24} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">Click to upload or drag and drop</p>
                                                <p className="text-slate-500 text-sm mt-1">PDF, DOC, Images (Max 50MB)</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{file.name}</p>
                                                <p className="text-indigo-300/80 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFile(null)}
                                            className="p-2 hover:bg-white/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-8 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => navigate('/assignments')}
                            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all text-base"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Check size={20} weight="bold" />
                                    Create Assignment
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateAssignment;
