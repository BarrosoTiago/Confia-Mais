import { createContext, useContext, useState } from 'react';
import axios from 'axios';

import api from '../services/api'; // <--- Importa o arquivo centralizado

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

    const [notification, setNotification] = useState(null); 
    const clearNotification = () => setNotification(null);

    const login = async (username, password) => {
        try {
            // CORREÇÃO 1: A URL correta agora é /auth/login/
            const response = await api.post('/auth/login/', {
                username,
                password
            });

            // Extrai os dados da resposta
            const { access, refresh, ...userData } = response.data;

            setAccessToken(access);
            
            // MELHORIA: Salva os dados do usuário (tipo_usuario, nome) no estado global
            setUser(userData); 

            // Configura o token para todas as próximas requisições do Axios
            api.defaults.headers.Authorization = `Bearer ${access}`;

            return response.data; 
        } catch (error) {
            console.error("Falha no login (Contexto):", error);
            throw error; 
        }
    };

    const register = async (userData) => {
        try {
            // CORREÇÃO 2: A URL correta agora é /auth/register/
            const response = await api.post('/auth/register/', userData);
            return response.data;
        } catch (error) {
            console.error("Falha no cadastro (Contexto):", error);
            if (error.response && error.response.data) {
                throw error.response.data; 
            } else {
                throw new Error("Erro de rede ou servidor indisponível.");
            }
        }
    };

    const logout = async () => {
        try {
            // Se tiver endpoint de logout no backend, descomente abaixo
            // await api.post('/auth/logout/');
        } catch (error) {
            console.error("Erro no logout:", error);
        }
        setAccessToken(null);
        setUser(null);
        api.defaults.headers.Authorization = null; // Remove o token do header
    };

    const value = {
        user,
        accessToken,
        login,
        register,
        logout,
        notification,
        setNotification,
        clearNotification,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};