import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Pencil, Trash, FileXls, UploadSimple, Clock, MapPin, UserCircle, CaretDown, Funnel } from '@phosphor-icons/react';
import CustomDropdown from '../components/CustomDropdown';
import LectureFormModal from '../components/LectureFormModal';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useAcademicYears, useDivisions, useTimeSlots } from '../hooks/useConfig';

const MasterSchedule = () => {
    const { user } = useContext(AuthContext);

    // Fixed weekly timetable - no navigation needed

    // Data and loading
    const [departments, setDepartments] = useState([]);
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dynamic config
    const { data: academicYears } = useAcademicYears();
    const { data: divisions } = useDivisions();
    const { data: timeSlots } = useTimeSlots();

    // Filters
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedClass, setSelectedClass] = useState('FY');
    const [selectedDivision, setSelectedDivision] = useState('A');

    // Fetch departments on mount
    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/teachers/departments');
            if (res.data.success) {
                setDepartments(res.data.departments);

                // Set default department based on role
                if (!selectedDept && res.data.departments.length > 0) {
                    if (user?.role === 'admin') {
                        // Admin can select any department - default to first non-Admin department
                        const defaultDept = res.data.departments.find(d => d !== 'Admin') || res.data.departments[0];
                        setSelectedDept(defaultDept);
                    } else {
                        // HOD and Teacher - lock to their own department
                        setSelectedDept(user?.department || 'IT');
                    }
                }
            }
        } catch (error) {
            logger.error('Error fetching departments:', error);
            setDepartments([]);
        }
    };

    // Import State
    const [showImport, setShowImport] = useState(false);
    const [importFile, setImportFile] = useState([]);
    const [importLog, setImportLog] = useState('');

    // Lecture CRUD modal states
    const [showLectureModal, setShowLectureModal] = useState(false);
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [modalMode, setModalMode] = useState('create');

    // Constants
    // Use dynamic config or fallback
    const classYears = academicYears.length > 0 ? academicYears.map(y => y.code) : ['FY', 'SY', 'TY'];
    const divisionsList = divisions.length > 0 ? divisions.map(d => d.code) : ['A', 'B', 'C', 'D'];
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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

    // Fetch lectures for the week
    useEffect(() => {
        if (selectedDept) {  // Only fetch if department is selected
            fetchWeekLectures();
        }
    }, [selectedDept, selectedClass, selectedDivision]);

    // Helper to format date
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const fetchWeekLectures = async () => {
        setLoading(true);
        try {
            const allLectures = [];
            // Fetch by day names instead of dates
            for (const day of weekDays) {
                logger.debug(`Fetching lectures for: day=${day}, department=${selectedDept}`);
                const res = await api.get(`/schedule?date=${day}&department=${selectedDept}`);
                if (res.data.success) {
                    logger.debug(`  ✅ Received ${res.data.schedule.length} lectures for ${day}`);
                    allLectures.push(...res.data.schedule);
                }
            }

            logger.debug(`\n📊 Total lectures fetched: ${allLectures.length}`);
            logger.debug(`🔍 Filtering for: class=${selectedClass}, division=${selectedDivision}`);

            // Filter by class and division
            const filtered = allLectures.filter(lec => {
                const classYearMatch = lec.class_year === selectedClass;
                const lecDivision = lec.division || 'A';
                const divisionMatch = lecDivision === selectedDivision;
                return classYearMatch && divisionMatch;
            });

            logger.debug(`✅ Filtered lectures: ${filtered.length}`);
            logger.debug('Sample:', filtered.slice(0, 3));

            setLectures(filtered);
        } catch (error) {
            logger.error('Error fetching lectures:', error);
            toast.error('Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    // Helper: Compare times fuzzily (within 15 mins) to handle data inconsistencies
    const isTimeMatch = (lectureTime, slotTime) => {
        if (!lectureTime || !slotTime) return false;

        // Direct string match
        if (lectureTime === slotTime) return true;

        // Hour match matching (e.g. 10:00 matches 10:15 slot if close enough? No, let's look for specific blocks)
        const [lHour, lMin] = lectureTime.split(':').map(Number);
        const [sHour, sMin] = slotTime.split(':').map(Number);

        // Convert to minutes for easier comparison
        const lTotal = lHour * 60 + lMin;
        const sTotal = sHour * 60 + sMin;

        // Allow loose matching: if lecture starts within -15/+15 mins of slot
        return Math.abs(lTotal - sTotal) <= 15;
    };

    // Helper to convert 24-hour time to 12-hour format
    const formatTime12Hour = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Get lecture for specific day and time slot
    const getLectureForSlot = (dayIndex, slot) => {
        if (slot.type === 'break') return null;

        const day = weekDays[dayIndex];
        return lectures.find(lec =>
            lec.day_of_week === day &&
            isTimeMatch(lec.start_time, slot.startTime)
        );
    };

    // ... CRUD operations (unchanged) ...
    const handleCreateLecture = () => {
        setSelectedLecture(null);
        setModalMode('create');
        setShowLectureModal(true);
    };
    const handleQuickAdd = (dayIndex, slot) => {
        // Logic to pass date/time to modal could be added here
        handleCreateLecture();
    };
    const handleEditLecture = (lecture) => {
        console.log('[MasterSchedule] Edit button clicked for lecture:', lecture);
        setSelectedLecture(lecture);
        setModalMode('edit');
        setShowLectureModal(true);
        console.log('[MasterSchedule] Modal should now be visible:', showLectureModal);
    };
    const handleDeleteLecture = (lectureId) => {
        toast((t) => (
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500/20 rounded-full text-rose-500">
                        <Trash size={20} weight="bold" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Cancel Lecture?</h4>
                        <p className="text-sm text-slate-400 mt-1">This action cannot be undone.</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            confirmDelete(lectureId);
                        }}
                        className="px-4 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold shadow-lg shadow-rose-500/20 transition-all"
                    >
                        Yes, Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: {
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '16px',
            }
        });
    };
    const confirmDelete = async (lectureId) => {
        const toastId = toast.loading('Cancelling lecture...');
        try {
            const res = await api.delete(`/lectures/${lectureId}`);
            if (res.data.success) {
                toast.success('Lecture cancelled successfully', { id: toastId });
                fetchWeekLectures();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete lecture', { id: toastId });
        }
    };
    // ... Import handler (unchanged) ...
    const handleImport = async (e) => {
        e.preventDefault();
        if (!importFile || importFile.length === 0) {
            toast.error('Please select at least one file to import');
            return;
        }

        const toastId = toast.loading('Processing files...');

        try {
            setImportLog(`Processing ${importFile.length} file(s)...`);
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < importFile.length; i++) {
                const data = new FormData();
                data.append('file', importFile[i]);

                try {
                    setImportLog(`Processing file ${i + 1}/${importFile.length}: ${importFile[i].name}`);
                    const res = await api.post('/lectures/import', data, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    successCount++;
                } catch (err) {
                    errorCount++;
                    logger.error(`Error in ${importFile[i].name}:`, err);
                }
            }

            setImportLog(`Completed! ✅ ${successCount} successful, ❌ ${errorCount} failed`);
            toast.success(`Import complete! ${successCount}/${importFile.length} successful`, { id: toastId });
            fetchWeekLectures();
            setTimeout(() => {
                setShowImport(false);
                setImportLog('');
            }, 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            setImportLog('Error: ' + errorMsg);
            toast.error(errorMsg, { id: toastId });
        }
    };

    // Get status color - Enhanced for Premium Look
    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_-5px_theme(colors.emerald.500/20)]';
            case 'cancelled':
                return 'bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20 shadow-[0_0_15px_-5px_theme(colors.rose.500/20)] grayscale';
            case 'sub_assigned':
                return 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 shadow-[0_0_15px_-5px_theme(colors.amber.500/20)]';
            default:
                return 'bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-500/20 shadow-[0_0_15px_-5px_theme(colors.indigo.500/20)]';
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
            {/* ... Header and Controls (unchanged) ... */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Master Schedule
                        </span>
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Manage and view weekly academic timetables</p>
                </div>

                {(user?.role === 'admin' || !!user?.is_hod || !!user?.is_acting_hod) && (
                    <button
                        onClick={() => setShowImport(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#0f172a] hover:bg-[#1e293b] text-indigo-400 rounded-2xl font-bold border border-indigo-500/20 hover:border-indigo-500/50 transition-all shadow-lg"
                    >
                        <FileXls size={20} weight="duotone" />
                        Bulk Upload
                    </button>
                )}
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                {/* Fixed Weekly Timetable Header */}
                <div className="flex-1 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-xl">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fixed Weekly Schedule</span>
                        <div className="flex items-center gap-3 text-white font-bold text-lg bg-white/5 px-6 py-2 rounded-lg border border-white/5">
                            <Calendar size={20} className="text-indigo-400" />
                            <span>Recurring Every Week</span>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex gap-4 bg-[#0f172a]/80 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-xl overflow-visible z-20">
                    <CustomDropdown
                        icon={<Funnel size={12} />}
                        label="Department"
                        value={selectedDept}
                        options={departments}
                        onChange={setSelectedDept}
                        disabled={user?.role !== 'admin'}
                    />
                    <CustomDropdown
                        label="Class Year"
                        value={selectedClass}
                        options={classYears}
                        onChange={setSelectedClass}
                    />
                    <CustomDropdown
                        label="Division"
                        value={`Division ${selectedDivision}`}
                        options={divisions.map(d => `Division ${d.code}`)}
                        onChange={(val) => setSelectedDivision(val.replace('Division ', ''))}
                    />
                </div>
            </div>

            {/* Timetable Grid - Custom Layout */}
            {loading ? (
                <div className="text-center py-32">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading schedule data...</p>
                </div>
            ) : (
                <div className="bg-[#0f172a]/60 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden ring-1 ring-white/5">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    {/* Corner Header */}
                                    <th className="sticky left-0 top-0 bg-[#0f172a]/95 backdrop-blur-xl p-4 text-left border-b border-white/10 border-r border-white/10 z-[60] w-[150px] shadow-lg shadow-black/20">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Day</span>
                                            <span className="text-[10px] text-slate-600 font-mono">Time &rarr;</span>
                                        </div>
                                    </th>

                                    {/* Time Slot Headers */}
                                    {scheduleLayout.map((slot, index) => {
                                        if (slot.type === 'break') {
                                            return (
                                                <th key={`break-${index}`} className={`sticky top-0 bg-[#0f172a]/90 backdrop-blur-sm p-0 z-50 border-b border-white/5 ${slot.width}`}>
                                                    <div className="h-full w-full flex items-center justify-center bg-stripes-white/[0.02]">
                                                        <span className="writing-vertical-lr text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em] opacity-50 py-4">
                                                            {slot.label}
                                                        </span>
                                                    </div>
                                                </th>
                                            );
                                        }
                                        return (
                                            <th key={`period-${index}`} className={`sticky top-0 bg-[#0f172a]/95 backdrop-blur-xl p-3 z-50 border-b border-white/10 ${slot.width}`}>
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
                                    <tr key={`day-${day}`} className="group/row bg-transparent hover:bg-white/[0.01] transition-colors">
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
                                            // Handle Break Columns
                                            if (slot.type === 'break') {
                                                return (
                                                    <td key={`break-cell-${dayIdx}-${colIdx}`} className="p-0 border-b border-white/5 relative bg-white/[0.01]">
                                                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xIDNIMlYySDFDMzBaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjAyIi8+PC9zdmc+')] opacity-30" />
                                                    </td>
                                                );
                                            }

                                            const lecture = getLectureForSlot(dayIdx, slot);

                                            return (
                                                <td key={`cell-${dayIdx}-${slot.id || colIdx}`} className="p-2 border-b border-white/5 h-[140px] align-top relative group/cell">
                                                    <AnimatePresence mode='wait'>
                                                        {lecture ? (
                                                            <motion.div
                                                                layoutId={`lecture-${lecture.id}`}
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.95 }}
                                                                className={`h-full group relative p-3.5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1e293b]/80 to-[#0f172a]/80 hover:from-indigo-900/40 hover:to-[#0f172a] backdrop-blur-md transition-all duration-300 cursor-default shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden`}
                                                            >
                                                                <>
                                                                    {/* Dynamic Ambient Mesh Gradient */}
                                                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-700 pointer-events-none mix-blend-screen" />
                                                                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none mix-blend-screen" />

                                                                    <div className="flex flex-col h-full relative z-10 w-full gap-3">
                                                                        {/* Header: Subject */}
                                                                        <div>
                                                                            <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-indigo-100/90 text-[13px] leading-snug mb-2 line-clamp-2" title={lecture.subject}>
                                                                                {lecture.subject}
                                                                            </div>

                                                                            {/* Metadata Badges */}
                                                                            <div className="flex flex-col gap-1.5">
                                                                                <div className="flex items-center gap-2 text-[10px] font-medium text-indigo-200/90 bg-indigo-500/10 border border-indigo-500/10 px-2.5 py-1 rounded-md w-max max-w-full">
                                                                                    <UserCircle size={12} weight="duotone" className="text-indigo-400 shrink-0" />
                                                                                    <span className="truncate">{lecture.teacher_name}</span>
                                                                                </div>

                                                                                <div className="flex items-center gap-2 text-[10px] font-medium text-emerald-200/90 bg-emerald-500/10 border border-emerald-500/10 px-2.5 py-1 rounded-md w-max max-w-full">
                                                                                    <MapPin size={12} weight="duotone" className="text-emerald-400 shrink-0" />
                                                                                    <span className="truncate">{lecture.room || 'TBA'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Hover Actions */}
                                                                    {Boolean((user?.role === 'admin' || user?.is_hod || user?.is_acting_hod) && lecture.status !== 'cancelled') && (
                                                                        <div className="absolute top-2 right-2 flex flex-col gap-1.5 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-50">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleEditLecture(lecture);
                                                                                }}
                                                                                className="p-1.5 bg-slate-950/60 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg border border-white/10 hover:border-indigo-500/50 backdrop-blur-md transition-all shadow-lg"
                                                                                title="Edit"
                                                                            >
                                                                                <Pencil size={12} weight="bold" />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteLecture(lecture.id);
                                                                                }}
                                                                                className="p-1.5 bg-slate-950/60 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg border border-white/10 hover:border-rose-500/50 backdrop-blur-md transition-all shadow-lg"
                                                                                title="Cancel"
                                                                            >
                                                                                <Trash size={12} weight="bold" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            </motion.div>
                                                        ) : (
                                                            (user?.role === 'admin' || user?.is_hod || user?.is_acting_hod) ? (
                                                                <motion.div
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    className="h-full w-full rounded-2xl border border-dashed border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] transition-all group/empty flex items-center justify-center cursor-pointer p-2"
                                                                    onClick={() => handleQuickAdd(dayIdx, slot)}
                                                                >
                                                                    <div className="flex flex-col items-center gap-1 opacity-0 group-hover/empty:opacity-100 transition-all duration-300 transform scale-95 group-hover/empty:scale-100">
                                                                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                                                            <Plus weight="bold" size={16} />
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ) : (
                                                                <div className="h-full w-full" />
                                                            )
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
            )}

            {/* Lecture Form Modal */}
            <LectureFormModal
                show={showLectureModal}
                onClose={() => setShowLectureModal(false)}
                onSuccess={fetchWeekLectures}
                lecture={selectedLecture}
                mode={modalMode}
            />

            {/* Import Modal */}
            {createPortal(
                <AnimatePresence>
                    {showImport && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
                            >
                                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <FileXls className="text-indigo-400" size={20} weight="duotone" />
                                    Bulk Schedule Upload
                                </h2>
                                <p className="text-xs text-slate-400 mb-4 font-medium">
                                    Upload Excel sheet to bulk schedule lectures.
                                </p>

                                <form onSubmit={handleImport} className="space-y-4">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-500/30 rounded-2xl bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all cursor-pointer group">
                                        <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                            <UploadSimple className="w-8 h-8 mb-2 text-indigo-500 group-hover:scale-110 transition-transform" />
                                            <p className="mb-1 text-xs text-slate-300"><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</p>
                                            <p className="text-[10px] text-slate-500">{importFile.length > 0 ? `${importFile.length} file(s) selected` : '.XLSX files only (multiple allowed)'}</p>
                                        </div>
                                        <input type="file" multiple accept=".xlsx" onChange={e => setImportFile(Array.from(e.target.files))} className="hidden" />
                                    </label>

                                    <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-900 p-3 rounded-lg border border-white/5">
                                        <span>Required: Date, Time, Subject, TeacherEmail</span>
                                        <a href="/api/lectures/template" target="_blank" className="text-blue-400 hover:underline">Download Template</a>
                                    </div>

                                    {importLog && (
                                        <div className={`p-4 rounded-xl text-xs font-mono font-bold ${importLog.startsWith('Error') ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                                            {importLog}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => { setShowImport(false); setImportLog(''); }} className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium">Close</button>
                                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all">
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
        </div>
    );
};

export default MasterSchedule;
