import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../styles/AuthForms.css";

import logotipo from "../assets/logotipo.svg";
import switchIcon from "../assets/switch.svg";
import emailIcon from "../assets/email.svg";
import passwordIcon from "../assets/password.svg";
import passConfirmIcon from "../assets/passConfirm.svg";
import dropdownIcon from "../assets/dropdown-otimized.svg";

// Nota: Se tiver ícones específicos para User e Phone, importe-os. 
// Vou reusar o emailIcon temporariamente para não quebrar seu código.

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    // NOVOS CAMPOS ---
    nome_completo: "",
    telefone: "",
    tipo_usuario: "CLIENTE", // Valor padrão
  });

  const { register, setNotification } = useAuth();
  const navigate = useNavigate();

  const [isLogoVisible, setIsLogoVisible] = useState(true);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (formData.password !== formData.password_confirm) {
      setNotification("As senhas não correspondem.");
      return;
    }

    try {
      // O formData agora contém username, email, pass, nome, telefone e tipo
      await register(formData); 
      alert("Cadastro realizado com sucesso!");
      navigate("/"); // Volta para o Login (rota raiz)
    
    } catch (validationErrors) {
      console.error(validationErrors);
      // Se validationErrors for um objeto, tratamos. Se for string, exibe direto.
      if (typeof validationErrors === 'object' && validationErrors !== null) {
          const allMessages = Object.values(validationErrors).flat();
          setNotification(allMessages.join(' '));
      } else {
          setNotification("Erro ao realizar cadastro.");
      }
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center">
      <div className="col-md-6 d-flex justify-content-center">
        <form
          onSubmit={handleSubmit}
          className="form-box d-flex justify-content-center flex-column p-5 rounded bg-light shadow-sm text-center"
          style={{maxHeight: '90vh', overflowY: 'auto'}} // Scroll se a tela for pequena
        >
          <h1 className="mb-3">Cadastro</h1>

          {/* --- SELEÇÃO DO TIPO DE USUÁRIO (IMPORTANTE) --- */}
          <div className="mb-3 d-flex justify-content-center gap-3">
            <div className="form-check">
              <input 
                className="form-check-input" type="radio" name="tipo_usuario" 
                id="radioCliente" value="CLIENTE"
                checked={formData.tipo_usuario === 'CLIENTE'} onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="radioCliente">Sou Cliente</label>
            </div>
            <div className="form-check">
              <input 
                className="form-check-input" type="radio" name="tipo_usuario" 
                id="radioAdmin" value="ADMIN"
                checked={formData.tipo_usuario === 'ADMIN'} onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="radioAdmin">Sou Empreendedor</label>
            </div>
          </div>

          <div id="formAccordionRegister">
            
            {/* --- CAMPO NOME COMPLETO (NOVO) --- */}
            <div className="mb-3">
              <div
                id="nome-label"
                className="d-flex align-items-center justify-content-between gap-2 p-3 bg-light border rounded text-center shadow-sm"
                data-bs-toggle="collapse" data-bs-target="#inputNome"
                style={{ cursor: "pointer", width: "250px", margin: "0 auto" }}
                role="button"
              >
                <img src={emailIcon} alt="" className="me-2" style={{ width: "20px" }} /> {/* Troque o icone se quiser */}
                Nome Completo
                <img src={dropdownIcon} alt="" style={{ width: "15px" }} />
              </div>
              <div id="inputNome" className="collapse mt-2" data-bs-parent="#formAccordionRegister">
                <input
                  type="text" name="nome_completo" className="form-control"
                  placeholder="Seu nome completo..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={handleChange} required
                />
              </div>
            </div>

            {/* Campo Usuário */}
            <div className="mb-3">
              <div
                id="username-label"
                className="d-flex align-items-center justify-content-between gap-2 p-3 bg-light border rounded text-center shadow-sm"
                data-bs-toggle="collapse" data-bs-target="#inputUsername"
                style={{ cursor: "pointer", width: "250px", margin: "0 auto" }}
                role="button"
              >
                <img src={emailIcon} alt="" className="me-2" style={{ width: "20px" }} />
                Usuário (Login)
                <img src={dropdownIcon} alt="" style={{ width: "15px" }} />
              </div>
              <div id="inputUsername" className="collapse mt-2" data-bs-parent="#formAccordionRegister">
                <input
                  type="text" name="username" className="form-control"
                  placeholder="Crie seu login..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={handleChange} required
                />
              </div>
            </div>

            {/* Campo Email */}
            <div className="mb-3">
              <div
                id="email-label"
                className="d-flex align-items-center justify-content-between gap-2 p-3 bg-light border rounded text-center shadow-sm"
                data-bs-toggle="collapse" data-bs-target="#inputEmail"
                style={{ cursor: "pointer", width: "250px", margin: "0 auto" }}
                role="button"
              >
                <img src={emailIcon} alt="" className="me-2" style={{ width: "20px" }} />
                Email
                <img src={dropdownIcon} alt="" style={{ width: "15px" }} />
              </div>
              <div id="inputEmail" className="collapse mt-2" data-bs-parent="#formAccordionRegister">
                <input
                  type="email" name="email" className="form-control"
                  placeholder="Digite seu email..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={handleChange} required
                />
              </div>
            </div>

            {/* --- CAMPO TELEFONE (NOVO) --- */}
            <div className="mb-3">
              <div
                id="tel-label"
                className="d-flex align-items-center justify-content-between gap-2 p-3 bg-light border rounded text-center shadow-sm"
                data-bs-toggle="collapse" data-bs-target="#inputTel"
                style={{ cursor: "pointer", width: "250px", margin: "0 auto" }}
                role="button"
              >
                <img src={emailIcon} alt="" className="me-2" style={{ width: "20px" }} /> {/* Troque o icone */}
                Telefone
                <img src={dropdownIcon} alt="" style={{ width: "15px" }} />
              </div>
              <div id="inputTel" className="collapse mt-2" data-bs-parent="#formAccordionRegister">
                <input
                  type="text" name="telefone" className="form-control"
                  placeholder="(XX) 99999-9999"
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="mb-3">
              <div
                id="password-label"
                className="d-flex align-items-center justify-content-between gap-2 p-3 bg-light border rounded text-center shadow-sm"
                data-bs-toggle="collapse" data-bs-target="#inputSenha"
                style={{ cursor: "pointer", width: "250px", margin: "0 auto" }}
                role="button"
              >
                <img src={passwordIcon} alt="" className="me-2" style={{ width: "20px" }} />
                Senha
                <img src={dropdownIcon} alt="" style={{ width: "15px" }} />
              </div>
              <div id="inputSenha" className="collapse mt-2" data-bs-parent="#formAccordionRegister">
                <input
                  type="password" name="password" className="form-control"
                  placeholder="Crie sua senha..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={handleChange} required
                />
              </div>
            </div>

            {/* Campo Confirmar */}
            <div className="mb-3">
              <div
                id="confirm-label"
                className="d-flex align-items-center justify-content-between gap-2 p-3 bg-light border rounded text-center shadow-sm"
                data-bs-toggle="collapse" data-bs-target="#inputConfirmar"
                style={{ cursor: "pointer", width: "250px", margin: "0 auto" }}
                role="button"
              >
                <img src={passConfirmIcon} alt="" className="me-2" style={{ width: "20px" }} />
                Confirme sua senha
                <img src={dropdownIcon} alt="" className="ms-3" style={{ width: "15px" }} />
              </div>
              <div id="inputConfirmar" className="collapse mt-2" data-bs-parent="#formAccordionRegister">
                <input
                  type="password" name="password_confirm" className="form-control"
                  placeholder="Confirme sua senha..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={handleChange} required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary d-block w-75 mt-3 mx-auto ">Confirmar</button>
          
          <br />
          <p className="my-2 text-muted">—————————— ou ———————————</p>
          <br />

          <Link to="/" className="text-decoration-none d-block mx-auto ms-50">
            <button type="button" className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 ms-50 px-4 py-2">
              <img src={switchIcon} alt="" className="me-2" style={{ width: "20px" }} />
              <span>JÁ TENHO CONTA</span>
            </button>
          </Link>
        </form>
      </div>

      {/* Coluna da imagem */}
      <div className="col-md-6 d-flex justify-content-center align-items-center">
        {isLogoVisible ? (
          <img
            src={logotipo}
            alt="Logotipo"
            className="img-fluid w-50"
            style={{ maxWidth: "400px", cursor: "pointer" }}
            onClick={() => setIsLogoVisible(false)}
          />
        ) : (
          <video src="" className="img-fluid w-100" style={{ maxWidth: "400px" }} autoPlay controls>
            Seu navegador não suporta o elemento de vídeo.
          </video>
        )}
      </div>
    </div>
  );
}

export default Register;