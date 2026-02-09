import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { EnvelopeSimple, LockKey, CircleNotch, Fingerprint, Eye, EyeSlash } from '@phosphor-icons/react';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [orgName, setOrgName] = useState('Welcome Back');
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        // White-labeling: Fetch Org Name
        import('../utils/api').then(module => {
            const api = module.default;
            api.get('/settings').then(res => {
                if (res.data.success && res.data.settings.org_name) {
                    setOrgName(res.data.settings.org_name);
                }
            }).catch(() => { });
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await login(formData.email, formData.password);
        if (result.success) {
            navigate(result.role === 'admin' ? '/admin/dashboard' : '/dashboard');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#020617] font-sans">
            {/* Atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md relative z-10 p-6"
            >
                <div className="glass p-8 sm:p-10 rounded-3xl relative overflow-hidden shadow-2xl ring-1 ring-white/10">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white mb-6 shadow-lg shadow-emerald-500/20">
                            <Fingerprint weight="fill" className="text-3xl" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{orgName}</h1>
                        <p className="text-slate-400 text-sm">Enter your credentials to access the console.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl mb-6 text-xs font-medium text-center flex items-center justify-center gap-2"
                        >
                            <CircleNotch className="animate-spin" /> {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="group relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                                <EnvelopeSimple size={20} />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-slate-900/50 text-white placeholder-slate-500 border border-white/10 focus:border-emerald-500/50 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 outline-none transition-all duration-300 font-medium"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="group relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                                <LockKey size={20} />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="w-full bg-slate-900/50 text-white placeholder-slate-500 border border-white/10 focus:border-emerald-500/50 focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-12 outline-none transition-all duration-300 font-medium"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 flex items-center justify-center gap-2 mt-6 uppercase tracking-wide text-sm"
                        >
                            {loading ? <CircleNotch className="animate-spin text-lg" /> : 'Secure Login'}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                            Protected by Enterprise Shield
                        </p>
                    </div>

                    <div className="text-center mt-4">
                        <a href="/forgot-password" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors font-medium">
                            Forgot your password?
                        </a>
                    </div>

                    <div className="text-center mt-4 pt-4 border-t border-white/5">
                        <a href="/register" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors font-medium">
                            First time here? <span className="underline decoration-emerald-500/30 underline-offset-4">Create an account</span>
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
