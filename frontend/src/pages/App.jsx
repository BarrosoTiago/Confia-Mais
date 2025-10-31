import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from './Login.jsx';
import Register from './Register.jsx';

// Componente simples de Dashboard
function Dashboard() {
    const { logout } = useAuth();
    return (
        <div>
            <h1>Bem-vindo ao Dashboard!</h1>
            <button onClick={logout}>Sair (Logout)</button>
        </div>
    );
}

// Componente para proteger rotas
function ProtectedRoute({ children }) {
    const { accessToken } = useAuth();
    
    // Se não há token EM MEMÓRIA, redireciona para o login
    if (!accessToken) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } 
            />
            
            {/* Rota padrão */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
}

export default App;