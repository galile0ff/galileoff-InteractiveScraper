import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api', // Backend adresi
});

// Request Interceptor: Her isteğe token ekle
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = sessionStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: 401 hatası gelirse oturumu kapat
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token geçersiz veya süresi dolmuş
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('authToken');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
