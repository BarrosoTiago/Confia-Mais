import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from './Login.jsx';
import Register from './Register.jsx';

import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

// Componente simples de Dashboard
function Dashboard() {
    const { logout } = useAuth();
    return (
        <div>
            <h1>Bem-vindo ao Dashboard!</h1>
            <button onClick={logout} className="btn btn-danger">Sair (Logout)</button>
        </div>
    );
}

// Componente para proteger rotas
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
        //  Fragment (<>) para ter o App e o Toast no mesmo nível
        <>
            {/* --- Container do Toast --- */}
            <ToastContainer
                position="top-end" 
                className="p-3" 
                style={{ zIndex: 9999 }} // Garante que fique "acima de tudo"
            >
                <Toast
                    show={notification !== null} 
                    onClose={clearNotification} 
                    // Duração de 15 segundos
                    delay={15000} 
                    autohide 
                    className="custom-error-toast"
                    bg={null}
                >
                    <Toast.Header closeButton={true}>
                        <strong className="me-auto text-danger">Ocorreu um erro</strong>
                    </Toast.Header>
                    <Toast.Body>{notification}</Toast.Body>
                </Toast>
            </ToastContainer>


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
                
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </>
    );
}

export default App;