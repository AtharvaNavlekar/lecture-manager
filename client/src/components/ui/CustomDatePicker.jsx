import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, CaretLeft, CaretRight, CaretDown } from '@phosphor-icons/react';

const CustomDatePicker = ({
    value,
    onChange,
    label,
    min,
    max,
    required = false,
    placeholder = "Select Date",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    // currentMonth tracks the month currently being viewed in the calendar
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
    const containerRef = useRef(null);
    const portalRef = useRef(null);

    // Close on click outside & window resize
    useEffect(() => {
        const handleInteraction = (event) => {
            const isClickInsideContainer = containerRef.current && containerRef.current.contains(event.target);
            const isClickInsidePortal = portalRef.current && portalRef.current.contains(event.target);

            if (isClickInsideContainer || isClickInsidePortal) {
                return;
            }
            setIsOpen(false);
        };

        const handleResize = () => setIsOpen(false);
        const handleScroll = () => setIsOpen(false);

        document.addEventListener('mousedown', handleInteraction);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    const toggleCalendar = () => {
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 8, // 8px spacing
                left: rect.left,
                width: rect.width // or hardcode w-72 if needed, but rect.width might be too small for calendar
            });
        }
        setIsOpen(!isOpen);
    };

    // Helper to format date as YYYY-MM-DD for value
    const formatDate = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper to format date for display (e.g., "07 Jan 2026")
    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/ /g, '-');
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const formatted = formatDate(newDate);

        // Mimic event object
        if (onChange) {
            onChange({ target: { value: formatted } });
        }
        setIsOpen(false);
    };

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

    const isDateDisabled = (day) => {
        const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        checkDate.setHours(0, 0, 0, 0);

        if (min) {
            const minDate = new Date(min);
            minDate.setHours(0, 0, 0, 0);
            if (checkDate < minDate) return true;
        }
        if (max) {
            const maxDate = new Date(max);
            maxDate.setHours(0, 0, 0, 0);
            if (checkDate > maxDate) return true;
        }
        return false;
    };

    const isSelected = (day) => {
        if (!value) return false;
        const selected = new Date(value);
        if (isNaN(selected.getTime())) return false;
        return selected.getDate() === day &&
            selected.getMonth() === currentMonth.getMonth() &&
            selected.getFullYear() === currentMonth.getFullYear();
    };

    const isToday = (day) => {
        const today = new Date();
        return today.getDate() === day &&
            today.getMonth() === currentMonth.getMonth() &&
            today.getFullYear() === currentMonth.getFullYear();
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>}

            <button
                type="button"
                onClick={toggleCalendar}
                className={`w-full bg-slate-950/50 border ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white flex items-center justify-between transition-all hover:bg-slate-900/50`}
            >
                <div className="flex items-center gap-3">
                    <CalendarIcon className="text-indigo-400" size={20} weight="duotone" />
                    <span className={value ? 'text-white' : 'text-slate-500'}>
                        {value ? formatDisplayDate(value) : placeholder}
                    </span>
                </div>
                <CaretDown weight="bold" className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={portalRef}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                position: 'fixed',
                                top: coords.top,
                                left: coords.left,
                                zIndex: 9999
                            }}
                            className="w-72 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <CaretLeft weight="bold" />
                                </button>
                                <span className="text-white font-bold">
                                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <CaretRight weight="bold" />
                                </button>
                            </div>

                            {/* Days Header */}
                            <div className="grid grid-cols-7 mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                    <div key={d} className="text-center text-xs font-semibold text-slate-500">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {blanksArray.map(b => (
                                    <div key={`blank-${b}`} />
                                ))}
                                {daysArray.map(day => {
                                    const disabled = isDateDisabled(day);
                                    const selected = isSelected(day);
                                    const today = isToday(day);

                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => handleDateClick(day)}
                                            className={`
                                                h-8 w-8 text-sm rounded-lg flex items-center justify-center transition-all
                                                ${selected
                                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 font-bold'
                                                    : disabled
                                                        ? 'text-slate-700 cursor-not-allowed'
                                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                                }
                                                ${today && !selected ? 'border border-indigo-500/30 text-indigo-400' : ''}
                                            `}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default CustomDatePicker;
