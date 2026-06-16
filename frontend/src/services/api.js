import axios from 'axios';

const api = axios.create({
  baseURL: 'https://confiaplus-api.onrender.com/api',
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. INTERCEPTOR DE REQUISIÇÃO
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. INTERCEPTOR DE RESPOSTA (RENOVAÇÃO SILENCIOSA)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      if (originalRequest.url.includes('/auth/login/') || originalRequest._isRefreshAttempt) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Rota padrão do Simple JWT configurada no seu Backend
          const refreshUrl = 'https://confiaplus-api.onrender.com/api/token/refresh/';
          
          const response = await axios.post(refreshUrl, {
            refresh: refreshToken
          }, { _isRefreshAttempt: true });

          if (response.data && response.data.access) {
            const newAccessToken = response.data.access;
            
            localStorage.setItem('access_token', newAccessToken);
            
            api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);
            isRefreshing = false;

            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          console.error("Erro crítico no Refresh Token:", refreshError.response?.data || refreshError.message);
          
          if (refreshError.response?.status !== 404) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        isRefreshing = false;
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;