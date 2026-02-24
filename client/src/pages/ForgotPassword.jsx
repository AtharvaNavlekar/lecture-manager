import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeSimple, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import api from '../utils/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [devLink, setDevLink] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/forgot-password', { email });

            if (res.data.success) {
                setSuccess(true);
                // Show dev link if available
                if (res.data.reset_link) {
                    setDevLink(res.data.reset_link);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass p-8 rounded-3xl w-[95%] md:w-full max-w-md text-center"
                >
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" weight="fill" />
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-3">Check Your Email</h2>
                    <p className="text-slate-300 mb-6">
                        If an account exists with this email, you will receive a password reset link shortly.
                    </p>

                    {devLink && (
                        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <p className="text-xs text-amber-400 mb-2 font-bold">DEV MODE ONLY:</p>
                            <a
                                href={devLink.replace('http://localhost:5173', '')}
                                className="text-sm text-amber-300 hover:text-amber-200 underline break-all"
                            >
                                {devLink}
                            </a>
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all"
                    >
                        <ArrowLeft size={20} />
                        Back to Login
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass p-8 rounded-3xl w-[95%] md:w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                        <EnvelopeSimple className="text-white" size={32} weight="fill" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
                    <p className="text-slate-400">Enter your email to receive a reset link</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="yourname@college.edu"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                            <p className="text-sm text-rose-400">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/20"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
                    >
                        <ArrowLeft size={18} />
                        Back to Login
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
