import logger from '@/utils/logger';

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Calendar,
    Clock,
    Check,
    X,
    ChatCircleDots,
    Warning
} from '@phosphor-icons/react';

const LeaveManagement = () => {
    const { user } = useContext(AuthContext);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [leaveCalendar, setLeaveCalendar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [reviewComments, setReviewComments] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pendingRes, calendarRes] = await Promise.all([
                api.get('/leaves/pending'),
                api.get('/leaves/calendar')
            ]);

            if (pendingRes.data.success) setPendingRequests(pendingRes.data.requests);
            if (calendarRes.data.success) setLeaveCalendar(calendarRes.data.leaves);
        } catch (err) {
            logger.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (id, status) => {
        try {
            const res = await api.put(`/leaves/${id}/review`, { status, comments: reviewComments });
            if (res.data.success) {
                setSelectedRequest(null);
                setReviewComments('');
                toast.success(`Leave request ${status}!`); // Replaced alert with toast
                fetchData();
            }
        } catch (err) {
            logger.error(err);
            toast.error(`Failed to ${status} leave request`); // Replaced alert with toast
        }
    };

    if (loading) return <div className="text-white p-10">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Calendar weight="fill" className="text-amber-400" />
                    Leave Management
                </h1>
                <p className="text-slate-400 mt-2">Approve or reject leave requests from your department</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {/* Pending Requests */}
                <div className="lg:col-span-2 glass p-4 md:p-4 md:p-6 lg:p-8 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Pending Requests</h2>
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-sm font-bold border border-amber-500/20">
                            {pendingRequests.length} Pending
                        </span>
                    </div>

                    <div className="space-y-4">
                        {pendingRequests.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <Check size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No pending leave requests</p>
                            </div>
                        ) : (
                            pendingRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-white font-bold">{request.teacher_name}</h3>
                                            <p className="text-xs text-slate-500 mt-1">{request.department} Department</p>
                                        </div>
                                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold capitalize">
                                            {request.leave_type}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                                        <Clock size={14} />
                                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                                    </div>

                                    <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg mb-4">
                                        {request.reason}
                                    </p>

                                    {selectedRequest === request.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={reviewComments}
                                                onChange={(e) => setReviewComments(e.target.value)}
                                                placeholder="Add comments (optional)"
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500 resize-none"
                                                rows="2"
                                            />
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleReview(request.id, 'approved')}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <Check weight="bold" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReview(request.id, 'rejected')}
                                                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <X weight="bold" />
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(null);
                                                        setReviewComments('');
                                                    }}
                                                    className="px-4 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedRequest(request.id)}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <ChatCircleDots weight="bold" />
                                            Review
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Leave Calendar */}
                <div className="glass p-4 md:p-4 md:p-6 lg:p-8 rounded-3xl border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6">Approved Leaves</h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {leaveCalendar.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No approved leaves</p>
                            </div>
                        ) : (
                            leaveCalendar.map((leave) => (
                                <div
                                    key={leave.id}
                                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4"
                                >
                                    <h4 className="text-white font-bold text-sm">{leave.teacher_name}</h4>
                                    <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2">
                                        <Clock size={12} />
                                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 capitalize">{leave.leave_type}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveManagement;
