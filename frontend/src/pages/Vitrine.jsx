import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Navbar, Nav } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaStore, FaMapMarkerAlt, FaStar, FaSignOutAlt, FaCalendarCheck, FaUserCog } from 'react-icons/fa';

// --- IMPORTAÇÃO DO LOGO ---
// Certifique-se que o arquivo existe em src/assets/logotipo1.svg
// Se não existir, o código usa um fallback para não quebrar.
import logoConfia from '../assets/logotipo1.svg'; 
// --------------------------

export default function Vitrine() {
  const [lojas, setLojas] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLojas() {
      try {
        const response = await api.get('/auth/empreendedores/');
        setLojas(response.data);
      } catch (error) {
        console.error("Erro ao buscar lojas", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLojas();
  }, []);

  const handleEntrarLoja = (loja) => {
    // Passa o objeto completo para o dashboard carregar instantaneamente
    // O ClienteDashboard deve estar preparado para receber o state: { loja }
    navigate('/cliente-dashboard', { 
        state: { loja } 
    });
  };

  const lojasFiltradas = lojas.filter(loja => {
    const termo = busca.toLowerCase();
    const nome = (loja.nome_completo || loja.username).toLowerCase();
    const bairro = (loja.bairro || '').toLowerCase();
    const servicos = (loja.descricao || '').toLowerCase();
    return nome.includes(termo) || bairro.includes(termo) || servicos.includes(termo);
  });

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#F8F9FA'}}><Spinner animation="border" style={{color:'#002B55'}}/></div>;

  return (
    <div className="vitrine-moderna">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        /* FUNDO GERAL LIMPO */
        .vitrine-moderna {
            background-color: #F8F9FA; /* Cinza Gelo suave */
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            padding-bottom: 60px;
        }

        /* NAVBAR TRANSPARENTE/BRANCA */
        .custom-navbar {
            background: white;
            box-shadow: 0 2px 15px rgba(0,0,0,0.03);
            padding: 16px 0;
        }
        
        .brand-container { display: flex; align-items: center; gap: 12px; text-decoration: none; cursor: pointer; }
        .brand-logo-img { width: 45px; height: 45px; object-fit: contain; }
        .brand-text { font-family: 'Libre Baskerville'; font-weight: 700; font-size: 1.5rem; color: #002B55; }

        .nav-btn-link { 
            color: #555; font-weight: 600; font-size: 0.9rem; transition: 0.2s; 
            text-decoration: none; display: flex; align-items: center; gap: 8px; background: transparent; border: none;
        }
        .nav-btn-link:hover { color: #002B55; }
        
        .btn-logout { 
            border: 1px solid #FFEBEE; background: #FFEBEE; color: #D32F2F; border-radius: 50px; 
            padding: 6px 18px; font-weight: 600; font-size: 0.85rem; transition: 0.2s; 
            display: flex; align-items: center; gap: 6px; 
        }
        .btn-logout:hover { background: #D32F2F; color: white; }

        /* HERO SECTION COM DEGRADÊ ELEGANTE */
        .hero-section {
            background: linear-gradient(135deg, #002B55 0%, #004e92 100%);
            color: white;
            padding: 70px 20px 100px 20px; /* Espaço extra embaixo para a busca flutuar */
            text-align: center;
            border-radius: 0 0 70px 70px;
            border-bottom: 6px solid #c7c5cc;
            margin-bottom: 40px;
            position: relative;
            z-index: 1;
        }
        
        .hero-title {
            font-family: 'Libre Baskerville', serif;
            font-size: 2.5rem;
            margin-bottom: 12px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .hero-subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            font-weight: 300;
            max-width: 600px;
            margin: 0 auto;
        }

        /* BARRA DE BUSCA FLUTUANTE */
        .search-wrapper {
            margin-top: -75px; /* Sobe para dentro do Hero */
            margin-bottom: 50px;
            padding: 0 20px;
            position: relative;
            z-index: 2;
        }
        .search-box {
            background: white;
            padding: 8px 8px 8px 25px;
            border-radius: 50px;
            box-shadow: 0 15px 35px rgba(0,43,85,0.1);
            display: flex;
            align-items: center;
            max-width: 700px;
            margin: 0 auto;
            border: 1px solid rgba(0,0,0,0.05);
        }
        .search-input {
            border: none;
            flex-grow: 1;
            padding: 10px;
            font-size: 1.05rem;
            outline: none;
            color: #333;
            background: transparent;
        }
        .search-input::placeholder { color: #BBB; }
        
        .search-btn {
            background: #2DCE89; /* Verde destaque */
            color: white;
            border: none;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: default; /* Apenas visual, já filtra ao digitar */
            box-shadow: 0 4px 10px rgba(45, 206, 137, 0.3);
            transition: 0.6s;
        }

        .search-btn:hover {
            background: #28b77f;
        }

        /* CARDS PREMIUM */
        .premium-card {
            background: white;
            border-radius: 24px;
            border: none;
            overflow: visible; /* Importante para elementos saltarem se precisar */
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            box-shadow: 0 10px 25px rgba(0,0,0,0.04);
            position: relative;
            cursor: pointer;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        .premium-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,43,85,0.12);
        }

        .card-cover-wrapper {
            height: 150px;
            position: relative;
            border-radius: 24px 24px 0 0;
            overflow: hidden;
        }

        .card-cover-img {
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            transition: transform 0.5s ease;
        }
        .premium-card:hover .card-cover-img { transform: scale(1.05); }

        /* Overlay escuro suave na capa */
        .card-cover-wrapper::after {
            content: ''; position: absolute; top:0; left:0; right:0; bottom:0;
            background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%);
        }

        /* Badge de Nota */
        .rating-pill {
            position: absolute; top: 15px; right: 15px; z-index: 2;
            background: rgba(255,255,255,0.95);
            padding: 5px 12px; border-radius: 20px;
            font-weight: 700; font-size: 0.85rem; color: #F9A825;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            display: flex; align-items: center; gap: 4px;
        }

        /* Avatar */
        .card-avatar-wrapper {
            margin-top: -50px;
            display: flex;
            justify-content: center;
            position: relative;
            z-index: 3;
        }
        .card-avatar-img {
            width: 90px; height: 90px;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            object-fit: cover;
            background: white;
        }
        .avatar-placeholder {
            width: 90px; height: 90px; border-radius: 50%; border: 4px solid white;
            background: #F0F2F5; display: flex; align-items: center; justify-content: center;
            font-size: 2rem; color: #002B55; box-shadow: 0 4px 10px rgba(0,0,0,0.08);
        }

        /* Conteúdo do Card */
        .card-content {
            padding: 18px 25px 25px 25px;
            text-align: center;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }

        .shop-title {
            font-weight: 800; font-size: 1.35rem; color: #002B55; margin-bottom: 6px;
            letter-spacing: -0.5px;
        }
        
        .shop-loc {
            color: #8898AA; font-size: 0.9rem; margin-bottom: 20px;
            display: flex; align-items: center; justify-content: center; gap: 5px; font-weight: 500;
        }
        
        /* Botão "Fantasma" que chama atenção */
        .action-text {
            margin-top: auto;
            color: #002B55;
            font-weight: 700;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding-top: 15px;
            border-top: 1px solid #F1F3F5;
            width: 100%;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: 0.2s;
        }
        .premium-card:hover .action-text { color: #2DCE89; }

        @media (max-width: 768px) {
            .hero-section { padding: 60px 20px 90px 20px; border-radius: 0 0 30px 30px; }
            .hero-title { font-size: 2rem; }
            .search-wrapper { margin-top: -60px; }
        }
      `}</style>

      {/* NAVBAR */}
      <Navbar className="custom-navbar" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand onClick={() => window.location.reload()} className="p-0">
              <div className="brand-container">
                  <img 
                    src={logoConfia} 
                    alt="Confia+" 
                    className="brand-logo-img" 
                    onError={(e) => { e.target.style.display = 'none'; }} 
                  />
                  <span className="brand-text">Confia+</span>
              </div>
          </Navbar.Brand>

          <Nav className="ms-auto flex-row align-items-center gap-4">
             <button className="nav-btn-link" onClick={() => navigate('/meus-agendamentos')}>
                <FaCalendarCheck size={18} /> <span className="d-none d-md-inline">Meus Agendamentos</span>
             </button>
             
             {/* BOTÃO ADICIONADO: MINHA CONTA */}
             <button className="nav-btn-link" onClick={() => navigate('/conta/configuracoes')}>
                <FaUserCog size={18} /> <span className="d-none d-md-inline">Minha Conta</span>
             </button>
             {/* ------------------------------- */}

             <button className="btn-logout" onClick={logout}>
                <FaSignOutAlt /> Sair
             </button>
          </Nav>
        </Container>
      </Navbar>

      {/* HERO SECTION */}
      <div className="hero-section">
        <Container>
            <h1 className="hero-title">Beleza e Bem-estar ao seu alcance</h1>
            <p className="hero-subtitle">Descubra e agende horários com os melhores profissionais da sua região.</p>
        </Container>
      </div>

      {/* BUSCA FLUTUANTE */}
      <div className="search-wrapper">
        <div className="search-box">
            <FaSearch className="ms-2 text-muted opacity-50" />
            <input 
                className="search-input" 
                placeholder="Busque por barbearia, manicure, spa..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
            />
            <div className="search-btn"><FaSearch /></div>
        </div>
      </div>

      <Container className="pb-5">
        {lojasFiltradas.length === 0 ? (
             <div className="text-center py-5 text-muted">
                 <FaStore size={40} className="mb-3 opacity-25" />
                 <h4>Nenhum local encontrado :(</h4>
                 <p>Tente buscar por outro termo.</p>
             </div>
        ) : (
            <Row xs={1} md={2} lg={3} className="g-4">
                {lojasFiltradas.map((loja) => (
                    <Col key={loja.id}>
                        <div className="premium-card" onClick={() => handleEntrarLoja(loja)}>
                            
                            {/* Capa */}
                            <div className="card-cover-wrapper">
                                <div 
                                    className="card-cover-img" 
                                    style={{
                                        backgroundImage: loja.capa ? `url(${loja.capa})` : 'linear-gradient(135deg, #002B55, #00509E)'
                                    }}
                                ></div>
                                {/* Badge de Nota */}
                                <div className="rating-pill">
                                    <FaStar /> {loja.nota_media || '5.0'}
                                </div>
                            </div>

                            {/* Avatar */}
                            <div className="card-avatar-wrapper">
                                {loja.foto ? (
                                    <img src={loja.foto} alt={loja.username} className="card-avatar-img" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        <FaStore />
                                    </div>
                                )}
                            </div>

                            {/* Conteúdo */}
                            <div className="card-content">
                                <h3 className="shop-title">{loja.nome_completo || loja.username}</h3>
                                
                                <div className="shop-loc">
                                    <FaMapMarkerAlt /> 
                                    {loja.bairro ? 
                                        (loja.bairro + (loja.cidade ? ` - ${loja.cidade}` : '')) 
                                        : 'Localização não informada'
                                    }
                                </div>
                                
                                <div className="action-text">
                                    Ver Agenda ➜
                                </div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
        )}
      </Container>
    </div>
  );
}