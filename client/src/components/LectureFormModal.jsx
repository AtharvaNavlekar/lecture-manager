import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import CustomDropdown from './CustomDropdown';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { useAcademicYears, useDivisions, useRooms } from '../hooks/useConfig';
import {
    X,
    CalendarBlank,
    Clock,
    ChalkboardTeacher,
    Books,
    Door,
    Warning,
    CheckCircle,
    Repeat
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const LectureFormModal = ({ show, onClose, onSuccess, lecture = null, mode = 'create', selectedDate, selectedSlot }) => {
    const { user } = useContext(AuthContext);
    const isEdit = mode === 'edit';
    const isReschedule = mode === 'reschedule';

    const [formData, setFormData] = useState({
        teacher_id: user?.id || '',
        subject: '',
        class_year: '',
        room: '',
        date: selectedDate || new Date().toISOString().split('T')[0],
        start_time: selectedSlot?.start_time || '09:00',
        end_time: selectedSlot?.end_time || '10:00',
        recurring: false,
        recurring_type: 'weekly',
        recurring_count: 10
    });

    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Dynamic config
    const { data: academicYears } = useAcademicYears();
    const { data: divisions } = useDivisions();
    const { data: rooms } = useRooms();
    const [conflicts, setConflicts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasAttendance, setHasAttendance] = useState(false);

    useEffect(() => {
        if (show) {
            fetchTeachers();
            if (lecture && isEdit) {
                setFormData({
                    teacher_id: lecture.scheduled_teacher_id,
                    subject: lecture.subject,
                    class_year: lecture.class_year,
                    room: lecture.room,
                    date: lecture.date,
                    start_time: lecture.start_time,
                    end_time: lecture.end_time,
                    recurring: false,
                    recurring_type: 'weekly',
                    recurring_count: 10
                });
            } else if (lecture && isReschedule) {
                setFormData({
                    ...formData,
                    date: lecture.date,
                    start_time: lecture.start_time,
                    end_time: lecture.end_time,
                    room: lecture.room
                });
            }
        }
    }, [show, lecture, isEdit, isReschedule]);

    useEffect(() => {
        if (formData.date && formData.start_time && formData.end_time && formData.room) {
            checkConflicts();
        }
    }, [formData.date, formData.start_time, formData.end_time, formData.room]);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/teachers');
            if (res.data.success) {
                setTeachers(res.data.teachers.filter(t =>
                    user?.role === 'admin' || t.department === user?.department
                ));
            }
        } catch (error) {
            logger.error('Failed to fetch teachers');
        }
    };

    const checkConflicts = async () => {
        try {
            const params = new URLSearchParams({
                date: formData.date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                room: formData.room
            });
            if (lecture?.id) {
                params.append('exclude_id', lecture.id);
            }

            const res = await api.get(`/lectures/conflicts?${params}`);
            if (res.data.success) {
                setConflicts(res.data.conflicts || []);
            }
        } catch (error) {
            logger.error('Failed to check conflicts');
        }
    };

    const executeSubmit = async () => {
        setLoading(true);
        try {
            let res;

            if (isReschedule) {
                res = await api.post(`/lectures/${lecture.id}/reschedule`, {
                    new_date: formData.date,
                    new_start_time: formData.start_time,
                    new_end_time: formData.end_time,
                    new_room: formData.room
                });
            } else if (isEdit) {
                res = await api.put(`/lectures/${lecture.id}`, {
                    teacher_id: formData.teacher_id,
                    subject: formData.subject,
                    class_year: formData.class_year,
                    room: formData.room,
                    date: formData.date,
                    start_time: formData.start_time,
                    end_time: formData.end_time
                });
            } else {
                // Create
                const payload = { ...formData };
                if (formData.recurring) {
                    payload.recurring = {
                        type: formData.recurring_type,
                        count: parseInt(formData.recurring_count)
                    };
                }

                res = await api.post('/lectures/create', payload);
            }

            if (res.data.success) {
                toast.success(res.data.message);
                onSuccess();
                onClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (conflicts.length > 0) {
            toast((t) => (
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-full text-amber-500">
                            <Warning size={20} weight="bold" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Time Conflicts Detected</h4>
                            <p className="text-sm text-slate-400 mt-1">This slot overlaps with existing lectures. Schedule anyway?</p>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                executeSubmit();
                            }}
                            className="px-4 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold"
                        >
                            Force Schedule
                        </button>
                    </div>
                </div>
            ), { duration: 6000, style: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' } });
            return;
        }

        executeSubmit();
    };

    if (!show) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-[#0f172a] border border-white/10 rounded-3xl w-[95%] md:w-full max-w-2xl overflow-hidden shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <CalendarBlank className="text-indigo-400" weight="duotone" />
                                    {isReschedule ? 'Reschedule Lecture' : isEdit ? 'Edit Lecture' : 'Create New Lecture'}
                                </h2>
                                <p className="text-slate-400 text-xs mt-1">
                                    {isReschedule ? 'Move lecture to a different time slot' : 'Schedule a new class session'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Conflicts Warning */}
                    {conflicts.length > 0 && (
                        <div className="mx-6 mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                            <Warning className="text-amber-400 flex-shrink-0" size={20} weight="fill" />
                            <div className="flex-1">
                                <p className="text-amber-300 font-bold text-sm">Time Conflict Detected</p>
                                <p className="text-amber-200/70 text-xs mt-1">
                                    {conflicts[0].subject} - {conflicts[0].teacher_name} ({conflicts[0].start_time} - {conflicts[0].end_time})
                                </p>
                            </div>
                        </div>
                    )}

                    {conflicts.length === 0 && formData.date && (
                        <div className="mx-6 mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                            <CheckCircle className="text-emerald-400" size={18} weight="fill" />
                            <p className="text-emerald-300 text-xs font-medium">No conflicts detected</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {!isReschedule && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <CustomDropdown
                                            label="Teacher"
                                            value={formData.teacher_id}
                                            onChange={(val) => setFormData({ ...formData, teacher_id: val })}
                                            options={teachers.map(t => ({
                                                value: t.id,
                                                label: `${t.name} (${t.department})`
                                            }))}
                                            placeholder="Select Teacher"
                                            icon={<ChalkboardTeacher size={14} />}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Subject</label>
                                        <input
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 h-[46px]" // Added height to match dropdown
                                            placeholder="e.g. Data Structures"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <CustomDropdown
                                            label="Class Year"
                                            value={formData.class_year}
                                            onChange={(val) => setFormData({ ...formData, class_year: val })}
                                            options={[
                                                { value: 'FY', label: 'First Year' },
                                                { value: 'SY', label: 'Second Year' },
                                                { value: 'TY', label: 'Third Year' },
                                                { value: 'Final Year', label: 'Final Year' }
                                            ]}
                                            placeholder="Select Year"
                                            icon={<Books size={14} />}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Room</label>
                                        <input
                                            required
                                            value={formData.room}
                                            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                            placeholder="e.g. Lab-1"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Date</label>
                                <input
                                    required
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Start Time</label>
                                <input
                                    required
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">End Time</label>
                                <input
                                    required
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Recurring Options (Create only) */}
                        {!isEdit && !isReschedule && (
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.recurring}
                                        onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                                        className="w-4 h-4 rounded border-white/20 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <Repeat className="text-indigo-400" size={16} />
                                    <span className="text-sm text-white font-medium">Recurring Lecture</span>
                                </label>

                                {formData.recurring && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <CustomDropdown
                                                label="Frequency"
                                                value={formData.recurring_type}
                                                onChange={(val) => setFormData({ ...formData, recurring_type: val })}
                                                options={[
                                                    { value: 'daily', label: 'Daily' },
                                                    { value: 'weekly', label: 'Weekly' }
                                                ]}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Occurrences</label>
                                            <input
                                                type="number"
                                                min="2"
                                                max="50"
                                                value={formData.recurring_count}
                                                onChange={(e) => setFormData({ ...formData, recurring_count: e.target.value })}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : isReschedule ? 'Reschedule' : isEdit ? 'Update' : 'Create Lecture'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default LectureFormModal;
