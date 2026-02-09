import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Database,
    Trash,
    Warning,
    Student,
    ChalkboardTeacher,
    CalendarBlank,
    BookOpen,
    UserSwitch,
    ArrowsClockwise,
    CheckCircle,
    Books,
    ListBullets,
    CalendarX
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const DataManagement = () => {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ show: false, module: null, action: null });

    const modules = [
        {
            key: 'students',
            name: 'Students',
            icon: Student,
            color: 'blue',
            description: 'All student records and enrollment data'
        },
        {
            key: 'teachers',
            name: 'Teachers',
            icon: ChalkboardTeacher,
            color: 'purple',
            description: 'Faculty members and teaching staff'
        },
        {
            key: 'lectures',
            name: 'Lectures',
            icon: BookOpen,
            color: 'amber',
            description: 'Lecture schedules and timetables'
        },
        {
            key: 'subjects',
            name: 'Subject Directory',
            icon: Books, // Changed icon
            color: 'cyan', // Adjusted color
            description: 'Course subjects and definitions' // Changed description
        },
        {
            key: 'syllabus',
            name: 'Syllabus Data',
            icon: ListBullets,
            color: 'teal',
            description: 'Curriculum topics and units'
        },
        {
            key: 'leaves',
            name: 'Leave Requests',
            icon: CalendarX, // Changed icon
            color: 'rose', // Adjusted color
            description: 'Leave applications and approvals'
        },
        {
            key: 'substitutes',
            name: 'Substitute Assignments',
            icon: UserSwitch,
            color: 'indigo',
            description: 'Substitute teacher assignments'
        },
        {
            key: 'attendance',
            name: 'Attendance',
            icon: CheckCircle,
            color: 'teal',
            description: 'Student attendance records'
        }
    ];

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/data-stats');
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (err) {
            logger.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClearModule = async (moduleKey) => {
        setConfirmModal({ show: true, module: moduleKey, action: 'clear' });
    };

    const handleFactoryReset = () => {
        setConfirmModal({ show: true, module: 'all', action: 'factory' });
    };

    const confirmAction = async () => {
        const { module, action } = confirmModal;
        setConfirmModal({ show: false, module: null, action: null });

        try {
            if (action === 'factory') {
                const res = await api.post('/admin/factory-reset');
                if (res.data.success) {
                    toast.success('Factory reset completed successfully!');
                    fetchStats();
                }
            } else {
                const res = await api.post('/admin/clear-module', { module });
                if (res.data.success) {
                    toast.success(`${modules.find(m => m.key === module)?.name} data cleared successfully!`);
                    fetchStats();
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const ModuleCard = ({ module }) => {
        const count = stats[module.key] || 0;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-4 md:p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-${module.color}-500/10 text-${module.color}-400 border border-${module.color}-500/20 group-hover:scale-110 transition-transform`}>
                        <module.icon size={24} weight="duotone" />
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">{loading ? '...' : count}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Records</div>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{module.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{module.description}</p>

                <button
                    onClick={() => handleClearModule(module.key)}
                    disabled={count === 0}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${count === 0
                        ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40'
                        }`}
                >
                    <Trash size={16} weight="bold" />
                    Clear Data
                </button>
            </motion.div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Database className="text-purple-400" weight="duotone" />
                    Data Management
                </h1>
                <p className="text-slate-400 mt-2">Manage and clear application data by module or perform a complete factory reset.</p>
            </div>

            {/* Warning Banner */}
            <div className="glass p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-3">
                    <Warning className="text-amber-400 mt-0.5" size={20} weight="fill" />
                    <div>
                        <h4 className="text-amber-400 font-bold text-sm mb-1">Caution: Permanent Data Deletion</h4>
                        <p className="text-slate-400 text-xs">
                            Deleting data is permanent and cannot be undone. Make sure to export backups before clearing any records.
                        </p>
                    </div>
                </div>
            </div>

            {/* Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {modules.map((module) => (
                    <ModuleCard key={module.key} module={module} />
                ))}
            </div>

            {/* Factory Reset Section */}
            <div className="glass p-4 md:p-4 md:p-6 lg:p-8 rounded-3xl border border-rose-500/20 bg-rose-500/5">
                <div className="flex items-start gap-4">
                    <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <ArrowsClockwise size={32} weight="duotone" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-2">Factory Reset</h2>
                        <p className="text-slate-400 text-sm mb-4">
                            Clear ALL data from the system including students, teachers, lectures, attendance, and all other records. This will restore the application to its initial state.
                        </p>
                        <button
                            onClick={handleFactoryReset}
                            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-900/20"
                        >
                            <Trash size={20} weight="bold" />
                            Perform Factory Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.show && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                        <div className="absolute inset-0" onClick={() => setConfirmModal({ show: false, module: null, action: null })} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0f172a] border border-rose-500/20 rounded-3xl w-full max-w-md p-4 md:p-6 shadow-2xl relative z-10"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Warning className="text-rose-400" size={32} weight="fill" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
                                <p className="text-slate-400 text-sm mb-6">
                                    {confirmModal.action === 'factory'
                                        ? 'Are you sure you want to perform a factory reset? This will delete ALL data from the system.'
                                        : `Are you sure you want to delete all ${modules.find(m => m.key === confirmModal.module)?.name} records?`
                                    }
                                </p>
                                <p className="text-rose-400 text-xs font-bold mb-6">This action cannot be undone!</p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConfirmModal({ show: false, module: null, action: null })}
                                        className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmAction}
                                        className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-900/20"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DataManagement;
