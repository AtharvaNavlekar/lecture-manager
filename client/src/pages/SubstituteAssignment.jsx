import logger from '@/utils/logger';

import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
    UsersThree,
    BookOpen,
    ChalkboardTeacher,
    ArrowsLeftRight,
    CheckCircle,
    WarningCircle,
    UserCircle,
    Clock,
    CalendarBlank,
    PaperPlaneRight,
    Plus,
    ShieldWarning,
    X,
    CircleNotch
} from '@phosphor-icons/react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomDropdown from '../components/CustomDropdown';

const SubstituteAssignment = () => {
    const { user } = useContext(AuthContext);
    const [lectures, setLectures] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        assignedToday: 0,
        pending: 0
    });

    // Dynamic Availability State
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);

    // Request form state
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [myLectures, setMyLectures] = useState([]);
    const [selectedRequestLecture, setSelectedRequestLecture] = useState(null);
    const [requestForm, setRequestForm] = useState({
        date: '',
        time_slot: '',
        subject: '',
        class_year: '',
        reason: ''
    });
    const [submittingRequest, setSubmittingRequest] = useState(false);

    // HOD Override state
    const [overrideMode, setOverrideMode] = useState(false);
    const [overrideJustification, setOverrideJustification] = useState('');
    const [substituteWorkload, setSubstituteWorkload] = useState({});

    const isHOD = user?.is_hod === 1 || user?.is_acting_hod === 1;

    useEffect(() => {
        fetchData();
    }, []);

    // Define fetchAvailableTeachers before the useEffect that uses it
    const fetchAvailableTeachers = useCallback(async () => {
        try {
            setLoadingAvailable(true);
            const { data } = await api.get('/leaves/teachers/available', {
                params: {
                    lecture_id: selectedLecture?.id,
                    ignore_department: overrideMode ? 'true' : 'false'
                }
            });
            setAvailableTeachers(data.available || []);
        } catch (err) {
            logger.error('Error fetching available teachers', err);
            toast.error("Failed to check teacher availability");
        } finally {
            setLoadingAvailable(false);
        }
    }, [selectedLecture, overrideMode]);

    // Fetch available teachers when lecture selected or override mode changes
    useEffect(() => {
        if (selectedLecture) {
            fetchAvailableTeachers();
        } else {
            setAvailableTeachers([]);
        }
    }, [selectedLecture, overrideMode, fetchAvailableTeachers]);

    // Calculate same-department teacher count
    const sameDeptCount = useMemo(() => {
        if (!selectedLecture || !availableTeachers.length || overrideMode) return 0;

        const originalTeacher = teachers.find(
            t => t.id === selectedLecture.scheduled_teacher_id
        );

        if (!originalTeacher) return 0;

        return availableTeachers.filter(
            t => t.department === originalTeacher.department
        ).length;
    }, [selectedLecture, availableTeachers, teachers, overrideMode]);



    const fetchData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

            const [lecRes, teachRes, assignmentsRes, monthlyAssignmentsRes] = await Promise.all([
                api.get('/leaves/lectures/needingsubstitutes'),
                api.get('/teachers'),
                api.get('/leaves/substitute/report?start_date=' + today + '&end_date=' + today),
                api.get('/leaves/substitute/report?start_date=' + startOfMonth + '&end_date=' + today)
            ]);

            setLectures(lecRes.data.lectures || []);
            setTeachers(teachRes.data.teachers || []);

            // Calculate workload per teacher (monthly)
            const monthlyAssignments = monthlyAssignmentsRes.data.details || [];
            const workloadMap = {};
            monthlyAssignments.forEach(assignment => {
                const teacherId = assignment.substitute_teacher_id;
                workloadMap[teacherId] = (workloadMap[teacherId] || 0) + 1;
            });
            setSubstituteWorkload(workloadMap);

            // Calculate stats from assignment data
            const assignments = assignmentsRes.data.details || [];
            console.log('[DEBUG] Today assignments:', assignments);
            console.log('[DEBUG] Monthly assignments:', monthlyAssignments);
            setStats({
                assignedToday: assignments.length,
                pending: lecRes.data.lectures?.length || 0
            });
            console.log('[DEBUG] Stats updated:', { assignedToday: assignments.length, pending: lecRes.data.lectures?.length || 0 });
        } catch (err) {
            logger.error('Fetch error:', err);
            logger.error('Error response:', err.response?.data);
            toast.error(err.response?.data?.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (teacherId) => {
        if (!selectedLecture) return;

        // Check if override is being used
        const originalTeacher = teachers.find(t => t.id === selectedLecture.scheduled_teacher_id);
        const substituteTeacher = teachers.find(t => t.id === teacherId);
        const isDifferentDept = originalTeacher?.department !== substituteTeacher?.department;

        if (isDifferentDept && !overrideMode) {
            toast.error("Cannot assign substitute from different department. Use override if necessary.");
            return;
        }

        if (isDifferentDept && overrideMode && !overrideJustification.trim()) {
            toast.error("Override justification is required for cross-department assignments");
            return;
        }

        try {
            await api.post('/leaves/substitute/assign', {
                lecture_id: selectedLecture.id,
                original_teacher_id: selectedLecture.scheduled_teacher_id,
                substitute_teacher_id: teacherId,
                leave_request_id: selectedLecture.leave_id,
                notes: isDifferentDept ? `DEPT OVERRIDE: ${overrideJustification}` : ''
            });

            console.log('[DEBUG] Assignment successful, refreshing data...');
            toast.success(isDifferentDept ? "Cross-department assignment successful (override used)" : "Substitute assigned successfully");
            setLectures(prev => prev.filter(l => l.id !== selectedLecture.id));
            setSelectedLecture(null);
            setOverrideMode(false);
            setOverrideJustification('');
            // Refresh stats after assignment
            fetchData();
        } catch (err) {
            logger.error('Assignment error:', err);
            toast.error(err.response?.data?.message || "Assignment failed");
        }
    };

    const getAvailableTeachers = () => {
        if (!selectedLecture) return [];

        // Sort the backend-fetched teachers by workload
        return [...availableTeachers].sort((a, b) => {
            const workloadA = substituteWorkload[a.id] || 0;
            const workloadB = substituteWorkload[b.id] || 0;
            return workloadA - workloadB;
        });
    };

    const getWorkloadBadge = (teacherId) => {
        const count = substituteWorkload[teacherId] || 0;
        if (count >= 5) return { text: `${count} this month`, color: 'bg-rose-500/20 text-rose-400', icon: '⚠️' };
        if (count >= 3) return { text: `${count} this month`, color: 'bg-amber-500/20 text-amber-400', icon: '📊' };
        return { text: count > 0 ? `${count} this month` : 'Available', color: 'bg-emerald-500/20 text-emerald-400', icon: '✓' };
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        setSubmittingRequest(true);

        try {
            await api.post('/leaves/substitute/request', {
                date: requestForm.date,
                time_slot: requestForm.time_slot,
                subject: requestForm.subject,
                class_year: requestForm.class_year,
                reason: requestForm.reason,
                teacher_id: user.id
            });

            toast.success("Substitute request submitted successfully");
            setRequestForm({
                date: '',
                time_slot: '',
                subject: '',
                class_year: '',
                reason: ''
            });
            setShowRequestForm(false);
            fetchData(); // Refresh data
        } catch (err) {
            logger.error('Request submission error:', err);
            toast.error(err.response?.data?.message || "Failed to submit request");
        } finally {
            setSubmittingRequest(false);
        }
    };

    // Define fetchMySchedule before the useEffect that uses it
    const fetchMySchedule = useCallback(async () => {
        try {
            const { data } = await api.get('/leaves/teacher/schedule', {
                params: {
                    date: requestForm.date,
                    teacher_id: user.id
                }
            });
            setMyLectures(data.lectures || []);
            // Reset selected lecture if date changes
            setSelectedRequestLecture(null);
            setRequestForm(prev => ({
                ...prev,
                time_slot: '',
                subject: '',
                class_year: ''
            }));
        } catch (err) {
            logger.error('Error fetching schedule', err);
        }
    }, [requestForm.date, user.id]);

    // Fetch my lectures when date changes in request form
    useEffect(() => {
        if (showRequestForm && requestForm.date) {
            fetchMySchedule();
        }
    }, [requestForm.date, showRequestForm, fetchMySchedule]);



    const handleRequestLectureChange = (lectureId) => {
        const lecture = myLectures.find(l => l.id === parseInt(lectureId));
        if (lecture) {
            setSelectedRequestLecture(lecture);
            setRequestForm(prev => ({
                ...prev,
                time_slot: lecture.time_slot,
                subject: lecture.subject,
                class_year: lecture.class_year
            }));
        }
    };

    const StatCard = (props) => {
        const { icon: IconComponent, label, value, color, bg, border } = props;
        return (
            <div className={`glass p-6 rounded-3xl border ${border} relative overflow-hidden`}>
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${bg} blur-xl opacity-50`} />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tighter mb-1">{value}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{label}</div>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${bg} ${color}`}>
                        <IconComponent weight="duotone" />
                    </div>
                </div>
            </div>
        );
    };

    // Helper to format lecture time
    const formatLectureTime = (lecture) => {
        if (!lecture) return '';

        // Helper specifically for 12h format
        const to12h = (t) => {
            if (!t) return '';
            const [h, m] = t.split(':').map(Number);
            const period = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
        };

        if (lecture.start_time && lecture.end_time) {
            return `${to12h(lecture.start_time)} - ${to12h(lecture.end_time)}`;
        }

        // Fallback or if time_slot is already formatted string
        return lecture.time_slot;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <ArrowsLeftRight className="text-indigo-400" weight="duotone" />
                        Substitute Operations
                    </h1>
                    <p className="text-slate-400 mt-2">Manage coverage and view substitution history.</p>
                </div>
                <button
                    onClick={() => setShowRequestForm(!showRequestForm)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2"
                >
                    <Plus size={20} weight="bold" />
                    Request Substitute
                </button>
            </div>

            {/* Request Form - Only for Teachers */}
            {showRequestForm && (
                <div className="glass rounded-3xl border border-indigo-500/20 overflow-hidden">
                    <form onSubmit={handleSubmitRequest} className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <PaperPlaneRight className="text-indigo-400" weight="fill" />
                            Request Substitute Coverage
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <CustomDatePicker
                                    label="Date of Absence"
                                    value={requestForm.date}
                                    onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })}
                                    placeholder="Select date"
                                />
                            </div>

                            {requestForm.date && (
                                <div className="md:col-span-2">
                                    <CustomDropdown
                                        label="Select Lecture to Cover"
                                        value={selectedRequestLecture?.id || ''}
                                        onChange={handleRequestLectureChange}
                                        options={myLectures.map(l => {
                                            // Format time slot for display in Dropdown using main helper
                                            const displayTime = formatLectureTime(l);
                                            return {
                                                value: l.id,
                                                label: `${displayTime} • ${l.subject} (${l.class_year})`
                                            };
                                        })}
                                        placeholder={myLectures.length > 0 ? "Choose a lecture..." : "No lectures found for this date"}
                                    />
                                </div>
                            )}

                            {selectedRequestLecture && (
                                <>
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                                        <div className="text-xs text-slate-400 font-bold uppercase">Time Slot</div>
                                        <div className="text-white font-mono">{formatLectureTime(selectedRequestLecture)}</div>
                                    </div>
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                                        <div className="text-xs text-slate-400 font-bold uppercase">Class / Year</div>
                                        <div className="text-white">{requestForm.class_year}</div>
                                    </div>
                                    <div className="md:col-span-2 p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                                        <div className="text-xs text-slate-400 font-bold uppercase">Subject</div>
                                        <div className="text-white font-bold">{requestForm.subject}</div>
                                    </div>
                                </>
                            )}

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason</label>
                                <textarea
                                    value={requestForm.reason}
                                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                                    placeholder="Brief reason for substitute request..."
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                                    rows="3"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="submit"
                                disabled={submittingRequest}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center gap-2"
                            >
                                <PaperPlaneRight weight="bold" />
                                {submittingRequest ? 'Submitting...' : 'Submit Request'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowRequestForm(false)}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon={BookOpen}
                    label="Needs Cover"
                    value={lectures.length}
                    color="text-rose-400"
                    bg="bg-rose-500/10"
                    border="border-rose-500/20"
                />
                <StatCard
                    icon={UsersThree}
                    label="Available Staff"
                    value={selectedLecture ? getAvailableTeachers().length : teachers.filter(t => t.is_active && t.department === user?.department).length}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    border="border-emerald-500/20"
                />
                <StatCard
                    icon={ChalkboardTeacher}
                    label="Assigned Today"
                    value={stats.assignedToday}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    border="border-blue-500/20"
                />
                <StatCard
                    icon={Clock}
                    label="Pending"
                    value={stats.pending}
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                    border="border-amber-500/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
                {/* Left: Lectures Needing Cover */}
                <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <WarningCircle className="text-rose-400" weight="fill" /> Lectures Needing Coverage
                    </h3>

                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 text-slate-500">Loading schedules...</div>
                        ) : lectures.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <CheckCircle size={48} className="text-emerald-500/20 mb-4" weight="duotone" />
                                <p>All classes covered!</p>
                            </div>
                        ) : (
                            lectures.map(lecture => (
                                <div
                                    key={lecture.id}
                                    onClick={() => setSelectedLecture(lecture)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all group ${selectedLecture?.id === lecture.id
                                        ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/20'
                                        : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className={`font-bold ${selectedLecture?.id === lecture.id ? 'text-white' : 'text-slate-200'}`}>
                                                {lecture.subject}
                                            </h4>
                                            <p className={`text-sm mt-1 ${selectedLecture?.id === lecture.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                                                {lecture.teacher_name} (Absent)
                                            </p>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-bold ${selectedLecture?.id === lecture.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                            {lecture.class_year}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 text-xs font-medium opacity-80">
                                        <span className={`flex items-center gap-1 ${selectedLecture?.id === lecture.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            <Clock weight="bold" /> {formatLectureTime(lecture)}
                                        </span>
                                        <span className={`flex items-center gap-1 ${selectedLecture?.id === lecture.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            <CalendarBlank weight="bold" /> {new Date(lecture.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Available Teachers */}
                <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col h-full relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <UsersThree className="text-emerald-400" weight="fill" /> Available Substitutes
                            {selectedLecture && !overrideMode && (
                                <span className="ml-2 text-xs font-medium text-slate-500">
                                    ({sameDeptCount} from same dept)
                                </span>
                            )}
                            {overrideMode && (
                                <span className="ml-2 px-2 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded">
                                    OVERRIDE MODE
                                </span>
                            )}
                        </h3>
                    </div>

                    {!selectedLecture ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                            <ChalkboardTeacher size={48} className="opacity-20 mb-4" weight="duotone" />
                            <p>Select a lecture to find substitutes</p>
                        </div>
                    ) : (
                        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {/* HOD Override Section */}
                            {isHOD && (
                                <div className="mb-4 p-3 bg-slate-800/50 border border-white/10 rounded-xl">
                                    {!overrideMode ? (
                                        <button
                                            onClick={() => setOverrideMode(true)}
                                            className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <ShieldWarning size={18} weight="fill" />
                                            Override Department Restriction
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-rose-400">Override Active</span>
                                                <button
                                                    onClick={() => {
                                                        setOverrideMode(false);
                                                        setOverrideJustification('');
                                                    }}
                                                    className="text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            <textarea
                                                value={overrideJustification}
                                                onChange={(e) => setOverrideJustification(e.target.value)}
                                                placeholder="Enter justification for cross-department assignment (required)..."
                                                className="w-full bg-slate-950/50 border border-rose-500/30 rounded-lg py-2 px-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all resize-none"
                                                rows="2"
                                            />
                                            <p className="text-xs text-slate-500">Showing all teachers from all departments</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Matching for:</span>
                                <span className="text-sm font-bold text-white">{selectedLecture.subject} • {selectedLecture.time_slot}</span>
                            </div>

                            {loadingAvailable ? (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <CircleNotch size={32} className="animate-spin mb-3 text-indigo-400" />
                                    <p>Checking teacher schedules...</p>
                                </div>
                            ) : getAvailableTeachers().length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <p>No available teachers {!overrideMode && `from ${teachers.find(t => t.id === selectedLecture.scheduled_teacher_id)?.department} department`}</p>
                                    <p className="text-xs mt-1">All qualified teachers are busy at this time.</p>
                                    {!overrideMode && isHOD && (
                                        <p className="text-xs mt-2 text-indigo-400">Use override to find teachers from other departments</p>
                                    )}
                                </div>
                            ) : (
                                getAvailableTeachers().map(teacher => {
                                    const workloadBadge = getWorkloadBadge(teacher.id);
                                    const isDifferentDept = teacher.department !== teachers.find(t => t.id === selectedLecture.scheduled_teacher_id)?.department;

                                    return (
                                        <div key={teacher.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                        <UserCircle size={24} weight="duotone" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-white flex items-center gap-2">
                                                            {teacher.name}
                                                            {isDifferentDept && (
                                                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded font-bold">
                                                                    {teacher.department}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{teacher.department} Department</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAssign(teacher.id)}
                                                    className="px-4 py-2 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all border border-white/5 hover:shadow-lg hover:shadow-emerald-500/20"
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className={`text-xs px-2 py-1 rounded font-bold ${workloadBadge.color}`}>
                                                    {workloadBadge.icon} {workloadBadge.text}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubstituteAssignment;
