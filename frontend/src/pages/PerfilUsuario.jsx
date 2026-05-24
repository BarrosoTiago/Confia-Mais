import { useState } from 'react';
import { Form, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';
import { 
  FaArrowLeft, FaLock, FaUserTimes, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.delete('/api/auth/users/delete/', {
        data: { password: password }
      });

      setSuccess(true);
      
      setTimeout(() => {
        logout(); 
        navigate('/'); 
      }, 2000);

    } catch (err) {
      const msg = err.response?.data?.detail || "Senha incorreta ou erro no servidor.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatedBackground />

      <div className="profile-user-wrapper">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            .profile-user-wrapper {
                min-height: 100vh; display: flex; align-items: center; justify-content: center;
                padding: 20px; font-family: 'Inter', sans-serif;
            }

            /* CARD PADRÃO (Igual ao Login/Recuperar Senha) */
            .glass-card {
                background: white; border-radius: 20px; padding: 40px;
                box-shadow: 0 10px 40px rgba(0,43,85,0.1);
                border: 1px solid rgba(255,255,255,0.8);
                width: 100%; max-width: 450px;
            }

            /* HEADER PADRÃO */
            .page-header { text-align: center; margin-bottom: 30px; }
            .header-icon { 
                width: 70px; height: 70px; background: #E3F2FD; color: #002B55; 
                border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                font-size: 1.8rem; margin: 0 auto 15px auto;
            }
            .page-title { font-family: 'Libre Baskerville', serif; font-weight: 700; color: #002B55; margin-bottom: 5px; }
            .page-subtitle { color: #666; font-size: 0.9rem; line-height: 1.5; }

            /* INPUTS PADRÃO */
            .custom-input { 
                border: 2px solid #F1F3F5; background: #F8F9FA; 
                padding: 12px 12px 12px 40px; border-radius: 10px; width: 100%; font-size: 0.95rem; 
                transition: 0.2s;
            }
            .custom-input:focus { border-color: #002B55; background: white; outline: none; }
            .form-label { font-size: 0.8rem; font-weight: 700; color: #002B55; text-transform: uppercase; margin-bottom: 8px; }

            /* BOTÃO DE AÇÃO (Vermelho sutil para indicar exclusão, mas mantendo o estilo flat) */
            .btn-action-danger {
                background: #DC2626; color: white; border: none; padding: 12px; border-radius: 30px;
                font-size: 1rem; font-weight: 700; box-shadow: 0 8px 20px rgba(220, 38, 38, 0.2); 
                transition: 0.2s; width: 100%; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 10px;
                cursor: pointer;
            }
            .btn-action-danger:hover { transform: translateY(-2px); background: #B91C1C; }
            .btn-action-danger:disabled { background: #FCA5A5; cursor: not-allowed; transform: none; box-shadow: none; }

            /* BOTÃO VOLTAR */
            .btn-back-text {
                background: transparent; border: none; color: #666; font-weight: 600; font-size: 0.9rem;
                display: flex; align-items: center; justify-content: center; gap: 8px;
                margin-top: 20px; transition: 0.2s; width: 100%; cursor: pointer;
            }
            .btn-back-text:hover { color: #002B55; }

            .btn-eye { position: absolute; right: 15px; top: 12px; background: none; border: none; color: #999; cursor: pointer; }
            .btn-eye:hover { color: #002B55; }
        `}</style>

        <div className="glass-card">
          
          {/* HEADER (Igual ao site, azul) */}
          <div className="page-header">
            <div className="header-icon">
                <FaUserTimes />
            </div>
            <h2 className="page-title">Excluir Conta</h2>
            <p className="page-subtitle">
                Tem certeza? Essa ação apagará todos os seus dados e agendamentos permanentemente.
            </p>
          </div>

          {error && <Alert variant="danger" className="d-flex align-items-center gap-2 small"><FaExclamationCircle/> {error}</Alert>}
          {success && <Alert variant="success" className="d-flex align-items-center gap-2 small"><FaCheckCircle/> Conta excluída! Redirecionando...</Alert>}

          <Form onSubmit={handleDeleteAccount}>
            <Form.Group className="mb-4">
               <Form.Label className="form-label">Senha Atual</Form.Label>
               <div className="position-relative">
                   <Form.Control 
                       className="custom-input"
                       type={showPassword ? "text" : "password"}
                       placeholder="Digite sua senha para confirmar"
                       value={password}
                       onChange={e => setPassword(e.target.value)}
                       required
                       disabled={success || loading}
                   />
                   <FaLock className="position-absolute text-muted" style={{left: '12px', top: '14px'}} />
                   <button type="button" className="btn-eye" onClick={() => setShowPassword(!showPassword)}>
                       {showPassword ? <FaEyeSlash/> : <FaEye/>}
                   </button>
               </div>
            </Form.Group>

            <button type="submit" className="btn-action-danger" disabled={loading || success || !password}>
                {loading ? <Spinner animation="border" size="sm"/> : "Confirmar Exclusão"}
            </button>
            
            <button type="button" className="btn-back-text" onClick={() => navigate(-1)} disabled={loading || success}>
                <FaArrowLeft /> Cancelar
            </button>
          </Form>

        </div>
      </div>
    </>
  );
}