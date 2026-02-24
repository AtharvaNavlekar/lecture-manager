import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import error404Animation from '../assets/error-404.json';
import { ArrowLeft, House } from '@phosphor-icons/react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center">
                {/* Lottie Animation */}
                <div className="flex justify-center mb-8">
                    <Lottie
                        animationData={error404Animation}
                        loop={true}
                        style={{ width: 400, height: 400 }}
                    />
                </div>

                {/* Error Message */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Page Not Found
                </h1>
                <p className="text-slate-400 text-lg mb-8">
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-white/10"
                    >
                        <ArrowLeft size={20} weight="bold" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                    >
                        <House size={20} weight="bold" />
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
