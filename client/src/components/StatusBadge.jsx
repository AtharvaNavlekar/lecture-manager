import React from 'react';

const StatusBadge = ({ status }) => (
    <div className={`px-3 py-1 bg-${status.color}-500/10 text-${status.color}-400 rounded-lg text-sm font-bold flex items-center gap-1.5`}>
        <status.icon size={14} weight="bold" />
        {status.label}
    </div>
);

export default StatusBadge;
