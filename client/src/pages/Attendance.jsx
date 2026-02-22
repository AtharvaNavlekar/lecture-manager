import logger from '@/utils/logger';

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    Clock,
    ArrowLeft,
    Users,
    Funnel,
    Star
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import CustomSelect from '../components/ui/CustomSelect';
import SandyLoader from '../components/SandyLoader';

const Attendance = () => {
    const { id, classYear } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Syllabus Tracking
    const [lectureDetails, setLectureDetails] = useState(null);
    const [syllabusTopics, setSyllabusTopics] = useState([]);

    const [predictions, setPredictions] = useState({});

    useEffect(() => {
        // Ensure params are valid before loading
        // Wait for user context to be ready
        console.log("Attendance: useEffect triggered", { id, classYear, user: !!user });
        if (id && classYear && user) {
            loadData();
        }

        // Safety timeout to prevent infinite loading
        const timer = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn("Attendance: Force stopping loading due to timeout");
                    toast.error("Loading timed out. Please try refreshing.");
                    return false;
                }
                return prev;
            });
        }, 8000); // 8 seconds timeout

        return () => clearTimeout(timer);
    }, [id, classYear, user]); // Added user to dependencies

    const loadData = async () => {
        console.log("Attendance: loadData started", { id, classYear });
        // Safety check: Don't proceed if params are missing
        if (!id || !classYear) {
            console.warn("Attendance: Missing params", { id, classYear });
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log("Attendance: Fetching data from API...");

            const [rosterRes, aiRes] = await Promise.all([
                api.get(`/attendance/roster/${id}/${classYear}`),
                api.get('/ai/forecast').catch(err => {
                    console.warn("Attendance: AI forecast failed", err);
                    return { data: { predictions: [] } };
                })
            ]);

            console.log("Attendance: Data fetched", { rosterSize: rosterRes.data?.roster?.length || rosterRes.data?.length });

            // Handle new response format { roster, lecture }
            const students = rosterRes.data.roster || rosterRes.data;
            const details = rosterRes.data.lecture || {};

            const normalized = students.map(s => ({
                ...s,
                status: s.status || 'pending'
            }));
            setRoster(normalized);
            setLectureDetails(details);

            // Map predictions by student ID for O(1) lookup
            const predMap = {};
            if (aiRes.data?.predictions) {
                aiRes.data.predictions.forEach(p => {
                    predMap[p.student.id] = p.risk;
                });
            }
            setPredictions(predMap);

            // Fetch Syllabus if subject is known and user is available
            if (details.subject && user?.department) {
                console.log("Attendance: Fetching syllabus for", details.subject);
                const subRes = await api.get(`/subjects?department=${user.department}`);
                const subject = subRes.data.subjects?.find(s => details.subject.includes(s.name) || s.name.includes(details.subject));

                if (subject) {
                    const topicsRes = await api.get(`/subjects/${subject.id}/topics`);
                    setSyllabusTopics(topicsRes.data.topics || []);
                }
            }

            setLoading(false);
        } catch (e) {
            logger.error("Attendance: Load failed", e);
            console.error("Attendance: Load failed", e);
            toast.error("Failed to load attendance data");
            setLoading(false);
        }
    };

    const markStudent = async (studentId, status) => {
        // Optimistic Update with sound effect logic (optional but "smooth")
        setRoster(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));

        try {
            await api.post('/attendance/mark', {
                lecture_id: id,
                student_id: studentId,
                status,
                user_id: user.id
            });
        } catch (e) {
            logger.error("Failed to mark", e);
            // Revert on failure could go here
        }
    };

    const markAllPresent = () => {
        toast((t) => (
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400">
                        <CheckCircle size={20} weight="bold" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Mark All Present?</h4>
                        <p className="text-sm text-slate-400 mt-1">Mark all remaining pending students as Present?</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            confirmMarkAllPresent();
                        }}
                        className="px-4 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        ), {
            duration: 8000,
            style: { background: '#0f172a', border: '1px solid rgba(16, 185, 129, 0.2)', maxWidth: '400px' }
        });
    };

    const confirmMarkAllPresent = async () => {
        const updated = roster.map(s => s.status === 'pending' || s.status === 'absent' ? { ...s, status: 'present' } : s);
        setRoster(updated);

        try {
            await api.post('/attendance/mark-all', { lecture_id: id, class_year: classYear, user_id: user.id });
        } catch (e) {
            logger.error(e);
            toast.error("Failed to mark all present");
        }
    };

    // Derived State
    const stats = useMemo(() => {
        return {
            present: roster.filter(s => s.status === 'present').length,
            absent: roster.filter(s => s.status === 'absent').length,
            late: roster.filter(s => s.status === 'late').length,
            total: roster.length
        };
    }, [roster]);

    const filteredRoster = roster.filter(s => {
        if (filter === 'all') return true;
        return s.status === filter;
    });

    console.log("Attendance: Rendering", { loading, rosterCount: roster.length, id });

    if (loading) return (
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center overflow-hidden z-[100]">
            <SandyLoader text="Loading students..." />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-8">
            {/* Header Area */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-7xl mx-auto mb-8 flex flex-col gap-6"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-3 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5"
                        >
                            <ArrowLeft weight="bold" size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-white tracking-tight">Live Classroom</h1>
                                <button
                                    onClick={loadData}
                                    className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                    title="Refresh List"
                                >
                                    <Clock size={16} weight="bold" className="animate-[spin_4s_linear_infinite_paused] hover:animate-[spin_1s_linear_infinite]" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border border-indigo-500/20">
                                    {classYear}
                                </span>
                                <span className="text-slate-400 text-sm">{lectureDetails?.subject}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
                        <FilterTab label="All" count={stats.total} active={filter === 'all'} onClick={() => setFilter('all')} />
                        <FilterTab label="Present" count={stats.present} active={filter === 'present'} color="text-emerald-400" onClick={() => setFilter('present')} />
                        <FilterTab label="Absent" count={stats.absent} active={filter === 'absent'} color="text-rose-400" onClick={() => setFilter('absent')} />
                        <FilterTab label="Late" count={stats.late} active={filter === 'late'} color="text-amber-400" onClick={() => setFilter('late')} />
                    </div>
                </div>

                {/* SYLLABUS TRACKER */}
                <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                        <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1 block">What are you teaching today?</label>
                        <CustomSelect
                            options={[
                                { value: "", label: "-- Select Syllabus Topic --" },
                                ...(syllabusTopics.length > 0 ? syllabusTopics.map(t => ({ value: t.id, label: `Unit ${t.unit_number}: ${t.title}` })) : []),
                                ...(syllabusTopics.length === 0 ? [{ value: "disabled", label: `No syllabus found for ${lectureDetails?.subject}`, disabled: true }] : []),
                                { value: "custom", label: "Custom Topic (Type manually)" }
                            ]}
                            value={lectureDetails?.syllabus_topic_id || ''}
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId === "disabled") return;
                                const topic = syllabusTopics.find(t => t.id == selectedId);
                                updateLectureTopic(topic?.title || '', selectedId);
                            }}
                            placeholder="Select Syllabus Topic"
                        />
                    </div>
                    {(!lectureDetails?.syllabus_topic_id || lectureDetails.syllabus_topic_id === 'custom') && (
                        <div className="flex-1 w-full">
                            <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1 block">Custom Topic / Notes</label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-white/10 text-white p-2.5 rounded-lg outline-none focus:border-indigo-500"
                                placeholder="e.g. Revision of Unit 1"
                                value={lectureDetails?.topic_covered || ''}
                                onBlur={(e) => updateLectureTopic(e.target.value, null)}
                                onChange={(e) => setLectureDetails(prev => ({ ...prev, topic_covered: e.target.value }))}
                            />
                        </div>
                    )}
                </div>
            </motion.header>

            {/* Stats Overview */}
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatBox label="Presence" value={`${Math.round((stats.present / (stats.total || 1)) * 100)}%`} color="text-indigo-400" bg="bg-indigo-500/10" />
                <button onClick={markAllPresent} className="col-span-2 md:col-span-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl flex flex-col items-center justify-center p-4 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 group">
                    <span className="text-lg font-bold flex items-center gap-2">
                        <CheckCircle size={24} weight="fill" /> Mark All
                    </span>
                    <span className="text-xs opacity-80 group-hover:opacity-100">Click to mark remaining</span>
                </button>
            </div>

            {/* Student Grid */}
            <motion.div
                layout
                className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
                <AnimatePresence mode='popLayout'>
                    {filteredRoster.map((student) => (
                        <StudentCard
                            key={student.id}
                            student={student}
                            risk={predictions[student.id]}
                            onMark={markStudent}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredRoster.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No students found for this filter.</p>
                </div>
            )}
        </div>
    );
};

