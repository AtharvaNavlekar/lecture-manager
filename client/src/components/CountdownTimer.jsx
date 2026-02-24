import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

const CountdownTimer = ({ targetDate, onExpire, label }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate) - new Date();

            if (difference <= 0) {
                if (onExpire) onExpire();
                return null;
            }

            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            return { minutes, seconds, total: difference };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [targetDate, onExpire]);

    if (!timeLeft) return null;

    const isUrgent = timeLeft.total < 5 * 60 * 1000; // Less than 5 minutes

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isUrgent ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
            {isUrgent && <AlertCircle className="w-4 h-4 animate-pulse" />}
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">
                {label}: {timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
        </div>
    );
};

export default CountdownTimer;
