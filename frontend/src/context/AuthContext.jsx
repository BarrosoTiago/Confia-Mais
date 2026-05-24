import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    const clearNotification = () => setNotification(null);

    // 1. Persistência (Mantém logado ao dar F5) - Ajustado para 'access_token'
    useEffect(() => {
        const recoverUser = async () => {
            const token = localStorage.getItem('access_token'); // CORRIGIDO: igual ao api.js
            
            if (token) {
                try {
                    api.defaults.headers.Authorization = `Bearer ${token}`;
                    // Certifique-se de que essa rota existe no seu Django backend
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

    // 2. Login
    const login = async (username, password) => {
        try {
            // ATENÇÃO: Verifique se no Django a rota é '/api/auth/jwt/create/' ou '/api/auth/login/'
            const response = await api.post('/api/auth/login/', { username, password });
            
            // Ajustado para ler a estrutura padrão do backend
            const { access, refresh } = response.data;

            // Salva no LocalStorage usando os mesmos nomes do api.js
            localStorage.setItem('access_token', access); // CORRIGIDO
            if (refresh) localStorage.setItem('refresh_token', refresh);

            api.defaults.headers.Authorization = `Bearer ${access}`;

            // Busca os dados do usuário
            const userResponse = await api.get('/api/auth/users/me/');
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
            // ATENÇÃO: Verifique se no seu Django a rota de criação é '/api/auth/users/' ou '/api/auth/register/'
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

    // 4. Logout - Ajustado para limpar as chaves certas
    const logout = () => {
        localStorage.removeItem('access_token'); // CORRIGIDO
        localStorage.removeItem('refresh_token'); // CORRIGIDO
        localStorage.removeItem('user_data');
        setUser(null);
        api.defaults.headers.Authorization = null;
        
        // Redireciona de forma limpa
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