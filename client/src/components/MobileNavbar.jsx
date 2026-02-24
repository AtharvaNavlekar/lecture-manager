import React, { useContext } from 'react';
import { List, Bell, ShieldCheck } from '@phosphor-icons/react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MobileNavbar = ({ onMenuClick }) => {
    const { user, unreadCount } = useContext(AuthContext);

    return (
        <nav className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f172a]/95 backdrop-blur-2xl border-b border-white/10 z-[100] flex flex-row items-center justify-between px-4 shadow-xl shadow-black/20">
            {/* Left Section: Menu & Brand */}
            <div className="flex flex-row items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors active:scale-95"
                >
                    <List size={26} weight="bold" />
                </button>

                <div className="flex flex-row items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                        <ShieldCheck size={18} weight="fill" />
                    </div>
                    <span className="font-bold text-white text-lg tracking-tight">LecMan</span>
                </div>
            </div>

            {/* Right Section: Notifications & Profile */}
            <div className="flex flex-row items-center gap-3">
                <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-white transition-colors">
                    <Bell size={22} weight="duotone" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#0f172a]" />
                    )}
                </Link>

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 p-[1px] shadow-lg shadow-indigo-500/20">
                    <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center">
                        <span className="font-bold text-sm text-indigo-400">
                            {user?.name?.charAt(0) || 'U'}
                        </span>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default MobileNavbar;
