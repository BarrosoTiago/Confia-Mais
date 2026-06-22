import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    const clearNotification = () => setNotification(null);

    // 1. Persistência
    useEffect(() => {
        const recoverUser = async () => {
            const token = localStorage.getItem('access_token');
            
            if (token) {
                try {
                    api.defaults.headers.Authorization = `Bearer ${token}`;
                    const response = await api.get('/auth/users/me/');
                    setUser(response.data);
                } catch (error) {
                    console.error("Sessão inválida ou expirada:", error);
                    logout(); 
                }
            }
            
            setLoading(false);
        };

        recoverUser();
    }, []);

    // 2. Login
    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login/', { username, password });
            const { access, refresh } = response.data;

            localStorage.setItem('access_token', access); 
            if (refresh) localStorage.setItem('refresh_token', refresh);

            api.defaults.headers.Authorization = `Bearer ${access}`;
          
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

    // 3. Cadastro
    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register/', userData);
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

    // 4. Logout — CORRIGIDO: adicionado async para permitir o await do api.post
    const logout = async () => {
        const refresh = localStorage.getItem('refresh_token');
        try {
            await api.post('/auth/logout/', { refresh });
        } catch (error) {
            // Mesmo se o servidor falhar, limpamos a sessão local
            console.error("Erro ao invalidar token no servidor:", error);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            delete api.defaults.headers.Authorization;
            setUser(null);
        }
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


