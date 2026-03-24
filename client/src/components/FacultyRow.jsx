/**
 * FacultyRow — Table view row for a single faculty member
 * Extracted from FacultyDirectory.jsx (E9: split large components)
 */
import { motion } from 'framer-motion';
import {
    Trash,
    PencilSimple,
    Crown,
    Phone
} from '@phosphor-icons/react';

const FacultyRow = ({ teacher, onEdit, onDelete, idx }) => (
    <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: idx * 0.02 }}
        className="group hover:bg-white/[0.02] transition-colors"
    >
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${teacher.is_hod ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                    : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
                    }`}>
                    {teacher.name.charAt(0)}
                </div>
                <div>
                    <div className="font-bold text-white text-sm">{teacher.name}</div>
                    <div className="text-xs text-slate-500">{teacher.email}</div>
                </div>
            </div>
        </td>
        <td className="px-6 py-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {teacher.department}
            </span>
        </td>
        <td className="px-6 py-4">
            <div className="flex flex-col items-start gap-1">
                <div className="text-sm text-slate-300">{teacher.post}</div>
                {(teacher.is_hod === 1 || teacher.is_acting_hod === 1) && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        <Crown size={12} weight="fill" />
                        {teacher.is_hod ? 'Head of Dept' : 'Acting HOD'}
                    </div>
                )}
            </div>
        </td>
        <td className="px-6 py-4">
            <div className="text-xs text-slate-400">
                {teacher.contact_number ? (
                    <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-emerald-400" />
                        {teacher.contact_number}
                    </div>
                ) : <span className="text-slate-600">-</span>}
            </div>
        </td>
        <td className="px-6 py-4">
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${teacher.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                <span className={`text-xs font-medium ${teacher.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {teacher.status === 'active' ? 'Active' : 'Inactive'}
                </span>
            </div>
        </td>
        <td className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={onEdit}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/30 transition-all"
                    title="Edit"
                >
                    <PencilSimple size={16} weight="bold" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 transition-all"
                    title="Delete"
                >
                    <Trash size={16} weight="bold" />
                </button>
            </div>
        </td>
    </motion.tr>
);

export default FacultyRow;
