import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    // Função auxiliar para notificações globais (opcional)
    const clearNotification = () => setNotification(null);

    // 1. Persistência (Mantém logado ao dar F5)
    useEffect(() => {
        const recoverUser = async () => {
            // CORRIGIDO: Alterado de 'token' para 'access_token' para alinhar com o api.js
            const token = localStorage.getItem('access_token');
            
            if (token) {
                try {
                    // Define o token no cabeçalho para todas as requisições futuras
                    api.defaults.headers.Authorization = `Bearer ${token}`;
                    
                    // Busca os dados do usuário para preencher o contexto
                    const response = await api.get('/auth/users/me/');
                    setUser(response.data);
                } catch (error) {
                    console.error("Sessão inválida ou expirada:", error);
                    logout(); // Token inválido? Limpa tudo.
                }
            }
            
            setLoading(false);
        };

        recoverUser();
    }, []);

    // 2. Login
    const login = async (username, password) => {
        try {
            // CORRIGIDO: Se o seu Django usa Djoser, a rota correta é '/auth/jwt/create/'
            // Se o seu Django usa Simple JWT puro, altere para '/api/token/'
            const response = await api.post('/auth/jwt/create/', { username, password });
            
            // O backend retorna { access: "...", refresh: "..." }
            const { access, refresh } = response.data;

            // CORRIGIDO: Salva no LocalStorage com os mesmos nomes que o api.js espera
            localStorage.setItem('access_token', access);
            if (refresh) localStorage.setItem('refresh_token', refresh);

            // Configura o Axios
            api.defaults.headers.Authorization = `Bearer ${access}`;

            // Busca os dados completos do usuário
            const userResponse = await api.get('/auth/users/me/');
            const userData = userResponse.data;
            
            setUser(userData);
            return userData; 

        } catch (error) {
            console.error("Erro no login:", error);
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw new Error("Erro de conexão com o servidor.");
        }
    };

    // 3. Cadastro (Register)
    const register = async (userData) => {
        try {
            // CORRIGIDO: No Djoser, a rota de criação de usuário padrão é '/auth/users/'
            // Se no seu urls.py do Django você criou uma rota customizada, mantenha '/auth/register/'
            const response = await api.post('/auth/users/', userData);
            return response.data;
        } catch (error) {
            console.error("Erro no cadastro:", error);
            if (error.response && error.response.data) {
                throw error.response.data; 
            } else {
                throw new Error("Erro de conexão com o servidor.");
            }
        }
    };

    // 4. Logout
    const logout = () => {
        // CORRIGIDO: Limpa as chaves corretas do localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        setUser(null);
        api.defaults.headers.Authorization = null;
        
        // Força o redirecionamento para login para garantir que saia de páginas protegidas
        window.location.href = '/login';
    };

    const value = {
        signed: !!user, 
        user,
        loading,
        login,
        register,
        logout,
        notification,
        setNotification,
        clearNotification
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children} 
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};