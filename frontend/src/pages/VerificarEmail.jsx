import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api'; // Ajuste o caminho da sua configuração do axios

const VerificarEmail = () => {
    const [codigo, setCodigo] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();

    // Puxa o e-mail que foi passado pela tela anterior
    const email = location.state?.email;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        if (!email) {
            setErro('E-mail não identificado. Por favor, volte para a tela de login.');
            return;
        }

        if (codigo.length !== 6) {
            setErro('O código deve ter exatamente 6 dígitos.');
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
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
            <h2>Verifique seu E-mail</h2>
            <p>Enviamos um código de 6 dígitos para o e-mail:<br/><strong>{email}</strong></p>
            
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="Digite o código de 6 dígitos" 
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    maxLength="6"
                    style={{ padding: '10px', fontSize: '18px', letterSpacing: '2px', textAlign: 'center', width: '100%', marginBottom: '15px' }}
                />
                
                {erro && <p style={{ color: 'red' }}>{erro}</p>}
                {sucesso && <p style={{ color: 'green' }}>{sucesso}</p>}

                <button type="submit" style={{ padding: '10px 20px', width: '100%', cursor: 'pointer' }}>
                    Confirmar Código
                </button>
            </form>
            
            <button 
                onClick={() => navigate('/login')} 
                style={{ marginTop: '20px', background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
            >
                Voltar para o Login
            </button>
        </div>
    );
};

export default VerificarEmail;