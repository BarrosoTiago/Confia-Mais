import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, InputGroup, Spinner, Alert } from 'react-bootstrap';
// Adicionei FaEye e FaEyeSlash
import { FaUser, FaKey, FaChevronDown, FaEye, FaEyeSlash } from 'react-icons/fa';
import { TbArrowsSort } from 'react-icons/tb';

// Importe o logo oficial
import logoOficial from '../assets/logotipo.svg'; 

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Novo estado para controlar a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
        const userData = await login(username, password);
        
        console.log("Dados do usuário recebidos:", userData);

        if (userData) {
          // Verifica se é um empreendedor
          if (userData.tipo_usuario === 'ADMIN') {
            
            // Se o backend indicar que não há horários cadastrados
            if (userData.deve_configurar_horarios) {
              // CAMINHO EXATO DA SUA ROTA
              navigate('/admin/config-horarios'); 
            } else {
              // Caminho padrão para quem já configurou
              navigate('/admin-dashboard');
            }
            
          } else {
            // Caminho para clientes comuns
            navigate('/vitrine'); 
          }
        }
      } catch (err) {
        console.error(err);
        setError('Credenciais inválidas.');
      } finally {
        setLoading(false);
      }
    }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        
        .login-page-wrapper {
          background: linear-gradient(90deg, #002B55 35%, #A8DADC 35%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Libre Baskerville', serif;
          overflow: hidden;
        }

        .card-login {
          background-color: #F8F9FA;
          border-radius: 12px;
          padding: 4rem 3.5rem;
          box-shadow: 0 25px 50px rgba(0,0,0,0.18);
          width: 100%;
          max-width: 500px;
          min-height: 620px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-right: -60px; 
          position: relative;
          z-index: 10;
        }

        .login-title {
          color: #002B55;
          font-weight: 700;
          font-size: 1.3rem;
          letter-spacing: 2px;
          margin-bottom: 3rem;
          text-transform: uppercase;
        }

        .custom-label {
          color: #002B55;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
        }
        
        .custom-input-group {
          border-bottom: 2px solid #002B55;
          margin-bottom: 2.5rem;
          transition: border-color 0.3s;
        }
        .custom-input-group:focus-within {
           border-color: #0056b3;
        }

        .custom-input {
          border: none;
          background: transparent;
          border-radius: 0;
          padding: 10px 0 10px 12px;
          color: #002B55;
          font-weight: 400;
          font-size: 1rem;
        }
        .custom-input:focus {
          background: transparent;
          box-shadow: none;
        }
        .custom-input::placeholder {
            color: #002B55; 
            opacity: 0.5;
            font-size: 0.9rem;
            font-style: italic;
        }

        /* Classe para o ícone clicável do olho */
        .password-toggle {
            cursor: pointer;
            transition: color 0.2s;
        }
        .password-toggle:hover {
            color: #0056b3 !important;
        }

        .btn-entrar {
            background-color: #002B55;
            border: none;
            padding: 16px;
            font-weight: 700;
            letter-spacing: 1.5px;
            width: 100%;
            border-radius: 6px;
            font-size: 0.9rem;
            text-transform: uppercase;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,43,85,0.2);
        }
        .btn-entrar:hover {
            background-color: #001a33;
            transform: translateY(-1px);
            box-shadow: 0 6px 8px rgba(0,43,85,0.3);
        }

        .btn-primeiro-acesso {
          background-color: #E0E0E0;
          color: #002B55;
          border: none;
          padding: 16px;
          font-weight: 700;
          letter-spacing: 1px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 0.9rem;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }
        .btn-primeiro-acesso:hover {
          background-color: #d0d0d0;
          color: #000;
        }

        .brand-container {
          padding-left: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .brand-logo-img {
          width: 100%;
          max-width: 600px;
          height: auto;
          filter: drop-shadow(0px 15px 25px rgba(0,43,85,0.2));
          transform: scale(1.05);
        }

        @media (max-width: 992px) {
           .login-page-wrapper {
              background: #A8DADC;
              flex-direction: column;
              padding: 20px;
              height: auto;
           }
           .card-login {
              margin-right: 0;
              margin-bottom: 50px;
              max-width: 100%;
              min-height: auto;
              padding: 2.5rem;
           }
           .brand-container {
              padding-left: 0;
              margin-bottom: 40px;
           }
           .brand-logo-img {
              max-width: 300px;
           }
        }
      `}</style>

      <div className="login-page-wrapper">
        <Container fluid>
          <Row className="justify-content-center align-items-center h-100">
            
            {/* COLUNA ESQUERDA - CARTÃO */}
            <Col md={10} lg={5} xl={4} className="d-flex justify-content-center justify-content-lg-end">
              <div className="card-login">
                <h3 className="login-title">Login</h3>

                {error && <Alert variant="danger" className="py-2 small text-center mb-4">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  {/* USUÁRIO */}
                  <div className="mb-4">
                    <label className="custom-label">
                      <FaUser className="me-2" size={14} /> EMAIL / USUÁRIO
                    </label>
                    <InputGroup className="custom-input-group">
                      <Form.Control 
                        type="text" 
                        placeholder="Digite seu usuário" 
                        className="custom-input"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                      />
                      <InputGroup.Text className="bg-transparent border-0 pe-0">
                        {/* Mantive o Chevron no usuário apenas por estilo */}
                        <FaChevronDown color="#002B55" size={10} />
                      </InputGroup.Text>
                    </InputGroup>
                  </div>

                  {/* SENHA (COM O OLHINHO) */}
                  <div className="mb-2">
                    <label className="custom-label">
                      <FaKey className="me-2" size={14} /> SENHA
                    </label>
                    <InputGroup className="custom-input-group">
                      <Form.Control 
                        // Aqui está a mágica: se showPassword for true, vira 'text', senão 'password'
                        type={showPassword ? "text" : "password"} 
                        placeholder="******" 
                        className="custom-input"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                      <InputGroup.Text 
                        className="bg-transparent border-0 pe-0 password-toggle"
                        onClick={() => setShowPassword(!showPassword)} // Alterna o estado ao clicar
                        title={showPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showPassword ? (
                            <FaEyeSlash color="#002B55" size={18} /> 
                        ) : (
                            <FaEye color="#002B55" size={18} />
                        )}
                      </InputGroup.Text>
                    </InputGroup>
                  </div>

                  {/* Link Esqueci Senha */}
                  <div className="text-end mb-5">
                     <span 
                        style={{
                            cursor:'pointer', 
                            fontSize:'0.8rem', 
                            color:'#555', 
                            fontStyle:'italic',
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px'
                        }}
                        onClick={() => navigate('/recuperar-senha')}
                     >
                        Esqueci minha senha
                     </span>
                  </div>

                  {/* Botão Entrar */}
                  <Button type="submit" className="btn-entrar mb-4" disabled={loading}>
                    {loading ? <Spinner size="sm"/> : 'ENTRAR'}
                  </Button>

                  {/* Divisor */}
                  <div className="d-flex align-items-center mb-4">
                    <hr className="flex-grow-1 border-secondary opacity-25" />
                    <span className="mx-3 fw-bold small text-muted" style={{fontFamily: 'sans-serif'}}>ou</span>
                    <hr className="flex-grow-1 border-secondary opacity-25" />
                  </div>

                  {/* Botão Primeiro Acesso */}
                  <Button className="btn-primeiro-acesso" onClick={() => navigate('/register')}>
                    <TbArrowsSort className="me-2" size={20} />
                    PRIMEIRO ACESSO
                  </Button>
                </Form>
              </div>
            </Col>

            {/* COLUNA DIREITA - LOGO SVG */}
            <Col md={10} lg={6} xl={6}>
              <div className="brand-container">
                <img src={logoOficial} alt="Logo Confia+" className="brand-logo-img" />
              </div>
            </Col>

          </Row>
        </Container>
      </div>
    </>
  );
}