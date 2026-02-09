import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, UserPlus } from 'lucide-react';

const PendingAssignmentRow = ({ assignment, onOverride }) => {
    const [timeLeft, setTimeLeft] = useState(assignment.time_remaining_seconds);

    useEffect(() => {
        // Only set up interval if time is remaining
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Update local state if prop changes (e.g. data refresh)
    useEffect(() => {
        setTimeLeft(assignment.time_remaining_seconds);
    }, [assignment.time_remaining_seconds]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = (seconds) => {
        if (seconds === 0) return 'text-slate-500';
        if (seconds < 300) return 'text-red-400 animate-pulse'; // < 5 mins
        if (seconds < 600) return 'text-amber-400'; // < 10 mins
        return 'text-emerald-400';
    };

    return (
        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10">
            <div className="flex items-center justify-between gap-4">

                {/* Assignment Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 rounded textxs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/20">
                            {assignment.class_year}
                        </span>
                        <h4 className="font-medium text-white truncate">{assignment.subject}</h4>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>📅 {new Date(assignment.date).toLocaleDateString()} at {assignment.time_slot}</span>
                        <span className="flex items-center gap-1">👤 {assignment.original_teacher}</span>
                    </div>
                </div>

                {/* Timer & Actions */}
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className={`font-mono text-xl font-bold flex items-center justify-end gap-2 ${getTimerColor(timeLeft)}`}>
                            <Clock size={18} />
                            {timeLeft > 0 ? formatTime(timeLeft) : "EXPIRED"}
                        </div>
                        <p className="text-xs text-slate-500">Time remaining</p>
                    </div>

                    <button
                        onClick={() => onOverride(assignment)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
                    >
                        <UserPlus size={18} />
                        Override
                    </button>
                </div>
            </div>

            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-white/10 w-full">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / 900) * 100}%` }} // Assuming 15 min (900s) max
                />
            </div>
        </div>
    );
};

export default PendingAssignmentRow;
