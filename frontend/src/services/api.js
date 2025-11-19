import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Interceptor para incluir o token automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token'); // Ou como você estiver salvando no Context
  // Nota: Se você estiver usando apenas o Context para salvar o token em memória, 
  // este interceptor pode não achar o token no localStorage.
  // Mas vamos manter simples por enquanto.
  
  return config;
});

export default api;