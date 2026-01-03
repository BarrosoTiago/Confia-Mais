import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    const clearNotification = () => setNotification(null);

    // 1. Persistência (Mantém logado ao dar F5)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.defaults.headers.Authorization = `Bearer ${token}`;
            setAccessToken(token);
            api.get('/auth/users/me/')
               .then(response => setUser(response.data))
               .catch(() => {
                   // Se o token venceu (Erro 401), limpa tudo
                   console.log("Sessão expirada. Deslogando...");
                   logout();
               }) 
               .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // 2. Login
    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login/', { username, password });
            const { access } = response.data;

            setAccessToken(access);
            localStorage.setItem('token', access);
            api.defaults.headers.Authorization = `Bearer ${access}`;

            // Busca os dados do usuário (Admin ou Cliente)
            const userResponse = await api.get('/auth/users/me/');
            const userData = userResponse.data;
            
            setUser(userData);
            return userData; 

        } catch (error) {
            console.error("Erro no login:", error);
            throw error; 
        }
    };

    // 3. O QUE ESTAVA FALTANDO: CADASTRO (Register) 🚨
    const register = async (userData) => {
        try {
            // Envia os dados para a rota que criamos no Backend
            const response = await api.post('/auth/register/', userData);
            return response.data;
        } catch (error) {
            console.error("Erro no cadastro:", error);
            // Repassa o erro do backend para a tela mostrar (ex: "Senha curta")
            if (error.response && error.response.data) {
                throw error.response.data; 
            } else {
                throw new Error("Erro de conexão com o servidor.");
            }
        }
    };

    // 4. Logout
    const logout = () => {
        localStorage.removeItem('token');
        setAccessToken(null);
        setUser(null);
        api.defaults.headers.Authorization = null;
    };

    const value = {
        user,
        accessToken,
        login,
        register, // <--- Agora a função existe e pode ser usada!
        logout,
        loading,
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