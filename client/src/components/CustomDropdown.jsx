import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown, Check } from '@phosphor-icons/react';

const CustomDropdown = ({
    label,
    value,
    options,
    onChange,
    icon = null,
    placeholder = "Select...",
    disabled = false,
    className = "",
    buttonClassName = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef(null);
    const portalRef = useRef(null);

    // Close on click outside & window resize
    useEffect(() => {
        const handleInteraction = (event) => {
            // Need to check both the trigger button AND the portal content
            const isClickInsideTrigger = dropdownRef.current && dropdownRef.current.contains(event.target);
            const isClickInsidePortal = portalRef.current && portalRef.current.contains(event.target);

            if (isClickInsideTrigger || isClickInsidePortal) {
                return;
            }
            // Close if clicking outside both
            setIsOpen(false);
        };

        const handleResize = () => setIsOpen(false);
        const handleScroll = (event) => {
            // Don't close if scrolling inside the dropdown menu
            if (portalRef.current && portalRef.current.contains(event.target)) {
                return;
            }
            setIsOpen(false);
        };

        document.addEventListener('mousedown', handleInteraction);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true); // Capture phase for sub-scrollers

        return () => {
            document.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    const toggleDropdown = () => {
        if (disabled) return;

        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            // If less than 250px below and we have more space above, open upwards
            const openUp = spaceBelow < 250 && spaceAbove > spaceBelow;

            if (openUp) {
                setCoords({
                    bottom: window.innerHeight - rect.top + 8,
                    left: rect.left,
                    width: rect.width,
                    placement: 'top'
                });
            } else {
                setCoords({
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
                    placement: 'bottom'
                });
            }
        }
        setIsOpen(!isOpen);
    };

    // Find display label for selected value
    const getDisplayValue = () => {
        if (!value) return placeholder;

        const selectedOption = options.find(opt =>
            (typeof opt === 'object' ? opt.value === value : opt === value)
        );

        if (selectedOption && typeof selectedOption === 'object') {
            return selectedOption.label;
        }

        return value.toString();
    };

    return (
        <div className={`flex flex-col gap-1.5 min-w-[140px] ${className}`}>
            {label && (
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 ml-1">
                    {icon} {label}
                </label>
            )}

            <div className="relative">
                <button
                    ref={dropdownRef}
                    onClick={toggleDropdown}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between bg-[#0f172a]/50 text-white px-4 py-3 rounded-xl border transition-all duration-200 group ${isOpen
                        ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                        : disabled
                            ? 'border-white/5 cursor-default opacity-80'
                            : 'border-white/10 hover:border-white/20 hover:bg-[#1e293b]/50'
                        } ${buttonClassName}`}
                >
                    <span className="font-bold text-sm truncate pr-2">{getDisplayValue()}</span>
                    {!disabled && (
                        <CaretDown
                            weight="bold"
                            className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`}
                            size={16}
                        />
                    )}
                </button>

                {createPortal(
                    <AnimatePresence>
                        {isOpen && !disabled && (
                            <motion.div
                                ref={portalRef}
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                style={{
                                    position: 'fixed',
                                    top: coords.placement === 'bottom' ? coords.top : 'auto',
                                    bottom: coords.placement === 'top' ? coords.bottom : 'auto',
                                    left: coords.left,
                                    width: coords.width,
                                    zIndex: 9999
                                }}
                                className={`bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[240px] overflow-y-auto custom-scrollbar ${coords.placement === 'top' ? 'origin-bottom' : 'origin-top'}`}
                            >
                                <div className="p-1.5 space-y-0.5">
                                    {options.map((option, index) => {
                                        const isObject = typeof option === 'object';
                                        const optValue = isObject ? option.value : option;
                                        const optLabel = isObject ? option.label : option;
                                        const isSelected = value === optValue;

                                        return (
                                            <button
                                                key={isObject ? optValue : index}
                                                onClick={() => {
                                                    onChange(optValue);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${isSelected
                                                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30'
                                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                <span className="truncate">{optLabel}</span>
                                                {isSelected && (
                                                    <Check weight="bold" size={14} />
                                                )}
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
        </div>
    );
};

export default CustomDropdown;
