import logger from '@/utils/logger';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    MagnifyingGlass,
    X,
    ChalkboardTeacher,
    Student,
    Books,
    Calendar,
    Spinner
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const GlobalSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Keyboard shortcut (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults({});
            setTotalResults(0);
            return;
        }

        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/search?query=${encodeURIComponent(query)}&limit=5`);
                if (res.data.success) {
                    setResults(res.data.results);
                    setTotalResults(res.data.totalResults);
                }
            } catch (error) {
                logger.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleResultClick = (type, item) => {
        setIsOpen(false);
        setQuery('');

        switch (type) {
            case 'teacher':
                navigate('/faculty-directory');
                break;
            case 'student':
                navigate('/student-directory');
                break;
            case 'lecture':
                navigate('/schedule');
                break;
            case 'subject':
                navigate('/subjects');
                break;
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery('');
        setResults({});
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 hover:bg-slate-800/50 border border-white/10 rounded-lg transition-all text-slate-400 hover:text-white"
                title="Search (⌘K)"
            >
                <MagnifyingGlass size={18} />
                <span className="text-sm hidden md:inline">Search...</span>
                <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-slate-800 border border-white/10 rounded">⌘K</kbd>
            </button>
        );
    }

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-start justify-center p-4 pt-20"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: -20 }}
                    className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div className="p-4 border-b border-white/5">
                        <div className="relative">
                            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search teachers, students, lectures, subjects..."
                                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            {loading && (
                                <Spinner className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" size={20} />
                            )}
                            {!loading && query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {query.length < 2 ? (
                            <div className="p-8 text-center text-slate-500">
                                <MagnifyingGlass size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Type at least 2 characters to search...</p>
                            </div>
                        ) : totalResults === 0 && !loading ? (
                            <div className="p-8 text-center text-slate-500">
                                <p>No results found for "{query}"</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                {/* Teachers */}
                                {results.teachers?.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-400 uppercase">
                                            <ChalkboardTeacher size={14} />
                                            Teachers ({results.teachers.length})
                                        </div>
                                        <div className="space-y-1 mt-2">
                                            {results.teachers.map((teacher) => (
                                                <button
                                                    key={teacher.id}
                                                    onClick={() => handleResultClick('teacher', teacher)}
                                                    className="w-full p-3 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-lg text-left transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                            <ChalkboardTeacher size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                                                                {teacher.name}
                                                                {teacher.is_hod && <span className="ml-2 text-xs text-amber-400">(HOD)</span>}
                                                            </div>
                                                            <div className="text-xs text-slate-400">
                                                                {teacher.post} • {teacher.department} • {teacher.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Students */}
                                {results.students?.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-400 uppercase">
                                            <Student size={14} />
                                            Students ({results.students.length})
                                        </div>
                                        <div className="space-y-1 mt-2">
                                            {results.students.map((student) => (
                                                <button
                                                    key={student.id}
                                                    onClick={() => handleResultClick('student', student)}
                                                    className="w-full p-3 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-lg text-left transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                            <Student size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                                                                {student.name}
                                                            </div>
                                                            <div className="text-xs text-slate-400">
                                                                {student.roll_no} • {student.class_year} {student.department}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Lectures */}
                                {results.lectures?.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-400 uppercase">
                                            <Calendar size={14} />
                                            Lectures ({results.lectures.length})
                                        </div>
                                        <div className="space-y-1 mt-2">
                                            {results.lectures.map((lecture) => (
                                                <button
                                                    key={lecture.id}
                                                    onClick={() => handleResultClick('lecture', lecture)}
                                                    className="w-full p-3 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-lg text-left transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                                                            <Calendar size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                                                                {lecture.subject}
                                                            </div>
                                                            <div className="text-xs text-slate-400">
                                                                {lecture.teacher_name} • {lecture.class_year} • {lecture.date} {lecture.start_time}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Subjects */}
                                {results.subjects?.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-400 uppercase">
                                            <Books size={14} />
                                            Subjects ({results.subjects.length})
                                        </div>
                                        <div className="space-y-1 mt-2">
                                            {results.subjects.map((subject, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleResultClick('subject', subject)}
                                                    className="w-full p-3 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-lg text-left transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                                                            <Books size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                                                                {subject.name}
                                                            </div>
                                                            <div className="text-xs text-slate-400">
                                                                {subject.class_year} • {subject.lecture_count} lectures
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-white/5 flex items-center justify-between bg-slate-900/30">
                        <div className="text-xs text-slate-500">
                            {totalResults > 0 && `${totalResults} result${totalResults !== 1 ? 's' : ''} found`}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/10 rounded">ESC</kbd>
                            <span>to close</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default GlobalSearch;
