import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (formData.password !== formData.password_confirm) {
            setError('As senhas não correspondem.');
            return;
        }

        try {
            await register(formData);
            navigate('/login'); // Redireciona para o login após sucesso

        } catch (validationErrors) {

            const firstErrorKey = Object.keys(validationErrors)[0];
            
            let errorMessage = 'Falha no cadastro. Tente novamente.';

            if (firstErrorKey) {

                errorMessage = validationErrors[firstErrorKey][0];
            }

            setError(errorMessage); 
        }
    };

    return (
        <div>
            <h2>Cadastro</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="username" placeholder="Usuário" onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                <input type="text" name="first_name" placeholder="Nome" onChange={handleChange} required />
                <input type="text" name="last_name" placeholder="Sobrenome" onChange={handleChange} required />
                <input type="password" name="password" placeholder="Senha (mín. 8 caracteres)" onChange={handleChange} required />
                <input type="password" name="password_confirm" placeholder="Confirme a Senha" onChange={handleChange} required />
                
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <button type="submit">Cadastrar</button>
            </form>
        </div>
    );
}

export default Register;