import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarBlank, CaretLeft, CaretRight, CaretDown, Clock } from '@phosphor-icons/react';

const CustomDatePicker = ({
    label,
    value,
    onChange,
    min,
    max,
    placeholder = "Select Date",
    showTime = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    // Time state
    const [selectedTime, setSelectedTime] = useState({
        hours: '12',
        minutes: '00',
        period: 'AM'
    });

    const triggerRef = useRef(null);
    const portalRef = useRef(null);

    // Initialize state from value
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setViewDate(date);

                if (showTime) {
                    let hours = date.getHours();
                    const period = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12 || 12; // Convert to 12h format

                    setSelectedTime({
                        hours: hours.toString().padStart(2, '0'),
                        minutes: date.getMinutes().toString().padStart(2, '0'),
                        period
                    });
                }
            }
        }
    }, [value, showTime]);

    // Close interactions
    useEffect(() => {
        const handleInteraction = (event) => {
            const isClickInsideTrigger = triggerRef.current && triggerRef.current.contains(event.target);
            const isClickInsidePortal = portalRef.current && portalRef.current.contains(event.target);

            if (!isClickInsideTrigger && !isClickInsidePortal) {
                setIsOpen(false);
            }
        };

        const handleResize = () => setIsOpen(false);
        const handleScroll = (event) => {
            if (portalRef.current && portalRef.current.contains(event.target)) return;
            setIsOpen(false);
        };

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
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Check space below
            const spaceBelow = window.innerHeight - rect.bottom;
            const height = 350;

            let top = rect.bottom + 8;
            if (spaceBelow < height && rect.top > height) {
                top = rect.top - height - 8;
            }

            setCoords({
                top: top,
                left: rect.left,
                width: rect.width
            });
        }
        setIsOpen(!isOpen);
    };

    const emitChange = (dateObj, timeObj = selectedTime) => {
        const newDate = new Date(dateObj);

        if (showTime) {
            let hours = parseInt(timeObj.hours);
            if (timeObj.period === 'PM' && hours !== 12) hours += 12;
            if (timeObj.period === 'AM' && hours === 12) hours = 0;

            newDate.setHours(hours);
            newDate.setMinutes(parseInt(timeObj.minutes));
        }

        // Adjust to local ISO string
        const offset = newDate.getTimezoneOffset();
        const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000));
        let dateString = adjustedDate.toISOString();

        if (!showTime) {
            dateString = dateString.split('T')[0];
        } else {
            dateString = dateString.slice(0, 16); // YYYY-MM-DDTHH:mm
        }

        onChange({ target: { value: dateString } });
    };

    const handleDateClick = (date) => {
        emitChange(date);
        if (!showTime) setIsOpen(false);
    };

    const handleTimeChange = (type, val) => {
        const newTime = { ...selectedTime, [type]: val };
        setSelectedTime(newTime);

        // If a date is already selected (value exists), update the timestamp immediately
        if (value) {
            const currentDate = new Date(value);
            if (!isNaN(currentDate.getTime())) {
                emitChange(currentDate, newTime);
            } else {
                emitChange(new Date(), newTime); // Fallback to today
            }
        }
    };

    const changeMonth = (delta) => {
        setViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    const generateDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ type: 'empty', id: `empty-${i}` });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const currentDate = new Date(year, month, i);
            const dateString = currentDate.toISOString().split('T')[0];
            const valueDateString = value && !isNaN(new Date(value).getTime()) ? value.split('T')[0] : '';

            days.push({
                day: i,
                date: currentDate,
                type: 'day',
                id: `day-${i}`,
                isSelected: valueDateString === dateString,
                isToday: new Date().toISOString().split('T')[0] === dateString
            });
        }
        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    // Time generation
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const formatDisplayValue = () => {
        if (!value) return placeholder;
        const date = new Date(value);
        if (isNaN(date.getTime())) return placeholder;

        if (showTime) {
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="flex flex-col gap-1.5 w-full min-w-[140px]">
            {label && (
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 ml-1">
                    {showTime ? <Clock weight="bold" /> : <CalendarBlank weight="bold" />} {label}
                </label>
            )}

            <div className="relative">
                <button
                    ref={triggerRef}
                    onClick={toggleCalendar}
                    type="button" // Prevent form submission
                    className={`w-full flex items-center justify-between bg-[#0f172a]/50 text-white px-4 py-3 rounded-xl border transition-all duration-200 group ${isOpen
                            ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-[#1e293b]/50'
                        } ${className}`}
                >
                    <span className={`font-medium text-sm truncate ${!value ? 'text-slate-500' : 'text-white'}`}>
                        {formatDisplayValue()}
                    </span>
                    <CaretDown
                        weight="bold"
                        size={16}
                        className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`}
                    />
                </button>

                {createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                ref={portalRef}
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                style={{
                                    position: 'fixed',
                                    top: coords.top,
                                    left: coords.left,
                                    zIndex: 9999
                                }}
                                className={`bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex gap-4 ${showTime ? 'w-[400px]' : 'w-[280px]'}`}
                            >
                                {/* Calendar Section */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => changeMonth(-1)} type="button" className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            <CaretLeft weight="bold" />
                                        </button>
                                        <div className="text-sm font-bold text-white">
                                            {monthNames[viewDate.getMonth()]} <span className="text-slate-500">{viewDate.getFullYear()}</span>
                                        </div>
                                        <button onClick={() => changeMonth(1)} type="button" className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            <CaretRight weight="bold" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 mb-2 text-center">
                                        {weekDays.map(day => (
                                            <div key={day} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {generateDays().map((dayObj) => {
                                            if (dayObj.type === 'empty') return <div key={dayObj.id} className="h-8" />;
                                            return (
                                                <button
                                                    key={dayObj.id}
                                                    type="button"
                                                    onClick={() => handleDateClick(dayObj.date)}
                                                    className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all relative
                                                        ${dayObj.isSelected
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 font-bold'
                                                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                                        }
                                                        ${dayObj.isToday && !dayObj.isSelected ? 'ring-1 ring-indigo-500/50 text-indigo-400' : ''}
                                                    `}
                                                >
                                                    {dayObj.day}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {!showTime && (
                                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center px-1">
                                            <button type="button" onClick={() => { onChange({ target: { value: '' } }); setIsOpen(false); }} className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider">Clear</button>
                                            <button type="button" onClick={() => handleDateClick(new Date())} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">Today</button>
                                        </div>
                                    )}
                                </div>

                                {/* Time Picker Section */}
                                {showTime && (
                                    <div className="w-24 border-l border-white/10 pl-4 flex flex-col">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Time</div>
                                        <div className="flex-1 flex gap-1 h-full max-h-[220px] overflow-hidden">
                                            {/* Hours */}
                                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar no-scrollbar text-center">
                                                {hours.map(h => (
                                                    <button
                                                        key={h}
                                                        type="button"
                                                        onClick={() => handleTimeChange('hours', h)}
                                                        className={`py-1 text-xs rounded w-full ${selectedTime.hours === h ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                                                    >
                                                        {h}
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Minutes */}
                                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar no-scrollbar text-center">
                                                {minutes.map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => handleTimeChange('minutes', m)}
                                                        className={`py-1 text-xs rounded w-full ${selectedTime.minutes === m ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* AM/PM Toggle */}
                                        <div className="flex bg-slate-800/50 rounded-lg p-0.5 mt-2">
                                            {['AM', 'PM'].map(p => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => handleTimeChange('period', p)}
                                                    className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-all ${selectedTime.period === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default CustomDatePicker;
