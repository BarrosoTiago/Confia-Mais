import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// 1. INTERCEPTOR DE REQUISIÇÃO (O que você já deve ter)
// Coloca o token no cabeçalho antes de sair do navegador
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. INTERCEPTOR DE RESPOSTA (NOVO!)
// Analisa a resposta antes de chegar na sua página
api.interceptors.response.use(
  (response) => {
    // Se deu tudo certo, apenas passa a resposta adiante
    return response;
  },
  (error) => {
    // Se deu erro, verificamos se foi erro de token (401)
    if (error.response && error.response.status === 401) {
        console.error("Sessão expirada ou token inválido.");

        // Limpa o lixo do localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');

        // Redireciona o usuário para o login à força
        // Usamos window.location em vez de navigate porque o api.js está fora do React Router
        window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;