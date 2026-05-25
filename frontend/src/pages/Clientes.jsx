import { useState, useEffect } from 'react';
import api from '../services/api';
import { Container, Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaSearch, FaUser, FaWhatsapp, FaGift, FaStar, FaMedal } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const META_FIDELIDADE = 10;

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    try {
      const resp = await api.get('/api/auth/clientes/');
      setClientes(resp.data);
    } catch (error) {
      console.error("Erro ao carregar clientes", error);
    } finally {
      setLoading(false);
    }
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="clientes-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .clientes-wrapper {
          min-height: 100vh;
          /* Fundo do corpo da página (mantendo o gradiente suave que você gostou) */
          background: rgba(246, 246, 246, 0.9);
          font-family: 'Inter', sans-serif;
          padding-bottom: 80px;
        }

        /* CABEÇALHO ESCURO (Igual ao Dashboard) */
        .header-section {
            background-color: #002B55; /* Azul Marinho Sólido */
            padding: 40px 0 80px 0; /* Padding inferior maior para os cards entrarem um pouco */
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            color: white;
            margin-bottom: -40px; /* Efeito de sobreposição dos cards */
        }

        .page-title {
            font-family: 'Libre Baskerville', serif;
            color: #FFFFFF;
            font-weight: 700;
            margin: 0;
            font-size: 1.8rem;
            letter-spacing: 0.5px;
        }

        .header-subtitle {
            color: rgba(255, 255, 255, 0.7);
            margin: 5px 0 0 0;
        }

        /* CARDS */
        .client-card {
            border: none;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 43, 85, 0.1); /* Sombra mais marcada */
            transition: all 0.3s ease;
            background: #FFFFFF;
            overflow: hidden;
        }
        .client-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0, 43, 85, 0.15);
        }

        .client-name {
            font-family: 'Libre Baskerville', serif;
            font-weight: 700;
            color: #002B55;
            font-size: 1.1rem;
            margin-bottom: 4px;
        }

        .avatar-circle {
            width: 65px; height: 65px;
            background: linear-gradient(45deg, #002B55, #004080);
            color: white;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.6rem; font-weight: bold;
            margin-right: 18px;
            box-shadow: 0 4px 10px rgba(0, 43, 85, 0.2);
            border: 3px solid white;
        }

        .loyalty-section {
            border-top: 1px dashed rgba(0, 43, 85, 0.15);
            padding-top: 20px;
            margin-top: auto;
        }

        .loyalty-track {
            display: flex; gap: 10px; margin-top: 15px;
            justify-content: center; flex-wrap: wrap;
        }
        .loyalty-dot {
            width: 28px; height: 28px; border-radius: 50%;
            border: 2px solid #E0E0E0; background-color: #F8F9FA;
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; color: #AAA; transition: all 0.3s;
        }
        .loyalty-dot.filled {
            background-color: #002B55; border-color: #002B55;
            color: white; transform: scale(1.1);
        }
        .loyalty-dot.reward {
            border-color: #FFD700; color: #FFD700; background-color: #FFFBE6;
        }
        .loyalty-dot.filled.reward {
            background: linear-gradient(45deg, #FFD700, #FFC107);
            border-color: transparent; color: #002B55;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
        }

        .btn-whatsapp {
            background: linear-gradient(45deg, #25D366, #128C7E);
            color: white; border: none; border-radius: 50%;
            width: 45px; height: 45px; display: flex; align-items: center; justify-content: center;
            transition: 0.3s; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3);
        }
        .btn-whatsapp:hover { transform: scale(1.1) rotate(-10deg); }

        /* SEARCH BAR NO HEADER ESCURO */
        .search-container {
            position: relative; max-width: 500px; width: 100%;
        }
        .search-input {
            border-radius: 80px; border: none;
            padding: 10px 25px 8px 50px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            font-size: 1rem;
        }
        .search-icon {
            position: absolute; left: 20px; top: 50%;
            transform: translateY(-50%); color: #002B55; opacity: 0.7;
        }
        
        .btn-back-custom {
            background: rgba(255,255,255,0.15); 
            color: white; font-weight: 600; 
            border-radius: 30px; padding: 8px 25px; 
            border: 1px solid rgba(255,255,255,0.3); 
            transition: 0.2s;
        }
        .btn-back-custom:hover { 
            background: white; color: #002B55; 
        }
      `}</style>

      {/* HEADER ESCURO (NAVY BLUE) */}
      <div className="header-section">
        <Container className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4">
            <div className="d-flex align-items-center gap-5 w-100">
                <Button className="btn-back-custom" onClick={() => navigate('/admin-dashboard')}>
                    <FaArrowLeft className="me-2"/> Voltar
                </Button>
                <div>
                    <h2 className="page-title">Carteira de Clientes</h2>
                    <p className="header-subtitle d-none d-md-block">Acompanhe a fidelidade do seu público.</p>
                </div>
            </div>
            
            <div className="search-container">
                <FaSearch className="search-icon" />
                <Form.Control 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    className="search-input"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>
        </Container>
      </div>

      <Container>
        {loading ? (
            <div className="text-center mt-5 pt-5">
                <Spinner animation="border" style={{color: '#002B55', width: '3rem', height: '3rem'}} />
                <p className="mt-3 text-muted fw-bold">Carregando...</p>
            </div>
        ) : (
            <Row className="mt-4">
                {clientesFiltrados.map(cliente => {
                    const visitas = cliente.visitas || 0;
                    const ciclosCompletos = Math.floor(visitas / META_FIDELIDADE);
                    const visitasAtuais = visitas % META_FIDELIDADE;
                    
                    return (
                        <Col md={6} lg={4} key={cliente.id} className="mb-4">
                            <Card className="client-card h-100">
                                <Card.Body className="d-flex flex-column p-4">
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="avatar-circle">
                                            {cliente.foto ? <img src={cliente.foto} alt="" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit: 'cover'}}/> : <FaUser />}
                                        </div>
                                        <div>
                                            <h5 className="client-name">{cliente.nome}</h5>
                                            <small className="text-muted d-block">{cliente.email}</small>
                                            
                                            {ciclosCompletos > 0 && (
                                                <div className="d-flex align-items-center gap-2 mt-2 px-3 py-1 rounded-pill" style={{background: 'rgba(255, 215, 0, 0.15)', color: '#B7950B', width: 'fit-content'}}>
                                                    <FaMedal /> <small className="fw-bold">{ciclosCompletos} prêmio(s)!</small>
                                                </div>
                                            )}
                                        </div>
                                        {cliente.telefone && (
                                            <a href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="ms-auto btn-whatsapp">
                                                <FaWhatsapp size={22} />
                                            </a>
                                        )}
                                    </div>

                                    <div className="loyalty-section text-center mt-auto">
                                        <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                                            <small className="fw-bold text-uppercase" style={{letterSpacing: '1px', color: '#002B55', fontSize: '0.75rem'}}>
                                                Fidelidade
                                            </small>
                                            <small style={{fontWeight: '800', color: '#002B55'}}>
                                                {visitasAtuais} <span className="text-muted fw-normal">/ {META_FIDELIDADE}</span>
                                            </small>
                                        </div>
                                        
                                        <div className="loyalty-track">
                                            {Array.from({ length: META_FIDELIDADE }).map((_, i) => {
                                                const isFilled = i < visitasAtuais;
                                                const isLast = i === META_FIDELIDADE - 1;
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className={`loyalty-dot ${isFilled ? 'filled' : ''} ${isLast ? 'reward' : ''}`}
                                                    >
                                                        {isLast ? <FaGift size={14} /> : (isFilled ? <FaStar size={12} /> : i+1)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
                
                {clientesFiltrados.length === 0 && !loading && (
                    <div className="text-center mt-5 pt-5 w-100" style={{opacity: 0.7}}>
                        <div className="mb-3" style={{fontSize: '3rem', color: '#002B55'}}><FaUser /></div>
                        <h4 style={{fontFamily: 'Libre Baskerville', color: '#002B55'}}>Nenhum cliente encontrado.</h4>
                    </div>
                )}
            </Row>
        )}
      </Container>
    </div>
  );
}