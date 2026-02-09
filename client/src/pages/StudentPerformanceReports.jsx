import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion } from 'framer-motion';
import {
    ChartBar,
    TrendUp,
    User,
    Medal,
    BookOpen
} from '@phosphor-icons/react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';

import CustomSelect from '../components/ui/CustomSelect';
import { useAcademicYears, useDepartments } from '../hooks/useConfig';

const StudentPerformanceReports = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [classFilter, setClassFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');

    // Config Hooks
    const { data: academicYears } = useAcademicYears();
    const { data: departments } = useDepartments();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students?limit=10000'); // Fetch all for client-side filtering
            if (res.data.success) {
                setStudents(res.data.students);
            }
        } catch (err) {
            logger.error('Fetch students error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.roll_no.toLowerCase().includes(searchTerm.toLowerCase());



        const matchesClass = classFilter === 'All' || student.class_year === classFilter;

        // Match Department
        let matchesDept = deptFilter === 'All';
        if (!matchesDept) {
            // Try explicit department field, or fall back to deriving from Roll No (e.g., "BSCIT-FY-001" -> "BSCIT")
            const studentDept = student.department || (student.roll_no ? student.roll_no.split('-')[0] : '');

            if (studentDept) {
                // Normalize both for comparison (remove dots, spaces, uppercase)
                const cleanFilter = deptFilter.replace(/[.\s]/g, '').toUpperCase(); // e.g., "B.Sc. IT" -> "BSCIT"
                const cleanStudentDept = studentDept.replace(/[.\s]/g, '').toUpperCase(); // e.g., "BSCIT" -> "BSCIT"

                // Check if they match or if one contains the other (handling "IT" vs "B.Sc. IT")
                matchesDept = cleanStudentDept === cleanFilter || cleanStudentDept.includes(cleanFilter) || cleanFilter.includes(cleanStudentDept);
            } else {
                matchesDept = false;
            }
        }

        return matchesSearch && matchesClass && matchesDept;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-4 h-[calc(100vh-80px)] flex flex-col">
            {/* Header */}
            <div className="shrink-0">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ChartBar weight="duotone" className="text-indigo-400" />
                    Student Performance Reports
                </h1>
                <p className="text-xs text-slate-400 mt-1">Comprehensive student analytics and progress tracking</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Left: Student List */}
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
                    {/* Search & Filters */}
                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#0B1221] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <CustomSelect
                                options={[{ value: 'All', label: 'All Depts' }, ...(departments || []).map(d => ({ value: d.code, label: d.code }))]}
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="bg-[#0B1221] border-white/10 py-1"
                            />
                            <CustomSelect
                                options={[{ value: 'All', label: 'All Years' }, ...(academicYears || []).map(y => ({ value: y.code, label: y.code }))]}
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className="bg-[#0B1221] border-white/10 py-1"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 text-slate-500 animate-pulse text-xs">Loading students...</div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                                <User size={24} className="mx-auto mb-2 opacity-50" />
                                <span className="text-xs">No students found</span>
                            </div>
                        ) : (
                            filteredStudents.map((student) => (
                                <motion.div
                                    key={student.id}
                                    onClick={() => handleSelectStudent(student)}
                                    whileHover={{ x: 4 }}
                                    className={`p-4 rounded-xl cursor-pointer border transition-all relative overflow-hidden group ${selectedStudent?.id === student.id
                                        ? 'bg-gradient-to-r from-indigo-900/40 to-slate-900/60 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                        : 'glass border-white/5 hover:border-indigo-500/30'
                                        }`}
                                >
                                    {selectedStudent?.id === student.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className={`font-bold text-sm ${selectedStudent?.id === student.id ? 'text-indigo-300' : 'text-white group-hover:text-indigo-200'}`}>
                                                {student.name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{student.roll_no}</span>
                                                <span className="text-[10px] text-slate-500">{student.class_year}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Performance Details */}
                <div className="flex-1 glass rounded-3xl flex flex-col overflow-hidden relative border border-white/5 shadow-2xl">
                    {!selectedStudent ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-10 relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                            <ChartBar size={64} className="opacity-20 mb-6 text-indigo-500" weight="duotone" />
                            <p className="text-lg font-medium text-slate-400">No Student Selected</p>
                            <p className="text-sm text-slate-500 mt-2">Select a student from the list to view their report.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Student Profile Header */}
                            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl font-bold border border-indigo-500/30 shadow-lg shadow-indigo-900/20">
                                            {selectedStudent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{selectedStudent.name}</h2>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                                <span className="flex items-center gap-1.5">
                                                    <User size={14} weight="bold" className="text-indigo-400" />
                                                    {selectedStudent.roll_no}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                <span>{selectedStudent.class_year}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                <span className="text-slate-500">{selectedStudent.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            Active Student
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Empty State Content */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-4 md:p-6 lg:p-8 custom-scrollbar flex flex-col items-center justify-center">
                                <div className="max-w-md text-center">
                                    <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-800/50 border border-white/5 flex items-center justify-center mb-6 rotated-3d relative group">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <Medal size={40} className="text-slate-600 group-hover:text-indigo-400 transition-colors relative z-10" weight="duotone" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Performance Records</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                        There are no academic performance records, grades, or attendance stats available for <span className="text-indigo-300">{selectedStudent.name}</span> yet.
                                    </p>
                                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-300/70">
                                        Once exams are conducted and grades are uploaded, performance analytics will appear here automatically.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentPerformanceReports;
