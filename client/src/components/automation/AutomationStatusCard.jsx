import React from 'react';

const AutomationStatusCard = ({ title, value, subtext, icon, color = 'blue' }) => {
    const colorMap = {
        blue: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30',
        green: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
        amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
        red: 'from-red-500/20 to-red-600/5 text-red-400 border-red-500/30',
    };

    return (
        <div className={`
      relative overflow-hidden rounded-2xl border backdrop-blur-xl p-6
      transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
      bg-gradient-to-br ${colorMap[color]}
    `}>
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
                    {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${colorMap[color].split(' ')[2]}`}>
                    {icon}
                </div>
            </div>

            {/* Decorative glow */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-20 bg-${color}-500`} />
        </div>
    );
};

export default AutomationStatusCard;
