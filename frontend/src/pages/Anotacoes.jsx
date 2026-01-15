import { useState, useEffect } from 'react';
import api from '../services/api';
import { Container, Row, Col, Card, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { FaPlus, FaTrash, FaArrowLeft, FaPen } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Anotacoes() {
  const navigate = useNavigate();
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [novaNota, setNovaNota] = useState({ titulo: '', conteudo: '', cor: '#FFF9C4' });

  const cores = [
      { nome: 'Amarelo Clássico', hex: '#FFF9C4' }, 
      { nome: 'Menta Fresca', hex: '#E0F2F1' },     
      { nome: 'Lavanda Suave', hex: '#F3E5F5' },   
      { nome: 'Coral Pálido', hex: '#FFCCBC' },   
      { nome: 'Azul Nuvem', hex: '#E3F2FD' },
      { nome: 'Branco Papel', hex: '#FFFFFF' },
  ];

  useEffect(() => {
    carregarNotas();
  }, []);

  async function carregarNotas() {
    try {
      const resp = await api.get('/anotacoes/');
      setNotas(resp.data);
    } catch (error) {
      console.error("Erro ao carregar", error);
    } finally {
      setLoading(false);
    }
  }

  async function criarNota() {
      if(!novaNota.conteudo) return alert("Sua nota precisa de conteúdo!");
      try {
          await api.post('/anotacoes/', novaNota);
          setShowModal(false);
          setNovaNota({ titulo: '', conteudo: '', cor: '#FFF9C4' }); 
          carregarNotas();
      } catch (error) {
          alert("Erro ao salvar nota.");
      }
  }

  async function deletarNota(id) {
      if(!window.confirm("Quer mesmo descolar e jogar fora essa nota?")) return;
      try {
          await api.delete(`/anotacoes/${id}/`);
          carregarNotas();
      } catch (error) {
          alert("Erro ao deletar.");
      }
  }

  return (
    <div className="anotacoes-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .anotacoes-wrapper {
          min-height: 100vh;
          background-color: #A8DADC;
          font-family: 'Inter', sans-serif;
          padding-bottom: 60px;
        }

        .header-bg {
            background: rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
            padding: 20px 0;
            margin-bottom: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            position: relative; /* Necessário para centralizar o título */
        }

        .page-title {
            font-family: 'Libre Baskerville', serif;
            color: #002B55;
            font-weight: 700;
            font-size: 1.8rem;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* CLASSE NOVA: Centralização Absoluta */
        .absolute-center {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            white-space: nowrap;
        }

        /* Em telas pequenas (celular), o título volta ao normal para não sobrepor botões */
        @media (max-width: 768px) {
            .absolute-center {
                position: static;
                transform: none;
                display: none; /* Opcional: Esconder título no mobile se ficar apertado */
            }
        }

        .tape {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%) rotate(-2deg);
            width: 100px;
            height: 30px;
            background-color: rgba(255, 255, 255, 0.4);
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 10;
        }

        .post-it-card {
            border: none;
            border-radius: 2px;
            position: relative;
            min-height: 220px;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-top: 15px;
        }

        .post-it-card:hover {
            transform: scale(1.02) rotate(0deg) !important;
            box-shadow: 0 15px 30px rgba(0,0,0,0.15);
            z-index: 20;
        }

        .post-it-title {
            font-family: 'Libre Baskerville', serif;
            font-weight: 700;
            color: #333;
            border-bottom: 1px dashed rgba(0,0,0,0.1);
            padding-bottom: 10px;
            margin-bottom: 15px;
        }

        .post-it-content {
            font-family: 'Inter', sans-serif;
            font-size: 0.95rem;
            color: #444;
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .btn-navy {
            background-color: #002B55;
            border: none;
            border-radius: 30px;
            padding: 10px 25px;
            font-weight: 600;
            transition: 0.2s;
        }
        .btn-navy:hover {
            background-color: #004080;
            transform: translateY(-2px);
        }

        .btn-back {
            color: #002B55;
            border: 2px solid #002B55;
            background: transparent;
            border-radius: 30px;
            padding: 8px 20px;
            font-weight: 600;
            transition: 0.2s;
        }
        .btn-back:hover {
            background: #002B55;
            color: white;
        }

        .custom-modal-content { border-radius: 20px; border: none; overflow: hidden; }
        .custom-modal-header { background-color: #002B55; color: white; border: none; }
      `}</style>

      {/* HEADER CENTRALIZADO */}
      <div className="header-bg">
        <Container className="d-flex justify-content-between align-items-center position-relative">
            
            {/* Botão Esquerda */}
            <Button className="btn-back" onClick={() => navigate('/admin-dashboard')}>
                <FaArrowLeft className="me-2"/> Voltar
            </Button>
            
            {/* Título Centralizado (Absoluto) */}
            <h2 className="page-title absolute-center d-none d-md-block">
                Quadro de Notas
            </h2>
            
            {/* Botão Direita */}
            <Button className="btn-navy shadow" onClick={() => setShowModal(true)}>
                <FaPlus className="me-2"/> Nova Nota
            </Button>

        </Container>
      </div>

      <Container>
        {loading ? (
            <div className="text-center mt-5">
                <Spinner animation="border" style={{color: '#002B55'}} />
                <p className="mt-3 text-muted">Buscando seus papéis...</p>
            </div>
        ) : (
            <Row>
                {notas.map((nota, index) => (
                    <Col md={4} sm={6} key={nota.id} className="mb-5">
                        <Card 
                            className="post-it-card h-100" 
                            style={{
                                backgroundColor: nota.cor,
                                transform: `rotate(${index % 2 === 0 ? '1.5deg' : '-1.5deg'})`
                            }}
                        >
                            <div className="tape"></div>
                            <Card.Body className="d-flex flex-column pt-4 px-4">
                                {nota.titulo && (
                                    <h5 className="post-it-title">{nota.titulo}</h5>
                                )}
                                <div className="post-it-content flex-grow-1">
                                    {nota.conteudo}
                                </div>
                                <div className="d-flex justify-content-end mt-3 pt-2">
                                    <Button 
                                        variant="link" 
                                        className="text-danger p-0 opacity-50 hover-opacity-100" 
                                        onClick={() => deletarNota(nota.id)} 
                                        title="Jogar no lixo"
                                    >
                                        <FaTrash size={16} />
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}

                {notas.length === 0 && (
                    <Col md={12} className="text-center mt-5">
                        <div style={{opacity: 0.6}}>
                            <div style={{
                                width: '100px', height: '100px', background: 'white', 
                                borderRadius: '50%', margin: '0 auto', display:'flex', 
                                alignItems:'center', justifyContent:'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                            }}>
                                <FaPen size={40} color="#002B55" />
                            </div>
                            <h4 className="mt-4 fw-bold" style={{color: '#002B55', fontFamily: 'Libre Baskerville'}}>
                                Nada por aqui...
                            </h4>
                            <Button variant="link" onClick={() => setShowModal(true)} style={{color: '#002B55', fontWeight: 'bold'}}>
                                Criar primeira nota
                            </Button>
                        </div>
                    </Col>
                )}
            </Row>
        )}
      </Container>

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="custom-modal-content">
            <Modal.Header closeButton className="custom-modal-header">
                <Modal.Title style={{fontFamily: 'Libre Baskerville'}}>Escrever Nota</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4" style={{backgroundColor: '#F9FAFB'}}>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-muted small">TÍTULO</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Ex: Lembrete importante" 
                            value={novaNota.titulo} 
                            onChange={e => setNovaNota({...novaNota, titulo: e.target.value})} 
                            className="border-0 shadow-sm p-3"
                        />
                    </Form.Group>
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold text-muted small">CONTEÚDO</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={5} 
                            placeholder="Digite aqui..." 
                            value={novaNota.conteudo} 
                            onChange={e => setNovaNota({...novaNota, conteudo: e.target.value})}
                            className="border-0 shadow-sm p-3"
                            style={{resize: 'none'}}
                        />
                    </Form.Group>
                    
                    <Form.Label className="fw-bold text-muted small d-block text-center mb-3">COR DO PAPEL</Form.Label>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                        {cores.map(c => (
                            <div key={c.hex} 
                                onClick={() => setNovaNota({...novaNota, cor: c.hex})}
                                style={{
                                    width: 40, height: 40, borderRadius: '50%', 
                                    backgroundColor: c.hex, cursor: 'pointer',
                                    border: novaNota.cor === c.hex ? '3px solid #002B55' : '1px solid #ddd',
                                    boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                                    transform: novaNota.cor === c.hex ? 'scale(1.1)' : 'scale(1)',
                                    transition: '0.2s'
                                }}
                            />
                        ))}
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-0 bg-white justify-content-between px-4 pb-4">
                <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button className="btn-navy px-4" onClick={criarNota}>Colar no Quadro</Button>
            </Modal.Footer>
        </Modal>
    </div>
  );
}