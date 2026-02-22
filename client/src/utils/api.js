import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {}
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        // Only warn, don't block - let the server decide
        console.warn(`[API] Warning: No token found for ${config.url}`);
    }
    return config;
});

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't auto-logout for all errors
        // Only handle specific cases
        if (error.response) {
            const { status, data } = error.response;

            // Log the error for debugging
            console.error('API Error:', {
                status,
                url: error.config?.url,
                message: data?.message || error.message
            });

            // For 401, we don't auto-logout anymore
            // Let each page handle it appropriately
            if (status === 401) {
                // You can add a toast notification here if needed
                console.warn('Unauthorized request - please check your authentication');
            }
        }

        // Always reject to let the calling code handle it
        return Promise.reject(error);
    }
);

export default api;
