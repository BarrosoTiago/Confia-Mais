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

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const { register, setNotification } = useAuth();
  const navigate = useNavigate();

  const [isLogoVisible, setIsLogoVisible] = useState(true); // Estado para controlar a visibilidade do logotipo

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null); // Limpa notificações antigas

    if (formData.password !== formData.password_confirm) {
      setNotification("As senhas não correspondem.");
      return;
    }

    try {
      await register(formData); 
      navigate("/login"); 
    
    } catch (validationErrors) {
      // Dispara o Toast com erros do backend ---
      const allMessages = Object.values(validationErrors).flat();
      // Junta todos os erros em uma única string, separados por um espaço
      setNotification(allMessages.join(' ')); 
    }
  };


  return (
    <div className="container-fluid vh-100 d-flex align-items-center">
      {/* Coluna do formulário */}
      <div className="col-md-6 d-flex justify-content-center">
        <form
          onSubmit={handleSubmit}
          className="form-box d-flex justify-content-center flex-column p-5 rounded bg-light shadow-sm text-center"
        >
          <h1 className="mb-4">Cadastro</h1>

          <div id="formAccordionRegister">
            {/* Campo de Usuário (username) */}
            <div className="mb-3">
              <div
                id="username-label"
                className="d-flex align-items-center justify-content-between gap-2 p-3 bg-light border rounded text-center shadow-sm"
                data-bs-toggle="collapse"
                data-bs-target="#inputUsername"
                style={{ cursor: "pointer", width: "250px", margin: "0 auto" }}
                role="button"
                aria-expanded="false"
                aria-controls="inputUsername"
              >
                <img src={emailIcon} alt="" className="me-2" style={{ width: "20px", height: "20px" }} />
                Usuário
                <img src={dropdownIcon} alt="" style={{ width: "15px", height: "15px" }} />
              </div>
              <div id="inputUsername" className="collapse mt-3" data-bs-parent="#formAccordionRegister">
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  placeholder="Crie seu nome de usuário..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={handleChange}
                  aria-labelledby="username-label"
                  required
                />
              </div>
            </div>

            {/* Campo de Email */}
            <div className="mb-3">
              <div
                id="email-label"
                className="d-flex align-items-center justify-content-between gap-2 p-3 bg-light border rounded text-center shadow-sm"
                data-bs-toggle="collapse"
                data-bs-target="#inputEmail"
                style={{ cursor: "pointer", width: "250px", margin: "0 auto" }}
                role="button"
                aria-expanded="false"
                aria-controls="inputEmail"
              >
                <img src={emailIcon} alt="" className="me-2" style={{ width: "20px", height: "20px" }} />
                Email
                <img src={dropdownIcon} alt="" style={{ width: "15px", height: "15px" }} />
              </div>
              <div id="inputEmail" className="collapse mt-3" data-bs-parent="#formAccordionRegister">
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Digite seu email..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={handleChange}
                  aria-labelledby="email-label"
                  required
                />
              </div>
            </div>

            {/* Campo de Senha (password) */}
            <div className="mb-3">
              <div
                id="password-label"
                className="d-flex align-items-center justify-content-between gap-2 p-3 bg-light border rounded text-center shadow-sm"
                data-bs-toggle="collapse"
                data-bs-target="#inputSenha"
                style={{ cursor: "pointer", width: "250px", margin: "0 auto" }}
                role="button"
                aria-expanded="false"
                aria-controls="inputSenha"
              >
                <img src={passwordIcon} alt="" className="me-2" style={{ width: "20px", height: "20px" }} />
                Senha
                <img src={dropdownIcon} alt="" style={{ width: "15px", height: "15px" }} />
              </div>
              <div id="inputSenha" className="collapse mt-3" data-bs-parent="#formAccordionRegister">
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Crie sua senha..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={handleChange}
                  aria-labelledby="password-label"
                  required
                />
              </div>
            </div>

            {/* Campo de Confirmação (password_confirm) */}
            <div className="mb-3">
              <div
                id="confirm-label"
                className="d-flex align-items-center justify-content-between gap-2 p-3 bg-light border rounded text-center shadow-sm"
                data-bs-toggle="collapse"
                data-bs-target="#inputConfirmar"
                style={{ cursor: "pointer", width: "250px", margin: "0 auto" }}
                role="button"
                aria-expanded="false"
                aria-controls="inputConfirmar"
              >
                <img src={passConfirmIcon} alt="" className="me-2" style={{ width: "20px", height: "20px" }} />
                Confirme sua senha
                <img src={dropdownIcon} alt="" className="ms-3" style={{ width: "15px", height: "15px" }} />
              </div>
              <div id="inputConfirmar" className="collapse mt-3" data-bs-parent="#formAccordionRegister">
                <input
                  type="password"
                  name="password_confirm"
                  className="form-control"
                  placeholder="Confirme sua senha..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={handleChange}
                  aria-labelledby="confirm-label"
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary d-block w-75 mt-3 mx-auto ">Confirmar</button>
          
          <br />
          <p className="my-4 text-muted">—————————— ou ———————————</p>
          <br />

          <Link to="/login" className="text-decoration-none d-block mx-auto ms-50">
            <button type="button" className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 ms-50 px-4 py-2">
              <img src={switchIcon} alt="" className="me-2" style={{ width: "20px", height: "20px" }} />
              <span>JÁ TENHO CONTA</span>
            </button>
          </Link>
        </form>
      </div>

      {/* Coluna da imagem */}
    <div className="col-md-6 d-flex justify-content-center align-items-center">
        {isLogoVisible ? (
          // SE isLogoVisible FOR TRUE, MOSTRA A IMAGEM
          <img
            src={logotipo}
            alt="Logotipo da ConfiaMais, clique para ver o vídeo" 
            className="img-fluid w-50"
            style={{ maxWidth: "400px", cursor: "pointer" }}
            onClick={() => setIsLogoVisible(false)} 
          />
        ) : (
          // SE isLogoVisible FOR FALSE, MOSTRA O VÍDEO
          <video
            src="" 
            className="img-fluid w-100" 
            style={{ maxWidth: "400px" }} 
            autoPlay 
            controls 
          >
            Seu navegador não suporta o elemento de vídeo.
          </video>
        )}
      </div>
    </div>
  );
}

export default Register;