import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { 
    FaUser, FaEnvelope, FaLock, FaPhone, FaStore, FaIdCard, 
    FaEye, FaEyeSlash, FaArrowLeft, FaShoppingBag 
} from 'react-icons/fa';
import logotipoSystem from "../assets/logotipo1.svg"; 


  // Campos do Formulário
// 1. Definição FORA do componente principal (Recebendo todas as props necessárias)
const FormFields = ({ 
  colorTheme, 
  formData, 
  handleChange, 
  showPassword, 
  setShowPassword, 
  showConfirmPassword, 
  setShowConfirmPassword 
}) => (
    <>
        <div className="modern-input-group">
            <label className="input-label" style={{color: colorTheme}}>Nome Completo</label>
            <div className="input-wrapper">
                <input type="text" className="modern-input" placeholder="Ex: Ana Souza" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required />
                <FaIdCard className="input-icon-left" />
            </div>
        </div>
        <div className="modern-input-group">
            <label className="input-label" style={{color: colorTheme}}>Usuário</label>
            <div className="input-wrapper">
                <input type="text" className="modern-input" placeholder="Seu login" name="username" value={formData.username} onChange={handleChange} required />
                <FaUser className="input-icon-left" />
            </div>
        </div>
        <div className="modern-input-group">
            <label className="input-label" style={{color: colorTheme}}>E-mail</label>
            <div className="input-wrapper">
                <input type="email" className="modern-input" placeholder="nome@email.com" name="email" value={formData.email} onChange={handleChange} required />
                <FaEnvelope className="input-icon-left" />
            </div>
        </div>
        <div className="modern-input-group">
            <label className="input-label" style={{color: colorTheme}}>Telefone</label>
            <div className="input-wrapper">
                <input type="tel" className="modern-input" placeholder="(xx) 9xxxx-xxxx" name="telefone" value={formData.telefone} onChange={handleChange} required />
                <FaPhone className="input-icon-left" />
            </div>
        </div>
        <Row>
            <Col md={6}>
                <div className="modern-input-group">
                    <label className="input-label" style={{color: colorTheme}}>Senha</label>
                    <div className="input-wrapper">
                        <input type={showPassword ? "text" : "password"} className="modern-input" placeholder="******" name="password" value={formData.password} onChange={handleChange} required />
                        <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>
                        <FaLock className="input-icon-left" />
                    </div>
                </div>
            </Col>
            <Col md={6}>
                <div className="modern-input-group">
                    <label className="input-label" style={{color: colorTheme}}>Confirmar</label>
                    <div className="input-wrapper">
                        <input type={showConfirmPassword ? "text" : "password"} className="modern-input" placeholder="******" name="password_confirm" value={formData.password_confirm} onChange={handleChange} required />
                        <div className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>
                        <FaLock className="input-icon-left" />
                    </div>
                </div>
            </Col>
        </Row>
    </>
);


export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('type') === 'client' ? 'client' : 'entrepreneur';

  const [role, setRole] = useState(initialRole); 
  const [formData, setFormData] = useState({
    nome_completo: '',   
    username: '', 
    email: '', 
    telefone: '',        
    password: '', 
    password_confirm: '' 
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if(error) setError('');
  };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.password_confirm) {
            return setError('As senhas não coincidem.');
        }

        setLoading(true);
        setError('');

        try {
            const dadosCompletos = {
                ...formData,
                tipo_usuario: role === 'client' ? 'CLIENTE' : 'EMPREENDEDOR'
            };

            await register(dadosCompletos); 
            
            // Redireciona para a tela de verificação enviando o e-mail preenchido "escondido"
            navigate('/verificar-email', { state: { email: formData.email } }); 
            
        } catch (err) {
            // Trata o erro vindo do backend (que configuramos no AuthContext)
            const msg = typeof err === 'object' ? Object.values(err).flat()[0] : 'Erro ao criar conta.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };


  return (
    <div className="register-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        :root {
            --col-navy: #002B55;
            --col-client: #0284C7;
            --col-bg-client: #F0F9FF;
            --col-neon: #FFFFFF;
            --col-neon-glow: rgba(255, 255, 255, 0.6);
            --col-teal-light: #A9D6E5;
            --bg-input: #F8FAFC;
            --text-main: #334155;
            --text-muted: #94A3B8;
        }

        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; background: var(--col-navy); }
        .register-wrapper { display: flex; height: 100vh; width: 100vw; }

        .form-section {
            flex: 1; background-color: var(--col-navy);
            display: flex; justify-content: center; position: relative; padding: 40px 20px 60px 20px; 
            overflow-y: auto; perspective: 1500px;
        }
        .form-section::-webkit-scrollbar { width: 6px; }
        .form-section::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }

        
