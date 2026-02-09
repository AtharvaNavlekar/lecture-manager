import React, { useState, useRef, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DatePicker = ({ value, onChange, minDate, label, color = 'emerald', required = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => value ? new Date(value) : new Date());
    const [focusedDate, setFocusedDate] = useState(null);
    const pickerRef = useRef(null);
    const buttonRef = useRef(null);
    const calendarRef = useRef(null);

    const colorClasses = {
        emerald: {
            primary: 'emerald',
            gradient: 'from-emerald-500 to-emerald-600',
            hover: 'hover:bg-emerald-500/20',
            selected: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
            border: 'border-emerald-500/50',
            text: 'text-emerald-400'
        },
        purple: {
            primary: 'purple',
            gradient: 'from-purple-500 to-purple-600',
            hover: 'hover:bg-purple-500/20',
            selected: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
            border: 'border-purple-500/50',
            text: 'text-purple-400'
        }
    };

    const colors = colorClasses[color] || colorClasses.emerald;

    // Helper functions - using useCallback to prevent unnecessary re-renders
    const getDaysInMonth = useCallback((date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty slots for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days in month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, []);

    const isDateDisabled = useCallback((date) => {
        if (!date || !minDate) return false;
        const min = new Date(minDate);
        min.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < min;
    }, [minDate]);

    const handleDateSelect = useCallback((date) => {
        if (date) {
            const formattedDate = date.toISOString().split('T')[0];
            onChange({ target: { value: formattedDate } });
            setIsOpen(false);
            buttonRef.current?.focus();
        }
    }, [onChange]);

    const navigateDate = useCallback((currentDate, offset) => {
        if (!currentDate) return;

        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset);

        // Check if we need to change month
        if (newDate.getMonth() !== currentMonth.getMonth()) {
            setCurrentMonth(new Date(newDate));
        }

        if (!isDateDisabled(newDate)) {
            setFocusedDate(newDate);
        }
    }, [currentMonth, isDateDisabled]);

    const handlePrevMonth = useCallback(() => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    }, [currentMonth]);

    const handleNextMonth = useCallback(() => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    }, [currentMonth]);

    const isToday = useCallback((date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }, []);

    const isSelected = useCallback((date) => {
        if (!date || !value) return false;
        const selected = new Date(value);
        return date.toDateString() === selected.toDateString();
    }, [value]);

    const isFocused = useCallback((date) => {
        if (!date || !focusedDate) return false;
        return date.toDateString() === focusedDate.toDateString();
    }, [focusedDate]);

    const formatDisplayDate = useCallback((dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }, []);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            const days = getDaysInMonth(currentMonth).filter(day => day && !isDateDisabled(day));
            const currentFocusedDate = focusedDate || (value ? new Date(value) : days[0]);

            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    setIsOpen(false);
                    buttonRef.current?.focus();
                    break;

                case 'Tab':
                    // Allow tab to work naturally but keep focus in calendar
                    if (!e.shiftKey && e.target === calendarRef.current?.querySelector('[data-action="close"]')) {
                        e.preventDefault();
                        calendarRef.current?.querySelector('[data-action="today"]')?.focus();
                    } else if (e.shiftKey && e.target === calendarRef.current?.querySelector('[data-action="today"]')) {
                        e.preventDefault();
                        calendarRef.current?.querySelector('[data-action="close"]')?.focus();
                    }
                    break;

                case 'ArrowRight':
                    e.preventDefault();
                    navigateDate(currentFocusedDate, 1);
                    break;

                case 'ArrowLeft':
                    e.preventDefault();
                    navigateDate(currentFocusedDate, -1);
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    navigateDate(currentFocusedDate, 7);
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    navigateDate(currentFocusedDate, -7);
                    break;

                case 'Enter':
                case ' ':
                    if (e.target.hasAttribute('data-date')) {
                        e.preventDefault();
                        const dateStr = e.target.getAttribute('data-date');
                        handleDateSelect(new Date(dateStr));
                    }
                    break;

                case 'Home':
                    e.preventDefault();
                    setFocusedDate(days[0]);
                    break;

                case 'End':
                    e.preventDefault();
                    setFocusedDate(days[days.length - 1]);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, focusedDate, currentMonth, value, getDaysInMonth, isDateDisabled, navigateDate, handleDateSelect]);

    const days = getDaysInMonth(currentMonth);
    const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="relative" ref={pickerRef}>
            {label && (
                <label
                    id={`label-${label.replace(/\s/g, '-')}`}
                    className={`text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2`}
                >
                    <Calendar size={14} aria-hidden="true" /> {label}
                    {required && <span className="text-rose-400" aria-label="required">*</span>}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`${label || 'Select date'}${value ? `, selected date is ${formatDisplayDate(value)}` : ''}`}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                className={`w-full px-4 py-3.5 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border ${isOpen ? colors.border : 'border-white/10'} rounded-xl text-white focus:outline-none ${isOpen ? `ring-2 ring-${colors.primary}-500/20` : ''} transition-all font-semibold hover:border-white/20 text-left flex items-center justify-between group`}
            >
                <span className={value ? 'text-white' : 'text-slate-500'}>
                    {value ? formatDisplayDate(value) : 'Select date...'}
                </span>
                <Calendar size={18} className={`${colors.text} transition-transform ${isOpen ? 'rotate-12 scale-110' : ''}`} aria-hidden="true" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        ref={calendarRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Calendar for ${label || 'date selection'}`}
                        className="absolute z-50 mt-2 p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/10 backdrop-blur-xl shadow-2xl"
                        style={{ minWidth: '320px' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                aria-label="Previous month"
                                className={`p-2 rounded-lg ${colors.hover} transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-${colors.primary}-500/50`}
                            >
                                <ChevronLeft size={20} className={colors.text} aria-hidden="true" />
                            </button>

                            <h3
                                className="text-sm font-black text-white uppercase tracking-wider"
                                aria-live="polite"
                            >
                                {monthYear}
                            </h3>

                            <button
                                type="button"
                                onClick={handleNextMonth}
                                aria-label="Next month"
                                className={`p-2 rounded-lg ${colors.hover} transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-${colors.primary}-500/50`}
                            >
                                <ChevronRight size={20} className={colors.text} aria-hidden="true" />
                            </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2" role="row">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-center text-xs font-bold text-slate-500 py-2" role="columnheader">
                                    <abbr title={day === 'Su' ? 'Sunday' : day === 'Mo' ? 'Monday' : day === 'Tu' ? 'Tuesday' : day === 'We' ? 'Wednesday' : day === 'Th' ? 'Thursday' : day === 'Fr' ? 'Friday' : 'Saturday'}>
                                        {day}
                                    </abbr>
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1" role="grid">
                            {days.map((date, index) => {
                                const disabled = isDateDisabled(date);
                                const selected = isSelected(date);
                                const today = isToday(date);
                                const focused = isFocused(date);

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        disabled={!date || disabled}
                                        onClick={() => handleDateSelect(date)}
                                        data-date={date?.toISOString()}
                                        tabIndex={focused ? 0 : -1}
                                        aria-label={date ? `${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${selected ? ', selected' : ''}${today ? ', today' : ''}${disabled ? ', not available' : ''}` : undefined}
                                        aria-selected={selected}
                                        aria-disabled={disabled}
                                        role="gridcell"
                                        className={`
                                            h-10 w-10 rounded-lg text-sm font-semibold transition-all relative
                                            ${!date ? 'invisible' : ''}
                                            ${disabled ? 'text-slate-700 cursor-not-allowed opacity-40' : ''}
                                            ${!disabled && !selected && !today ? `text-slate-300 hover:bg-white/10 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-${colors.primary}-500/50` : ''}
                                            ${selected && !disabled ? colors.selected + ' shadow-lg shadow-' + colors.primary + '-500/30 scale-105' : ''}
                                            ${today && !selected && !disabled ? `border border-${colors.primary}-500/30 ${colors.text}` : ''}
                                            ${focused && !disabled ? `ring-2 ring-offset-2 ring-offset-slate-900 ring-${colors.primary}-400` : ''}
                                        `}
                                    >
                                        {date && date.getDate()}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            <button
                                type="button"
                                data-action="today"
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    onChange({ target: { value: today } });
                                    setIsOpen(false);
                                    buttonRef.current?.focus();
                                }}
                                className={`text-xs font-bold ${colors.text} ${colors.hover} px-3 py-1.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-${colors.primary}-500/50`}
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                data-action="close"
                                onClick={() => {
                                    setIsOpen(false);
                                    buttonRef.current?.focus();
                                }}
                                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 hover:bg-white/5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DatePicker;
