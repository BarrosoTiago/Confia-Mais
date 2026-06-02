import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, Spinner } from 'react-bootstrap';
import { FaKey, FaArrowLeft, FaEnvelopeOpenText } from 'react-icons/fa';
import logotipoSystem from "../assets/logotipo1.svg"; 
import api from '../services/api'; 

const VerificarEmail = () => {
    const [codigo, setCodigo] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    // Puxa o e-mail que foi passado pela tela anterior
    const email = location.state?.email;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');
        setLoading(true);

        if (!email) {
            setErro('E-mail não identificado. Por favor, volte para a tela de login.');
            setLoading(false);
            return;
        }

        if (codigo.length !== 6) {
            setErro('O código deve ter exatamente 6 dígitos.');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/verificar-email/', {
                email: email,
                codigo: codigo
            });

            setSucesso(response.data.mensagem);
            
            // Aguarda 2 segundos para o usuário ler a mensagem e manda pro Login
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            setErro(error.response?.data?.erro || 'Erro ao verificar o código. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verification-wrapper">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

                :root {
                    --col-navy: #002B55;
                    --col-neon: #FFFFFF;
                    --col-blue-mid: #2A6F97;
                    --bg-input: #F8FAFC;
                    --text-main: #334155;
                    --text-muted: #94A3B8;
                }

                body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; background: var(--col-navy); }

                .verification-wrapper { 
                    display: flex; justify-content: center; align-items: center; 
                    height: 100vh; width: 100vw; position: relative; overflow: hidden;
                    background-color: var(--col-navy);
                }

                /* Fundo animado característico do Confia+ */
                .tech-grid {
                    position: absolute; width: 200%; height: 200%; top: -50%; left: -50%;
                    background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), 
                                      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    background-size: 60px 60px; transform: perspective(500px) rotateX(45deg); opacity: 0.8;
                    animation: gridMove 25s linear infinite; z-index: 1;
                }
                @keyframes gridMove {
                    0% { transform: perspective(500px) rotateX(45deg) translateY(0); }
                    100% { transform: perspective(500px) rotateX(45deg) translateY(60px); }
                }

                .verification-card {
                    width: 100%; max-width: 480px; background: white; padding: 50px 40px; 
                    border-radius: 24px; border: 2px solid var(--col-neon);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    position: relative; z-index: 10;
                    animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    text-align: center;
                }
                @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

                .header-logo-small { height: 60px; width: auto; margin-bottom: 20px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.1)); }
                
                .form-title { font-family: 'Libre Baskerville', serif; font-size: 2rem; color: var(--col-navy); font-weight: 700; margin-bottom: 10px; line-height: 1.2; }
                .form-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 30px; }
                .email-highlight { color: var(--col-blue-mid); font-weight: 700; background: #F0F9FF; padding: 5px 10px; border-radius: 6px; display: inline-block; margin-top: 5px;}

                .modern-input-group { position: relative; margin-bottom: 25px; }
                .input-wrapper { position: relative; }
                
                .code-input { 
                    width: 100%; padding: 18px 20px 18px 50px; background: var(--bg-input); 
                    border: 2px solid #E2E8F0; border-radius: 12px; font-size: 1.5rem; 
                    letter-spacing: 8px; font-weight: 700; color: var(--col-navy); 
                    text-align: center; transition: all 0.3s ease; 
                }
                .code-input:focus { background: white; border-color: var(--col-blue-mid); outline: none; box-shadow: 0 0 0 4px rgba(42, 111, 151, 0.1); }
                .code-input::placeholder { font-size: 1rem; letter-spacing: normal; font-weight: 400; color: #CBD5E1; }
                
                .input-icon-left { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.3rem; transition: 0.2s; }
                .code-input:focus + .input-icon-left { color: var(--col-blue-mid); }

                .btn-primary-solid { 
                    width: 100%; padding: 16px; border-radius: 12px; border: none; 
                    background: var(--col-navy); color: white; font-weight: 700; 
                    font-size: 1rem; letter-spacing: 1px; transition: all 0.3s ease; 
                    box-shadow: 0 10px 20px rgba(0, 43, 85, 0.2); display: flex; 
                    align-items: center; justify-content: center; gap: 10px; 
                }
                .btn-primary-solid:hover { background: var(--col-blue-mid); transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0, 43, 85, 0.3); }
                .btn-primary-solid:disabled { background: #CBD5E1; transform: none; box-shadow: none; cursor: not-allowed; }

                .btn-back { 
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    margin-top: 25px; color: var(--text-muted); font-size: 0.9rem; 
                    font-weight: 600; cursor: pointer; border: none; background: transparent; width: 100%; transition: 0.3s;
                }
                .btn-back:hover { color: var(--col-blue-mid); }
                
                .icon-large { font-size: 3rem; color: var(--col-blue-mid); margin-bottom: 15px; }

                @media (max-width: 600px) {
                    .verification-card { padding: 40px 20px; border-radius: 0; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; border: none;}
                    .tech-grid { display: none; }
                }
            `}</style>

            <div className="tech-grid"></div>

            <div className="verification-card">
                <img src={logotipoSystem} alt="Logo Confia+" className="header-logo-small" />
                
                <h2 className="form-title">Autenticação</h2>
                <p className="form-subtitle">
                    Por segurança, enviamos um código de 6 dígitos para:<br/>
                    <span className="email-highlight">
                        <FaEnvelopeOpenText style={{marginRight: '8px', verticalAlign: 'text-bottom'}}/> 
                        {email || "E-mail não encontrado"}
                    </span>
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="modern-input-group">
                        <div className="input-wrapper">
                            <input 
                                type="text" 
                                className="code-input" 
                                placeholder="000000" 
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} // Garante que só aceite números
                                maxLength="6"
                                required
                            />
                            <FaKey className="input-icon-left" />
                        </div>
                    </div>
                    
                    {erro && <Alert variant="danger" className="border-0 shadow-sm mb-4 text-center" style={{borderRadius:'10px'}}>{erro}</Alert>}
                    {sucesso && <Alert variant="success" className="border-0 shadow-sm mb-4 text-center" style={{borderRadius:'10px'}}>{sucesso}</Alert>}

                    <button type="submit" className="btn-primary-solid" disabled={loading || !email}>
                        {loading ? <Spinner animation="border" size="sm" /> : "VALIDAR ACESSO"}
                    </button>
                </form>
                
                <button onClick={() => navigate('/login')} className="btn-back">
                    <FaArrowLeft /> Voltar para o Login
                </button>
            </div>
        </div>
    );
};

export default VerificarEmail;