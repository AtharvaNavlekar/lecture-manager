import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Users,
    MapPin,
    UserCircle,
    Funnel
} from '@phosphor-icons/react';
import CustomDropdown from '../components/CustomDropdown';
import { useTimeSlots } from '../hooks/useConfig';

// Helper function to get current day of the week
const getCurrentDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    return days[today]; // Return actual current day
};

const PersonalTimetable = () => {
    const { user } = useContext(AuthContext);
    const [lectures, setLectures] = useState([]);
    const [viewMode, setViewMode] = useState('week'); // day or week
    const [loading, setLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState(getCurrentDayOfWeek()); // Auto-detect current day

    // Dynamic time slots
    const { data: timeSlots } = useTimeSlots();

    useEffect(() => {
        fetchMyLectures();
    }, []);

    const fetchMyLectures = async () => {
        setLoading(true);
        try {
            const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

            // Fetch all days in parallel
            const fetchDay = async (day) => {
                const url = `/lectures/schedule?date=${day}`;
                const res = await api.get(url);
                return res.data.success ? res.data.schedule : [];
            };

            const dayResults = await Promise.all(weekDays.map(day => fetchDay(day)));
            const allLectures = dayResults.flat();

            // PERSONAL FILTER: Show ONLY classes where current user is instructor or substitute
            // This applies to ALL users (teachers, HODs, admins)
            // Empty cells in grid = FREE PERIODS (when teacher is not teaching)
            const myPersonalLectures = allLectures.filter(
                lec => lec.scheduled_teacher_id === user.id || lec.substitute_teacher_id === user.id
            );

            // Remove duplicates by lecture ID
            const uniqueLectures = Array.from(
                new Map(myPersonalLectures.map(item => [item.id, item])).values()
            );

            logger.debug(`My Timetable: Found ${uniqueLectures.length} personal classes for user ${user.id}`);
            setLectures(uniqueLectures);

        } catch (err) {
            logger.error('Fetch lectures error:', err);
            // Fallback: try alternative endpoint
            try {
                const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                const fetchDay = (day) => api.get(`/schedule?date=${day}`);
                const dayResults = await Promise.all(weekDays.map(day => fetchDay(day)));
                const allLectures = dayResults.map(r => r.data.success ? r.data.schedule : []).flat();

                // Same personal filtering
                const myPersonalLectures = allLectures.filter(
                    l => l.scheduled_teacher_id === user.id || l.substitute_teacher_id === user.id
                );

                setLectures(Array.from(new Map(myPersonalLectures.map(item => [item.id, item])).values()));
            } catch (e2) {
                logger.error("Fallback fetch failed", e2);
            }
        } finally {
            setLoading(false);
        }
    };

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; // Removed Sunday & Saturday

    const getDayLectures = (day) => {
        return lectures.filter(lec => lec.day_of_week === day).sort((a, b) =>
            a.start_time.localeCompare(b.start_time)
        );
    };

    // Helper function to format time to 12-hour format
    const formatTime12Hour = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Build schedule layout from time slots or use default
    let lectureCounter = 0; // Track period numbers
    const scheduleLayout = timeSlots.length > 0
        ? timeSlots.filter(t => t.is_active).map(slot => {
            const config = {
                type: slot.slot_type,
                startTime: slot.start_time,
                endTime: slot.end_time,
                label: slot.name
            };
            if (slot.slot_type === 'lecture') {
                lectureCounter++;
                config.periodNumber = lectureCounter;
            }
            return config;
        })
        : [  // Fallback with period numbers
            { type: 'lecture', startTime: '08:00', endTime: '10:00', label: '08:00 - 10:00', periodNumber: 1 },
            { type: 'break', startTime: '10:00', endTime: '10:15', label: 'BREAK' },
            { type: 'lecture', startTime: '10:15', endTime: '11:15', label: '10:15 - 11:15', periodNumber: 2 },
            { type: 'lecture', startTime: '11:15', endTime: '12:15', label: '11:15 - 12:15', periodNumber: 3 },
            { type: 'break', startTime: '12:15', endTime: '12:45', label: 'LUNCH' },
            { type: 'lecture', startTime: '12:45', endTime: '13:45', label: '12:45 - 13:45', periodNumber: 4 },
            { type: 'lecture', startTime: '13:45', endTime: '14:45', label: '13:45 - 14:45', periodNumber: 5 }
        ];

    const isTimeMatch = (lectureTime, slotTime) => {
        if (!lectureTime || !slotTime) return false;
        if (lectureTime === slotTime) return true;

        const [lHour, lMin] = lectureTime.split(':').map(Number);
        const [sHour, sMin] = slotTime.split(':').map(Number);
        const lTotal = lHour * 60 + lMin;
        const sTotal = sHour * 60 + sMin;

        return Math.abs(lTotal - sTotal) <= 15;
    };

    const getLectureForSlot = (dayIndex, slot) => {
        if (slot.type === 'break') return null;

        const day = weekDays[dayIndex];
        return lectures.find(lec =>
            lec.day_of_week === day &&
            isTimeMatch(lec.start_time, slot.startTime)
        );
    };

    const getCurrentTime = () => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    };

    const isCurrentLecture = (lecture) => {
        const today = new Date().toISOString().split('T')[0];
        if (lecture.date !== today) return false;

        const currentTime = getCurrentTime();
        return currentTime >= lecture.start_time && currentTime <= lecture.end_time;
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
            {/* Clean Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            My Timetable
                        </span>
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Your personal teaching schedule</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    {/* View mode toggle */}
                    <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'day' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Week
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-32">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading schedule...</p>
                </div>
            ) : viewMode === 'week' ? (
                /* Week View - Table Grid matching MasterSchedule */
                <div className="bg-[#0f172a]/60 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden ring-1 ring-white/5">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    {/* Corner Header */}
                                    <th className="sticky left-0 top-0 bg-[#0f172a]/95 backdrop-blur-xl p-4 text-left border-b border-white/10 border-r border-white/10 z-[60] w-[150px] shadow-lg shadow-black/20">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Day</span>
                                            <span className="text-[10px] text-slate-600 font-mono">Time →</span>
                                        </div>
                                    </th>

                                    {/* Time Slot Headers */}
                                    {scheduleLayout.map((slot, index) => {
                                        if (slot.type === 'break') {
                                            return (
                                                <th key={`break-${index}`} className="sticky top-0 bg-[#0f172a]/90 backdrop-blur-sm p-0 z-50 border-b border-white/5">
                                                    <div className="h-full w-full flex items-center justify-center bg-stripes-white/[0.02]">
                                                        <span className="writing-vertical-lr text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em] opacity-50 py-4">
                                                            {slot.label}
                                                        </span>
                                                    </div>
                                                </th>
                                            );
                                        }
                                        return (
                                            <th key={`period-${index}`} className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-xl p-3 z-50 border-b border-white/10">
                                                <div className="flex flex-col items-center justify-center gap-0.5">
                                                    <span className="font-mono text-sm font-bold text-indigo-200 whitespace-nowrap">
                                                        {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)}
                                                    </span>
                                                    <span className="text-[9px] font-medium text-slate-500 whitespace-nowrap">
                                                        Period {slot.periodNumber}
                                                    </span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Days as Rows */}
                                {weekDays.map((day, dayIdx) => (
                                    <tr key={dayIdx} className="group/row bg-transparent hover:bg-white/[0.01] transition-colors">
                                        {/* Row Header: Day */}
                                        <td className="sticky left-0 bg-[#0f172a]/95 backdrop-blur-xl p-4 border-r border-white/10 border-b border-white/5 z-40 group-hover/row:bg-[#0f172a]">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-sm font-bold text-slate-300">
                                                    {day}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Time Slots */}
                                        {scheduleLayout.map((slot, colIdx) => {
                                            if (slot.type === 'break') {
                                                return (
                                                    <td key={`break-cell-${dayIdx}-${colIdx}`} className="p-0 border-b border-white/5 relative bg-white/[0.01]">
                                                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xIDNIMlYySDFDMzBaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjAyIi8+PC9zdmc+')] opacity-30" />
                                                    </td>
                                                );
                                            }

                                            const lecture = getLectureForSlot(dayIdx, slot);

                                            return (
                                                <td key={`cell-${dayIdx}-${colIdx}`} className="p-2 border-b border-white/5 h-[140px] align-top relative group/cell">
                                                    <AnimatePresence mode='wait'>
                                                        {lecture ? (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.95 }}
                                                                className={`h-full group relative p-3.5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1e293b]/80 to-[#0f172a]/80 hover:from-indigo-900/40 hover:to-[#0f172a] backdrop-blur-md transition-all duration-300 cursor-default shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden ${isCurrentLecture(lecture) ? 'ring-2 ring-indigo-500/50 shadow-indigo-500/20' : ''}`}
                                                            >
                                                                {/* Ambient Gradient */}
                                                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-700 pointer-events-none mix-blend-screen" />
                                                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none mix-blend-screen" />

                                                                <div className="flex flex-col h-full justify-between relative z-10 w-full gap-3">
                                                                    <div>
                                                                        <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-indigo-100/90 text-[13px] leading-snug mb-2 line-clamp-2" title={lecture.subject}>
                                                                            {lecture.subject}
                                                                        </div>

                                                                        {/* Metadata Badges */}
                                                                        <div className="flex flex-col gap-1.5">
                                                                            <div className="flex items-center gap-2 text-[10px] font-medium text-indigo-200/90 bg-indigo-500/10 border border-indigo-500/10 px-2.5 py-1 rounded-md w-max max-w-full">
                                                                                <UserCircle size={12} weight="duotone" className="text-indigo-400 shrink-0" />
                                                                                <span className="truncate">{lecture.class_year}</span>
                                                                            </div>

                                                                            {lecture.room && (
                                                                                <div className="flex items-center gap-2 text-[10px] font-medium text-emerald-200/90 bg-emerald-500/10 border border-emerald-500/10 px-2.5 py-1 rounded-md w-max max-w-full">
                                                                                    <MapPin size={12} weight="duotone" className="text-emerald-400 shrink-0" />
                                                                                    <span className="truncate">{lecture.room}</span>
                                                                                </div>
                                                                            )}

                                                                            {isCurrentLecture(lecture) && (
                                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 mt-1">
                                                                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                                                                                    <span>Live Now</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity duration-300">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <div className='w-1 h-1 rounded-full bg-slate-700/50' />
                                                                    <span className="text-[9px] text-slate-600 font-medium uppercase tracking-wider">Free</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </AnimatePresence>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Day View - Timeline */
                <DayTimeline
                    lectures={getDayLectures(selectedDay)}
                    selectedDay={selectedDay}
                    isCurrentLecture={isCurrentLecture}
                    user={user}
                />
            )
            }
        </div >
    );
};

// Day Timeline Component
const DayTimeline = ({ lectures, selectedDay, isCurrentLecture, user }) => {
    // Convert 24-hour to 12-hour format
    const formatTime12Hour = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'border-emerald-500/50 bg-emerald-500/5';
            case 'cancelled': return 'border-rose-500/50 bg-rose-500/5';
            case 'sub_assigned': return 'border-amber-500/50 bg-amber-500/5';
            default: return 'border-indigo-500/50 bg-indigo-500/5';
        }
    };

    const getStatusIcon = (lecture) => {
        if (lecture.status === 'completed') {
            return <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center"><span className="text-white text-xs">✓</span></div>;
        }
        if (isCurrentLecture(lecture)) {
            return <div className="w-6 h-6 bg-indigo-400 rounded-full animate-pulse" />;
        }
        return <div className="w-6 h-6 border-2 border-slate-600 rounded-full" />;
    };

    return (
        <div className="glass p-8 rounded-3xl border border-white/5">
            <h2 className="text-xl font-bold text-white mb-8">
                {selectedDay}
            </h2>

            {lectures.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-xl">
                    <Calendar size={48} className="mx-auto mb-4 opacity-20 text-slate-500" />
                    <p className="text-slate-500">No classes scheduled for this day</p>
                    <p className="text-slate-600 text-sm mt-2">You have a free day!</p>
                </div>
            ) : (
                <div className="space-y-6 relative">
                    <div className="absolute left-[52px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 via-indigo-500/20 to-transparent"></div>

                    {lectures.map((lecture, idx) => (
                        <motion.div
                            key={lecture.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex gap-6 relative"
                        >
                            <div className="flex flex-col items-end w-20 shrink-0">
                                <div className="text-sm font-bold text-white">{formatTime12Hour(lecture.start_time)}</div>
                                <div className="text-xs text-slate-500">{formatTime12Hour(lecture.end_time)}</div>
                            </div>

                            <div className="shrink-0 z-10 relative">
                                {getStatusIcon(lecture)}
                            </div>

                            <div className={`flex-1 p-6 rounded-2xl border-2 ${getStatusColor(lecture.status)} ${isCurrentLecture(lecture) ? 'ring-2 ring-indigo-500/50' : ''} transition-all hover:scale-[1.02]`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{lecture.subject}</h3>
                                        <div className="flex items-center gap-3 text-sm text-slate-400 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Users size={14} />
                                                {lecture.class_year}
                                            </span>
                                            {lecture.room && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={14} />
                                                        Room {lecture.room}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase whitespace-nowrap ${isCurrentLecture(lecture) ? 'bg-indigo-500/20 text-indigo-400' :
                                        lecture.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                            lecture.status === 'cancelled' ? 'bg-rose-500/20 text-rose-400' :
                                                'bg-slate-500/20 text-slate-400'
                                        }`}>
                                        {isCurrentLecture(lecture) ? '● Live Now' : lecture.status.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                {lecture.topic_covered && (
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 mt-3">
                                        <div className="text-xs text-slate-500 mb-1">Topic Covered:</div>
                                        <div className="text-sm text-slate-300">{lecture.topic_covered}</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PersonalTimetable;
