import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Trash,
    ShieldCheck,
    User,
    Crown,
    Pencil
} from '@phosphor-icons/react';
import CustomSelect from '../components/ui/CustomSelect';

const UserRoleManagement = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users-credentials');
            if (res.data.success) {
                setUsers(res.data.users);
            }
        } catch (err) {
            logger.error('Fetch users error:', err);
        }
    };

    const handleAssignRole = async (userId, newRole) => {
        try {
            const res = await api.post('/admin/assign-role', {
                teacher_id: userId,
                role: newRole
            });

            if (res.data.success) {
                toast.success('Role assigned successfully!');
                fetchUsers();
                // setReason(''); // These variables are not defined in the current scope
                // setSelectedUser(null); // These variables are not defined in the current scope
                setEditingUser(null);
            }
        } catch (error) {
            logger.error(error);
            toast.error('Failed to assign role');
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <ShieldCheck weight="fill" className="text-rose-400" />;
            case 'hod': return <Crown weight="fill" className="text-amber-400" />;
            default: return <User weight="fill" className="text-indigo-400" />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'hod': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ShieldCheck className="text-rose-400" size={32} />
                    User Role Management
                </h1>
                <p className="text-slate-400 mt-2">Assign and manage user roles and permissions</p>
            </div>

            <div className="glass p-4 md:p-4 md:p-6 lg:p-8 rounded-3xl border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-slate-400 text-sm font-bold py-4 px-4">User</th>
                                <th className="text-left text-slate-400 text-sm font-bold py-4 px-4">Department</th>
                                <th className="text-left text-slate-400 text-sm font-bold py-4 px-4">Current Role</th>
                                <th className="text-left text-slate-400 text-sm font-bold py-4 px-4">HOD Status</th>
                                <th className="text-right text-slate-400 text-sm font-bold py-4 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <motion.tr
                                    key={u.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <td className="py-4 px-4">
                                        <div>
                                            <div className="font-bold text-white">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-sm text-slate-400">{u.department}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        {editingUser === u.id ? (
                                            <CustomSelect
                                                options={[
                                                    { value: "teacher", label: "Teacher" },
                                                    { value: "hod", label: "HOD" },
                                                    { value: "admin", label: "Admin" }
                                                ]}
                                                value={selectedRole}
                                                onChange={(e) => setSelectedRole(e.target.value)}
                                            />
                                        ) : (
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border flex items-center gap-2 w-fit ${getRoleColor(u.role)}`}>
                                                {getRoleIcon(u.role)}
                                                {u.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4">
                                        {u.is_hod === 1 ? (
                                            <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-xs border border-amber-500/20">
                                                HOD
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-600">-</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        {editingUser === u.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleAssignRole(u.id, selectedRole)}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingUser(null)}
                                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditingUser(u.id);
                                                    setSelectedRole(u.role);
                                                }}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all ml-auto"
                                            >
                                                <Pencil size={14} />
                                                Edit Role
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="glass p-4 md:p-6 rounded-2xl border border-white/5 bg-indigo-500/5">
                <h3 className="text-sm font-bold text-white mb-2">Role Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 text-xs">
                    <div>
                        <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
                            <ShieldCheck size={16} />
                            Admin
                        </div>
                        <ul className="text-slate-400 space-y-1">
                            <li>• Full system access</li>
                            <li>• Assign roles</li>
                            <li>• View audit logs</li>
                            <li>• Factory reset</li>
                        </ul>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
                            <Crown size={16} />
                            HOD
                        </div>
                        <ul className="text-slate-400 space-y-1">
                            <li>• Department management</li>
                            <li>• Approve leaves</li>
                            <li>• Faculty evaluations</li>
                            <li>• Assign substitutes</li>
                        </ul>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                            <User size={16} />
                            Teacher
                        </div>
                        <ul className="text-slate-400 space-y-1">
                            <li>• Mark attendance</li>
                            <li>• Create assignments</li>
                            <li>• Submit leave requests</li>
                            <li>• View timetable</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserRoleManagement;
