import React, { useContext, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    TrendingUp,
    Calendar,
    Bell,
    LogOut,
    GraduationCap,
    IdCard,
    User,
    Library,
    ShieldCheck,
    Plane,
    Megaphone,
    Settings,
    Database,
    Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileNavbar from './MobileNavbar';

const AdminLayout = () => {
    const { user, logout, unreadCount } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [orgName, setOrgName] = React.useState('LecMan');
    const [orgSuffix, setOrgSuffix] = React.useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    React.useEffect(() => {
        import('../utils/api').then(module => {
            const api = module.default;
            api.get('/settings').then(res => {
                if (res.data.success && res.data.settings.org_name) {
                    const name = res.data.settings.org_name;
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

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#020617] text-slate-50 overflow-hidden font-sans selection:bg-rose-500/30">
            {/* Mobile Header (New) */}
            <MobileNavbar onMenuClick={() => setIsMobileMenuOpen(true)} />

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Admin Sidebar with Rose Theme */}
            <motion.aside
                initial={false}
                animate={{ x: 0 }}
                className={`
                    w-72 bg-[#020617] md:glass flex flex-col shadow-2xl z-[120] overflow-hidden border border-rose-500/20
                    fixed inset-y-0 left-0 transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0 md:m-4 md:mr-0 md:rounded-3xl
                    ${isMobileMenuOpen ? 'translate-x-0 rounded-r-3xl' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {/* Rose Decorative Glow */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none" />

                {/* Admin Header */}
                <div className="p-8 flex items-center gap-4 border-b border-rose-500/10 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 text-white">
                        <ShieldCheck className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl tracking-tight text-white">{orgName}<span className="text-rose-400">{orgSuffix}</span></h2>
                        <p className="text-[10px] text-rose-400/80 font-mono tracking-widest uppercase">THE.NAVLEKAR</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 rounded text-[9px] text-rose-300 font-bold">
                            ADMIN PANEL
                        </span>
                    </div>
                </div>

                {/* Admin Navigation */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar">
                    {/* Main Section */}
                    <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Admin Dashboard" />
                    <NavItem to="/admin/analytics" icon={TrendingUp} label="System Analytics" />

                    {/* Management Section */}
                    <SectionDivider label="Management" />
                    <NavItem to="/admin/faculty" icon={IdCard} label="Faculty Management" color="text-blue-400" />
                    <NavItem to="/admin/students" icon={User} label="Student Management" color="text-emerald-400" />
                    <NavItem to="/admin/subjects" icon={Library} label="Subject Management" color="text-purple-400" />
                    <NavItem to="/admin/schedule" icon={Calendar} label="Master Schedule" color="text-indigo-400" />
                    <NavItem to="/admin/leave-management" icon={Plane} label="Leave Management" color="text-purple-400" />
                    <NavItem to="/admin/substitutes" icon={User} label="Substitutes" color="text-emerald-400" />
                    <NavItem to="/admin/evaluations" icon={GraduationCap} label="Evaluations" color="text-indigo-400" />
                    <NavItem to="/admin/student-reports" icon={GraduationCap} label="Student Reports" color="text-blue-400" />
                    <NavItem to="/admin/announcements" icon={Megaphone} label="Announcements" color="text-indigo-400" />

                    {/* Analytics Section */}
                    <SectionDivider label="Analytics" />
                    <NavItem to="/admin/attendance-trends" icon={TrendingUp} label="Attendance Trends" color="text-cyan-400" />
                    <NavItem to="/admin/dept-metrics" icon={LayoutDashboard} label="Dept Metrics" color="text-violet-400" />
                    <NavItem to="/admin/predictive" icon={TrendingUp} label="Predictive AI" color="text-fuchsia-400" />

                    {/* System Section */}
                    <SectionDivider label="System" />
                    <NavItem to="/admin/automation" icon={Bot} label="Automation" color="text-cyan-400" />
                    <NavItem to="/admin/audit" icon={ShieldCheck} label="Audit Logs" color="text-rose-400" />
                    <NavItem to="/admin/user-roles" icon={ShieldCheck} label="User Roles" color="text-rose-400" />
                    <NavItem to="/admin/users-credentials" icon={ShieldCheck} label="User Credentials" color="text-amber-400" />
                    <NavItem to="/admin/data-management" icon={Database} label="Data Management" color="text-purple-400" />
                    <NavItem to="/admin/notifications" icon={Bell} label="Notifications" color="text-slate-400" />
                    <NavItem to="/admin/settings" icon={Settings} label="Settings" color="text-slate-400" />
                </nav>

                {/* Admin User Info */}
                <div className="p-4 relative z-10">
                    <div className="glass p-4 rounded-2xl mb-4 border border-rose-500/20 flex items-center gap-3 bg-rose-500/5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-700 to-rose-800 flex items-center justify-center text-white font-bold shadow-inner">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
                            <p className="text-xs text-rose-300 truncate">System Administrator</p>
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
            <main className="flex-1 m-0 md:m-4 rounded-none md:rounded-3xl overflow-hidden relative flex flex-col shadow-2xl border-t border-rose-500/10 md:border border-rose-500/10 bg-[#020617]/50 backdrop-blur-sm z-10 pt-16 md:pt-0">
                {/* Background Blobs */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />

                <header className="h-16 border-b border-rose-500/10 hidden md:flex items-center px-8 justify-between relative z-20 bg-[#020617]/40 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-rose-400" />
                        </div>
                        <span className="text-sm font-bold text-rose-400">ADMIN SECTION</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-mono hidden md:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        <div className="h-6 w-px bg-white/10 mx-2" />
                        <Link to="/admin/notifications" className="w-10 h-10 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center relative">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full border border-[#020617]"></span>
                            )}
                        </Link>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
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
        <div className="h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
        <p className="text-[10px] text-rose-400/60 uppercase tracking-widest font-bold mt-4 mb-2">{label}</p>
    </div>
);

// Helper Component for Nav Items
const NavItem = ({ to, icon: Icon, label, color = 'text-slate-400' }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `group flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border ${isActive
                ? `bg-rose-500/10 ${color} border-rose-500/20`
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`
        }
    >
        <Icon className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 ${color}`} />
        <span className="font-medium text-sm">{label}</span>
    </NavLink>
);

export default AdminLayout;
