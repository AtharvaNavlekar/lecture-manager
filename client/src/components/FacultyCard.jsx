/**
 * FacultyCard — Grid view card for a single faculty member
 * Extracted from FacultyDirectory.jsx (E9: split large components)
 */
import { motion } from 'framer-motion';
import {
    Trash,
    PencilSimple,
    ChalkboardTeacher,
    GraduationCap
} from '@phosphor-icons/react';

const FacultyCard = ({ teacher, onEdit, onDelete, idx }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="glass p-6 rounded-3xl relative group hover:border-blue-500/30 transition-all card-tilt border border-white/5 bg-[#0f172a]/40"
    >
        {/* Badges */}
        <div className="absolute top-4 right-4 flex gap-2">
            {teacher.is_acting_hod === 1 && (
                <div className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse">
                    Acting HOD
                </div>
            )}
            {teacher.is_hod === 1 && (
                <div className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-amber-500/20 text-amber-300 border-amber-500/30">
                    HOD
                </div>
            )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4 mb-5 mt-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${teacher.is_hod ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20'
                : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-blue-500/20'
                }`}>
                {teacher.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors truncate">
                    {teacher.name}
                </h3>
                <div className="text-xs text-slate-400 font-medium truncate">{teacher.email}</div>
            </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#0B1221] rounded-xl p-2.5 border border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Department</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ChalkboardTeacher size={14} className="text-indigo-400" />
                    {teacher.department}
                </div>
            </div>
            <div className="bg-[#0B1221] rounded-xl p-2.5 border border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Role</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-purple-400" />
                    <span className="truncate">{teacher.post}</span>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/5 flex gap-2">
            <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-white/5 py-2 text-xs font-bold"
            >
                <PencilSimple size={14} />
                Edit Profile
            </button>
            <button
                onClick={onDelete}
                className="w-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-white/5 group/del"
            >
                <Trash size={14} className="group-hover/del:fill-rose-400 transition-colors" />
            </button>
        </div>
    </motion.div>
);

export default FacultyCard;
