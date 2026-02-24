import React from 'react';
import Lottie from 'lottie-react';
import sandyAnimation from '../assets/sandy-loading.json';

const SandyLoader = ({ text = "Loading...", size = 150 }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <Lottie
                animationData={sandyAnimation}
                loop={true}
                style={{ width: size, height: size }}
            />
            <p className="text-slate-400 font-medium text-sm animate-pulse">
                {text}
            </p>
        </div>
    );
};

export default SandyLoader;
