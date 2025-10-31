import { createContext, useContext, useState } from 'react';
import axios from 'axios';

// Configura a instância base do Axios
const api = axios.create({
    baseURL: 'http://localhost:8000/api', // URL do seu backend Django
    withCredentials: true // Permite que o Axios envie o cookie HttpOnly
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

    // Função de Login
    const login = async (username, password) => {
        try {
            const response = await api.post('/login/', {
                username,
                password
            });
            
            setAccessToken(response.data.access);

            return true;
        } catch (error) {
            console.error("Falha no login:", error);
            return false;
        }
    };

    // Função de Cadastro
const register = async (userData) => {
        try {
            await api.post('/register/', userData);
            return true;
        } catch (error) {
            console.error("Falha no cadastro (Contexto):", error);

            // Se o Django enviou um objeto de validação (erro 400)
            if (error.response && error.response.data) {
                console.error("Erro de validação:", error.response.data);
                throw error.response.data; 
            } else {
                throw new Error("Erro de rede ou servidor indisponível.");
            }
            return false;
        }
    };

    // Função de Logout
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
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook customizado para usar o contexto
export const useAuth = () => {
    return useContext(AuthContext);
};