import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger", // danger, warning, info, success
    isLoading = false
}) => {
    if (!isOpen) return null;

    const variants = {
        danger: {
            icon: AlertTriangle,
            color: 'rose',
            bg: 'bg-rose-500',
            text: 'text-rose-500',
            border: 'border-rose-500/20',
            lightBg: 'bg-rose-500/10'
        },
        warning: {
            icon: AlertTriangle,
            color: 'amber',
            bg: 'bg-amber-500',
            text: 'text-amber-500',
            border: 'border-amber-500/20',
            lightBg: 'bg-amber-500/10'
        },
        info: {
            icon: Info,
            color: 'blue',
            bg: 'bg-blue-500',
            text: 'text-blue-500',
            border: 'border-blue-500/20',
            lightBg: 'bg-blue-500/10'
        },
        success: {
            icon: CheckCircle,
            color: 'emerald',
            bg: 'bg-emerald-500',
            text: 'text-emerald-500',
            border: 'border-emerald-500/20',
            lightBg: 'bg-emerald-500/10'
        }
    };

    const style = variants[type] || variants.info;
    const Icon = style.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Dialog */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="dialog-title"
                            aria-describedby="dialog-desc"
                        >
                            <div className="p-6">
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-full ${style.lightBg} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-6 h-6 ${style.text}`} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 id="dialog-title" className="text-lg font-bold text-white mb-2">
                                            {title}
                                        </h3>
                                        <p id="dialog-desc" className="text-slate-400 text-sm leading-relaxed">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-4 flex justify-end gap-3 border-t border-white/5">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`px-4 py-2 rounded-xl text-white font-medium text-sm transition-all shadow-lg ${style.bg} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                                >
                                    {isLoading && (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    )}
                                    {confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
