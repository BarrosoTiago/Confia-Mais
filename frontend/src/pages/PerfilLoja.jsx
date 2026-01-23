import { useState, useEffect } from 'react';
import api from '../services/api';
import { Container, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { 
  FaArrowLeft, FaStore, FaMapMarkerAlt, FaCamera, FaImage, FaSave, FaUserEdit 
} from 'react-icons/fa';

export default function PerfilLoja() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [dados, setDados] = useState({
    nome_completo: '',
    telefone: '',
    descricao: '',
    endereco: '',
    bairro: '',
    cidade: '',
    foto: null,
    capa: null,
    fotoPreview: '',
    capaPreview: ''
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const response = await api.get('/auth/users/me/');
      const user = response.data;
      setDados({
        nome_completo: user.nome_completo || '',
        telefone: user.telefone || '',
        descricao: user.descricao || '',
        endereco: user.endereco || '',
        bairro: user.bairro || '',
        cidade: user.cidade || '',
        foto: null,
        capa: null,
        fotoPreview: user.foto,
        capaPreview: user.capa
      });
    } catch (error) {
      setNotification({ type: 'danger', message: 'Erro ao carregar dados.' });
    }
  }

  const handleFileChange = (e, campo) => {
    const file = e.target.files[0];
    if (file) {
      setDados(prev => ({
        ...prev,
        [campo]: file,
        [`${campo}Preview`]: URL.createObjectURL(file)
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const formData = new FormData();
      formData.append('nome_completo', dados.nome_completo);
      formData.append('telefone', dados.telefone);
      formData.append('descricao', dados.descricao);
      formData.append('endereco', dados.endereco);
      formData.append('bairro', dados.bairro);
      formData.append('cidade', dados.cidade);

      if (dados.foto instanceof File) formData.append('foto', dados.foto);
      if (dados.capa instanceof File) formData.append('capa', dados.capa);

      await api.patch('/auth/users/me/', formData);
      setNotification({ type: 'success', message: 'Perfil atualizado com sucesso!' });
      
    } catch (error) {
      setNotification({ type: 'danger', message: 'Erro ao salvar perfil.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <AnimatedBackground />

        <div className="profile-wrapper">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            .profile-wrapper {
            min-height: 100vh; background-color: #transparent; font-family: 'Inter', sans-serif;
            padding: 40px 20px; overflow-x: hidden;
            }
            .container-limit { max-width: 1100px; margin: 0 auto; padding-bottom: 60px; }

            /* HEADER */
            .page-header {
                display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;
            }
            .header-left { display: flex; align-items: center; gap: 20px; }
            .btn-back-circle {
                width: 45px; height: 45px; border-radius: 50%; background: #F8F9FA; border: 1px solid #E9ECEF;
                color: #002B55; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
                cursor: pointer; transition: 0.2s;
            }
            .btn-back-circle:hover { background: #002B55; color: white; }
            .title-group h1 { font-family: 'Libre Baskerville', serif; font-weight: 700; font-size: 1.8rem; color: #ffffff; margin: 0; }
            .title-group span { font-size: 0.9rem; color: #dfdfdf; }

            /* CARDS */
            .glass-card {
                background: white; border-radius: 20px; padding: 60px;
                box-shadow: 0 10px 30px rgba(0,43,85,0.05); height: 100%; border: 1px solid white;
            }

            /* UPLOAD AVATAR */
            .avatar-upload {
                position: relative; width: 140px; height: 140px; margin: 0 auto 15px auto;
            }
            .avatar-preview {
                width: 100%; height: 100%; border-radius: 50%; object-fit: cover; 
                border: 4px solid #E3F2FD; box-shadow: 0 5px 15px rgba(0,0,0,0.1); background: white;
            }
            .avatar-edit-btn {
                position: absolute; bottom: 5px; right: 5px; background: #002B55; color: white;
                width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                cursor: pointer; transition: 0.2s; border: 2px solid white;
            }
            .avatar-edit-btn:hover { transform: scale(1.1); background: #004080; }

            /* UPLOAD CAPA */
            .cover-upload {
                position: relative; height: 120px; background: #F1F3F5; border-radius: 12px; overflow: hidden;
                display: flex; align-items: center; justify-content: center; border: 2px dashed #CED4DA; cursor: pointer;
                transition: 0.2s;
            }
            .cover-upload:hover { border-color: #002B55; background: #E9ECEF; }
            .cover-preview { width: 100%; height: 100%; object-fit: cover; }
            .cover-placeholder { color: #888; font-size: 0.85rem; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 5px; }

            /* FORMULÁRIO */
            .section-label { font-size: 0.8rem; font-weight: 700; color: #002B55; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #F1F3F5; padding-bottom: 10px; }
            
            .custom-input {
                border: 2px solid #F1F3F5; background: #F8F9FA; padding: 12px; border-radius: 10px; font-size: 0.95rem; color: #333; font-weight: 500;
            }
            .custom-input:focus { border-color: #002B55; background: white; outline: none; box-shadow: none; }
            .form-label { font-size: 0.85rem; font-weight: 600; color: #666; margin-bottom: 5px; }

            .btn-save-float {
                background: #002B55; color: white; border: none; padding: 12px 40px; border-radius: 30px;
                font-size: 1rem; font-weight: 700; box-shadow: 0 8px 20px rgba(0,43,85,0.2); transition: 0.2s;
                display: flex; align-items: center; gap: 10px; width: 100%; justify-content: center; margin-top: 20px;
            }
            .btn-save-float:hover { transform: translateY(-2px); background: #003366; }
        `}</style>

        <div className="container-limit">
            
            {/* HEADER */}
            <div className="page-header">
                <div className="header-left">
                    <button className="btn-back-circle" onClick={() => navigate('/admin-dashboard')}>
                        <FaArrowLeft />
                    </button>
                    <div className="title-group">
                        <h1>Minha Loja</h1>
                        <span>Edite as informações do seu negócio</span>
                    </div>
                </div>
            </div>

            {notification && (
                <Alert variant={notification.type} onClose={() => setNotification(null)} dismissible className="shadow-sm mb-4">
                {notification.message}
                </Alert>
            )}

            <Form onSubmit={handleSave}>
                <Row className="g-4">
                    
                    {/* COLUNA ESQUERDA: IMAGENS */}
                    <Col md={4}>
                        <div className="glass-card text-center align-content-center gap-2 d-flex flex-column">
                            <div className="section-label justify-content-center"><FaImage /> Identidade Visual</div>
                            
                            {/* Logo Upload */}
                            <div className="avatar-upload">
                                {dados.fotoPreview ? (
                                    <img src={dados.fotoPreview} className="avatar-preview" alt="Logo" />
                                ) : (
                                    <div className="avatar-preview d-flex align-items-center justify-content-center bg-light text-muted">
                                        <FaStore size={40} opacity={0.3} />
                                    </div>
                                )}
                                <label htmlFor="upload-foto" className="avatar-edit-btn">
                                    <FaCamera size={14} />
                                </label>
                                <input type="file" id="upload-foto" accept="image/*" hidden onChange={(e) => handleFileChange(e, 'foto')} />
                            </div>
                            <p className="small text-muted mb-4">Logo da Loja</p>

                            {/* Capa Upload */}
                            <label htmlFor="upload-capa" className="cover-upload">
                                {dados.capaPreview ? (
                                    <img src={dados.capaPreview} className="cover-preview" alt="Capa" />
                                ) : (
                                    <div className="cover-placeholder">
                                        <FaImage size={20} />
                                        <span>Adicionar Capa</span>
                                    </div>
                                )}
                                <input type="file" id="upload-capa" accept="image/*" hidden onChange={(e) => handleFileChange(e, 'capa')} />
                            </label>
                            <p className="small text-muted mt-2">Imagem de Fundo (Vitrine)</p>
                        </div>
                    </Col>

                    {/* COLUNA DIREITA: DADOS */}
                    <Col md={8}>
                        <div className="glass-card">
                            
                            {/* SOBRE O NEGÓCIO */}
                            <div className="section-label"><FaStore /> Sobre o Negócio</div>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nome da Loja / Profissional</Form.Label>
                                        <Form.Control 
                                            type="text" className="custom-input" 
                                            value={dados.nome_completo} 
                                            onChange={e => setDados({...dados, nome_completo: e.target.value})} 
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>WhatsApp / Telefone</Form.Label>
                                        <Form.Control 
                                            type="text" className="custom-input" 
                                            value={dados.telefone} 
                                            onChange={e => setDados({...dados, telefone: e.target.value})} 
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-4">
                                <Form.Label>Descrição (Bio)</Form.Label>
                                <Form.Control 
                                    as="textarea" rows={3} className="custom-input" 
                                    placeholder="Conte um pouco sobre seus serviços..."
                                    value={dados.descricao} 
                                    onChange={e => setDados({...dados, descricao: e.target.value})} 
                                />
                            </Form.Group>

                            {/* LOCALIZAÇÃO */}
                            <div className="section-label mt-4"><FaMapMarkerAlt /> Localização</div>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Endereço</Form.Label>
                                        <Form.Control 
                                            className="custom-input" 
                                            value={dados.endereco} 
                                            onChange={e => setDados({...dados, endereco: e.target.value})} 
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Bairro</Form.Label>
                                        <Form.Control 
                                            className="custom-input" 
                                            value={dados.bairro} 
                                            onChange={e => setDados({...dados, bairro: e.target.value})} 
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Cidade</Form.Label>
                                        <Form.Control 
                                            className="custom-input" 
                                            value={dados.cidade} 
                                            onChange={e => setDados({...dados, cidade: e.target.value})} 
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* BOTÃO SALVAR */}
                            <button className="btn-save-float" type="submit" disabled={loading}>
                                {loading ? <Spinner animation="border" size="sm" /> : <><FaSave /> Salvar Alterações</>}
                            </button>

                        </div>
                    </Col>
                </Row>
            </Form>
        </div>
        </div>
    </>
  );
}