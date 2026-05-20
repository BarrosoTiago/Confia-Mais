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
                    
                    // CORRIGIDO: Adicionado /api/
                    const response = await api.get('/api/auth/users/me/');
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

    // 2. Login Otimizado
    const login = async (username, password) => {
        try {
            // Faz o login e já recebe os tokens E os dados do usuário!
            const response = await api.post('/api/auth/login/', { username, password });
            
            // Extraímos os tokens e o resto guardamos na variável userData
            const { access, refresh, ...userData } = response.data;

            localStorage.setItem('access_token', access); 
            if (refresh) localStorage.setItem('refresh_token', refresh);

            api.defaults.headers.Authorization = `Bearer ${access}`;

            // Como o Django já mandou o id, username e tipo_usuario, não precisamos
            // daquele segundo api.get()! Só salvamos direto no estado:
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
            // CORRIGIDO: Adicionado /api/
            const response = await api.post('/api/auth/register/', userData);
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
        localStorage.removeItem('access_token'); 
        localStorage.removeItem('refresh_token'); 
        localStorage.removeItem('user_data');
        setUser(null);
        api.defaults.headers.Authorization = null;
        
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