const StudentCard = ({ student, risk, onMark }) => {
    const statusColors = {
        present: 'bg-emerald-500/10 border-emerald-500/50',
        absent: 'bg-rose-500/10 border-rose-500/50',
        late: 'bg-amber-500/10 border-amber-500/50',
        pending: 'bg-slate-800/40 border-white/5'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`backdrop-blur-md border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden group ${statusColors[student.status] || statusColors.pending}`}
        >
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={student.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
                            alt={student.name}
                            className="w-12 h-12 rounded-full bg-slate-700 object-cover border-2 border-white/10"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px]
                            ${student.status === 'present' ? 'bg-emerald-500 text-emerald-950' :
                                student.status === 'absent' ? 'bg-rose-500 text-white' :
                                    student.status === 'late' ? 'bg-amber-500 text-amber-950' : 'bg-slate-600 text-slate-300'}
                        `}>
                            {student.status === 'present' && <CheckCircle weight="fill" />}
                            {student.status === 'absent' && <XCircle weight="fill" />}
                            {student.status === 'late' && <Clock weight="fill" />}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-100 leading-tight">{student.name}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {student.id}</p>
                    </div>
                </div>
            </div>

            {risk && (
                <div className="absolute top-4 right-4 z-20">
                    <div className="group/risk relative cursor-help">
                        <Star size={24} weight="fill" className="text-violet-400 animate-pulse drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
                        <div className="absolute right-0 top-8 w-48 bg-violet-950/90 backdrop-blur-md border border-violet-500/30 p-3 rounded-xl text-[10px] text-violet-200 opacity-0 group-hover/risk:opacity-100 transition-all duration-200 pointer-events-none shadow-xl transform origin-top-right scale-95 group-hover/risk:scale-100">
                            <strong className="text-violet-100 block mb-2 text-xs">✨ AI Insight</strong>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 flex-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${risk.riskScore}%` }}></div>
                                </div>
                                <span className="font-bold text-violet-300">{risk.riskScore}% Risk</span>
                            </div>
                            <p className="leading-relaxed opacity-90">{risk.reason}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2 relative z-10">
                <StatusButton
                    active={student.status === 'present'}
                    onClick={() => onMark(student.id, 'present')}
                    color="hover:bg-emerald-500 hover:text-white"
                    activeClass="bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    icon={<CheckCircle size={20} weight={student.status === 'present' ? "fill" : "bold"} />}
                    label="Present"
                />
                <StatusButton
                    active={student.status === 'absent'}
                    onClick={() => onMark(student.id, 'absent')}
                    color="hover:bg-rose-500 hover:text-white"
                    activeClass="bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                    icon={<XCircle size={20} weight={student.status === 'absent' ? "fill" : "bold"} />}
                    label="Absent"
                />
                <StatusButton
                    active={student.status === 'late'}
                    onClick={() => onMark(student.id, 'late')}
                    color="hover:bg-amber-500 hover:text-white"
                    activeClass="bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                    icon={<Clock size={20} weight={student.status === 'late' ? "fill" : "bold"} />}
                    label="Late"
                />
            </div>
        </motion.div>
    );
};

const StatusButton = ({ active, onClick, color, activeClass, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-200 gap-1 ${active ? activeClass : `bg-slate-900/50 text-slate-400 ${color}`}`}
    >
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </button>
);

const FilterTab = ({ label, count, active, onClick, color = 'text-slate-400' }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${active ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
    >
        {label}
        <span className={`text-xs ${active ? 'text-white' : color} font-bold opacity-80`}>{count}</span>
    </button>
);

const StatBox = ({ label, value, color, bg }) => (
    <div className={`rounded-2xl p-4 flex flex-col justify-center ${bg}`}>
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
);

export default Attendance;
