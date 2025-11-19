import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../styles/AuthForms.css";

import logotipo from "../assets/logotipo.svg";
import switchIcon from "../assets/switch.svg";
import emailIcon from "../assets/email.svg";
import passwordIcon from "../assets/password.svg";
import dropdownIcon from "../assets/dropdown-otimized.svg";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Importamos o login e o setNotification do nosso Contexto
  const { login, setNotification } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null); // Limpa notificações antigas

    try {
      // 1. Faz o login e RECEBE os dados do usuário de volta (graças ao nosso AuthContext atualizado)
      const userData = await login(username, password);
      
      console.log("Login realizado com sucesso:", userData); // Debug para você ver no F12

      // 2. VERIFICAÇÃO INTELIGENTE DE ROTA
      // Se o tipo for CLIENTE, vai para o painel de agendamentos
      if (userData.tipo_usuario === 'CLIENTE') {
        navigate("/cliente-dashboard");
      } 
      // Se for ADMIN (Empreendedor), vai para o painel de gestão
      else {
        navigate("/admin-dashboard");
      }

    } catch (err) {
      console.error(err);
      setNotification("Usuário ou senha inválidos.");
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
          <h1 className="mb-4">Login</h1>

          <div id="formAccordionLogin">
            {/* Campo de Usuário (Username) */}
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
              <div id="inputUsername" className="collapse mt-3" data-bs-parent="#formAccordionLogin">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Digite seu usuário..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-labelledby="username-label"
                  required
                />
              </div>
            </div>

            {/* Campo de Senha */}
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
              <div id="inputSenha" className="collapse mt-3" data-bs-parent="#formAccordionLogin">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Digite sua senha..."
                  style={{ width: "250px", margin: "0 auto" }}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-labelledby="password-label"
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary d-block w-75 mt-3 mx-auto ">Confirmar</button>

          <br />
          <p className="my-4 text-muted">—————————— ou ———————————</p>
          <br />
          
          <Link to="/register" className="text-decoration-none d-block mx-auto ms-50">
            <button type="button" className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 ms-50 px-4 py-2">
              <img src={switchIcon} alt="" className="me-2" style={{ width: "20px", height: "20px" }} />
              <span>PRIMEIRO ACESSO</span>
            </button>
          </Link>

        </form>
      </div>

      {/* Coluna da imagem */}
      <div className="col-md-6 d-flex justify-content-center align-items-center">
        <img
          src={logotipo}
          alt="Logotipo da ConfiaMais"
          className="img-fluid w-50"
          style={{ maxWidth: "400px" }}
        />
      </div>
    </div>
  );
}

export default Login;