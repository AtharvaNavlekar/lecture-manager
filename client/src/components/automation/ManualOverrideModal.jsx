import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

const ManualOverrideModal = ({ assignment, onClose, onSuccess }) => {
    const [activeTeachers, setActiveTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch available teachers (mock endpoint or filter existing)
        // Ideally we'd have an endpoint /api/teachers/available?date=...&time_slot=...
        // For now, let's just fetch all teachers and filter in frontend or backend
        // Since we don't have that specific endpoint ready in this plan, 
        // I'll assume we can fetch all teachers and just list them.
        // In a real scenario, we should filter by availability.
        const fetchTeachers = async () => {
            try {
                const response = await api.get('/teachers'); // Assuming this exists
                if (response.data.success) {
                    // Filter out original teacher
                    const available = response.data.data.filter(t => t.id !== assignment.original_teacher_id && t.is_active);
                    setActiveTeachers(available);
                }
            } catch (err) {
                logger.error("Failed to fetch teachers", err);
                setError("Could not load teacher list.");
            } finally {
                setFetchLoading(false);
            }
        };

        fetchTeachers();
    }, [assignment]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTeacher) return;

        setLoading(true);
        try {
            await api.post('/automation/override', {
                assignment_id: assignment.id,
                substitute_teacher_id: selectedTeacher
            });
            onSuccess();
            onClose();
        } catch (err) {
            logger.error("Override failed", err);
            setError(err.response?.data?.message || "Failed to assign substitute.");
            setLoading(false);
        }
    };

    if (!assignment) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <UserCheck className="text-indigo-400" />
                        Manual Override
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Context Info */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-200">
                        Assigning substitute for <strong>{assignment.subject}</strong> ({assignment.class_year}) <br />
                        Original Teacher: {assignment.original_teacher}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-300 flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Teacher Selection */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">Select Substitute Teacher</label>
                        {fetchLoading ? (
                            <div className="h-10 w-full animate-pulse bg-white/10 rounded-lg" />
                        ) : (
                            <select
                                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                required
                            >
                                <option value="">-- Choose a teacher --</option>
                                {activeTeachers.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.department})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedTeacher}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? 'Assigning...' : 'Confirm Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualOverrideModal;
