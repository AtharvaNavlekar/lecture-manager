import logger from '@/utils/logger';

import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion } from 'framer-motion';
import {
    BookmarkSimple,
    ClockCountdown,
    CheckCircle,
    UsersThree,
    ArrowRight
} from '@phosphor-icons/react';
import SandyLoader from '../components/SandyLoader';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState({ lectures: [], loading: true });

    const fetchData = async () => {
        try {
            const [syncRes, aiRes] = await Promise.all([
                api.get('/sync'),
                api.get('/ai/forecast').catch(() => ({ data: { predictions: [] } }))
            ]);

            setData({
                lectures: syncRes.data.lectures || [],
                forecast: aiRes.data.predictions || [],
                loading: false
            });
        } catch (e) {
            logger.error(e);
            setData({ ...data, loading: false });
        }
    };

    useEffect(() => {
        fetchData();
        // REMOVED: Aggressive 5s polling (Self-DDoS prevention)
        // Replaced with single fetch on mount.
        // For real-time, we will use WebSockets in Phase 2.
    }, []);

    if (data.loading) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex items-center justify-center overflow-hidden z-50">
                <SandyLoader text="Loading your dashboard..." />
            </div>
        );
    }

    // Filter logic is now simplified as server returns only MY relevant lectures
    const myLecs = data.lectures;

    const pendingCount = myLecs.filter(l => l.status === 'scheduled').length;
    const completedCount = myLecs.filter(l => l.status === 'completed').length;

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 md:p-8 relative overflow-hidden shadow-2xl shadow-indigo-500/20"

            >
                <div className="relative z-10">
                    <h1 className="text-xl md:text-3xl font-bold text-white mb-2">Welcome back, {user?.name.split(' ')[0]} 👋</h1>
                    <p className="text-blue-100/90 text-sm md:text-lg">You have <strong className="text-white">{pendingCount} classes</strong> remaining today.</p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform origin-bottom-right"></div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={BookmarkSimple}
                    label="Total Load"
                    value={myLecs.length}
                    color="text-blue-400"
                    bg="bg-blue-400/10"
                />
                <StatCard
                    icon={ClockCountdown}
                    label="Pending"
                    value={pendingCount}
                    color="text-orange-400"
                    bg="bg-orange-400/10"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Completed"
                    value={completedCount}
                    color="text-emerald-400"
                    bg="bg-emerald-400/10"
                />
            </div>

            {/* AI Forecast Widget */}
            {data.forecast && data.forecast.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-violet-950/40 to-fuchsia-950/20 border border-violet-500/20 rounded-2xl p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">✨</span> AI Attendance Forecast
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 relative z-10">
                        {data.forecast.map((item, idx) => (
                            <div key={idx} className="bg-slate-900/50 backdrop-blur-sm border border-violet-500/30 p-4 rounded-xl flex items-start gap-4">
                                <img
                                    src={item.student.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.student.name}`}
                                    alt={item.student.name}
                                    className="w-10 h-10 rounded-full bg-slate-800"
                                />
                                <div>
                                    <h4 className="font-bold text-white text-sm">{item.student.name}</h4>
                                    <div className="text-xs text-violet-300 font-medium mb-1">{item.risk.reason}</div>
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/20">
                                        {item.risk.riskScore}% Probability
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Today's Schedule List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl"
            >

                <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-3">
                    <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>

                    Today's Schedule
                </h3>

                <div className="space-y-4">
                    {myLecs.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 bg-white/5 rounded-xl">
                            No classes scheduled for today. Enjoy your day! 🎉
                        </div>
                    ) : (
                        myLecs.map((lec, index) => (
                            <motion.div
                                key={lec.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-stretch bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors group"
                            >
                                <div className="w-16 md:w-24 bg-black/20 flex flex-col items-center justify-center p-2 md:p-3 text-center border-r border-white/5">
                                    <span className="text-xs md:text-sm font-bold block">{lec.start_time}</span>
                                    <span className="text-[10px] md:text-xs text-gray-400 block mb-1">to</span>
                                    <span className="text-xs md:text-sm font-bold block text-gray-400">{lec.end_time}</span>
                                </div>

                                <div className="flex-1 p-3 md:p-4 flex flex-col justify-center">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-lg">{lec.subject}</h4>
                                        <span className={`text-xs px-2 py-1 rounded capitalize font-medium ${lec.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                                            }`}>

                                            {lec.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <UsersThree /> Class {lec.class_year}
                                        </span>
                                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                        <span>Room {lec.room}</span>
                                    </div>
                                </div>

                                <div className="flex items-center px-4 md:px-6">
                                    {lec.status === 'scheduled' && (
                                        <a href={`/attendance/${lec.id}/${lec.class_year}`} className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all cursor-pointer">
                                            <ArrowRight weight="bold" />
                                        </a>

                                    )}

                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-6 flex items-center gap-5 shadow-lg group hover:border-indigo-500/30 transition-all"
    >

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${bg} ${color}`}>
            <Icon weight="fill" />
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{label}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
        </div>
    </motion.div>
);

export default Dashboard;
