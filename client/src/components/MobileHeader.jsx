import React, { useContext } from 'react';
import { List, ShieldCheck, Bell } from '@phosphor-icons/react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MobileHeader = ({ onMenuClick }) => {
    const { user, unreadCount } = useContext(AuthContext);

    return (
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 z-30 flex items-center justify-between px-4">
            {/* Left: Menu & Logo */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors"
                >
                    <List size={24} weight="bold" />
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg shadow-rose-500/20 text-white">
                        <ShieldCheck size={20} weight="fill" />
                    </div>
                    <span className="font-bold text-white tracking-tight">LecMan</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                <Link to="/admin/notifications" className="relative p-2 text-slate-400 hover:text-rose-400 transition-colors">
                    <Bell size={24} weight="duotone" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-[#0f172a]"></span>
                    )}
                </Link>

                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                    {user?.name?.charAt(0) || 'A'}
                </div>
            </div>
        </div>
    );
};

export default MobileHeader;
