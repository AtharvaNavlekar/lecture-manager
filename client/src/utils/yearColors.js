/**
 * Year-based color utility for consistent theming across the entire application
 * FY (First Year) = Yellow
 * SY (Second Year) = Red  
 * TY (Third Year) = Blue
 */

export const getYearColors = (classYear) => {
    const yearColors = {
        'FY': {
            bg: 'bg-amber-500/10',
            text: 'text-amber-400',
            border: 'border-amber-500/20',
            hover: 'hover:bg-amber-500/20',
            shadow: 'shadow-amber-900/20'
        },
        'SY': {
            bg: 'bg-rose-500/10',
            text: 'text-rose-400',
            border: 'border-rose-500/20',
            hover: 'hover:bg-rose-500/20',
            shadow: 'shadow-rose-900/20'
        },
        'TY': {
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            border: 'border-blue-500/20',
            hover: 'hover:bg-blue-500/20',
            shadow: 'shadow-blue-900/20'
        }
    };

    return yearColors[classYear] || yearColors['SY']; // Default to SY if not found
};

// Convenient helper to get all classes at once for a given year
export const getYearColorClasses = (classYear) => {
    const colors = getYearColors(classYear);
    return `${colors.bg} ${colors.text} ${colors.border}`;
};
