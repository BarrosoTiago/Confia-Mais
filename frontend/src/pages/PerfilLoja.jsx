import { useState, useEffect } from 'react';
import { Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom'; 
import api from '../services/api';
import AnimatedBackground from '../components/AnimatedBackground';
import OnboardingHeader from '../components/OnboardingHeader';
import { FaStore, FaCamera, FaSave, FaArrowRight, FaArrowLeft, FaMapMarkerAlt, FaPhone, FaInfoCircle } from 'react-icons/fa';

export default function PerfilLoja() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Verifica se está no modo "Passo a Passo" (vindo do Login)
    const isOnboarding = searchParams.get('onboarding') === 'true';

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    // Estado do Formulário
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');

    // Imagens
    const [fotoPreview, setFotoPreview] = useState(null);
    const [fotoFile, setFotoFile] = useState(null);
    const [capaPreview, setCapaPreview] = useState(null);
    const [capaFile, setCapaFile] = useState(null);

    // 1. Carregar dados atuais
    useEffect(() => {
        async function loadData() {
            try {
                const response = await api.get('/auth/users/me/');
                const u = response.data;
                
                setNome(u.nome_completo || '');
                setDescricao(u.descricao || '');
                setTelefone(u.telefone || '');
                setEndereco(u.endereco || '');
                setBairro(u.bairro || '');
                setCidade(u.cidade || '');
                
                if(u.foto) setFotoPreview(u.foto);
                if(u.capa) setCapaPreview(u.capa);

            } catch (err) {
                console.error("Erro ao carregar perfil", err);
            }
        }
        loadData();
    }, []);

    // Função para preview de imagem
    const handleImageChange = (e, setFile, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // 2. Salvar
    async function handleSalvar(e) {
        e.preventDefault();
        setLoading(true);
        setMsg(''); setError('');

        try {
            const data = new FormData();
            data.append('nome_completo', nome);
            data.append('descricao', descricao);
            data.append('telefone', telefone);
            data.append('endereco', endereco);
            data.append('bairro', bairro);
            data.append('cidade', cidade);

            // Só anexa se trocou a imagem
            if (fotoFile) data.append('foto', fotoFile);
            if (capaFile) data.append('capa', capaFile);

            // SOLUÇÃO DAS IMAGENS: Deixamos o Axios gerenciar o Content-Type sozinho para não quebrar o FormData
            await api.patch('/auth/users/me/', data);

            if (isOnboarding) {
                // ROTEIRO: Passo 1 OK -> Vai para Passo 2 (Horários)
                navigate('/admin/config-horarios?onboarding=true');
            } else {
                setMsg('Perfil atualizado com sucesso!');
                window.scrollTo(0, 0);
            }

        } catch (err) {
            console.error(err);
            setError('Erro ao salvar. Verifique sua conexão.');
            window.scrollTo(0, 0);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <AnimatedBackground />
            
            <div className="perfil-wrapper">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

                    .perfil-wrapper { 
                        padding: 30px 20px; min-height: 100vh; font-family: 'Inter', sans-serif; 
                        display: flex; justify-content: center; align-items: flex-start;
                    }
                    .main-card { 
                        background: white; border-radius: 24px; width: 100%; max-width: 850px; 
                        box-shadow: 0 15px 50px rgba(0,43,85,0.1); overflow: hidden; position: relative;
                        border: 1px solid rgba(255,255,255,0.8);
                    }
                    
                    /* Área da Capa */
                    .cover-area { 
                        height: 220px; background: linear-gradient(135deg, #E3F2FD, #BBDEFB); 
                        position: relative; background-size: cover; background-position: center; 
                        transition: 0.3s;
                    }
                    .cover-upload-btn { 
                        position: absolute; bottom: 20px; right: 20px; 
                        background: rgba(0,0,0,0.5); backdrop-filter: blur(5px);
                        color: white; border: 1px solid rgba(255,255,255,0.3); 
                        padding: 8px 18px; border-radius: 30px; font-size: 0.85rem; font-weight: 600;
                        cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px;
                    }
                    .cover-upload-btn:hover { background: rgba(0,0,0,0.7); transform: translateY(-2px); }

                    /* Área da Foto (Avatar) */
                    .avatar-area { 
                        position: absolute; top: 150px; left: 50%; transform: translateX(-50%); 
                        width: 130px; height: 130px; z-index: 10;
                    }
                    .avatar-img { 
                        width: 100%; height: 100%; border-radius: 50%; border: 5px solid white; 
                        object-fit: cover; background: white; box-shadow: 0 8px 25px rgba(0,43,85,0.15); 
                    }
                    .avatar-upload-icon { 
                        position: absolute; bottom: 5px; right: 5px; background: #002B55; color: white; 
                        width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                        border: 3px solid white; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    }
                    .avatar-upload-icon:hover { transform: scale(1.1); background: #004080; }

                    /* Formulário */
                    .form-container { padding: 80px 50px 50px 50px; }
                    .section-title { 
                        font-family: 'Libre Baskerville', serif; font-weight: 700; color: #002B55; 
                        margin-bottom: 30px; text-align: center; font-size: 1.8rem;
                    }
                    
                    .custom-label { font-size: 0.75rem; font-weight: 700; color: #6C757D; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
                    
                    .custom-input { 
                        background: #F8F9FA; border: 2px solid #E9ECEF; padding: 12px 15px; border-radius: 12px; 
                        font-size: 0.95rem; color: #333; transition: 0.2s;
                    }
                    .custom-input:focus { border-color: #002B55; background: white; outline: none; box-shadow: 0 0 0 4px rgba(0, 43, 85, 0.05); }

                    .icon-input-wrapper { position: relative; }
                    .icon-input-wrapper .input-icon { position: absolute; top: 50%; left: 15px; transform: translateY(-50%); color: #ADB5BD; pointer-events: none; }
                    .icon-input-wrapper .custom-input { padding-left: 40px; } /* Espaço pro ícone */

                    /* Botões de Ação */
                    .action-buttons { 
                        display: flex; gap: 15px; margin-top: 40px; 
                    }
                    
                    .btn-outline-back {
                        background: transparent; color: #002B55; border: 2px solid #E9ECEF;
                        padding: 14px 20px; border-radius: 30px; font-weight: 700; font-size: 1rem;
                        transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;
                        flex: 1; /* Divide o espaço com o botão de salvar */
                    }
                    .btn-outline-back:hover { background: #F8F9FA; border-color: #002B55; }

                    .btn-save { 
                        background: #002B55; color: white; border: none; padding: 14px 20px; 
                        border-radius: 30px; font-weight: 700; font-size: 1rem;
                        transition: 0.3s; box-shadow: 0 10px 25px rgba(0, 43, 85, 0.25);
                        display: flex; align-items: center; justify-content: center; gap: 10px;
                        flex: 2; /* Fica um pouco maior que o botão de voltar */
                    }
                    .btn-save:hover { background: #004080; transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0, 43, 85, 0.35); }
                    .btn-save:disabled { background: #CBD5E1; transform: none; box-shadow: none; cursor: not-allowed; }

                    @media (max-width: 768px) {
                        .form-container { padding: 70px 20px 30px 20px; }
                        .cover-area { height: 180px; }
                        .avatar-area { width: 110px; height: 110px; top: 120px; }
                        .action-buttons { flex-direction: column-reverse; } /* Empilha os botões no celular */
                        .btn-outline-back, .btn-save { width: 100%; }
                    }
                `}</style>

                <div className="main-card">
                    {/* BARRA DE PROGRESSO (SÓ NO ONBOARDING) */}
                    {isOnboarding && (
                        <div className="p-4 bg-white border-bottom">
                            <OnboardingHeader step={1} />
                        </div>
                    )}

                    {/* MENSAGENS */}
                    {msg && <Alert variant="success" className="m-3 text-center small fw-bold">{msg}</Alert>}
                    {error && <Alert variant="danger" className="m-3 text-center small fw-bold">{error}</Alert>}

                    <Form onSubmit={handleSalvar}>
                        {/* 1. UPLOAD DE CAPA E FOTO */}
                        <div className="cover-area" style={{ backgroundImage: capaPreview ? `url(${capaPreview})` : 'none' }}>
                            <label className="cover-upload-btn">
                                <FaCamera /> Editar Capa
                                <input type="file" hidden accept="image/*" onChange={(e) => handleImageChange(e, setCapaFile, setCapaPreview)} />
                            </label>
                            
                            <div className="avatar-area">
                                {fotoPreview ? (
                                    <img src={fotoPreview} alt="Logo" className="avatar-img" />
                                ) : (
                                    <div className="avatar-img d-flex align-items-center justify-content-center text-muted h1 bg-white m-0">
                                        <FaStore style={{opacity: 0.3}} />
                                    </div>
                                )}
                                <label className="avatar-upload-icon">
                                    <FaCamera size={14} />
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleImageChange(e, setFotoFile, setFotoPreview)} />
                                </label>
                            </div>
                        </div>

                        {/* 2. DADOS DA LOJA */}
                        <div className="form-container">
                            <h2 className="section-title">Informações Básicas</h2>
                            
                            <Row className="g-4">
                                <Col md={12}>
                                    <Form.Label className="custom-label">Nome do Estabelecimento</Form.Label>
                                    <div className="icon-input-wrapper">
                                        <FaStore className="input-icon" />
                                        <Form.Control 
                                            type="text" className="custom-input" required 
                                            placeholder="Ex: Barbearia Viking"
                                            value={nome} onChange={e => setNome(e.target.value)} 
                                        />
                                    </div>
                                </Col>
                                
                                <Col md={12}>
                                    <Form.Label className="custom-label">Sobre (Bio)</Form.Label>
                                    <div className="icon-input-wrapper">
                                        <FaInfoCircle className="input-icon" style={{top: '20px'}} />
                                        <Form.Control 
                                            as="textarea" rows={3} className="custom-input" 
                                            placeholder="Descreva seu negócio para os clientes..."
                                            value={descricao} onChange={e => setDescricao(e.target.value)} 
                                        />
                                    </div>
                                </Col>

                                <Col md={6}>
                                    <Form.Label className="custom-label">Telefone / WhatsApp</Form.Label>
                                    <div className="icon-input-wrapper">
                                        <FaPhone className="input-icon" />
                                        <Form.Control 
                                            type="text" className="custom-input" required 
                                            placeholder="(00) 00000-0000"
                                            value={telefone} onChange={e => setTelefone(e.target.value)} 
                                        />
                                    </div>
                                </Col>
                                
                                <Col md={6}>
                                    <Form.Label className="custom-label">Cidade</Form.Label>
                                    <div className="icon-input-wrapper">
                                        <FaMapMarkerAlt className="input-icon" />
                                        <Form.Control 
                                            type="text" className="custom-input"
                                            placeholder="Sua cidade"
                                            value={cidade} onChange={e => setCidade(e.target.value)} 
                                        />
                                    </div>
                                </Col>

                                <Col md={8}>
                                    <Form.Label className="custom-label">Endereço</Form.Label>
                                    <Form.Control 
                                        type="text" className="custom-input"
                                        placeholder="Rua, Número, Complemento"
                                        value={endereco} onChange={e => setEndereco(e.target.value)} 
                                    />
                                </Col>

                                <Col md={4}>
                                    <Form.Label className="custom-label">Bairro</Form.Label>
                                    <Form.Control 
                                        type="text" className="custom-input"
                                        placeholder="Seu bairro"
                                        value={bairro} onChange={e => setBairro(e.target.value)} 
                                    />
                                </Col>
                            </Row>

                            {/* BOTÕES DE AÇÃO (Voltar e Salvar) */}
                            <div className="action-buttons">
                                {!isOnboarding && (
                                    <button 
                                        type="button" 
                                        className="btn-outline-back" 
                                        onClick={() => navigate('/admin-dashboard')}
                                    >
                                        <FaArrowLeft /> Voltar ao Painel
                                    </button>
                                )}
                                
                                <button type="submit" className="btn-save" disabled={loading}>
                                    {loading ? <Spinner size="sm" animation="border" variant="light"/> : (
                                        isOnboarding 
                                            ? <>Salvar e Continuar <FaArrowRight /></>
                                            : <>Salvar Alterações <FaSave /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </Form>
                </div>
            </div>
        </>
    );
}