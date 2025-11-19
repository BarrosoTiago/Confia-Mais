import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importação das Páginas Reais
import Login from './Login.jsx';
import Register from './Register.jsx';
import ClienteDashboard from './ClienteDashboard'; 
import AdminDashboard from './AdminDashboard'; // <--- IMPORTANTE: Importe o arquivo novo
import Despesas from './Despesas';
import Servicos from './Servicos';

import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

// Função de Proteção de Rota (Mantenha esta)
function ProtectedRoute({ children }) {
    const { accessToken } = useAuth();
    
    if (!accessToken) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    const { notification, clearNotification } = useAuth();

    return (
        <>
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast show={notification !== null} onClose={clearNotification} delay={5000} autohide bg="danger">
                    <Toast.Header><strong className="me-auto">Aviso</strong></Toast.Header>
                    <Toast.Body className="text-white">{notification}</Toast.Body>
                </Toast>
            </ToastContainer>

            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Rota do Cliente */}
                <Route 
                    path="/cliente-dashboard" 
                    element={
                        <ProtectedRoute>
                            <ClienteDashboard />
                        </ProtectedRoute>
                    } 
                />

                {/* Rota do Admin (Agora aponta para o arquivo AdminDashboard) */}
                <Route 
                    path="/admin-dashboard" 
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />

                <Route 
                    path="/admin/despesas" 
                    element={
                        <ProtectedRoute>
                            <Despesas />
                </ProtectedRoute>
                    } 
                />

                <Route 
                    path="/admin/servicos" 
                    element={
                        <ProtectedRoute>
                            <Servicos />
                        </ProtectedRoute>
                    } 
                />

                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="*" element={<h1>Página não encontrada (404)</h1>} />
            </Routes>
        </>
    );
}

export default App;