import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Form, Alert, Spinner } from 'react-bootstrap';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaLongArrowAltRight, FaTimes } from 'react-icons/fa';
import logotipoSystem from "../assets/logotipo1.svg"; 

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if(error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData.username, formData.password);
      navigate('/admin-dashboard'); 
    } catch (err) {
      setError('Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        :root {
            --col-navy: #002B55;
            --col-neon: #FFFFFF;
            --col-neon-glow: rgba(255, 255, 255, 0.6);
            --col-blue-mid: #2A6F97;
            --col-teal-light: #A9D6E5;
            --col-teal-dark: #61A5C2;
            --bg-input: #F8FAFC;
            --text-main: #334155;
            --text-muted: #94A3B8;
        }

        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; background: var(--col-navy); }

        .login-wrapper { display: flex; height: 100vh; width: 100vw; }

        /* =========================================
           LADO ESQUERDO (MANTIDO ESCURO)
        ========================================= */
        .form-section {
            flex: 1;
            background-color: var(--col-navy);
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            position: relative; padding: 40px; overflow: hidden; z-index: 20;
        }

        .close-btn-X {
            position: absolute; top: 30px; right: 30px;
            display: flex; align-items: center; justify-content: center;
            width: 45px; height: 45px; border-radius: 50%;
            background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8);
            font-size: 1.4rem; text-decoration: none; transition: all 0.3s ease;
            border: 2px solid transparentO; z-index: 20;
        }
        .close-btn-X:hover { 
            color: var(--col-navy); background: var(--col-neon);
            box-shadow: 0 0 20px var(--col-neon-glow); transform: rotate(90deg) scale(1.1);
        }
        .login-card {
            width: 100%; max-width: 440px;
            background: white; padding: 50px 40px; border-radius: 24px;
            border: 2px solid var(--col-neon);
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            position: relative; z-index: 10;
            animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .form-header-row { display: flex; align-items: center; gap: 15px; margin-bottom: 35px; }
        .form-header-row div { display: flex; flex-direction:column; align-items: center; text-align: left;}
        .header-logo-small { height: 55px; width: auto; align-self: center; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.1)); }
        .form-title { font-family: 'Libre Baskerville', serif; font-size: 2rem; color: var(--col-navy); font-weight: 700; margin-bottom: 0; line-height: 1; }
        .form-subtitle { color: var(--text-muted); font-size: 0.9rem; margin-top: 5px; }
        .modern-input-group { position: relative; margin-bottom: 12px; }
        .input-label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--col-navy); margin-bottom: 8px; letter-spacing: 0.5px; text-transform: uppercase; }
        .input-wrapper { position: relative; }
        .modern-input { width: 100%; padding: 14px 14px 14px 45px; background: var(--bg-input); border: 1px solid #E2E8F0; border-radius: 6px; font-size: 1rem; color: var(--text-main); transition: all 0.3s ease; }
        .modern-input:focus { background: white; border-color: var(--col-blue-mid); outline: none; box-shadow: 0 0 0 4px rgba(42, 111, 151, 0.1); }
        .input-icon-left { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.1rem; transition: 0.2s; }
        .modern-input:focus + .input-icon-left { color: var(--col-blue-mid); }
        .password-toggle { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); cursor: pointer; transition: 0.2s; }
        .password-toggle:hover { color: var(--col-blue-mid); }
        .forgot-pass { display: block; text-align: right; font-size: 0.85rem; color: var(--text-muted); text-decoration: none; margin-bottom: 30px; transition: 0.2s; font-weight: 600; }
        .forgot-pass:hover { color: var(--col-blue-mid); text-decoration: underline; }
        .btn-primary-solid { width: 100%; padding: 16px; border-radius: 12px; border: none; background: var(--col-navy); color: white; font-weight: 700; font-size: 1rem; letter-spacing: 1px; transition: all 0.3s ease; box-shadow: 0 10px 20px rgba(0, 43, 85, 0.2); display: flex; align-items: center; justify-content: center; gap: 10px; }
        .btn-primary-solid:hover { background: var(--col-blue-mid); transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0, 43, 85, 0.3); }
        .btn-primary-solid:disabled { background: #CBD5E1; transform: none; box-shadow: none; }
        .divider { display: flex; align-items: center; margin: 30px 0; color: var(--text-muted); font-size: 0.8rem; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #E2E8F0; }
        .divider span { padding: 0 15px; text-transform: uppercase; letter-spacing: 1px; }
        .btn-outline { width: 100%; padding: 14px; border-radius: 12px; background: white; border: 2px solid #E2E8F0; color: var(--col-navy); font-weight: 700; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .btn-outline:hover { border-color: var(--col-navy); background: var(--bg-input); color: var(--col-blue-mid); }

        /* =========================================
           LADO DIREITO (FUNDO CLARO)
        ========================================= */
        .brand-section {
            flex: 1.2;
            /* Gradiente MUITO CLARO (Branco Azulado -> Teal Claro) */
            background: linear-gradient(135deg, #F0F9FF 0%, var(--col-teal-light) 100%);
            position: relative;
            overflow: hidden;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            text-align: center;
            padding: 40px;
        }

        /* GRID TECNOLÓGICO (Agora escuro e sutil para fundo claro) */
        .tech-grid {
            position: absolute; width: 200%; height: 200%; top: -50%; left: -50%;
            background-image: 
                linear-gradient(rgba(0, 43, 85, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 43, 85, 0.05) 1px, transparent 1px);
            background-size: 60px 60px;
            transform: perspective(500px) rotateX(45deg);
            animation: gridMove 25s linear infinite; opacity: 0.8;
        }
        @keyframes gridMove {
            0% { transform: perspective(500px) rotateX(45deg) translateY(0); }
            100% { transform: perspective(500px) rotateX(45deg) translateY(60px); }
        }

        /* PARTÍCULAS FLUTUANTES (Escuras para fundo claro) */
        .floating-square {
            position: absolute; 
            background: rgba(0, 43, 85, 0.05);
            border: 1px solid rgba(0, 43, 85, 0.1); 
            transform: rotate(45deg);
            animation: floatSquare 12s infinite ease-in-out;
        }
        .sq1 { width: 100px; height: 100px; top: 15%; right: 15%; }
        .sq2 { width: 60px; height: 60px; bottom: 25%; left: 15%; animation-delay: -3s; }
        .sq3 { width: 150px; height: 150px; top: 45%; left: 45%; opacity: 0.08; animation-duration: 18s; }
        @keyframes floatSquare {
            0%, 100% { transform: rotate(45deg) translate(0, 0); }
            50% { transform: rotate(45deg) translate(20px, -30px); }
        }

        .brand-content-wrapper {
            position: relative; z-index: 10;
            animation: fadeInRight 1s ease-out;
        }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

        .logo-giant { 
            height: 290px; width: auto; margin-bottom: 25px;
            /* Sombra escura sutil para destacar no fundo claro */
            filter: drop-shadow(0 5px 15px rgba(0, 43, 85, 0.15));
        }

        /* Texto agora é ESCURO para contraste */
        .brand-title {
            font-family: 'Libre Baskerville', serif; font-size: 4rem; 
            color: var(--col-navy); /* Azul marinho */
            margin: 0;
        }
        .brand-tagline {
            font-size: 1.3rem; 
            color: var(--col-navy); /* Azul marinho */
            margin-top: 15px; font-weight: 500; letter-spacing: 0.5px;
        }

        @media (max-width: 900px) {
            .login-wrapper { flex-direction: column; }
            .brand-section { display: none; }
            .form-section { padding: 80px 20px 40px 20px; }
            .close-btn-X { top: 20px; right: 20px; }
            .form-header-row { justify-content: center; text-align: left; }

        }
      `}</style>

      {/* LADO ESQUERDO (MANTIDO) */}
      <div className="form-section">
          <div className="bg-glow-effect"></div>
          
          <a href="/" className="close-btn-X" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
              <FaTimes />
          </a>

          <div className="login-card">
              <div className="form-header-row">
                  <img src={logotipoSystem} alt="Logo Confia+" className="header-logo-small" />
                  <div>
                      <h2 className="form-title">Login</h2>
                      <p className="form-subtitle">Bem-vindo de volta!</p>
                  </div>
              </div>

              {error && <Alert variant="danger" className="border-0 shadow-sm mb-4 text-center" style={{fontSize:'0.9rem', borderRadius:'10px'}}>{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                  <div className="modern-input-group">
                      <label className="input-label">Usuário</label>
                      <div className="input-wrapper">
                          <input 
                              type="text" 
                              className="modern-input" 
                              placeholder="Digite seu usuário"
                              name="username"
                              value={formData.username}
                              onChange={handleChange}
                              required
                          />
                          <FaUser className="input-icon-left" />
                      </div>
                  </div>

                  <div className="modern-input-group">
                      <label className="input-label">Senha</label>
                      <div className="input-wrapper">
                          <input 
                              type={showPassword ? "text" : "password"} 
                              className="modern-input" 
                              placeholder="Digite sua senha"
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              required
                          />
                          <FaLock className="input-icon-left" />
                          <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </div>
                      </div>
                  </div>

                  <a href="/recuperar-senha" class="forgot-pass">Esqueceu a senha?</a>

                  <button type="submit" className="btn-primary-solid" disabled={loading}>
                      {loading ? <Spinner animation="border" size="sm" /> : <>ENTRAR <FaSignInAlt /></>}
                  </button>
              </Form>

              <div className="divider"><span>ou</span></div>

              <button className="btn-outline" onClick={() => navigate('/register')}>
                  Criar conta agora <FaLongArrowAltRight />
              </button>
          </div>
      </div>

      {/* LADO DIREITO (FUNDO CLARO) */}
      <div className="brand-section">
          <div className="tech-grid"></div>
          <div className="floating-square sq1"></div>
          <div className="floating-square sq2"></div>
          <div className="floating-square sq3"></div>
          
          <div className="brand-content-wrapper">
              <img src={logotipoSystem} alt="Confia+" className="logo-giant" />
              <h1 className="brand-title">CONFIA +</h1>
              <p className="brand-tagline">Feito para o microempreendedor brasileiro.</p>
          </div>
      </div>

    </div>
  );
}