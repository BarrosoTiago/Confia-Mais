import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api', 
    withCredentials: true 
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

    const [notification, setNotification] = useState(null); 
    const clearNotification = () => setNotification(null);

    const login = async (username, password) => {
        try {
            const response = await api.post('/login/', {
                username,
                password
            });
            setAccessToken(response.data.access);
            return response.data; // Retorna dados no sucesso
        } catch (error) {
            console.error("Falha no login (Contexto):", error);
            throw error; // Lança o erro para a página (Login.jsx)
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/register/', userData);
            return response.data;
        } catch (error) {
            console.error("Falha no cadastro (Contexto):", error);
            if (error.response && error.response.data) {
                // Lança o objeto de validação (ex: { email: [...] })
                throw error.response.data; 
            } else {
                // Lança um erro genérico de rede
                throw new Error("Erro de rede ou servidor indisponível.");
            }
        }
    };

    const logout = async () => {
        try {
            await api.post('/logout/');
        } catch (error) {
            console.error("Erro no logout:", error);
        }
        setAccessToken(null);
        setUser(null);
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