import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext"; 
import { Toast, ToastContainer } from 'react-bootstrap';

// Importação das Telas
// Como o App.jsx está na pasta 'pages', não precisamos do prefixo "./pages/"
import Login from "./Login";
import Register from "./Register";
import AdminDashboard from "./AdminDashboard";
import ClienteDashboard from "./ClienteDashboard";
import ConfigHorarios from "./ConfigHorarios";
import Servicos from "./Servicos";
import Financeiro from "./Financeiro";
import Despesas from "./Despesas";
import Agendamentos from "./Agendamentos";
import RecuperarSenha from "./RecuperarSenha"; 
import Vitrine from "./Vitrine";
import PerfilLoja from "./PerfilLoja";
import HistoricoGeral from "./HistoricoGeral";
import CalculadoraPreco from "./CalculadoraPreco"; // <--- CAMINHO CORRIGIDO

// --- Componente que Protege as Rotas ---
const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
     return (
       <div className="d-flex justify-content-center align-items-center vh-100">
         <div className="spinner-border text-primary" role="status">
           <span className="visually-hidden">Carregando...</span>
         </div>
       </div>
     );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role === 'ADMIN' && user.tipo_usuario !== 'ADMIN') {
    return <Navigate to="/vitrine" />;
  }

  return children;
};

// --- Notificação Global ---
const GlobalNotification = () => {
    const { notification, clearNotification } = useAuth();
    if (!notification) return null;

    return (
        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
            <Toast 
                show={!!notification} 
                onClose={clearNotification} 
                delay={4000} 
                autohide 
                bg={notification.type === 'error' ? 'danger' : 'success'}
            >
                <Toast.Header closeButton={true}>
                    <strong className="me-auto">
                        {notification.type === 'error' ? 'Aviso' : 'Sucesso'}
                    </strong>
                </Toast.Header>
                <Toast.Body className="text-white">
                    {notification.message}
                </Toast.Body>
            </Toast>
        </ToastContainer>
    );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalNotification />

        <Routes>
          {/* --- Rotas Públicas --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />

          {/* --- Rotas do ADMIN (Empreendedor) --- */}
          <Route path="/admin-dashboard" element={
            <PrivateRoute role="ADMIN"><AdminDashboard /></PrivateRoute>
          } />
          <Route path="/admin/config-horarios" element={
            <PrivateRoute role="ADMIN"><ConfigHorarios /></PrivateRoute>
          } />
          <Route path="/admin/servicos" element={
            <PrivateRoute role="ADMIN"><Servicos /></PrivateRoute>
          } />
          <Route path="/admin/financeiro" element={
            <PrivateRoute role="ADMIN"><Financeiro /></PrivateRoute>
          } />
          <Route path="/admin/despesas" element={
            <PrivateRoute role="ADMIN"><Despesas /></PrivateRoute>
          } />
          <Route path="/admin/agendamentos" element={
            <PrivateRoute role="ADMIN"><Agendamentos /></PrivateRoute>
          } />
          <Route path="/admin/perfil" element={
            <PrivateRoute role="ADMIN"><PerfilLoja /></PrivateRoute>
          } />
          
          {/* ROTA DA CALCULADORA */}
          <Route path="/admin/calculadora" element={
            <PrivateRoute role="ADMIN"><CalculadoraPreco /></PrivateRoute>
          } />

          {/* --- Rotas do CLIENTE --- */}
          <Route path="/vitrine" element={
            <PrivateRoute role="CLIENTE"><Vitrine /></PrivateRoute>
          } />
          
          <Route path="/meus-agendamentos" element={
            <PrivateRoute role="CLIENTE"><HistoricoGeral /></PrivateRoute>
          } />

          <Route path="/cliente-dashboard" element={
            <PrivateRoute role="CLIENTE"><ClienteDashboard /></PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}