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
            const token = localStorage.getItem('token');
            
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
            // Faz o POST para pegar os tokens
            const response = await api.post('/auth/login/', { username, password });
            
            // O backend geralmente retorna { access: "...", refresh: "..." }
            const { access, refresh } = response.data;

            // Salva no LocalStorage
            localStorage.setItem('token', access);
            if (refresh) localStorage.setItem('refresh_token', refresh);

            // Configura o Axios
            api.defaults.headers.Authorization = `Bearer ${access}`;

            // Busca os dados completos do usuário (incluindo setup_concluido)
            const userResponse = await api.get('/auth/users/me/');
            const userData = userResponse.data;
            
            setUser(userData);

            // ⚠️ IMPORTANTE: Retornamos os dados para que o Login.jsx 
            // possa decidir o redirecionamento (Onboarding vs Dashboard)
            return userData; 

        } catch (error) {
            console.error("Erro no login:", error);
            // Repassa o erro detalhado se houver
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw new Error("Erro de conexão com o servidor.");
        }
    };

    // 3. Cadastro (Register)
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

    // 4. Logout
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        api.defaults.headers.Authorization = null;
        
        // Força o redirecionamento para login para garantir que saia de páginas protegidas
        // Usamos window.location para garantir uma limpeza total de estado
        window.location.href = '/login';
    };

    const value = {
        signed: !!user, // Propriedade útil para rotas privadas
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