/* Estilo do Card Único */
/* Definição de Cores Adicionais */
:root {
    --col-navy-card: #003d7a; /* Um azul um pouco mais claro que o fundo navy para contraste */
}

.register-card-switch {
    width: 100%;
    max-width: 500px;
    min-height: 750px;
    border-radius: 28px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 10;
    border: 2px solid rgba(255, 255, 255, 0.1);
    
    /* Transição de cores e um leve "deslize" lateral */
    transition: 
        background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.5s ease;
}

/* --- ESTADO EMPREENDEDOR (Azul Escuro com Detalhes Brancos) --- */
.is-entrepreneur {
    background-color: var(--col-navy-card);
    transform: translateX(-10px); /* Desliza para a esquerda */
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
}

.is-entrepreneur .form-title, 
.is-entrepreneur .input-label,
.is-entrepreneur .back-link {
    color: #FFFFFF !important;
}

.is-entrepreneur .modern-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
}

.is-entrepreneur .input-icon-left,
.is-entrepreneur .password-toggle {
    color: rgba(255, 255, 255, 0.6);
}

/* --- ESTADO CLIENTE (Branco com Detalhes Azul Claro) --- */
.is-client {
    background-color: #FFFFFF;
    transform: translateX(10px); /* Desliza para a direita */
    box-shadow: 0 25px 50px rgba(2, 132, 199, 0.2);
}

.is-client .form-title,
.is-client .input-label {
    color: var(--col-client);
}

.is-client .modern-input {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    color: var(--text-main);
}

/* Botões com efeito de destaque */
.btn-entrep {
    background: #FFFFFF;
    color: var(--col-navy);
}

