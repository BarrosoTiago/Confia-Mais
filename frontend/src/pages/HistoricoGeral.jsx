import { useState, useEffect } from 'react';
import api from '../services/api';
import { Container, Badge, Button, Spinner, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { 
  FaArrowLeft, FaCalendarAlt, FaStore, FaCheckCircle, 
  FaClock, FaStar, FaRegStar, FaHistory 
} from 'react-icons/fa';

export default function HistoricoGeral() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- ESTADOS MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const response = await api.get('/agendamentos/');
      // Ordena por data (mais recente primeiro)
      const ordenados = response.data.sort((a, b) => new Date(b.data_hora_inicio) - new Date(a.data_hora_inicio));
      setAgendamentos(ordenados);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Formata Data Legível
  const formatDate = (dateString) => {
      const d = new Date(dateString);
      return d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric'}) + ' às ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  };

  // Abre Modal
  const handleOpenAvaliar = (agenda) => {
    setSelectedAgendamento(agenda);
    setNota(5);
    setComentario('');
    setShowModal(true);
  };

  // Envia Avaliação
  const handleEnviarAvaliacao = async () => {
    if (!selectedAgendamento) return;
    setModalLoading(true);
    try {
        await api.post(`/agendamentos/${selectedAgendamento.id}/avaliar/`, { nota, comentario });
        alert("Avaliação enviada com sucesso! ⭐"); 
        setShowModal(false);
        loadAll(); 
    } catch (error) {
        const msg = error.response?.data?.erro || "Erro ao enviar avaliação.";
        alert(msg);
    } finally {
        setModalLoading(false);
    }
  };


  // Função para Cancelar Agendamento
  const handleCancelarAgendamento = async (id) => {
    if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    
    try {
        // Opção A: Deletar do banco
        // await api.delete(`/agendamentos/${id}/`);
        
        // Opção B: Apenas mudar status (Recomendado para manter histórico)
        await api.patch(`/agendamentos/${id}/`, { status: 'CANCELADO' });
        
        alert("Agendamento cancelado com sucesso.");
        loadAll(); // Recarrega a lista
    } catch (error) {
        console.error(error);
        alert("Não foi possível cancelar o agendamento.");
    }
  };

  // Renderiza Estrelas
  const renderStars = (currentRating, interactive = false) => {
      return [...Array(5)].map((_, index) => {
          const ratingValue = index + 1;
          return (
              <span 
                key={index} 
                style={{ 
                    cursor: interactive ? 'pointer' : 'default', 
                    color: ratingValue <= currentRating ? '#FFC107' : '#E0E0E0',
                    fontSize: interactive ? '2rem' : '1.1rem',
                    marginRight: '3px',
                    transition: '0.2s'
                }}
                onClick={() => interactive && setNota(ratingValue)}
              >
                  {ratingValue <= currentRating ? <FaStar /> : <FaRegStar />}
              </span>
          );
      });
  };

  if (loading) {
    return (
      <>
        <AnimatedBackground />
        <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'transparent'}}>
          <Spinner animation="border" style={{color: 'white'}} />
        </div>
      </>
    );
  }

  return (
    <>
        <AnimatedBackground />
        <div className="history-wrapper">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            .history-wrapper {
            min-height: 100vh; background-color: transparent; font-family: 'Inter', sans-serif;
            padding: 40px 20px; overflow-x: hidden;
            }
            .container-limit { max-width: 900px; margin: 0 auto; }

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
            .title-group span { font-size: 0.9rem; color: #ececec; }

            /* LISTA DE CARDS */
            .history-card {
                background: white; border-radius: 16px; padding: 20px; margin-bottom: 15px;
                box-shadow: 0 4px 15px rgba(0,43,85,0.05); border-left: 5px solid transparent;
                transition: 0.2s; display: flex; flex-wrap: wrap; align-items: center; gap: 15px;
            }
            .history-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,43,85,0.1); }
            
            /* Cores da Borda Lateral baseadas no status */
            .card-concluido { border-left-color: #2DCE89; }
            .card-pendente { border-left-color: #FB6340; }
            .card-cancelado { border-left-color: #F5365C; opacity: 0.8; }

            /* Colunas do Card */
            .col-date { flex: 1; min-width: 140px; }
            .date-badge { 
                background: #F8F9FA; color: #555; font-weight: 600; font-size: 0.85rem; 
                padding: 8px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px;
            }

            .col-info { flex: 2; min-width: 200px; }
            .store-name { font-weight: 700; color: #002B55; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
            .services-list { font-size: 0.9rem; color: #666; }

            .col-status { flex: 1; text-align: center; min-width: 100px; }
            .status-pill { 
                padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; 
                text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;
            }
            .st-ok { background: #E8F5E9; color: #2DCE89; }
            .st-wait { background: #FFF3E0; color: #EF6C00; }
            .st-bad { background: #FFEBEE; color: #F5365C; }

            .col-action { flex: 1; text-align: end; min-width: 120px; }
            .btn-rate {
                background: #FFC107; color: #fff; border: none; padding: 8px 20px; border-radius: 20px;
                font-weight: 700; font-size: 0.85rem; box-shadow: 0 4px 10px rgba(255, 193, 7, 0.3);
                text-shadow: 0 1px 1px rgba(0,0,0,0.1); transition: 0.2s;
            }
            .btn-rate:hover { background: #FFB300; transform: scale(1.05); color: white; }

            /* MODAL */
            .modal-clean-header { background: #002B55; color: white; border: none; padding: 25px; }
            .modal-clean-header .btn-close { filter: invert(1); opacity: 1; }
            .custom-textarea { 
                border: 2px solid #E9ECEF; border-radius: 12px; padding: 15px; 
                background: #F8F9FA; color: #002B55; font-weight: 500;
            }
            .custom-textarea:focus { border-color: #002B55; background: white; outline: none; }
        `}</style>

        <div className="container-limit">
            
            {/* HEADER */}
            <div className="page-header">
                <div className="header-left">
                    <button className="btn-back-circle" onClick={() => navigate('/vitrine')}>
                        <FaArrowLeft />
                    </button>
                    <div className="title-group">
                        <h1><FaHistory className="me-2"/> Histórico</h1>
                        <span>Seus agendamentos e avaliações</span>
                    </div>
                </div>
            </div>

            {/* LISTA DE AGENDAMENTOS */}
            {agendamentos.length === 0 ? (
                <div className="text-center py-5" style={{background:'white', borderRadius:'20px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)'}}>
                    <FaCalendarAlt size={40} className="text-muted mb-3 opacity-25"/>
                    <h5 className="text-muted">Nenhum agendamento encontrado.</h5>
                    <Button variant="link" onClick={() => navigate('/vitrine')}>Ir para Vitrine</Button>
                </div>
            ) : agendamentos.map(agenda => {
                // Nome da loja (fallback)
                const nomeLoja = agenda.servicos_detalhes?.[0]?.criado_por_nome || "Loja Parceira";
                
                // Classes dinâmicas
                let statusClass = 'st-wait';
                let borderClass = 'card-pendente';
                
                if(agenda.status === 'CONCLUIDO') { statusClass = 'st-ok'; borderClass = 'card-concluido'; }
                if(agenda.status === 'CANCELADO') { statusClass = 'st-bad'; borderClass = 'card-cancelado'; }

                return (
                    <div key={agenda.id} className={`history-card ${borderClass}`}>
                        
                        {/* 1. Data */}
                        <div className="col-date">
                            <div className="date-badge">
                                <FaCalendarAlt /> 
                                {formatDate(agenda.data_hora_inicio)}
                            </div>
                        </div>

                        {/* 2. Informações */}
                        <div className="col-info">
                            <div className="store-name"><FaStore size={14}/> {nomeLoja}</div>
                            <div className="services-list">
                                {agenda.servicos_detalhes.map(s => s.nome).join(', ')}
                            </div>
                            {/* Alerta de Dívida / Fiado */}
                            {agenda.status === 'CONCLUIDO' && agenda.financeiro && agenda.financeiro.restante > 0 && (
                                <div style={{marginTop: 5}}>
                                    <Badge bg="danger" style={{fontSize: '0.8rem', padding: '5px 8px'}}>
                                        ⚠️ Pagamento Pendente: R$ {agenda.financeiro.restante.toFixed(2).replace('.', ',')}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* 3. Status */}
                        <div className="col-status">
                            <span className={`status-pill ${statusClass}`}>{agenda.status}</span>
                        </div>

                        {/* 4. Ações */}
                            <div className="col-action">
                                {/* Botão de Avaliar (Já existe) */}
                                {agenda.status === 'CONCLUIDO' && !agenda.avaliacao && (
                                    <button className="btn-rate" onClick={() => handleOpenAvaliar(agenda)}>
                                        <FaStar /> Avaliar
                                    </button>
                                )}

                                {/* NOVO: Botão de Cancelar (Apenas se pendente ou confirmado) */}
                                {(agenda.status === 'PENDENTE' || agenda.status === 'CONFIRMADO') && (
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm" 
                                        style={{ borderRadius: '20px', fontWeight: 'bold' }}
                                        onClick={() => handleCancelarAgendamento(agenda.id)}
                                    >
                                        Cancelar
                                    </Button>
                                )}
                                
                                {/* ... restante da lógica ... */}
                            </div>
                    </div>
                );
            })}

            {/* MODAL DE AVALIAÇÃO */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="modal-clean-header">
                    <Modal.Title style={{fontFamily: 'Libre Baskerville'}}>Avaliar Experiência</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-4">
                    <h5 className="text-muted mb-4 fw-bold">Como foi o serviço?</h5>
                    
                    <div className="mb-4">
                        {renderStars(nota, true)}
                    </div>

                    <Form.Group className="text-start">
                        <Form.Label className="small fw-bold text-muted text-uppercase">Comentário (Opcional)</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            className="custom-textarea"
                            placeholder="Conte como foi o atendimento..."
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{border: 'none', paddingTop: 0, paddingBottom:'25px'}}>
                    <Button variant="light" onClick={() => setShowModal(false)} style={{borderRadius:'20px'}}>Cancelar</Button>
                    <Button onClick={handleEnviarAvaliacao} disabled={modalLoading} 
                            style={{background:'#002B55', border:'none', borderRadius:'20px', padding:'8px 25px', fontWeight:'bold'}}>
                        {modalLoading ? <Spinner size="sm" animation="border"/> : 'Enviar'}
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
        </div>
    </>
  );
}