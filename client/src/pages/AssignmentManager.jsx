import logger from '@/utils/logger';

import React, { useState, useEffect, useContext, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { useAcademicYears } from '../hooks/useConfig';
import { motion } from 'framer-motion';
import StatusBadge from '../components/StatusBadge';
import {
    BookmarkSimple,
    Plus,
    Trash,
    Calendar,
    Star,
    ClipboardText,
    Clock,
    CheckCircle,
    Warning,
    MagnifyingGlass,
    GraduationCap
} from '@phosphor-icons/react';

const AssignmentManager = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Dynamic config
    const { data: academicYears } = useAcademicYears();

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const res = await api.get('/assignments');
            if (res.data.success) {
                setAssignments(res.data.assignments);
            }
        } catch (err) {
            logger.error('Fetch assignments error:', err);
        }
    };

    const confirmDeleteAssignment = async (id) => {
        try {
            await api.delete(`/assignments/${id}`);
            fetchAssignments();
            toast.success('Assignment deleted');
        } catch (error) {
            logger.error(error);
            toast.error('Failed to delete assignment');
        }
    };

    const handleDeleteAssignment = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500/20 rounded-full text-rose-500">
                        <Trash size={20} weight="bold" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Delete Assignment?</h4>
                        <p className="text-sm text-slate-400 mt-1">This action cannot be undone.</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white">Dismiss</button>
                    <button onClick={() => { toast.dismiss(t.id); confirmDeleteAssignment(id); }} className="px-4 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold">Delete</button>
                </div>
            </div>
        ), { duration: 5000, style: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' } });
    };

    // Get assignment status
    const getAssignmentStatus = (assignment) => {
        const dueDate = new Date(assignment.due_date);
        const now = new Date();
        const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) return { label: 'Overdue', color: 'rose', icon: Warning };
        if (daysDiff <= 3) return { label: 'Due Soon', color: 'amber', icon: Clock };
        return { label: 'Upcoming', color: 'emerald', icon: CheckCircle };
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const total = assignments.length;
        const now = new Date();
        const overdue = assignments.filter(a => new Date(a.due_date) < now).length;
        const upcoming = total - overdue;

        // Calculate pending grading (placeholder)
        const pendingGrading = 0;

        return {
            total,
            upcoming,
            overdue,
            pendingGrading
        };
    }, [assignments]);

    // Filter assignments
    const filteredAssignments = useMemo(() => {
        return assignments.filter(assignment => {
            const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                assignment.subject.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesClass = !filterClass || assignment.class_year === filterClass;

            let matchesStatus = true;
            if (filterStatus) {
                const status = getAssignmentStatus(assignment);
                matchesStatus = status.label.toLowerCase() === filterStatus.toLowerCase();
            }

            return matchesSearch && matchesClass && matchesStatus;
        });
    }, [assignments, searchQuery, filterClass, filterStatus]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                        <BookmarkSimple weight="fill" className="text-indigo-400" size={40} />
                        Assignment Manager
                    </h1>
                    <p className="text-slate-400 mt-2">Create, manage, and grade assignments for your classes</p>
                </div>
                <button
                    onClick={() => navigate('/assignments/create')}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 hover:scale-105"
                >
                    <Plus weight="bold" size={20} />
                    Create Assignment
                </button>
            </motion.div>

            {/* Statistics Dashboard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                <StatCard
                    icon={ClipboardText}
                    label="Total Assignments"
                    value={stats.total}
                    gradient="from-blue-500 to-cyan-500"
                    iconBg="bg-blue-500/10"
                    iconColor="text-blue-400"
                />
                <StatCard
                    icon={Clock}
                    label="Upcoming"
                    value={stats.upcoming}
                    gradient="from-emerald-500 to-teal-500"
                    iconBg="bg-emerald-500/10"
                    iconColor="text-emerald-400"
                />
                <StatCard
                    icon={Warning}
                    label="Overdue"
                    value={stats.overdue}
                    gradient="from-rose-500 to-pink-500"
                    iconBg="bg-rose-500/10"
                    iconColor="text-rose-400"
                />
                <StatCard
                    icon={GraduationCap}
                    label="Pending Grading"
                    value={stats.pendingGrading}
                    gradient="from-amber-500 to-orange-500"
                    iconBg="bg-amber-500/10"
                    iconColor="text-amber-400"
                />
            </motion.div>

            {/* Search and Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-4 rounded-2xl border border-white/5"
            >
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search assignments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3">
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        >
                            <option value="">All Classes</option>
                            {academicYears.map(year => (
                                <option key={year.code} value={year.code}>{year.name}</option>
                            ))}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        >
                            <option value="">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="due soon">Due Soon</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Assignment Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {filteredAssignments.length === 0 ? (
                    <div className="glass p-12 rounded-3xl border border-white/5 text-center">
                        <BookmarkSimple size={64} className="mx-auto mb-4 opacity-20 text-slate-500" />
                        <p className="text-slate-400 text-lg">
                            {searchQuery || filterClass || filterStatus ? 'No assignments match your filters' : 'No assignments yet'}
                        </p>
                        {!searchQuery && !filterClass && !filterStatus && (
                            <button
                                onClick={() => navigate('/assignments/create')}
                                className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
                            >
                                Create Your First Assignment
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssignments.map((assignment, index) => (
                            <AssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                index={index}
                                onClick={() => navigate(`/assignments/${assignment.id}`)}
                                onDelete={handleDeleteAssignment}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, gradient, iconBg, iconColor }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden group"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
        <div className="relative">
            <div className={`${iconBg} ${iconColor} w-12 h-12 rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={24} weight="bold" />
            </div>
            <p className="text-slate-400 text-sm mb-1">{label}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    </motion.div>
);

// Assignment Card Component
const AssignmentCard = ({ assignment, index, onClick, onDelete }) => {
    const status = getAssignmentStatus(assignment);

    // Helper specific to card
    function getAssignmentStatus(assignment) {
        const dueDate = new Date(assignment.due_date);
        const now = new Date();
        const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) return { label: 'Overdue', color: 'rose', icon: Warning };
        if (daysDiff <= 3) return { label: 'Due Soon', color: 'amber', icon: Clock };
        return { label: 'Upcoming', color: 'emerald', icon: CheckCircle };
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="glass p-6 rounded-2xl border border-white/5 cursor-pointer transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-900/20 group relative overflow-hidden"
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">{assignment.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold">
                                {assignment.class_year}
                            </span>
                            <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-bold">
                                {assignment.subject}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(assignment.id);
                        }}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash size={16} weight="bold" />
                    </button>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                    <StatusBadge status={status} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar size={14} />
                        {new Date(assignment.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Star size={14} weight="fill" className="text-amber-400" />
                        {assignment.max_marks} marks
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AssignmentManager;
