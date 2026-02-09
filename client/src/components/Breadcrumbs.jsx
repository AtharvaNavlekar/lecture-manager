import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNameMap = {
    'dashboard': 'Dashboard',
    'analytics': 'Analytics',
    'faculty': 'Faculty Directory',
    'students': 'Student Directory',
    'subjects': 'Subject Management',
    'schedule': 'Master Schedule',
    'leave-management': 'Leave Management',
    'leave-request': 'Leave Request',
    'leave-approval': 'Leave Approvals',
    'substitute-assignment': 'Substitute Assignment',
    'substitute-report': 'Substitute Reports',
    'substitute-analytics': 'Substitute Analytics',
    'announcements': 'Announcements',
    'faculty-evaluations': 'Faculty Evaluations',
    'student-reports': 'Student Reports',
    'audit': 'Audit Logs',
    'user-roles': 'User Roles',
    'users-credentials': 'User Credentials',
    'data-management': 'Data Management',
    'settings': 'Settings',
    'automation': 'Automation',
    'attendance': 'Attendance',
    'assignments': 'Assignments',
    'timetable': 'My Timetable',
    'notifications': 'Inbox',
    'hod': 'HOD Console',
    'attendance-trends': 'Attendance Trends',
    'predictive-analytics': 'Predictive Analytics',
    'department-metrics': 'Department Metrics'
};

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Don't show breadcrumbs on dashboard home
    if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className="mb-4 hidden md:block">
            <ol className="flex items-center space-x-2 text-sm text-slate-400">
                <li>
                    <Link to="/dashboard" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                        <Home size={14} />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    const name = routeNameMap[value] || value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                    return (
                        <li key={to} className="flex items-center space-x-2">
                            <ChevronRight size={14} className="text-slate-600" />
                            {isLast ? (
                                <span className="text-slate-200 font-medium" aria-current="page">
                                    {name}
                                </span>
                            ) : (
                                <Link to={to} className="hover:text-emerald-400 transition-colors">
                                    {name}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
