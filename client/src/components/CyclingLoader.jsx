import React from 'react';
import { motion } from 'framer-motion';

const CyclingLoader = ({ size = 120, text = "Loading..." }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <svg
                width={size}
                height={size}
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Orange Ground */}
                <motion.rect
                    x="0"
                    y="160"
                    width="200"
                    height="40"
                    fill="#fb923c"
                    opacity="0.3"
                />
                <motion.line
                    x1="0"
                    y1="160"
                    x2="200"
                    y2="160"
                    stroke="#fb923c"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    animate={{
                        strokeDashoffset: [0, -10]
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Bicycle Frame - Red */}
                <g transform="translate(100, 100)">
                    {/* Back Wheel */}
                    <motion.g
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <circle cx="-30" cy="40" r="20" fill="none" stroke="#ef4444" strokeWidth="3" />
                        <line x1="-30" y1="20" x2="-30" y2="60" stroke="#ef4444" strokeWidth="2" />
                        <line x1="-10" y1="40" x2="-50" y2="40" stroke="#ef4444" strokeWidth="2" />
                    </motion.g>

                    {/* Front Wheel */}
                    <motion.g
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <circle cx="30" cy="40" r="20" fill="none" stroke="#ef4444" strokeWidth="3" />
                        <line x1="30" y1="20" x2="30" y2="60" stroke="#ef4444" strokeWidth="2" />
                        <line x1="10" y1="40" x2="50" y2="40" stroke="#ef4444" strokeWidth="2" />
                    </motion.g>

                    {/* Frame */}
                    <line x1="-30" y1="40" x2="0" y2="10" stroke="#dc2626" strokeWidth="4" />
                    <line x1="0" y1="10" x2="30" y2="40" stroke="#dc2626" strokeWidth="4" />
                    <line x1="-30" y1="40" x2="-5" y2="30" stroke="#dc2626" strokeWidth="4" />
                    <line x1="-5" y1="30" x2="30" y2="40" stroke="#dc2626" strokeWidth="4" />
                    <line x1="0" y1="10" x2="0" y2="-10" stroke="#dc2626" strokeWidth="4" />
                    <line x1="0" y1="-10" x2="15" y2="-10" stroke="#dc2626" strokeWidth="3" />

                    {/* Boy */}
                    {/* Head */}
                    <motion.circle
                        cx="5"
                        cy="-25"
                        r="8"
                        fill="#fbbf24"
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Body - Blue Shirt */}
                    <motion.ellipse
                        cx="3"
                        cy="-5"
                        rx="10"
                        ry="15"
                        fill="#3b82f6"
                        animate={{ y: [0, -1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Arms - animated pedaling */}
                    <motion.line
                        x1="3"
                        y1="-8"
                        x2="15"
                        y2="-10"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />

                    {/* Legs - Animated Pedaling */}
                    <motion.g
                        animate={{
                            rotate: [0, 180, 360]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <line x1="0" y1="0" x2="10" y2="10" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                        <line x1="0" y1="0" x2="-10" y2="-10" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                    </motion.g>

                    {/* Backpack - Red */}
                    <ellipse cx="-2" cy="-8" rx="6" ry="8" fill="#ef4444" opacity="0.8" />
                </g>
            </svg>

            {/* Loading Text */}
            <motion.p
                className="text-slate-400 font-medium text-sm"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                {text}
            </motion.p>
        </div>
    );
};

export default CyclingLoader;
