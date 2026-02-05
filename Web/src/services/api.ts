import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:32441/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@FamilyFinance:token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('@FamilyFinance:refreshToken');
            const accessToken = localStorage.getItem('@FamilyFinance:token');

            if (refreshToken && accessToken) {
                try {
                    // Quick decode to get accountId/sub. Basic base64 decode to avoid heavy libs if possible, 
                    // or just rely on backend parsing refresh token context if it had accountId.
                    // But command needs AccountId. Let's try to extract it from access token.
                    const [, payload] = accessToken.split('.');
                    const decoded = JSON.parse(atob(payload));
                    const accountId = decoded.sub || decoded.accountId;

                    const response = await api.post('/accounts/refresh-token', {
                        accountId,
                        refreshToken
                    });

                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

                    localStorage.setItem('@FamilyFinance:token', newAccessToken);
                    localStorage.setItem('@FamilyFinance:refreshToken', newRefreshToken);

                    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                    return api(originalRequest);
                } catch (refreshError) {
                    // Logout logic: clear tokens and redirect
                    localStorage.removeItem('@FamilyFinance:token');
                    localStorage.removeItem('@FamilyFinance:refreshToken');
                    window.location.href = '/login';
                }
            } else {
                // No token to refresh, just redirect
                localStorage.removeItem('@FamilyFinance:token');
                localStorage.removeItem('@FamilyFinance:refreshToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
