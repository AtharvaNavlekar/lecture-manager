import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Envelope, Buildings, ArrowRight, Warning } from '@phosphor-icons/react';
import api from '../utils/api';
import CustomSelect from '../components/ui/CustomSelect';

const Register = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department: 'CS'
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await api.post('/auth/register', formData);
            if (res.data.success) {
                login(res.data.token, res.data.role, res.data.user);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-[#020617] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-10 rounded-3xl border border-white/10 w-[95%] md:w-full max-w-md shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 mb-4 shadow-lg shadow-emerald-500/20">
                        <User size={32} weight="duotone" className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
                    <p className="text-slate-400 mt-2">Join the academic staff portal.</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3"
                    >
                        <Warning size={20} className="shrink-0 mt-0.5" />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                        <input
                            type="text"
                            required
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                        />
                    </div>

                    <div className="relative group">
                        <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                        <input
                            type="email"
                            required
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                        />
                    </div>

                    <div>
                        <CustomSelect
                            options={[
                                { value: "CS", label: "Computer Science" },
                                { value: "EE", label: "Electrical Engineering" },
                                { value: "ME", label: "Mechanical Engineering" },
                                { value: "Civil", label: "Civil Engineering" }
                            ]}
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            placeholder="Select Department"
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                        <input
                            type="password"
                            required
                            placeholder="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                        {!loading && <ArrowRight weight="bold" className="group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors font-medium">
                            Already have an account? <span className="text-emerald-400">Sign In</span>
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Register;
