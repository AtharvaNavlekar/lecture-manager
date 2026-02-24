import logger from '@/utils/logger';

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import DatePicker from '../components/DatePicker';
import {
    Calendar,
    AlertCircle,
    Send,
    Clock,
    ChevronLeft,
    FileText,
    BookOpen,
    CalendarDays,
    CheckCircle,
    Info,
    Sparkles
} from 'lucide-react';

const LeaveRequest = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        reason: 'Medical',
        affected_lectures: [],
        notes: ''
    });
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [focusedField, setFocusedField] = useState(null);

    const today = new Date().toISOString().split('T')[0];

    // Extract form values for stable dependencies
    const { start_date: startDate, end_date: endDate } = formData;

    // Memoize fetchLectures to use in useEffect dependency array
    const fetchLectures = useCallback(async () => {
        // Guard: Don't fetch if user context not loaded yet
        if (!user?.id || !startDate || !endDate) {
            logger.debug('[LeaveRequest] Skipping fetch - missing required data:', {
                hasUser: !!user?.id,
                hasStartDate: !!startDate,
                hasEndDate: !!endDate
            });
            return;
        }

        try {
            logger.debug('[LeaveRequest] Fetching lectures for user:', user.id);
            logger.debug('[LeaveRequest] Date range:', { startDate, endDate });

            // Fetch all lectures for this teacher
            const res = await api.get(`/lectures?teacher_id=${user.id}`);
            logger.debug('[LeaveRequest] API Response:', res.data);

            if (res.data.success) {
                const allLectures = res.data.lectures || [];
                logger.debug(`[LeaveRequest] Total lectures fetched: ${allLectures.length}`);

                // Generate affected lectures based on day_of_week
                const start = new Date(startDate);
                const end = new Date(endDate);

                const affectedLectures = [];
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                // Iterate through each lecture
                allLectures.forEach(lecture => {
                    // Check if this lecture falls on any day within the date range
                    const currentDate = new Date(start);

                    while (currentDate <= end) {
                        const dayName = dayNames[currentDate.getDay()];

                        // If lecture's day_of_week matches current day, include it
                        if (lecture.day_of_week === dayName) {
                            // Add lecture with the specific date
                            affectedLectures.push({
                                ...lecture,
                                specific_date: new Date(currentDate).toISOString().split('T')[0]
                            });
                        }

                        // Move to next day
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                });

                logger.debug(`[LeaveRequest] Affected lectures (after day_of_week filtering): ${affectedLectures.length}`);
                console.log('[LeaveRequest] Affected lectures:', affectedLectures);

                setLectures(affectedLectures);

                // AUTO-SELECT: Automatically select all affected lectures
                const allLectureIds = affectedLectures.map(l => l.id);
                setFormData(prev => ({
                    ...prev,
                    affected_lectures: allLectureIds
                }));
                logger.info(`[LeaveRequest] Auto-selected ${allLectureIds.length} lectures`);

                if (affectedLectures.length === 0) {
                    logger.info('[LeaveRequest] No lectures found in date range');
                }
            }
        } catch (err) {
            logger.error('[LeaveRequest] Error fetching lectures:', err);
            console.error('[LeaveRequest] Full error:', err);
            // DON'T trigger logout - just log the error and show user-friendly message
            setMessage({
                type: 'error',
                text: 'Failed to load lectures. Please try again.'
            });
        }
    }, [user, startDate, endDate]); // Use extracted values

    // Wait for user context to load before fetching
    useEffect(() => {
        if (!user?.id) {
            logger.debug('[LeaveRequest] Waiting for user context to load...');
            return;
        }

        if (startDate && endDate) {
            fetchLectures();
        }
    }, [user, startDate, endDate, fetchLectures]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            const response = await api.post('/leaves', {
                ...formData,
                teacher_id: user.id
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to submit leave request');
            }

            setMessage({ type: 'success', text: 'Leave request submitted successfully!' });
            setFormData({
                start_date: '',
                end_date: '',
                reason: 'Medical',
                affected_lectures: [],
                notes: ''
            });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            logger.error('Leave submission error:', err);
            logger.error('Error response:', err.response?.data);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to submit leave request';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const toggleLecture = (id) => {
        setFormData(prev => ({
            ...prev,
            affected_lectures: prev.affected_lectures.includes(id)
                ? prev.affected_lectures.filter(l => l !== id)
                : [...prev.affected_lectures, id]
        }));
    };

    const calculateDuration = () => {
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            return days;
        }
        return 0;
    };

    const formProgress = () => {
        let completed = 0;
        let total = 5;
        if (formData.start_date) completed++;
        if (formData.end_date) completed++;
        if (formData.reason) completed++;
        if (formData.affected_lectures.length > 0) completed++;
        if (formData.notes.trim()) completed++;
        return (completed / total) * 100;
    };

    // CRITICAL: Loading guard to prevent race conditions
    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl font-semibold">Loading your profile...</p>
                    <p className="text-slate-400 text-sm mt-2">Preparing leave request form</p>
                </motion.div>
            </div>
        );
    }

    // If auth complete but no user, something went wrong
    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <AlertCircle size={64} className="text-rose-400 mx-auto mb-4" />
                    <p className="text-white text-xl font-semibold">Authentication Required</p>
                    <p className="text-slate-400 text-sm mt-2">Please log in to access this page</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all"
                    >
                        Go to Login
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-10">
            {/* Enhanced Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <div className="relative">
                            <Calendar className="text-emerald-400" size={40} />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-1 -right-1"
                            >
                                <Sparkles size={16} className="text-emerald-300 fill-emerald-300" />
                            </motion.div>
                        </div>
                        Request Leave
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm font-medium">Submit a new leave application for approval</p>
                </div>

                {/* Progress Indicator */}
                <div className="hidden md:flex items-center gap-3 bg-white/5 rounded-2xl px-5 py-3 border border-white/10 backdrop-blur-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Progress</span>
                        <span className="text-2xl font-black text-emerald-400">{Math.round(formProgress())}%</span>
                    </div>
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${formProgress()}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <div className="glass rounded-3xl p-4 md:p-6 lg:p-8 border border-white/10 relative overflow-hidden shadow-2xl shadow-emerald-900/10">
                        {/* Enhanced Decorative Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-500/5 via-cyan-400/5 to-transparent rounded-full blur-3xl pointer-events-none -ml-24 -mb-24"></div>

                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`mb-6 p-5 rounded-2xl flex items-center gap-4 border backdrop-blur-sm ${message.type === 'success'
                                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-300 border-emerald-500/30'
                                        : 'bg-gradient-to-r from-rose-500/20 to-rose-600/10 text-rose-300 border-rose-500/30'
                                        }`}
                                >
                                    {message.type === 'success' ? (
                                        <CheckCircle size={28} />
                                    ) : (
                                        <AlertCircle size={28} />
                                    )}
                                    <span className="font-bold text-sm">{message.text}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            {/* Date Range Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Leave Period</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DatePicker
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        minDate={today}
                                        label="Start Date"
                                        color="emerald"
                                        required
                                    />

                                    <DatePicker
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        minDate={formData.start_date || today}
                                        label="End Date"
                                        color="emerald"
                                        required
                                    />
                                </div>

                                {calculateDuration() > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl"
                                    >
                                        <Info size={18} className="text-emerald-400" />
                                        <span className="text-sm font-bold text-emerald-300">
                                            Total Duration: {calculateDuration()} {calculateDuration() === 1 ? 'day' : 'days'}
                                        </span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Reason Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Leave Reason</h3>
                                </div>

                                <div className="relative group">
                                    <select
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        onFocus={() => setFocusedField('reason')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full px-4 py-3.5 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer font-semibold group-hover:border-emerald-500/30 hover:bg-slate-900 pr-10 custom-select"
                                        style={{
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'none',
                                            appearance: 'none',
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 1rem center',
                                            backgroundSize: '16px'
                                        }}
                                    >
                                        <option value="Medical">🏥 Medical Emergency</option>
                                        <option value="Personal">� Personal Work</option>
                                        <option value="Emergency">🚨 Family Emergency</option>
                                        <option value="Official">📋 Official Duty</option>
                                        <option value="Other">📝 Other</option>
                                    </select>
                                    {focusedField === 'reason' && (
                                        <motion.div
                                            layoutId="focus-ring"
                                            className="absolute inset-0 rounded-xl border-2 border-emerald-400/50 pointer-events-none"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Affected Lectures */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Affected Lectures</h3>
                                    </div>
                                    {formData.affected_lectures.length > 0 && (
                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                                            {formData.affected_lectures.length} selected
                                        </span>
                                    )}
                                </div>

                                <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm">
                                    {lectures.length > 0 ? (
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                            {lectures.map((lecture, index) => (
                                                <motion.label
                                                    key={lecture.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${formData.affected_lectures.includes(lecture.id)
                                                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 shadow-lg shadow-emerald-900/20'
                                                        : 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-white/10 hover:border-emerald-500/30 hover:from-white/10 hover:to-white/5'
                                                        }`}
                                                >
                                                    {formData.affected_lectures.includes(lecture.id) && (
                                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none"></div>
                                                    )}

                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all relative z-10 ${formData.affected_lectures.includes(lecture.id)
                                                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 shadow-lg shadow-emerald-500/50'
                                                        : 'border-slate-500 group-hover:border-emerald-400 group-hover:bg-emerald-500/10'
                                                        }`}>
                                                        <AnimatePresence>
                                                            {formData.affected_lectures.includes(lecture.id) && (
                                                                <motion.div
                                                                    initial={{ scale: 0, rotate: -180 }}
                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                    exit={{ scale: 0, rotate: 180 }}
                                                                >
                                                                    <CheckCircle size={16} className="text-white" />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    <div className="flex-1 relative z-10">
                                                        <div className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                                                            {lecture.subject}
                                                        </div>
                                                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-1.5">
                                                            <span className="bg-white/10 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10">
                                                                {lecture.class_year}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 font-semibold">
                                                                <Clock size={12} /> {lecture.time_slot}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <input
                                                        type="checkbox"
                                                        checked={formData.affected_lectures.includes(lecture.id)}
                                                        onChange={() => toggleLecture(lecture.id)}
                                                        className="sr-only"
                                                    />
                                                </motion.label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-slate-900/30">
                                            <BookOpen size={48} className="text-slate-600 mx-auto mb-3" />
                                            <p className="text-sm font-bold text-slate-500">
                                                {formData.start_date ? "No lectures scheduled for this date" : "Select a start date to view lectures"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Notes */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Additional Notes</h3>
                                </div>

                                <div className="relative group">
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        onFocus={() => setFocusedField('notes')}
                                        onBlur={() => setFocusedField(null)}
                                        rows={4}
                                        placeholder="Provide any specific details for the HOD (e.g., substitute arrangements, contact information during leave)..."
                                        className="w-full px-4 py-3.5 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-600 font-medium resize-none group-hover:border-white/20"
                                    />
                                    {focusedField === 'notes' && (
                                        <motion.div
                                            layoutId="focus-ring"
                                            className="absolute inset-0 rounded-xl border-2 border-emerald-400/50 pointer-events-none"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-500 text-white rounded-xl font-black text-lg shadow-xl shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group relative overflow-hidden border border-emerald-400/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Submitting...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Send size={24} className="group-hover:translate-x-1 transition-transform" />
                                        Submit Leave Request
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </div>
                </motion.div>

                {/* Info Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    {/* Quick Tips */}
                    <div className="glass rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Info size={20} className="text-blue-400" />
                            <h3 className="font-black text-white text-sm uppercase tracking-wider">Quick Tips</h3>
                        </div>
                        <ul className="space-y-3 text-xs text-slate-400">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span className="font-medium">Submit requests at least 24 hours in advance when possible</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span className="font-medium">Select all lectures that will be affected during your leave period</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span className="font-medium">Provide detailed notes to help arrange substitutes</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span className="font-medium">You'll receive a notification once your request is reviewed</span>
                            </li>
                        </ul>
                    </div>

                    {/* Status Legend */}
                    <div className="glass rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle size={20} className="text-emerald-400" />
                            <h3 className="font-black text-white text-sm uppercase tracking-wider">What Happens Next?</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-amber-400 text-xs font-bold">1</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">HOD Review</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Your request will be reviewed by the department head</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-blue-400 text-xs font-bold">2</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">Notification</p>
                                    <p className="text-xs text-slate-500 mt-0.5">You'll receive an email with the decision</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-emerald-400 text-xs font-bold">3</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">Arrangements</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Substitute arrangements will be made if approved</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #10b981, #059669);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #059669, #047857);
                }
                .glass {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                }
                
                /* Custom Select Dropdown Styling */
                .custom-select option {
                    background: #0f172a;
                    color: white;
                    padding: 12px 16px;
                    font-weight: 600;
                    border-radius: 8px;
                }
                
                .custom-select option:hover {
                    background: linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
                }
                
                .custom-select option:checked {
                    background: linear-gradient(to right, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.15));
                    color: #10b981;
                    font-weight: 700;
                }
            `}</style>
        </div>
    );
};

export default LeaveRequest;