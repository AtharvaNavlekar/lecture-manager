import logger from '@/utils/logger';

import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    TrendingUp,
    Calendar,
    Bell,
    LogOut,
    GraduationCap,
    Crown,
    IdCard,
    User,
    Library,
    ShieldCheck,
    BookOpen,
    Plane,
    Megaphone,
    FileCheck,
    BarChart,
    Settings,
    Database,
    ClipboardCheck,
    Menu,
    X
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Breadcrumbs from './Breadcrumbs';
import GlobalSearch from './GlobalSearch';

const Layout = () => {
    const { user, logout, unreadCount } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [orgName, setOrgName] = React.useState('LecMan');
    const [orgSuffix, setOrgSuffix] = React.useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    React.useEffect(() => {
        import('../utils/api').then(module => {
            const api = module.default;
            api.get('/settings').then(res => {
                if (res.data.success && res.data.settings.org_name) {
                    const name = res.data.settings.org_name;
                    // Smart split for branding effect
                    const parts = name.split(' ');
                    if (parts.length > 1) {
                        setOrgName(parts.slice(0, -1).join(' '));
                        setOrgSuffix(' ' + parts.slice(-1));
                    } else {
                        setOrgName(name);
                        setOrgSuffix('');
                    }
                }
            }).catch(() => { });
        });
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Debug logging
    React.useEffect(() => {
        logger.debug('🔐 User Role:', user?.role);
        logger.debug('👤 User Info:', { name: user?.name, department: user?.department, is_hod: user?.is_hod });
    }, [user]);

    return (
        <div className="flex h-screen bg-[#020617] text-slate-50 overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed top-4 left-4 z-50 md:hidden p-3 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-xl text-white hover:border-emerald-500/50 transition-all backdrop-blur-sm"
                aria-label="Toggle mobile menu"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{
                    x: isMobileMenuOpen || window.innerWidth >= 768 ? 0 : -320,
                    opacity: 1
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`fixed md:relative w-72 h-full md:h-[calc(100%-2rem)] md:m-4 md:mr-0 md:rounded-3xl glass flex flex-col shadow-2xl z-40 overflow-hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                {/* Decorative Glow - Different for Admin */}
                <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${user?.role === 'admin' ? 'from-rose-500/10' : 'from-emerald-500/10'} to-transparent pointer-events-none`} />

                <div className="p-8 flex items-center gap-4 border-b border-white/5 relative z-10">
                    <div className={`w-12 h-12 bg-gradient-to-br ${user?.role === 'admin' ? 'from-rose-400 to-rose-600' : 'from-emerald-400 to-emerald-600'} rounded-2xl flex items-center justify-center shadow-lg ${user?.role === 'admin' ? 'shadow-rose-500/20' : 'shadow-emerald-500/20'} text-white`}>
                        <GraduationCap className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl tracking-tight text-white">{orgName}<span className={user?.role === 'admin' ? 'text-rose-400' : 'text-emerald-400'}>{orgSuffix}</span></h2>
                        <p className={`text-[10px] ${user?.role === 'admin' ? 'text-rose-400/80' : 'text-emerald-400/80'} font-mono tracking-widest uppercase`}>THE.NAVLEKAR</p>
                        {user?.role === 'admin' && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 rounded text-[9px] text-rose-300 font-bold">
                                ADMIN
                            </span>
                        )}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar">
                    {user?.role === 'admin' ? (
                        // ADMIN NAVIGATION
                        <>
                            {/* Main Section */}
                            <NavItem to="/dashboard" icon={LayoutDashboard} label="Admin Dashboard" />
                            <NavItem to="/analytics" icon={TrendingUp} label="System Analytics" />

                            {/* Management Section */}
                            <SectionDivider label="Management" />
                            <NavItem to="/faculty" icon={IdCard} label="Faculty Management" color="text-blue-400" />
                            <NavItem to="/students" icon={User} label="Student Management" color="text-emerald-400" />
                            <NavItem to="/subjects" icon={Library} label="Subject Management" color="text-purple-400" />
                            <NavItem to="/schedule" icon={Calendar} label="Master Schedule" color="text-indigo-400" />
                            <NavItem to="/leave-management" icon={Plane} label="Leave Management" color="text-purple-400" />
                            <NavItem to="/substitute/assign" icon={User} label="Assign Substitutes" color="text-emerald-400" />
                            <NavItem to="/substitute/report" icon={BarChart} label="Substitute Reports" color="text-cyan-400" />
                            <NavItem to="/faculty-evaluations" icon={GraduationCap} label="Evaluations" color="text-indigo-400" />
                            <NavItem to="/student-reports" icon={GraduationCap} label="Student Reports" color="text-blue-400" />
                            <NavItem to="/announcements" icon={Megaphone} label="Announcements" color="text-indigo-400" />

                            {/* Analytics Section */}
                            <SectionDivider label="Analytics" />
                            <NavItem to="/attendance-trends" icon={TrendingUp} label="Attendance Trends" color="text-cyan-400" />
                            <NavItem to="/department-metrics" icon={LayoutDashboard} label="Dept Metrics" color="text-violet-400" />
                            <NavItem to="/predictive-analytics" icon={TrendingUp} label="Predictive AI" color="text-fuchsia-400" />

                            {/* System Section */}
                            <SectionDivider label="System" />
                            <NavItem to="/audit" icon={ShieldCheck} label="Audit Logs" color="text-rose-400" />
                            <NavItem to="/user-roles" icon={ShieldCheck} label="User Roles" color="text-rose-400" />
                            <NavItem to="/admin/users-credentials" icon={ShieldCheck} label="User Credentials" color="text-amber-400" />
                            <NavItem to="/admin/data-management" icon={Database} label="Data Management" color="text-purple-400" />
                            <NavItem to="/notifications" icon={Bell} label="Notifications" color="text-slate-400" />
                            <NavItem to="/admin/settings" icon={Settings} label="Settings" color="text-slate-400" />
                        </>
                    ) : user?.is_hod === 1 || user?.is_acting_hod === 1 ? (
                        // HOD NAVIGATION
                        <>
                            <NavItem to="/dashboard" icon={LayoutDashboard} label="HOD Dashboard" />
                            <NavItem to="/analytics" icon={TrendingUp} label="Department Analytics" />
                            <NavItem to="/schedule" icon={Calendar} label="Master Schedule" />
                            <NavItem to="/timetable" icon={Calendar} label="My Timetable" />
                            <NavItem to="/notifications" icon={Bell} label="Inbox" />
                            <NavItem to="/attendance" icon={ClipboardCheck} label="Attendance" />
                            <NavItem to="/assignments" icon={BookOpen} label="Assignments" />
                            <NavItem to="/leave-request" icon={Plane} label="Leave Request" />
                            <NavItem to="/substitute/assign" icon={User} label="Assign Substitutes" />

                            <SectionDivider label="Management" />
                            <NavItem to="/hod" icon={Crown} label="HOD Console" color="text-amber-400" />
                            <NavItem to="/leave/approval" icon={FileCheck} label="Leave Approvals" color="text-purple-400" />
                            <NavItem to="/substitute/report" icon={BarChart} label="Substitute Reports" color="text-cyan-400" />
                            <NavItem to="/faculty-evaluations" icon={GraduationCap} label="Evaluations" color="text-indigo-400" />
                            <NavItem to="/student-reports" icon={GraduationCap} label="Student Reports" color="text-blue-400" />
                            <NavItem to="/announcements" icon={Megaphone} label="Announcements" color="text-indigo-400" />
                            <NavItem to="/faculty" icon={IdCard} label="Faculty Dir" color="text-blue-400" />
                            <NavItem to="/students" icon={User} label="Students" color="text-emerald-400" />
                            <NavItem to="/subjects" icon={Library} label="Subjects" color="text-purple-400" />

                            <SectionDivider label="Analytics" />
                            <NavItem to="/attendance-trends" icon={TrendingUp} label="Attendance Trends" color="text-cyan-400" />
                            <NavItem to="/predictive-analytics" icon={TrendingUp} label="Predictive AI" color="text-fuchsia-400" />
                        </>
                    ) : (
                        // TEACHER NAVIGATION
                        <>
                            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem to="/analytics" icon={TrendingUp} label="EduTrend Analytics" />
                            <NavItem to="/schedule" icon={Calendar} label="Master Schedule" />
                            <NavItem to="/timetable" icon={Calendar} label="My Timetable" />
                            <NavItem to="/notifications" icon={Bell} label="Inbox" />
                            <NavItem to="/attendance" icon={ClipboardCheck} label="Attendance" />
                            <NavItem to="/assignments" icon={BookOpen} label="Assignments" />
                            <NavItem to="/leave-request" icon={Plane} label="Leave Request" />
                            <NavItem to="/substitute/assign" icon={User} label="Assign Substitutes" />

                        </>
                    )}
                </nav>

                <div className="p-4 relative z-10">
                    <div className="glass p-4 rounded-2xl mb-4 border border-white/5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold shadow-inner">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
                            <p className="text-xs text-slate-400 truncate">{user?.department || 'Admin'} • {user?.post || 'Staff'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full group flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300 py-3 rounded-xl transition-all hover:bg-rose-500/10 active:scale-95 text-sm font-semibold border border-transparent hover:border-rose-500/20"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Sign Out
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 m-4 rounded-3xl overflow-hidden relative flex flex-col shadow-2xl border border-white/5 bg-[#020617]/50 backdrop-blur-sm z-10">
                {/* Background Blobs for Atmosphere */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

                <header className="h-16 border-b border-white/5 flex items-center px-8 justify-end relative z-20 bg-[#020617]/40 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-mono hidden md:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        <div className="h-6 w-px bg-white/10 mx-2" />
                        <Link to="/notifications" className="w-10 h-10 rounded-full bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all flex items-center justify-center relative">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full border border-[#020617]"></span>
                            )}
                        </Link>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
                    <Breadcrumbs />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

// Helper Component for Section Dividers
const SectionDivider = ({ label }) => (
    <div className="py-4 px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-4 mb-2">{label}</p>
    </div>
);

// Helper Component for Nav Items
// eslint-disable-next-line no-unused-vars
const NavItem = ({ to, icon: Icon, label, color = 'text-slate-400' }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `group flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border ${isActive
                ? `bg-white/5 ${color} border-white/10`
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`
        }
    >
        <Icon className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 ${color}`} />
        <span className="font-medium text-sm">{label}</span>
    </NavLink>
);

export default Layout;