.btn-client {
    background: var(--col-client);
    color: #FFFFFF;
}

        /* CABEÇALHO DO FORMULÁRIO COM LOGO */
        .form-header-row {
            display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 25px;
        }
        .header-logo-small { height: 50px; width: auto; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.1)); align-self: center; margin-right: 8px; }
        
        .form-title { 
            font-family: 'Libre Baskerville', serif; font-size: 1.8rem; 
            font-weight: 700; margin: 0; line-height: 1;
        }

        .role-toggle {
            display: flex; background: rgba(0,0,0,0.04); border-radius: 50px; padding: 5px; margin-bottom: 30px; border: 1px solid rgba(0,0,0,0.05);
        }
        .toggle-item {
            flex: 1; text-align: center; padding: 12px; cursor: pointer;
            border-radius: 50px; font-weight: 700; font-size: 0.85rem; color: var(--text-muted);
            transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .toggle-item:hover { background: rgba(0,0,0,0.05); }
        .active-entrepreneur { background: var(--col-neon) !important; color: var(--col-navy) !important; box-shadow: 0 4px 10px rgba(0, 43, 85, 0.25); }
        .active-client { background: var(--col-client) !important; color: white !important; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25); }

        .modern-input-group { margin-bottom: 12px; }
        .input-label { display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 2px; letter-spacing: 0.5px; text-transform: uppercase; }
        .input-wrapper { position: relative; width: 100%; }
        .modern-input {
            width: 100%; padding: 12px 12px 12px 40px; background: white; 
            border: 1px solid #E2E8F0; border-radius: 6px; font-size: 0.95rem; color: var(--text-main); transition: 0.3s;
        }
        .modern-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
        .front .modern-input { background: var(--bg-input); color: white; border-color: #0284C7; }
        .front .modern-input:focus { border-color: var(--col-neon); background: white; }
        .back .modern-input { background: white; border-color: #BAE6FD; }
        .back .modern-input:focus { border-color: var(--col-client); }

        .input-icon-left { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .password-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); cursor: pointer; }

        .btn-register {
            width: 100%; padding: 15px; border-radius: 12px; border: none;
            color: white; font-weight: 700; font-size: 1rem; letter-spacing: 1px;
            transition: 0.3s; margin-top: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .btn-entrep { background: var(--col-neon); color: var(--col-navy); }
        .btn-entrep:hover { background: var(--col-neon-glow); transform: translateY(-2px); }
        .btn-client { background: var(--col-client); }
        .btn-client:hover { background: #0369A1; transform: translateY(-2px); }

        .back-link {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            margin: 25px; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; font-weight: 600; cursor: pointer;
        }

        .brand-section {
            flex: 1.2; background: linear-gradient(135deg, #F0F9FF 0%, var(--col-teal-light) 100%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            position: relative; overflow: hidden; text-align: center; padding: 40px;
        }
        .tech-grid {
            position: absolute; width: 200%; height: 200%; top: -50%; left: -50%;
            background-image: linear-gradient(rgba(0, 43, 85, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 43, 85, 0.05) 1px, transparent 1px);
            background-size: 60px 60px; transform: perspective(500px) rotateX(45deg); opacity: 0.8;
            animation: gridMove 25s linear infinite;
        }
        @keyframes gridMove {
            0% { transform: perspective(500px) rotateX(45deg) translateY(0); }
            100% { transform: perspective(500px) rotateX(45deg) translateY(60px); }
        }
        .floating-square {
            position: absolute; background: rgba(0, 43, 85, 0.05);
            border: 1px solid rgba(0, 43, 85, 0.1); transform: rotate(45deg);
            animation: floatSquare 12s infinite ease-in-out;
        }
        .sq1 { width: 100px; height: 100px; top: 15%; right: 15%; }
        .sq2 { width: 60px; height: 60px; bottom: 25%; left: 15%; animation-delay: -3s; }
        .sq3 { width: 150px; height: 150px; top: 45%; left: 45%; opacity: 0.08; animation-duration: 18s; }
        @keyframes floatSquare {
            0%, 100% { transform: rotate(45deg) translate(0, 0); }
            50% { transform: rotate(45deg) translate(20px, -30px); }
        }
        .logo-giant { height: 290px; margin-bottom: 25px; filter: drop-shadow(0 5px 15px rgba(0, 43, 85, 0.15)); }
        .brand-title { font-family: 'Libre Baskerville', serif; font-size: 4rem; color: var(--col-navy); margin: 0; }
        .brand-tagline { font-size: 1.3rem; color: var(--col-navy); margin-top: 15px; font-weight: 500; }

        @media (max-width: 900px) {
            .register-wrapper { flex-direction: column; }
            .brand-section { display: none; }
            .form-section { padding: 40px 20px; }
        }
      `}</style>

      {/* LADO ESQUERDO: FORMULÁRIO  */}
<div className="form-section">
    <div className="bg-glow-effect"></div>

    {/* O card desliza levemente e troca de cor conforme o role */}
    <div className={`register-card-switch ${role === 'client' ? 'is-client' : 'is-entrepreneur'}`}>
        
        <div className="form-header-row">
            <img src={logotipoSystem} alt="Logo" className="header-logo-small" />
            <h2 className="form-title">
                {role === 'client' ? 'Novo Cliente' : 'Nova Empresa'}
            </h2>
        </div>

        <div className="role-toggle">
            <div 
                className={`toggle-item ${role === 'client' ? 'active-client' : ''}`} 
                onClick={() => setRole('client')}
            >
                <FaShoppingBag /> SOU CLIENTE
            </div>
            <div 
                className={`toggle-item ${role === 'entrepreneur' ? 'active-entrepreneur' : ''}`} 
                onClick={() => setRole('entrepreneur')}
            >
                <FaStore /> SOU EMPREENDEDOR
            </div>
        </div>

        {error && <Alert variant="danger" className="text-center py-2 mb-3">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
            <FormFields 
                colorTheme={role === 'client' ? 'var(--col-client)' : '#FFFFFF'} 
                formData={formData}
                handleChange={handleChange}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
            />
            
            <button 
                type="submit" 
                className={`btn-register ${role === 'client' ? 'btn-client' : 'btn-entrep'}`} 
                disabled={loading}
            >
                {loading ? <Spinner animation="border" size="sm" /> : 
                 role === 'client' ? "CADASTRAR MEU PERFIL" : "CADASTRAR EMPRESA"}
            </button>
        </Form>

        <div className="back-link" onClick={() => navigate('/login')}>
            <FaArrowLeft /> Já possuo conta
        </div>
    </div>
</div>

      {/* LADO DIREITO: MARCA */}
      <div className="brand-section">
          <div className="tech-grid"></div>
          <div className="floating-square sq1"></div>
          <div className="floating-square sq2"></div>
          <div className="floating-square sq3"></div>
          
          <div className="brand-content" style={{animation: 'fadeInRight 1s ease-out', position: 'relative', zIndex: 10}}>
              <img src={logotipoSystem} alt="Confia+" className="logo-giant" />
              <h1 className="brand-title">CONFIA +</h1>
              <p className="brand-tagline">Feito para o microempreendedor brasileiro.</p>
          </div>
      </div>
    </div>
  );
}