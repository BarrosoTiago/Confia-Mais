import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Spinner, Badge } from 'react-bootstrap';
import api from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaMapMarkerAlt, FaStar, FaClock, FaCheckCircle, 
  FaChevronLeft, FaChevronRight, FaStore, FaCalendarDay, FaSun, FaMoon 
} from 'react-icons/fa';

export default function ClienteDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const lojaRecebida = location.state?.loja;

  const [loja, setLoja] = useState(lojaRecebida || null);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mesAtual, setMesAtual] = useState(new Date());
  const [horaSelecionada, setHoraSelecionada] = useState('');
  const [agendando, setAgendando] = useState(false);

  // Lista de Horários
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);


  useEffect(() => {
    if (!lojaRecebida || !lojaRecebida.id) {
      navigate('/vitrine'); 
      return;
    }
    loadServicos();
  }, [lojaRecebida]);

    async function carregarHorariosDinâmicos() {

        console.log("Buscando horários para:", servicoSelecionado?.id, "na data:", dataSelecionada);
        if (!servicoSelecionado || !dataSelecionada) return;

        try {
        const ano = dataSelecionada.getFullYear();
        const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
        const dia = String(dataSelecionada.getDate()).padStart(2, '0');
        const dataFormatada = `${ano}-${mes}-${dia}`;

        const response = await api.get('/horarios/disponiveis/', {
            params: {
            servico_id: servicoSelecionado.id,
            data: dataFormatada
            }
        });
        setHorariosDisponiveis(response.data);
        } catch (error) {
        console.error("Erro ao carregar horários:", error);
        setHorariosDisponiveis([]);
        }
    }

    // Monitora quando o usuário muda o dia ou o serviço no Modal
    useEffect(() => {
        if (showModal) carregarHorariosDinâmicos();
    }, [dataSelecionada, servicoSelecionado, showModal]);


  async function loadServicos() {
    try {
      const response = await api.get('/servicos/');
      const todos = response.data || [];

      const filtrados = todos.filter(s => {
          const idDono = s.criado_por || s.empreendedor || s.user;
          const idFinal = (typeof idDono === 'object' && idDono !== null) ? idDono.id : idDono;
          return String(idFinal) === String(lojaRecebida.id);
      });
      
      setServicos(filtrados);
    } catch (error) {
      setServicos([]); 
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DE CALENDÁRIO ---
  const getDiasNoMes = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getDiaSemanaInicio = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const mudarMes = (offset) => setMesAtual(new Date(mesAtual.setMonth(mesAtual.getMonth() + offset)));
  
  const isSameDay = (d1, d2) => {
      return d1.getDate() === d2.getDate() && 
             d1.getMonth() === d2.getMonth() && 
             d1.getFullYear() === d2.getFullYear();
  };

  const handleOpenModal = (servico) => {
      setServicoSelecionado(servico);
      setDataSelecionada(new Date()); 
      setHoraSelecionada('');
      setShowModal(true);
  };

const handleConfirmarAgendamento = async () => {
      if(!horaSelecionada) return;
      setAgendando(true);
      const ano = dataSelecionada.getFullYear();
      const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
      const dia = String(dataSelecionada.getDate()).padStart(2, '0');
      const dataHoraFinal = `${ano}-${mes}-${dia}T${horaSelecionada}:00`;

      try {
          await api.post('/agendamentos/', {
              empreendedor: lojaRecebida.id, 
              servicos: [servicoSelecionado.id],
              data_hora_inicio: dataHoraFinal
          });
          alert("✅ Agendamento realizado com sucesso!");
          setShowModal(false);
          navigate('/meus-agendamentos');
      } catch (error) {
          // --- LÓGICA PARA EXIBIR ERRO DETALHADO ---
          let mensagemErro = "Erro ao agendar. Tente novamente.";

          if (error.response && error.response.data) {
              const data = error.response.data;

              // Se o backend enviou um erro de 'detail' (padrão SimpleJWT/DRF)
              if (data.detail) {
                  mensagemErro = data.detail;
              } 
              // Se o backend enviou erros de validação de campos específicos
              else if (typeof data === 'object') {
                  const mensagens = Object.values(data).flat();
                  mensagemErro = mensagens.join('\n');
              }
          }

          alert(`❌ Falha no Agendamento:\n${mensagemErro}`);
      } finally {
          setAgendando(false);
      }
  };

  

  const diasVazios = Array.from({ length: getDiaSemanaInicio(mesAtual) }, (_, i) => i);
  const diasDoMes = Array.from({ length: getDiasNoMes(mesAtual) }, (_, i) => i + 1);

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#A8DADC'}}><Spinner animation="border" style={{color:'#002B55'}}/></div>;

  return (
    <div className="client-dashboard-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .client-dashboard-wrapper { min-height: 100vh; background-color: #A8DADC; font-family: 'Inter', sans-serif; padding-bottom: 50px; }
        .container-limit { max-width: 1000px; margin: 0 auto; }
        
        /* HERO LOJA */
        .shop-hero { background: white; border-radius: 0 0 30px 30px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,43,85,0.1); margin-bottom: 30px; position: relative; }
        .shop-cover { height: 180px; background: linear-gradient(135deg, #002B55 0%, #00509E 100%); position: relative; }
        .btn-back-float { position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; cursor: pointer; z-index: 10; }
        .btn-back-float:hover { background: white; color: #002B55; }
        .shop-info-card { text-align: center; padding: 0 20px 30px 20px; margin-top: -60px; position: relative; }
        .shop-avatar { width: 120px; height: 120px; background: white; border-radius: 50%; border: 4px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #002B55; margin: 0 auto 15px auto; }
        .shop-name { font-family: 'Libre Baskerville'; font-weight: 700; font-size: 1.8rem; color: #002B55; margin-bottom: 5px; }
        .shop-meta { display: flex; justify-content: center; gap: 15px; color: #666; font-size: 0.9rem; margin-bottom: 15px; }
        .badge-rating { background: #FFF8E1; color: #F9A825; border: 1px solid #FFE082; padding: 5px 10px; border-radius: 20px; font-weight: 700; display: flex; align-items: center; gap: 5px; }
        
        /* SERVIÇOS */
        .section-title { font-family: 'Libre Baskerville'; color: #002B55; font-size: 1.4rem; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .service-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,43,85,0.03); border: 1px solid transparent; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; }
        .service-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,43,85,0.08); border-color: #A8DADC; }
        .svc-info h5 { font-weight: 700; color: #333; margin: 0 0 5px 0; font-size: 1.1rem; }
        .svc-meta { display: flex; gap: 15px; font-size: 0.9rem; color: #666; }
        .svc-price { color: #2DCE89; font-weight: 700; font-size: 1.1rem; }
        .btn-book { background: #002B55; color: white; border: none; padding: 10px 25px; border-radius: 30px; font-weight: 600; transition: 0.2s; box-shadow: 0 4px 10px rgba(0,43,85,0.2); }
        .btn-book:hover { background: #004080; transform: scale(1.05); }
        
        /* MODAL E CALENDÁRIO OTIMIZADO */
        .modal-clean-header { background: #002B55; color: white; border: none; padding: 20px 30px; border-radius: 0; }
        .modal-clean-header .btn-close { filter: invert(1); opacity: 1; }
        
        /* Removida a borda do wrapper para evitar 'caixa dentro de caixa' */
        .calendar-wrapper { padding: 10px; height: 100%; }
        
        .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-weight: 700; color: #002B55; }
        .cal-nav { cursor: pointer; padding: 5px; color: #002B55; font-size: 1.1rem; }
        
        .calendar-grid { 
            display: grid; 
            grid-template-columns: repeat(7, 1fr); 
            gap: 8px; 
            text-align: center;
        }
        
        .week-day { 
            font-size: 0.8rem; font-weight: 700; color: #888; 
            margin-bottom: 10px; text-transform: uppercase;
        }
        
        .day-cell { 
            height: 42px; display: flex; align-items: center; justify-content: center; 
            border-radius: 12px; font-size: 1rem; cursor: pointer; 
            transition: 0.2s; position: relative; font-weight: 600;
        }
        .day-cell:hover { background: #E3F2FD; }
        .day-cell.today { color: #002B55; font-weight: 900; border: 2px solid #002B55; background: transparent; }
        .day-cell.selected { background: #002B55 !important; color: white !important; box-shadow: 0 4px 10px rgba(0,43,85,0.3); border: none; }

        /* HORÁRIOS */
        .time-section { margin-top: 10px; }
        .period-label { font-size: 0.8rem; font-weight: 800; color: #8898AA; margin: 15px 0 10px 0; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #F1F3F5; padding-bottom: 5px; }
        
        .chips-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        
        .time-chip {
            background: #fff; border: 1px solid #E9ECEF; padding: 10px 5px; border-radius: 12px;
            font-size: 0.9rem; font-weight: 600; color: #495057; cursor: pointer; transition: 0.2s; text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        }
        .time-chip:hover { border-color: #002B55; color: #002B55; background: #E3F2FD; }
        .time-chip.selected { background: #002B55; color: white; border-color: #002B55; box-shadow: 0 4px 12px rgba(0,43,85,0.2); transform: scale(1.05); z-index: 2; }

        @media(max-width: 992px) { 
            .chips-grid { grid-template-columns: repeat(3, 1fr); }
            .col-left { border-right: none !important; border-bottom: 1px solid #E9ECEF; }
        }
      `}</style>

      {/* 1. HERO PERFIL DA LOJA */}
      <div className="shop-hero">
          <button className="btn-back-float" onClick={() => navigate('/vitrine')}>
              <FaArrowLeft />
          </button>
          <div className="shop-cover" style={loja?.capa ? {background: `url(${loja.capa}) center/cover`} : {}}></div>
          <div className="container-limit">
              <div className="shop-info-card">
                  <div className="shop-avatar">
                      {loja?.foto ? <img src={loja.foto} alt="Loja" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} /> : <FaStore />}
                  </div>
                  <h1 className="shop-name">{loja?.nome_completo || loja?.username}</h1>
                  <div className="shop-meta">
                      <span><FaMapMarkerAlt /> {loja?.bairro || 'Centro'}</span>
                      <div className="badge-rating"><FaStar size={12}/> {loja?.nota_media || '5.0'}</div>
                  </div>
                  <p className="text-muted small" style={{maxWidth: '600px', margin: '0 auto'}}>
                      {loja?.descricao || "Bem-vindo! Escolha um serviço abaixo e agende seu horário conosco."}
                  </p>
              </div>
          </div>
      </div>

      <div className="container-limit px-3">
          <div className="section-title">
              <FaCheckCircle className="text-success" /> Serviços Disponíveis
          </div>

          {servicos.length === 0 ? (
              <div className="text-center py-5 text-muted bg-white rounded-3 shadow-sm">
                  <FaStore size={30} className="mb-3 opacity-50"/>
                  <p>Nenhum serviço disponível nesta loja no momento.</p>
              </div>
          ) : servicos.map(servico => (
              <div key={servico.id} className="service-card">
                  <div className="svc-info">
                      <h5>{servico.nome}</h5>
                      <div className="svc-meta">
                          <span><FaClock className="me-1"/> {servico.duracao_minutos} min</span>
                          <span className="svc-price">R$ {parseFloat(servico.preco).toFixed(2)}</span>
                      </div>
                  </div>
                  <button className="btn-book" onClick={() => handleOpenModal(servico)}>
                      Agendar
                  </button>
              </div>
          ))}

          {/* 3. MODAL DE AGENDAMENTO (XL) */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl">
              <Modal.Header closeButton className="modal-clean-header">
                  <Modal.Title style={{fontFamily: 'Libre Baskerville'}}>
                      Agendar: {servicoSelecionado?.nome}
                  </Modal.Title>
              </Modal.Header>
              
              <Modal.Body className="p-0">
                  <Row className="g-0" style={{minHeight: '400px'}}> {/* Altura mínima para não colapsar */}
                      
                      {/* ESQUERDA: CALENDÁRIO */}
                      <Col md={12} lg={6} className="p-4 border-end col-left d-flex flex-column justify-content-center">
                          <h6 className="text-muted fw-bold mb-4 small text-uppercase text-center">
                              <FaCalendarDay className="me-2"/> Escolha o Dia
                          </h6>
                          
                          <div className="calendar-wrapper">
                              <div className="cal-header px-3">
                                  <span className="cal-nav" onClick={() => mudarMes(-1)}><FaChevronLeft /></span>
                                  <span>{mesAtual.toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}</span>
                                  <span className="cal-nav" onClick={() => mudarMes(1)}><FaChevronRight /></span>
                              </div>
                              
                              <div className="calendar-grid">
                                  <div className="week-day">D</div>
                                  <div className="week-day">S</div>
                                  <div className="week-day">T</div>
                                  <div className="week-day">Q</div>
                                  <div className="week-day">Q</div>
                                  <div className="week-day">S</div>
                                  <div className="week-day">S</div>

                                  {diasVazios.map(v => <div key={`empty-${v}`}></div>)}
                                  {diasDoMes.map(dia => {
                                      const dateClone = new Date(mesAtual); dateClone.setDate(dia);
                                      const isSelected = isSameDay(dateClone, dataSelecionada);
                                      const isToday = isSameDay(dateClone, new Date());
                                      return ( 
                                          <div 
                                              key={dia} 
                                              className={`day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                              onClick={() => { setDataSelecionada(dateClone); setHoraSelecionada(''); }}
                                          >
                                              {dia}
                                          </div>
                                      )
                                  })}
                              </div>
                          </div>
                      </Col>

                      {/* DIREITA: HORÁRIOS */}
                      <Col md={12} lg={6} className="p-4 bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="text-muted fw-bold small text-uppercase m-0">
                                  <FaClock className="me-2"/> Horários
                              </h6>
                              <div className="text-primary fw-bold small bg-white px-3 py-1 rounded shadow-sm">
                                  {dataSelecionada.toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric'})}
                              </div>
                          </div>
                          
                            <div className="time-section">
                                {horariosDisponiveis.length > 0 ? (
                                    <>
                                        <div className="period-label"><FaClock /> Horários Disponíveis</div>
                                        <div className="chips-grid">
                                            {horariosDisponiveis.map(hora => (
                                                <div 
                                                    key={hora} 
                                                    className={`time-chip ${horaSelecionada === hora ? 'selected' : ''}`}
                                                    onClick={() => setHoraSelecionada(hora)}
                                                >
                                                    {hora}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4 text-muted">
                                        <p>Nenhum horário disponível para este dia.</p>
                                    </div>
                                )}
                            </div>
                      </Col>
                  </Row>
              </Modal.Body>
              
              {/* RODAPÉ DO MODAL (FOOTER FIXO) */}
              <Modal.Footer style={{borderTop:'1px solid #E9ECEF', background:'#F8F9FA'}}>
                  <Button variant="link" className="text-muted text-decoration-none fw-bold me-auto" onClick={() => setShowModal(false)}>
                      Cancelar
                  </Button>
                  <Button 
                      className="px-5 py-2 rounded-pill fw-bold shadow-sm" 
                      style={{background: '#002B55', border: 'none'}}
                      disabled={!horaSelecionada || agendando}
                      onClick={handleConfirmarAgendamento}
                  >
                      {agendando ? <Spinner size="sm"/> : "Confirmar Agendamento"}
                  </Button>
              </Modal.Footer>
          </Modal>
      </div>
    </div>
  );
}