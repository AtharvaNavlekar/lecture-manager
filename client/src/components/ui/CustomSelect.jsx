import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown, Check } from '@phosphor-icons/react';

const CustomSelect = ({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    disabled = false,
    className = "",
    label
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        if (onChange) {
            // Mimic event object for compatibility with existing handlers
            onChange({ target: { value: optionValue } });
        }
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>}

            <button
                type="button"
                className={`w-full bg-slate-950/50 border ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white flex items-center justify-between transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <span className={selectedOption ? 'text-white' : 'text-slate-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <CaretDown className="text-slate-400" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${value === option.value ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-300'}`}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check weight="bold" />}
                            </button>
                        ))}
                        {options.length === 0 && (
                            <div className="px-4 py-3 text-slate-500 text-center text-sm">No options available</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect;
