import logger from '@/utils/logger';

import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const res = await api.get('/notifications?status=unread&limit=1');
            if (res.data.success) {
                setUnreadCount(res.data.pagination.total);
            }
        } catch (e) {
            logger.error('Failed to fetch unread count', e);
        }
    };

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
        }
    }, [user]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        // Fast UI hydration
        if (storedUser) setUser(JSON.parse(storedUser));

        // Verify session with backend HTTP-Only cookie
        api.get('/auth/me')
            .then(res => {
                if (res.data.success && res.data.user) {
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                    setUser(res.data.user);
                }
            })
            .catch(() => {
                // Session invalid or expired
                logout();
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Real-time Notifications (SSE) with Exponential Backoff Retry
    useEffect(() => {
        let eventSource = null;
        let retryCount = 0;
        const maxRetries = 5;
        const baseDelay = 1000; // 1 second
        let retryTimeout = null;

        const connectSSE = () => {
            // Don't attempt if no user or max retries exceeded
            if (!user || retryCount >= maxRetries) {
                if (retryCount >= maxRetries) {
                    logger.error('🔴 SSE max retries reached. Notifications disabled until refresh.');
                }
                return;
            }

            const url = `${import.meta.env.VITE_API_URL || ''}/api/v1/notifications/stream`;

            logger.debug(`🔄 SSE attempt ${retryCount + 1}/${maxRetries}`);
            eventSource = new EventSource(url, { withCredentials: true });

            eventSource.onopen = () => {
                logger.debug('🟢 SSE Connected');
                retryCount = 0; // Reset on success
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'notification') {
                        // Increment unread count
                        setUnreadCount(prev => prev + 1);

                        // Dispatch custom event for components to listen
                        window.dispatchEvent(new CustomEvent('new-notification', { detail: data.data }));

                        logger.debug('📬 New notification received');
                    }
                } catch (e) {
                    logger.error('🔴 SSE Parse Error', e);
                }
            };

            eventSource.onerror = (err) => {
                logger.error(`🔴 SSE Error (attempt ${retryCount + 1}/${maxRetries})`, err);
                eventSource.close();

                // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                retryCount++;
                if (retryCount < maxRetries) {
                    const delay = baseDelay * Math.pow(2, retryCount - 1);
                    logger.debug(`⏱️ Retrying SSE in ${delay}ms...`);

                    retryTimeout = setTimeout(() => {
                        connectSSE();
                    }, delay);
                } else {
                    logger.error('🔴 SSE failed permanently. Refresh page for notifications.');
                }
            };
        };

        // Start initial connection
        connectSSE();

        // Cleanup on unmount or user change
        return () => {
            if (eventSource) {
                eventSource.close();
                logger.debug('🔴 SSE Closed (cleanup)');
            }
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
        };
    }, [user]);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            logger.debug('🔐 Login response:', res.data);
            if (res.data.success) {
                localStorage.removeItem('token'); // clear old tokens
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setUser(res.data.user);
                return { success: true, role: res.data.user.role };
            }
            return { success: false, message: 'Login failed' };
        } catch (err) {
            logger.error('❌ Login error:', err);
            return { success: false, message: err.response?.data?.message || 'Login failed' };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) { } // Best effort
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, unreadCount, fetchUnreadCount }}>
            {children}
        </AuthContext.Provider>
    );
};
