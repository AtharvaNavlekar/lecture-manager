import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import {
    FileText,
    DownloadSimple,
    ChalkboardTeacher,
    Clock,
    TrendUp
} from '@phosphor-icons/react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CustomDatePicker from '../components/CustomDatePicker';

const SubstituteReport = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState({ summary: [], details: [] });
    // Default to current month
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1); // First day of current month
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0]; // Today
    });

    const [stats, setStats] = useState({
        totalAssignments: 0,
        teachersInvolved: 0,
        lecturesCovered: 0,
        avgPerTeacher: 0
    });

    useEffect(() => {
        fetchReport();
    }, [startDate, endDate]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/leaves/substitute/report?start_date=${startDate}&end_date=${endDate}`);
            if (res.data.success) {
                const details = res.data.details || [];
                const summary = res.data.summary || [];

                setReportData({ summary, details });
                calculateStats(details);
            }
        } catch (err) {
            logger.error(err);
            toast.error("Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (details) => {
        const totalAssignments = details.length;
        const uniqueTeachers = new Set(details.map(d => d.substitute_teacher_id)).size;

        setStats({
            totalAssignments,
            teachersInvolved: uniqueTeachers,
            lecturesCovered: totalAssignments, // Assuming 1 assignment = 1 lecture covered
            avgPerTeacher: uniqueTeachers > 0 ? (totalAssignments / uniqueTeachers).toFixed(1) : 0
        });
    };

    const downloadCSV = () => {
        if (!reportData.details.length) {
            toast.error("No data to export");
            return;
        }

        const headers = ['Date', 'Time', 'Original Teacher', 'Substitute', 'Subject', 'Class', 'Status'];
        const rows = reportData.details.map(row => [
            new Date(row.date).toLocaleDateString(),
            row.time_slot,
            row.original_teacher_name,
            row.substitute_teacher_name,
            row.subject,
            row.class_year,
            'Completed'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `substitution_report_${startDate}_to_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const StatCard = ({ icon: Icon, label, value, color, bg, border }) => (
        <div className={`glass p-6 rounded-3xl border ${border} relative overflow-hidden group`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${bg} blur-xl opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${bg} ${color}`}>
                    <Icon weight="duotone" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white tracking-tighter mb-1">{value}</div>
                <div className="text-sm text-slate-400 font-medium">{label}</div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <FileText className="text-emerald-400" weight="duotone" />
                        Weekly Substitution Report
                    </h1>
                    <p className="text-slate-400 mt-2">Track substitute teacher assignments and workload.</p>
                </div>
                <button
                    onClick={downloadCSV}
                    disabled={loading || reportData.details.length === 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2"
                >
                    <DownloadSimple size={20} weight="bold" /> Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatCard
                    icon={FileText}
                    label="Total Assignments"
                    value={stats.totalAssignments}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    border="border-blue-500/20"
                />
                <StatCard
                    icon={ChalkboardTeacher}
                    label="Teachers Involved"
                    value={stats.teachersInvolved}
                    color="text-purple-400"
                    bg="bg-purple-500/10"
                    border="border-purple-500/20"
                />
                <StatCard
                    icon={Clock}
                    label="Lectures Covered"
                    value={stats.lecturesCovered}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    border="border-emerald-500/20"
                />
                <StatCard
                    icon={TrendUp}
                    label="Avg per Teacher"
                    value={stats.avgPerTeacher}
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                    border="border-amber-500/20"
                />
            </div>

            <div className="glass p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 max-w-sm">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Date Range</label>
                        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-white/10">
                            <div className="flex-1">
                                <CustomDatePicker
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    placeholder="Start Date"
                                />
                            </div>
                            <span className="text-slate-500 font-bold">&rarr;</span>
                            <div className="flex-1">
                                <CustomDatePicker
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    placeholder="End Date"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Substitute</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Original Teacher</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Date & Time</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Lecture Details</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400">Loading data...</td>
                                    </tr>
                                ) : reportData.details.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-500">
                                            No substitution records found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.details.map((row, index) => (
                                        <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4">
                                                <div className="text-sm font-bold text-white">{row.substitute_teacher_name}</div>
                                                <div className="text-xs text-slate-500">{row.substitute_dept || 'Department'}</div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">{row.original_teacher_name}</td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-300">{new Date(row.date).toLocaleDateString()}</div>
                                                <div className="text-xs text-slate-500 font-mono">{row.time_slot}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-indigo-300 font-medium">{row.subject}</div>
                                                <div className="text-xs text-slate-500">{row.class_year}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-emerald-400 text-[10px] font-bold px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg uppercase tracking-wider">
                                                    Completed
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubstituteReport;
