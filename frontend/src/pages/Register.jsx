import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Ícones
import { 
  FaUser, FaEnvelope, FaKey, FaIdCard, FaPhone, 
  FaEye, FaEyeSlash, FaStore 
} from 'react-icons/fa';
import { IoMdArrowBack } from 'react-icons/io';
import { Container, Row, Col, Form, Button, InputGroup, Alert, Toast, ToastContainer } from 'react-bootstrap';

// Logo
import logoOficial from "../assets/logotipo.svg";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    nome_completo: "",
    telefone: "",
    tipo_usuario: "CLIENTE",
  });

  const { register, setNotification } = useAuth();
  const navigate = useNavigate();

  // Estados visuais
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de erro e notificação
  const [errorMsg, setErrorMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Função genérica de input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Função específica para o seletor moderno
  const handleTypeChange = (type) => {
    setFormData({ ...formData, tipo_usuario: type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (formData.password !== formData.password_confirm) {
      alert("As senhas não correspondem.");
      return;
    }

    try {
      await register(formData);
      alert("Cadastro realizado com sucesso!");
      navigate("/");
    } catch (error) {
        console.error("Erro completo:", error);
        
        let mensagemFinal = "Erro ao realizar cadastro. Verifique os dados.";

        if (typeof error === 'object') {
            const errosListados = Object.keys(error).map(campo => {
                const mensagem = Array.isArray(error[campo]) ? error[campo][0] : error[campo];
                // Traduz nomes de campos técnicos para o usuário
                const nomeCampo = campo.replace('username', 'Usuário').replace('email', 'E-mail').replace('password', 'Senha').replace('telefone', 'Telefone');
                return `${nomeCampo}: ${mensagem}`;
            });
            mensagemFinal = errosListados.join(' | ');
        }

        setErrorMsg(mensagemFinal);
        setShowToast(true);
    }
  };

  return (
    <>
      <style>{`
        /* FONTE ÚNICA: Libre Baskerville (Igual ao Login) */
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        
        .register-page-wrapper {
          background: linear-gradient(90deg, #002B55 35%, #A8DADC 35%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          /* Aplica a fonte em todo o container */
          font-family: 'Libre Baskerville', serif; 
          overflow-x: hidden;
          padding: 20px;
        }

        .card-register {
          background-color: #FFFFFF;
          border-radius: 16px;
          padding: 3rem 2.5rem;
          box-shadow: 0 30px 60px rgba(0,0,0,0.15);
          width: 100%;
          max-width: 580px;
          display: flex;
          flex-direction: column;
          margin-right: -60px; 
          position: relative;
          z-index: 10;
          max-height: 90vh;
          overflow-y: auto;
        }

        .card-register::-webkit-scrollbar { width: 6px; }
        .card-register::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 4px; }

        .register-title {
          color: #002B55;
          font-weight: 700;
          font-size: 1.5rem;
          letter-spacing: 1px;
          margin-bottom: 2rem;
          text-align: center;
          text-transform: uppercase;
        }

        /* --- SELETOR MODERNO (Agora com a mesma fonte) --- */
        .user-type-selector {
          display: flex;
          background-color: #F1F3F5;
          border-radius: 50px;
          padding: 5px;
          margin-bottom: 2rem;
          position: relative;
          border: 1px solid #E9ECEF;
        }

        .type-option {
          flex: 1;
          text-align: center;
          padding: 12px 10px;
          border-radius: 50px;
          cursor: pointer;
          font-family: 'Libre Baskerville', serif; /* Fonte Corrigida */
          font-weight: 700;
          font-size: 0.8rem; /* Levemente menor para caber bem */
          color: #6C757D;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .type-option:hover {
          color: #002B55;
          background-color: rgba(0,0,0,0.03);
        }

        .type-option.active {
          background-color: #002B55;
          color: #FFFFFF;
          box-shadow: 0 4px 10px rgba(0,43,85,0.3);
        }
        /* --------------------------- */

        .custom-label {
          color: #002B55;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 1.2px;
          margin-bottom: 4px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
        }
        
        .custom-input-group {
          border-bottom: 2px solid #DEE2E6;
          margin-bottom: 1.2rem;
          transition: border-color 0.3s ease;
        }
        .custom-input-group:focus-within {
           border-color: #002B55;
        }

        .custom-input {
          border: none;
          background: transparent;
          border-radius: 0;
          padding: 8px 0 8px 10px;
          color: #002B55;
          font-weight: 400;
          font-size: 1rem;
          font-family: 'Libre Baskerville', serif; /* Fonte Corrigida */
        }
        .custom-input:focus {
          background: transparent;
          box-shadow: none;
        }
        .custom-input::placeholder {
            color: #ADB5BD; 
            font-size: 0.9rem;
            font-style: italic;
        }

        .password-toggle {
            cursor: pointer;
            color: #ADB5BD;
            transition: color 0.2s;
        }
        .password-toggle:hover {
            color: #002B55 !important;
        }

        .btn-register {
            background-color: #002B55;
            border: none;
            padding: 15px;
            font-weight: 700;
            letter-spacing: 1.5px;
            width: 100%;
            border-radius: 8px;
            font-size: 0.9rem;
            text-transform: uppercase;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(0,43,85,0.2);
            margin-top: 10px;
        }
        .btn-register:hover {
            background-color: #001a33;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0,43,85,0.3);
        }

        .btn-back-login {
          background-color: transparent;
          color: #6C757D;
          border: 1px solid transparent; /* Remove borda visível inicial para ficar mais limpo */
          padding: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 0.8rem;
          text-transform: uppercase;
          transition: all 0.3s ease;
          font-family: 'Libre Baskerville', serif; /* Fonte Corrigida */
        }
        .btn-back-login:hover {
          color: #002B55;
          background-color: #F8F9FA;
        }

        .brand-container {
          padding-left: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          position: sticky; 
          top: 0;
        }
        .brand-logo-img {
          width: 100%;
          max-width: 600px;
          height: auto;
          filter: drop-shadow(0px 15px 25px rgba(0,43,85,0.2));
          transform: scale(1.05);
        }

        @media (max-width: 992px) {
           .register-page-wrapper {
              background: #A8DADC;
              flex-direction: column;
              height: auto;
           }
           .card-register {
              margin-right: 0;
              margin-bottom: 50px;
              max-width: 100%;
              padding: 2rem;
              max-height: none;
           }
           .brand-container {
              padding-left: 0;
              margin-bottom: 40px;
              position: relative;
           }
           .brand-logo-img {
              max-width: 300px;
           }
        }
      `}</style>

      <div className="register-page-wrapper">
        <Container fluid>
          <Row className="justify-content-center align-items-center">
            
            {/* COLUNA ESQUERDA - FORMULÁRIO */}
            <Col md={10} lg={5} xl={5} className="d-flex justify-content-center justify-content-lg-end">
              <div className="card-register">
                <h3 className="register-title">Criar Conta</h3>

                <Form onSubmit={handleSubmit}>
                  
                  {/* --- SELETOR MODERNO (Fonte Corrigida) --- */}
                  <div className="user-type-selector">
                    <div 
                      className={`type-option ${formData.tipo_usuario === 'CLIENTE' ? 'active' : ''}`}
                      onClick={() => handleTypeChange('CLIENTE')}
                    >
                      <FaUser size={14} /> SOU CLIENTE
                    </div>
                    <div 
                      className={`type-option ${formData.tipo_usuario === 'ADMIN' ? 'active' : ''}`}
                      onClick={() => handleTypeChange('ADMIN')}
                    >
                      <FaStore size={14} /> SOU EMPREENDEDOR
                    </div>
                  </div>
                  {/* ------------------------------------------- */}

                  {/* NOME COMPLETO */}
                  <div className="mb-1">
                    <label className="custom-label">
                       NOME COMPLETO
                    </label>
                    <InputGroup className="custom-input-group">
                      <InputGroup.Text className="bg-transparent border-0 ps-0 pe-2">
                         <FaIdCard color="#002B55" size={16} />
                      </InputGroup.Text>
                      <Form.Control 
                        type="text" 
                        name="nome_completo"
                        placeholder="Ex: Ana Souza" 
                        className="custom-input"
                        value={formData.nome_completo}
                        onChange={handleChange}
                        required
                      />
                    </InputGroup>
                  </div>

                  {/* USUÁRIO */}
                  <div className="mb-1">
                    <label className="custom-label">
                       USUÁRIO (LOGIN)
                    </label>
                    <InputGroup className="custom-input-group">
                      <InputGroup.Text className="bg-transparent border-0 ps-0 pe-2">
                         <FaUser color="#002B55" size={16} />
                      </InputGroup.Text>
                      <Form.Control 
                        type="text" 
                        name="username"
                        placeholder="Nome de usuário" 
                        className="custom-input"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                    </InputGroup>
                  </div>

                  {/* EMAIL */}
                  <div className="mb-1">
                    <label className="custom-label">
                       E-MAIL
                    </label>
                    <InputGroup className="custom-input-group">
                       <InputGroup.Text className="bg-transparent border-0 ps-0 pe-2">
                         <FaEnvelope color="#002B55" size={16} />
                      </InputGroup.Text>
                      <Form.Control 
                        type="email" 
                        name="email"
                        placeholder="nome@email.com" 
                        className="custom-input"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </InputGroup>
                  </div>

                  {/* TELEFONE */}
                  <div className="mb-1">
                    <label className="custom-label">
                       TELEFONE
                    </label>
                    <InputGroup className="custom-input-group">
                      <InputGroup.Text className="bg-transparent border-0 ps-0 pe-2">
                         <FaPhone color="#002B55" size={16} />
                      </InputGroup.Text>
                      <Form.Control 
                        type="text" 
                        name="telefone"
                        placeholder="(xx) 9xxxx-xxxx" 
                        className="custom-input"
                        value={formData.telefone}
                        onChange={handleChange}
                      />
                    </InputGroup>
                  </div>

                  {/* SENHA */}
                  <div className="mb-1">
                    <label className="custom-label">
                       SENHA
                    </label>
                    <InputGroup className="custom-input-group">
                      <InputGroup.Text className="bg-transparent border-0 ps-0 pe-2">
                         <FaKey color="#002B55" size={16} />
                      </InputGroup.Text>
                      <Form.Control 
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Sua senha secreta" 
                        className="custom-input"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <InputGroup.Text 
                        className="bg-transparent border-0 pe-0 password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash size={18}/> : <FaEye size={18}/>}
                      </InputGroup.Text>
                    </InputGroup>
                  </div>

                  {/* CONFIRMAR SENHA */}
                  <div className="mb-4">
                    <label className="custom-label">
                       CONFIRMAR SENHA
                    </label>
                    <InputGroup className="custom-input-group">
                      <InputGroup.Text className="bg-transparent border-0 ps-0 pe-2">
                         <FaKey color="#002B55" size={16} />
                      </InputGroup.Text>
                      <Form.Control 
                        type={showConfirmPassword ? "text" : "password"}
                        name="password_confirm"
                        placeholder="Repita a senha" 
                        className="custom-input"
                        value={formData.password_confirm}
                        onChange={handleChange}
                        required
                      />
                      <InputGroup.Text 
                        className="bg-transparent border-0 pe-0 password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FaEyeSlash size={18}/> : <FaEye size={18}/>}
                      </InputGroup.Text>
                    </InputGroup>
                  </div>

                  {/* BOTÃO CADASTRAR */}
                  <Button type="submit" className="btn-register">
                    CADASTRAR
                  </Button>

                  {/* Divisor Visual */}
                  <div className="d-flex align-items-center my-3">
                    <hr className="flex-grow-1 border-secondary opacity-25" />
                    <span className="mx-3 fw-bold small text-muted" style={{fontFamily: 'Libre Baskerville'}}>ou</span>
                    <hr className="flex-grow-1 border-secondary opacity-25" />
                  </div>

                  {/* BOTÃO VOLTAR (Fonte Corrigida) */}
                  <Button className="btn-back-login" onClick={() => navigate('/')}>
                    <IoMdArrowBack className="me-2" size={18} />
                    VOLTAR PARA O LOGIN
                  </Button>

                </Form>
              </div>
            </Col>

            {/* COLUNA DIREITA - LOGO */}
            <Col md={10} lg={6} xl={6}>
              <div className="brand-container">
                <img src={logoOficial} alt="Logo Confia+" className="brand-logo-img" />
              </div>
            </Col>

          </Row>
        </Container>

        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
          <Toast onClose={() => setShowToast(false)} show={showToast} delay={5000} autohide bg="danger" title="Erro no Cadastro">
            <Toast.Header>
              <strong className="me-auto text-danger">⚠️ Erro no Cadastro</strong>
            </Toast.Header>
            <Toast.Body className="text-white">
              {errorMsg}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </div>
    </>
  );
}

export default Register;