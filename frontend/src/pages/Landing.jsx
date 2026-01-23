import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { 
    FaArrowRight, FaChartLine, FaMobileAlt, FaWhatsapp, FaInstagram, 
    FaStar, FaCut, FaStore, FaTools, FaCalendarAlt, FaCalculator, 
    FaUsers, FaLock, FaPlay, FaUserTie, FaShoppingBag, FaEnvelope, FaMapMarkerAlt, FaSearchLocation, FaCheckCircle
} from 'react-icons/fa';
import logotipoSystem from "../assets/logotipo1.svg"; 
import imgTiago from "../assets/tiagoimg.jpeg";
import imgEmily from "../assets/emilyimg.jpeg";
import imgIasmin from "../assets/iasmimimg.jpeg";
import imgGiseliane from "../assets/giselianeimg.jpeg";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        :root {
            /* PALETA COASTAL BLUES (Extraída da imagem) */
            --col-deep-navy: #012A4A;     /* Fundo Footer / Textos Fortes */
            --col-dark-blue: #013A63;     /* Hero Gradient End */
            --col-navy:      #01497C;     /* Hero Gradient Start */
            --col-primary:   #014F86;     /* Botões Hover */
            --col-mid-blue:  #2A6F97;     /* Botões Principal / Destaques */
            --col-ocean:     #2C7DA0;     /* Ícones Fortes */
            --col-soft:      #61A5C2;     /* Bordas Suaves / Detalhes */
            --col-light:     #89C2D9;     /* Ícones Claros */
            --col-pale:      #A9D6E5;     /* Hover / Backgrounds tint */

            /* TONS DE CINZA (MODERN SLATE) */
            --gray-bg-main:  #F8FAFC;     /* Fundo Principal */
            --gray-bg-sec:   #F1F5F9;     /* Fundo Secundário */
            --gray-border:   #E2E8F0;     /* Bordas */
            --gray-text-sub: #64748B;     /* Texto Secundário */
            --gray-text-main:#334155;     /* Texto Principal */
        }

        .landing-wrapper { font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; background: var(--gray-bg-main); color: var(--gray-text-main); }
        
        /* ANIMAÇÕES */
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-up { animation: fadeInUp 0.2s ease-out forwards; }

        /* NAVBAR */
        .navbar-custom { 
            position: absolute; top: 0; left: 0; width: 100%; 
            padding: 25px 5%; display: flex; justify-content: space-between; align-items: center; z-index: 100;
        }
        .navbar-logo { height: 50px; transition: 0.3s; }
        
        .nav-links span { 
            color: rgba(255,255,255,0.85); margin-left: 30px; font-weight: 600; cursor: pointer; transition: 0.3s; font-size: 0.95rem;
        }
        .nav-links span:hover { color: var(--col-light); }

        /* --- HERO SECTION (GRADIENTE AZUL PROFUNDO) --- */
        .hero {
            background: radial-gradient(circle at 70% 30%, var(--col-navy) 0%, var(--col-deep-navy) 90%);
            min-height: 100vh;
            color: white; display: flex; align-items: center; position: relative; overflow: hidden; padding-top: 100px;
        }
        .hero::before {
            content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 50px 50px; pointer-events: none;
        }
        .hero-tag {
            background: rgba(169, 214, 229, 0.1); border: 1px solid var(--col-soft); color: var(--col-pale);
            padding: 8px 25px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
            display: inline-block; margin-bottom: 25px; backdrop-filter: blur(5px);
        }
        .hero-title { 
            font-family: 'Libre Baskerville', serif; font-size: 3.8rem; font-weight: 700; 
            line-height: 1.1; margin-bottom: 25px; text-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .hero-subtitle { 
            font-size: 1.2rem; opacity: 0.9; margin-bottom: 40px; font-weight: 300; max-width: 550px; line-height: 1.6; color: var(--col-pale);
        }
        .btn-glow {
            background: var(--col-mid-blue); color: white;
            padding: 16px 45px; border-radius: 50px; font-weight: 800; border: none; font-size: 1.05rem;
            box-shadow: 0 0 25px rgba(42, 111, 151, 0.4); transition: 0.3s; display: inline-flex; align-items: center; gap: 10px;
        }
        .btn-glow:hover { transform: translateY(-3px); box-shadow: 0 10px 40px rgba(42, 111, 151, 0.6); background: var(--col-ocean); }
        
        .video-frame {
            backdrop-filter: blur(10px); padding: 15px; border-radius: 8px;
            box-shadow: 0 40px 80px rgba(0, 0, 0, 0.11); border: 0.5px solid rgba(255, 255, 255, 0.17); transition: 0.3s;
        }
        .video-frame:hover { transform: perspective(1000px) scale(1.08); }
        .video-placeholder {
            width: 100%; aspect-ratio: 16/9; background: linear-gradient(to bottom, #35a8ff, #012A4A);
            border-radius: 5px; display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: white; position: relative; overflow: hidden; cursor: pointer;
        }
        .play-btn {
            width: 60px; height: 60px; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; 
            border: 2px solid var(--col-light); color: var(--col-light); transition: 0.3s; margin-bottom: 15px;
        }
        .video-placeholder:hover .play-btn { background: var(--col-mid-blue); border-color: var(--col-mid-blue); color: white; transform: scale(1.05); }

        /* SEÇÃO "PARA QUEM É" */
        .target-section { padding: 100px 20px; background: var(--gray-bg-main); text-align: center; }
        .target-title { 
            font-family: 'Libre Baskerville', serif; color: var(--col-deep-navy); font-size: 2.5rem; margin-bottom: 60px; font-weight: 700; 
            text-transform: uppercase; letter-spacing: 1px;
        }
        .target-grid { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; }
        .target-card {
            background: white; padding: 40px 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); 
            display: flex; flex-direction: column; align-items: center; gap: 15px; min-width: 220px; transition: 0.3s; 
            position: relative; overflow: hidden; border: 1px solid var(--gray-border);
        }
        .target-card:hover { transform: translateY(-10px); box-shadow: 0 20px 50px rgba(1, 42, 74, 0.1); border-color: var(--col-mid-blue); }
        .target-icon { 
            width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
            font-size: 2rem; margin-bottom: 10px; transition: 0.3s; background: var(--gray-bg-sec); color: var(--col-mid-blue);
        }
        .tc-barber:hover .target-icon { background: var(--col-deep-navy); color: white; }
        .tc-store:hover .target-icon { background: var(--col-navy); color: white; }
        .tc-tools:hover .target-icon { background: var(--col-mid-blue); color: white; }
        .tc-star:hover .target-icon { background: var(--col-ocean); color: white; }
        .target-label { font-weight: 800; color: var(--gray-text-main); text-transform: uppercase; font-size: 0.95rem; letter-spacing: 1px; }

        /* --- ECOSSISTEMA DUPLO (MODIFICADO: FUNDO ESCURO / CARDS CLAROS) --- */
        .ecosystem-section { padding: 120px 20px; background: var(--col-deep-navy); color: white; position: relative; }
        .ecosystem-section::after {
            content: ''; position: absolute; right: 0; bottom: 0; width: 500px; height: 500px;
            background: radial-gradient(circle, rgba(42, 111, 151, 0.15) 0%, transparent 70%); pointer-events: none;
        }
        
        /* Títulos em Maiúsculo */
        .section-subtitle-caps { text-transform: uppercase; font-weight: 700; letter-spacing: 1px; opacity: 0.8; }
        .section-title-caps { font-family: 'Libre Baskerville', serif; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        .eco-card {
            background: white; /* FUNDO BRANCO */
            border: 2px solid var(--col-soft); /* BORDA AZUL CLARA */
            padding: 50px 40px; border-radius: 24px; color: var(--col-deep-navy); /* LETRAS AZUL ESCURO */
            height: 100%; transition: 0.3s; display: flex; flex-direction: column;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .eco-card:hover { transform: translateY(-5px); box-shadow: 0 20px 60px rgba(0,0,0,0.3); border-color: var(--col-mid-blue); }
        
        .eco-icon { font-size: 3rem; margin-bottom: 25px; color: var(--col-mid-blue); /* Ícone Azul Médio */ }
        .eco-title { font-family: 'Libre Baskerville', serif; font-size: 2rem; font-weight: 700; margin-bottom: 20px; color: var(--col-deep-navy); }
        .eco-desc { font-size: 1.05rem; line-height: 1.7; opacity: 0.9; margin-bottom: 30px; flex-grow: 1; color: var(--gray-text-sub); }
        
        .feature-list-eco { list-style: none; padding: 0; margin-bottom: 30px; }
        .feature-list-eco li { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 15px; font-size: 0.95rem; font-weight: 500; color: var(--gray-text-main); }
        .feature-list-eco svg { color: var(--col-ocean); margin-top: 4px; flex-shrink: 0; }
        
        /* Botões dentro dos cards brancos */
        .btn-eco-primary {
            background: var(--col-mid-blue); color: white; border: none; padding: 14px 30px; border-radius: 50px; font-weight: 700; width: 100%; text-align: center; transition: 0.3s;
        }
        .btn-eco-primary:hover { background: var(--col-primary); transform: scale(1.02); }
        
        .btn-eco-secondary {
            background: transparent; color: var(--col-mid-blue); border: 2px solid var(--col-mid-blue); padding: 14px 30px; border-radius: 50px; font-weight: 700; width: 100%; text-align: center; transition: 0.3s;
        }
        .btn-eco-secondary:hover { background: var(--col-mid-blue); color: white; transform: scale(1.02); }

        /* RECURSOS */
        .features-section { padding: 120px 20px; background-color: white; }
        .section-header { text-align: center; max-width: 800px; margin: 0 auto 70px auto; }
        .section-title-main { 
            font-family: 'Libre Baskerville', serif; font-size: 2.5rem; color: var(--col-deep-navy); font-weight: 700; margin-bottom: 15px; 
            text-transform: uppercase; letter-spacing: 1px;
        }
        .section-lead { font-size: 1.1rem; color: var(--gray-text-sub); }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; }
        .feature-card-modern {
            background: var(--gray-bg-main); padding: 40px 30px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); border: 1px solid var(--gray-border); transition: all 0.3s ease; text-align: left;
        }
        .feature-card-modern:hover { transform: translateY(-10px); box-shadow: 0 20px 50px rgba(1, 42, 74, 0.08); border-color: var(--col-mid-blue); background: white; }
        .icon-circle {
            width: 60px; height: 60px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin-bottom: 25px; transition: 0.3s;
            background: white; border: 1px solid var(--gray-border); color: var(--col-mid-blue);
        }
        .feature-card-modern:hover .icon-circle { background: var(--col-mid-blue); color: white; border-color: var(--col-mid-blue); }
        .fc-title { font-size: 1.3rem; font-weight: 700; color: var(--col-deep-navy); margin-bottom: 15px; font-family: 'Libre Baskerville', serif; }
        .fc-desc { color: var(--gray-text-sub); line-height: 1.6; font-size: 1rem; }

        /* SOBRE & EQUIPE */
        .about-section { background: var(--gray-bg-sec); padding: 100px 20px; text-align: center; }
        .quote-box {
            font-size: 1.4rem; line-height: 1.8; font-style: italic; font-family: 'Libre Baskerville', serif;
            max-width: 900px; margin: 0 auto 60px auto; opacity: 0.9; color: var(--col-dark-blue);
        }
        .team-grid { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
        .team-member { display: flex; flex-direction: column; align-items: center; }
        .team-avatar { 
            width: 100px; 
            height: 100px; 
            background: white; 
            border-radius: 50%; 
            border: 3px solid var(--gray-border); 
            margin-bottom: 15px; 
            box-shadow: 0 10px 20px rgba(0,0,0,0.05); 
            transition: all 0.3s ease;
            /* Adicione estas linhas abaixo: */
            background-size: cover;
            background-position: center;
            overflow: hidden;
        }
        .team-member:hover .team-avatar {
            transform: scale(1.1); border-color: var(--col-mid-blue); box-shadow: 0 15px 30px rgba(42, 111, 151, 0.2);
        }
        .team-name { font-weight: 700; font-size: 1.1rem; color: var(--col-deep-navy); }

        /* FOOTER */
        .main-footer { 
            background: var(--col-deep-navy); color: var(--col-light); 
            padding: 80px 0 0 0; font-size: 0.95rem; 
        }
        .footer-logo { height: 50px; opacity: 1; margin-bottom: 25px; display: block; }
        .footer-heading {
            color: white; font-weight: 700; margin-bottom: 25px; font-family: 'Libre Baskerville', serif; font-size: 1.1rem;
            border-left: 3px solid var(--col-mid-blue); padding-left: 15px;
        }
        .footer-links { list-style: none; padding: 0; }
        .footer-links li { margin-bottom: 12px; }
        .footer-links a { color: var(--col-pale); text-decoration: none; transition: 0.2s; display: block; opacity: 0.8; }
        .footer-links a:hover { color: white; padding-left: 5px; opacity: 1; }
        .footer-contact-item { display: flex; align-items: flex-start; gap: 15px; margin-bottom: 20px; color: var(--col-pale); }
        .footer-icon { color: var(--col-soft); font-size: 1.2rem; margin-top: 3px; }
        .social-box { display: flex; gap: 15px; margin-top: 25px; }
        .social-btn { 
            width: 45px; height: 45px; border-radius: 12px; background: rgba(255,255,255,0.05);
            display: flex; align-items: center; justify-content: center; color: white; 
            font-size: 1.3rem; transition: 0.3s; border: 1px solid rgba(255,255,255,0.1);
        }
        .social-btn:hover { background: var(--col-mid-blue); border-color: var(--col-mid-blue); transform: translateY(-3px); }
        .footer-bottom { 
            background: #001A33; padding: 25px 0; margin-top: 60px; text-align: center; 
            font-size: 0.85rem; color: var(--col-soft); border-top: 1px solid rgba(255,255,255,0.05); margin-bottom: 0;
        }

        @media(max-width: 992px) {
            .hero-title { font-size: 2.8rem; }
            .hero { text-align: center; padding-top: 130px; display: block; height: auto; padding-bottom: 80px; }
            .hero .row { display: flex; flex-direction: column; gap: 50px; }
            .nav-links { display: none; }
            .video-frame { transform: rotate(0); margin-top: 30px; }
            .main-footer { text-align: center; }
            .footer-col-title { border-left: none; border-bottom: 2px solid var(--col-mid-blue); display: inline-block; padding-left: 0; padding-bottom: 5px; }
            .footer-contact-item { justify-content: center; }
            .social-box { justify-content: center; }
            .footer-logo { margin: 0 auto 20px auto; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar-custom animate-up">
          <img src={logotipoSystem} alt="Confia+" className="navbar-logo" />
          <div className="nav-links d-none d-md-block">
              <span onClick={() => document.getElementById('ecossistema').scrollIntoView({behavior:'smooth'})}>O Sistema</span>
              <span onClick={() => document.getElementById('recursos').scrollIntoView({behavior:'smooth'})}>Recursos</span>
              <span onClick={() => document.getElementById('sobre').scrollIntoView({behavior:'smooth'})}>Equipe</span>
              <span onClick={() => navigate('/login')}>Entrar</span>
              <Button variant="outline-light" className="ms-4 rounded-pill px-4 fw-bold" onClick={() => navigate('/register')}>Criar Conta</Button>
          </div>
          <div className="d-md-none">
              <Button size="sm" variant="outline-light" onClick={() => navigate('/login')}>Entrar</Button>
          </div>
      </nav>

      {/* HERO SECTION */}
      <header className="hero">
          <Container>
              <Row className="align-items-center">
                  <Col lg={6} className="text-center text-lg-start animate-up">
                      <div className="hero-tag">Gestão Simples</div>
                      <h1 className="hero-title">
                          O controle que seu <br/>negócio <span style={{color: 'var(--col-light)'}}>precisa.</span>
                      </h1>
                      <p className="hero-subtitle mx-auto mx-lg-0">
                          O <strong>Confia+</strong> centraliza finanças, agenda e clientes em um único lugar. Conecte sua loja à cidade e veja seu lucro crescer de verdade.
                      </p>
                      <div className="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
                          <button className="btn-glow" onClick={() => navigate('/register')}>
                              Começar Gratuitamente <FaArrowRight />
                          </button>
                      </div>
                  </Col>
                  <Col lg={6} className="animate-up">
                      <div className="video-frame">
                          <div className="video-placeholder">
                              <FaPlay className="play-btn" size={24} />
                              <span className="fw-bold">Assistir Apresentação do Sistema</span>
                          </div>
                      </div>
                  </Col>
              </Row>
          </Container>
      </header>

      {/* SEÇÃO "PARA QUEM É" */}
      <section className="target-section">
          <Container>
              <h2 className="target-title">IDEAL PARA QUEM QUER CRESCER</h2>
              <div className="target-grid">
                  <div className="target-card tc-barber">
                      <div className="target-icon"><FaCut/></div>
                      <span className="target-label">Negócios</span>
                  </div>
                  <div className="target-card tc-tools">
                      <div className="target-icon"><FaTools/></div>
                      <span className="target-label">Prestadores</span>
                  </div>
                  <div className="target-card tc-star">
                      <div className="target-icon"><FaStar/></div>
                      <span className="target-label">Autônomos</span>
                  </div>
              </div>
          </Container>
      </section>

      {/* ECOSSISTEMA DUPLO (MODIFICADO: FUNDO ESCURO / CARDS BRANCOS) */}
      <section id="ecossistema" className="ecosystem-section">
          <Container>
              <div className="text-center mb-5">
                  <small className="section-subtitle-caps text-white-50">COMO FUNCIONA</small>
                  <h2 className="section-title-caps text-white mt-2">DUAS FRENTES, UMA SOLUÇÃO COMPLETA</h2>
              </div>
              <Row className="g-4">
                  {/* LADO DO EMPREENDEDOR */}
                  <Col lg={6}>
                      <div className="eco-card">
                          <div className="d-flex justify-content-center">
                              <FaUserTie className="eco-icon"/>
                          </div>
                          <h3 className="eco-title text-center">Para o Empreendedor</h3>
                          <p className="eco-desc text-center">
                              A ferramenta definitiva de gestão interna. Você organiza seu fluxo de caixa, estoque e agenda, além de criar um perfil profissional online.
                          </p>
                          <ul className="feature-list-eco">
                              <li><FaCheckCircle/> Gestão Financeira Completa.</li>
                              <li><FaCheckCircle/> Agenda sem conflitos.</li>
                              <li><FaCheckCircle/> Vitrine exclusiva para os seus clientes.</li>
                          </ul>
                          <button className="btn-eco-primary" onClick={() => navigate('/register')}>
                              Cadastrar Minha Empresa
                          </button>
                      </div>
                  </Col>
                  
                  {/* LADO DO CLIENTE */}
                  <Col lg={6}>
                      <div className="eco-card">
                          <div className="d-flex justify-content-center">
                              <FaSearchLocation className="eco-icon"/>
                          </div>
                          <h3 className="eco-title text-center">Para o Cliente</h3>
                          <p className="eco-desc text-center">
                              Uma plataforma de descoberta. Clientes antigos usam seu link direto, e novos clientes encontram sua loja buscando por serviços na região (Geolocalização).
                          </p>
                          <ul className="feature-list-eco">
                              <li><FaCheckCircle/> Acesso à vitrine de serviços e produtos.</li>
                              <li><FaCheckCircle/> Encontre serviços próximos.</li>
                              <li><FaCheckCircle/> Acompanhe pontos de fidelidade.</li>
                          </ul>
                          <button className="btn-eco-secondary" onClick={() => navigate('/register?type=client')}>
                              Criar Conta Cliente
                          </button>
                      </div>
                  </Col>
              </Row>
          </Container>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="features-section">
          <Container>
              <div className="section-header">
                  <h2 className="section-title-main">FERRAMENTAS PODEROSAS</h2>
                  <p className="section-lead">Tudo o que você precisa para sair do caderno e profissionalizar.</p>
              </div>

              <div className="feature-grid">
                  <div className="feature-card-modern fc-money">
                      <div className="icon-circle"><FaChartLine/></div>
                      <h4 className="fc-title">Fluxo de Caixa</h4>
                      <p className="fc-desc">Saiba o lucro exato do mês. Lance entradas e saídas de forma rápida e pare de misturar contas pessoais.</p>
                  </div>

                  <div className="feature-card-modern fc-agenda">
                      <div className="icon-circle"><FaCalendarAlt/></div>
                      <h4 className="fc-title">Agenda Inteligente</h4>
                      <p className="fc-desc">Organize horários e veja o histórico do cliente. Evite furos na agenda e aumente a produtividade.</p>
                  </div>

                  <div className="feature-card-modern fc-calc">
                      <div className="icon-circle"><FaCalculator/></div>
                      <h4 className="fc-title">Calculadora de Preço</h4>
                      <p className="fc-desc">Ferramenta exclusiva para calcular o preço ideal do seu serviço, cobrindo custos fixos e variáveis.</p>
                  </div>

                  <div className="feature-card-modern fc-mobile">
                      <div className="icon-circle"><FaMobileAlt/></div>
                      <h4 className="fc-title">Acesso Mobile</h4>
                      <p className="fc-desc">Seu negócio na palma da mão. Acesse o sistema de qualquer lugar, pelo celular, tablet ou PC.</p>
                  </div>

                  <div className="feature-card-modern fc-users">
                      <div className="icon-circle"><FaUsers/></div>
                      <h4 className="fc-title">Fidelidade</h4>
                      <p className="fc-desc">Sistema de pontos automático para fazer seus clientes voltarem e consumirem mais.</p>
                  </div>

                  <div className="feature-card-modern fc-security">
                      <div className="icon-circle"><FaLock/></div>
                      <h4 className="fc-title">Segurança Total</h4>
                      <p className="fc-desc">Backup automático na nuvem. Se você perder o celular, os dados da sua empresa continuam salvos.</p>
                  </div>
              </div>
          </Container>
      </section>

      {/* SOBRE & EQUIPE */}
      <section id="sobre" className="about-section">
          <Container>
              <img src={logotipoSystem} alt="Confia+" style={{height: '60px', marginBottom: '40px'}} />
              
              <div className="quote-box">
                  "O Confia+ é um sistema de gerenciamento feito para o microempreendedor que enxerga a necessidade de visualizar, analisar e gerenciar o seu negócio de forma automatizada e prática."
              </div>

              <div className="text-uppercase fw-bold mb-5 opacity-75 ls-1 text-muted" style={{letterSpacing:'2px'}}>Iniciativa IFRN - Canguaretama</div>

                <div className="team-grid">
                    <div className="team-member">
                        <div className="team-avatar" style={{ backgroundImage: `url(${imgTiago})` }}></div>
                        <div className="team-name">Tiago Barroso</div>
                    </div>
                    <div className="team-member">
                        <div className="team-avatar" style={{ backgroundImage: `url(${imgEmily})` }}></div>
                        <div className="team-name">Emily Amorim</div>
                    </div>
                    <div className="team-member">
                        <div className="team-avatar" style={{ backgroundImage: `url(${imgIasmin})` }}></div>
                        <div className="team-name">Iasmin Dias</div>
                    </div>
                    <div className="team-member">
                        <div className="team-avatar" style={{ backgroundImage: `url(${imgGiseliane})` }}></div>
                        <div className="team-name">Giseliane da Silva</div>
                    </div>
                </div>
          </Container>
      </section>

      {/* FOOTER */}
      <footer className="main-footer">
          <Container>
              <Row>
                  <Col lg={4} xs={12} className="mb-5 mb-lg-0 text-center text-lg-start">
                      <img src={logotipoSystem} alt="Confia+" className="footer-logo" />
                      <p style={{opacity: 0.7, lineHeight: 1.6, maxWidth: '350px', margin: '0 auto 0 0'}} className="mx-auto mx-lg-0">
                          A plataforma que conecta microempreendedores a clientes e facilita a gestão do seu negócio.
                      </p>
                      <div className="social-box">
                          <a href="#" className="social-btn"><FaInstagram/></a>
                          <a href="#" className="social-btn"><FaWhatsapp/></a>
                          <a href="#" className="social-btn"><FaEnvelope/></a>
                      </div>
                  </Col>
                  
                  <Col lg={2} md={4} xs={12} className="text-center text-lg-start mb-4 mb-md-0">
                      <h5 className="footer-heading">Navegação</h5>
                      <ul className="footer-links">
                          <li><a href="#ecossistema">Como Funciona</a></li>
                          <li><a href="#recursos">Funcionalidades</a></li>
                          <li><a href="#sobre">Equipe</a></li>
                          <li><a href="/login">Área do Cliente</a></li>
                      </ul>
                  </Col>
                  
                  <Col lg={3} md={4} xs={12} className="text-center text-lg-start">
                      <h5 className="footer-heading">Contato</h5>
                      <div className="footer-contact-item">
                          <FaWhatsapp className="footer-icon"/>
                          <div>
                              <strong>WhatsApp Suporte</strong><br/>
                              (84) *****-****
                          </div>
                      </div>
                      <div className="footer-contact-item">
                          <FaEnvelope className="footer-icon"/>
                          <div>
                              <strong>Email Oficial</strong><br/>
                              contato.confiamais@gmail.com
                          </div>
                      </div>
                      <div className="footer-contact-item">
                          <FaMapMarkerAlt className="footer-icon"/>
                          <div>
                              <strong>Sede</strong><br/>
                              Canguaretama, RN
                          </div>
                      </div>
                  </Col>
              </Row>
          </Container>
          
          <div className="footer-bottom">
              <Container>
                  &copy; 2026 Confia+ Sistema de Gerenciamento. Desenvolvido com apoio IFRN.
              </Container>
          </div>
      </footer>
    </div>
  );
}