import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import api from '../services/api'; // Verifique se o caminho do api está certo. Se der erro, tente '../../services/api'
import { useNavigate } from 'react-router-dom';

export default function RecuperarSenha() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = Pedir Email, 2 = Pedir Token
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    // Passo 1: Enviar email pedindo token
    async function handleRequestToken(e) {
        e.preventDefault();
        setError(''); setMsg('');
        
        try {
            await api.post('/auth/password_reset/', { email });
            setStep(2);
            setMsg('E-mail enviado! Verifique sua caixa de entrada e digite o código abaixo.');
        } catch (err) {
            setError('E-mail não encontrado ou erro no sistema.');
        }
    }

    // Passo 2: Enviar token + nova senha
    async function handleConfirmReset(e) {
        e.preventDefault();
        setError(''); setMsg('');

        try {
            await api.post('/auth/password_reset/confirm/', {
                token: token,
                password: password
            });
            alert("Senha alterada com sucesso! Faça login.");
            navigate('/login');
        } catch (err) {
            setError('Token inválido ou senha muito fraca.');
        }
    }

    return (
        <Container className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <Card className="p-4 shadow" style={{ width: '400px' }}>
                <h3 className="text-center mb-4 text-primary">🔐 Recuperar Senha</h3>
                
                {msg && <Alert variant="success" className="small">{msg}</Alert>}
                {error && <Alert variant="danger" className="small">{error}</Alert>}

                {step === 1 ? (
                    <Form onSubmit={handleRequestToken}>
                        <Form.Group className="mb-3">
                            <Form.Label>Digite seu E-mail</Form.Label>
                            <Form.Control 
                                type="email" 
                                placeholder="exemplo@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required 
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary" className="w-100">
                            Enviar Código
                        </Button>
                    </Form>
                ) : (
                    <Form onSubmit={handleConfirmReset}>
                        <Form.Group className="mb-3">
                            <Form.Label>Código Recebido (Token)</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="Ex: 123abc456"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                required 
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Nova Senha</Form.Label>
                            <Form.Control 
                                type="password" 
                                placeholder="Mínimo 8 caracteres"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required 
                            />
                        </Form.Group>
                        <Button type="submit" variant="success" className="w-100">
                            Alterar Senha
                        </Button>
                        <Button variant="link" className="w-100 mt-2 text-muted" onClick={() => setStep(1)}>
                            Voltar
                        </Button>
                    </Form>
                )}
                
                <div className="text-center mt-3">
                    <small onClick={() => navigate('/login')} style={{cursor:'pointer'}} className="text-primary">
                        Voltar para Login
                    </small>
                </div>
            </Card>
        </Container>
    );
}