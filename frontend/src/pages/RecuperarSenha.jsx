import { useState } from 'react';
import { Form, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api'; 
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { 
    FaArrowLeft, FaEnvelope, FaLock, FaKey, 
    FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash 
} from 'react-icons/fa';

export default function RecuperarSenha() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = Email, 2 = Token + Senha
    
    // Inputs
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Feedback
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Passo 1: Enviar email
    async function handleRequestToken(e) {
        e.preventDefault();
        setError(''); setMsg(''); setLoading(true);
        
        try {
            // ATUALIZADO PARA A NOVA ROTA DO DJANGO
            await api.post('/recuperar-senha/solicitar/', { email });               setStep(2);
            setMsg('E-mail enviado! Verifique sua caixa de entrada.');
        } catch (err) {
            setError('E-mail não encontrado ou erro no sistema.');
        } finally {
            setLoading(false);
        }
    }

    // Passo 2: Confirmar Token e Senha
    async function handleConfirmReset(e) {
        e.preventDefault();
        setError(''); setMsg('');

        // Validação local de senha
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 8) {
            setError('A senha deve ter no mínimo 8 caracteres.');
            return;
        }

        setLoading(true);

        try {
            // ATUALIZADO PARA A NOVA ROTA E OS NOVOS NOMES DOS CAMPOS
            await api.post('/recuperar-senha/redefinir/', {
                email: email,
                codigo: token,
                nova_senha: password
            });
            alert("Senha alterada com sucesso! Você será redirecionado para o login.");
            navigate('/login');
        } catch (err) {
            // Se o Django devolver uma mensagem de erro específica, nós mostramos
            if (err.response && err.response.data && err.response.data.erro) {
                setError(err.response.data.erro);
            } else {
                setError('Código inválido, expirado ou erro no servidor.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <AnimatedBackground />
            
            <div className="recover-wrapper">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

                    .recover-wrapper { 
                        min-height: 100vh; display: flex; align-items: center; justify-content: center;
                        padding: 20px; font-family: 'Inter', sans-serif;
                    }

                    .glass-card {
                        background: white; border-radius: 20px; padding: 40px; 
                        box-shadow: 0 10px 40px rgba(0,43,85,0.1); 
                        border: 1px solid rgba(255,255,255,0.5); 
                        width: 100%; max-width: 450px;
                    }

                    .page-header { text-align: center; margin-bottom: 30px; }
                    .header-icon { 
                        width: 70px; height: 70px; background: #E3F2FD; color: #002B55; 
                        border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                        font-size: 1.8rem; margin: 0 auto 15px auto;
                    }
                    .page-title { font-family: 'Libre Baskerville', serif; font-weight: 700; color: #002B55; margin-bottom: 5px; }
                    .page-subtitle { color: #666; font-size: 0.9rem; }

                    .custom-input { 
                        border: 2px solid #F1F3F5; background: #F8F9FA; 
                        padding: 12px 12px 12px 40px; border-radius: 10px; width: 100%; font-size: 0.95rem; 
                        transition: 0.2s;
                    }
                    .custom-input:focus { border-color: #002B55; background: white; outline: none; }
                    .form-label { font-size: 0.8rem; font-weight: 700; color: #002B55; text-transform: uppercase; margin-bottom: 8px; }

                    .btn-action-blue {
                        background: #002B55; color: white; border: none; padding: 12px; border-radius: 30px;
                        font-size: 1rem; font-weight: 700; box-shadow: 0 8px 20px rgba(0,43,85,0.2); 
                        transition: 0.2s; width: 100%; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 10px;
                    }
                    .btn-action-blue:hover { transform: translateY(-2px); background: #003366; }
                    .btn-action-blue:disabled { background: #ccc; cursor: not-allowed; transform: none; }

                    .btn-eye {
                        position: absolute; right: 15px; background: none; border: none; color: #999; cursor: pointer;
                    }
                    .btn-eye:hover { color: #002B55; }

                    .btn-back-text {
                        background: transparent; border: none; color: #666; font-weight: 600; font-size: 0.9rem;
                        display: flex; align-items: center; justify-content: center; gap: 8px;
                        margin-top: 20px; transition: 0.2s; width: 100%;
                    }
                    .btn-back-text:hover { color: #002B55; }
                `}</style>

                <div className="glass-card">
                    
                    <div className="page-header">
                        <div className="header-icon">
                            {step === 1 ? <FaLock /> : <FaKey />}
                        </div>
                        <h2 className="page-title">Recuperar Senha</h2>
                        <p className="page-subtitle">
                            {step === 1 
                                ? "Informe seu e-mail para receber o código." 
                                : "Crie uma nova senha segura."}
                        </p>
                    </div>

                    {msg && <Alert variant="success" className="d-flex align-items-center gap-2 small"><FaCheckCircle/> {msg}</Alert>}
                    {error && <Alert variant="danger" className="d-flex align-items-center gap-2 small"><FaExclamationCircle/> {error}</Alert>}

                    {step === 1 ? (
                        <Form onSubmit={handleRequestToken}>
                            <Form.Group className="mb-4">
                                <Form.Label className="form-label">Seu E-mail</Form.Label>
                                <div className="d-flex align-items-center position-relative">
                                    <Form.Control 
                                        className="custom-input" type="email" placeholder="exemplo@email.com"
                                        value={email} onChange={e => setEmail(e.target.value)} required 
                                    />
                                    <FaEnvelope className="position-absolute text-muted" style={{left: '12px'}} />
                                </div>
                            </Form.Group>

                            <button type="submit" className="btn-action-blue" disabled={loading}>
                                {loading ? <Spinner animation="border" size="sm"/> : "Enviar Código"}
                            </button>
                        </Form>
                    ) : (
                        <Form onSubmit={handleConfirmReset}>
                            <Form.Group className="mb-3">
                                <Form.Label className="form-label">Código (Token)</Form.Label>
                                <div className="d-flex align-items-center position-relative">
                                    <Form.Control 
                                        className="custom-input" type="text" placeholder="Cole o código aqui"
                                        value={token} onChange={e => setToken(e.target.value)} required 
                                        maxLength="6"
                                        style={{letterSpacing: '3px', fontWeight: 'bold'}}
                                    />
                                    <FaKey className="position-absolute text-muted" style={{left: '12px'}} />
                                </div>
                            </Form.Group>

                            {/* NOVA SENHA COM OLHINHO */}
                            <Form.Group className="mb-3">
                                <Form.Label className="form-label">Nova Senha</Form.Label>
                                <div className="d-flex align-items-center position-relative">
                                    <Form.Control 
                                        className="custom-input"
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Mínimo 8 caracteres"
                                        value={password} onChange={e => setPassword(e.target.value)} required 
                                    />
                                    <FaLock className="position-absolute text-muted" style={{left: '12px'}} />
                                    <button type="button" className="btn-eye" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <FaEyeSlash/> : <FaEye/>}
                                    </button>
                                </div>
                            </Form.Group>

                            {/* CONFIRMAR SENHA */}
                            <Form.Group className="mb-4">
                                <Form.Label className="form-label">Confirmar Senha</Form.Label>
                                <div className="d-flex align-items-center position-relative">
                                    <Form.Control 
                                        className="custom-input"
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Repita a senha"
                                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required 
                                    />
                                    <FaLock className="position-absolute text-muted" style={{left: '12px'}} />
                                </div>
                            </Form.Group>

                            <button type="submit" className="btn-action-blue" disabled={loading}>
                                {loading ? <Spinner animation="border" size="sm"/> : "Salvar Nova Senha"}
                            </button>
                            
                            <button type="button" className="btn-back-text mt-3" onClick={() => setStep(1)}>
                                Voltar e corrigir e-mail
                            </button>
                        </Form>
                    )}

                    <div className="text-center">
                        <button className="btn-back-text" onClick={() => navigate('/login')}>
                            <FaArrowLeft /> Voltar para o Login
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}