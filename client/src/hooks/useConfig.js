import logger from '@/utils/logger';

// Custom hook for fetching configuration data
import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useConfigData = (configType) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/config/${configType}`);
                if (res.data.success) {
                    // Handle both hyphen and underscore formats
                    const key = configType.replace(/-/g, '_');
                    setData(res.data[key] || res.data[configType] || []);
                }
            } catch (err) {
                logger.error(`Error fetching ${configType}:`, err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [configType]);

    return { data, loading, error };
};

// Individual hooks for each config type
export const useDepartments = () => useConfigData('departments');
export const useAcademicYears = () => useConfigData('academic-years');
export const useTimeSlots = () => useConfigData('time-slots');
export const useDivisions = () => useConfigData('divisions');
export const useRooms = () => useConfigData('rooms');
export const useDesignations = () => useConfigData('designations');
export const useSystemConfig = () => useConfigData('system-config');
