import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion } from 'framer-motion';
import {
    ClipboardText,
    Clock,
    CheckCircle,
    Calendar,
    ArrowRight,
    BookOpen,
    Users,
    Lightning
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import SandyLoader from '../components/SandyLoader';

const AttendanceLauncher = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentLecture, setCurrentLecture] = useState(null);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    useEffect(() => {
        const loadSchedule = async () => {
            try {
                setLoading(true);

                // Get today's day name (Monday, Tuesday, etc.) to match PersonalTimetable approach
                const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const today = new Date();
                const dayName = daysOfWeek[today.getDay()];

                // Fetch today's schedule using day name (matches PersonalTimetable logic)
                const res = await api.get(`/lectures/schedule?date=${dayName}`);
                const allLectures = res.data.success ? res.data.schedule : [];

                // PERSONAL FILTER: Show ONLY classes where current user is instructor or substitute
                // This matches PersonalTimetable filtering logic
                const myPersonalLectures = allLectures.filter(
                    lec => lec.scheduled_teacher_id === user.id || lec.substitute_teacher_id === user.id
                );

                // Map status='completed' to attendance_marked=true for frontend compatibility
                const lectures = myPersonalLectures.map(l => ({
                    ...l,
                    attendance_marked: l.status === 'completed'
                }));

                setSchedule(lectures);

                // Auto-detect current lecture
                if (!hasUserInteracted) {
                    const now = new Date();
                    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                    const activeLecture = lectures.find(lecture => {
                        if (!lecture.start_time || !lecture.end_time) return false;
                        return currentTime >= lecture.start_time && currentTime <= lecture.end_time;
                    });

                    if (activeLecture) {
                        setCurrentLecture(activeLecture);
                    }
                }

                setLoading(false);
            } catch (err) {
                logger.error('Failed to load schedule:', err);
                toast.error('Failed to load schedule');
                setLoading(false);
            }
        };

        loadSchedule();
    }, [user.id]); // Reloads when component mounts or user changes

    const handleLectureClick = (lecture) => {
        // Allow viewing all lectures - completed ones will show attendance data
        navigate(`/attendance/${lecture.id}/${lecture.class_year}`);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex items-center justify-center overflow-hidden z-50">
                <SandyLoader text="Loading your schedule..." />
            </div>
        );
    }

    // Show detected lecture with manual override option
    if (currentLecture && !hasUserInteracted) {
        return (
            <div className="max-w-4xl mx-auto pt-20">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center"
                >
                    {/* Detected Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full mb-6">
                        <Lightning size={20} weight="bold" />
                        <span className="font-semibold">Current Lecture Detected!</span>
                    </div>

                    {/* Lecture Info */}
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{currentLecture.subject}</h2>
                    <p className="text-slate-400 mb-1">{currentLecture.class_year}</p>
                    <p className="text-slate-500 text-sm mb-8">
                        {currentLecture.start_time} - {currentLecture.end_time}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => handleLectureClick(currentLecture)}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all font-semibold"
                        >
                            <CheckCircle size={22} weight="bold" />
                            Continue to Attendance
                        </button>
                        <button
                            onClick={() => setHasUserInteracted(true)}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all border border-white/10"
                        >
                            <Calendar size={22} weight="bold" />
                            Choose Different Lecture
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <ClipboardText className="text-indigo-400" weight="duotone" />
                    Mark Attendance
                </h1>
                <p className="text-slate-400 mt-2">Select a lecture to mark student attendance</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                <div className="glass p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl md:text-3xl font-bold text-white tracking-tighter mb-1">
                                {schedule.length}
                            </div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                Today's Lectures
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-blue-500/10 text-blue-400">
                            <BookOpen weight="duotone" />
                        </div>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl md:text-3xl font-bold text-white tracking-tighter mb-1">
                                {schedule.filter(l => l.attendance_marked).length}
                            </div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                Completed
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-emerald-500/10 text-emerald-400">
                            <CheckCircle weight="duotone" />
                        </div>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl md:text-3xl font-bold text-white tracking-tighter mb-1">
                                {schedule.filter(l => !l.attendance_marked).length}
                            </div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                Pending
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-amber-500/10 text-amber-400">
                            <Clock weight="duotone" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Lectures Grid */}
            {schedule.length === 0 ? (
                <div className="glass rounded-3xl p-20 text-center border border-white/5">
                    <Calendar size={64} className="text-slate-600 mx-auto mb-4" weight="duotone" />
                    <h3 className="text-xl font-bold text-slate-400 mb-2">No Lectures Today</h3>
                    <p className="text-slate-500">You don't have any scheduled lectures for today.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Calendar className="text-indigo-400" weight="fill" />
                        Today's Schedule
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                        {schedule.map((lecture) => (
                            <motion.div
                                key={lecture.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass rounded-2xl p-5 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
                                onClick={() => handleLectureClick(lecture)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white text-lg mb-1 group-hover:text-indigo-400 transition-colors">
                                            {lecture.subject}
                                        </h3>
                                        <p className="text-sm text-slate-400">{lecture.class_year}</p>
                                    </div>
                                    {lecture.attendance_marked ? (
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                            <CheckCircle size={18} weight="fill" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                            <Clock size={18} weight="fill" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} weight="bold" />
                                        {lecture.start_time} - {lecture.end_time}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${lecture.attendance_marked
                                        ? 'text-emerald-400'
                                        : 'text-amber-400'
                                        }`}>
                                        {lecture.attendance_marked ? 'Completed' : 'Pending'}
                                    </span>
                                    <ArrowRight
                                        size={20}
                                        className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all"
                                        weight="bold"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceLauncher;
