import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import HodDashboard from './HodDashboard';
import Dashboard from './Dashboard';

const RoleDashboard = () => {
    const { user } = useContext(AuthContext);

    // Admin gets AdminDashboard
    if (user?.role === 'admin') {
        return <AdminDashboard />;
    }

    // HOD gets HODDashboard  
    if (user?.is_hod === 1 || user?.is_acting_hod === 1) {
        return <HodDashboard />;
    }

    // Everyone else (teachers, students) gets regular Dashboard
    return <Dashboard />;
};

export default RoleDashboard;
