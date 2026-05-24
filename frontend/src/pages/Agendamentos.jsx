import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge, Spinner, InputGroup } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaPlus, FaWhatsapp, FaEdit, FaTrash, 
  FaUserCircle, FaClock, FaFilter, FaSearch, FaCheck, FaTimes, 
  FaChevronLeft, FaChevronRight, FaMapMarkerAlt
} from 'react-icons/fa';

export default function Agendamentos() {
  const navigate = useNavigate();
  
  // --- ESTADOS DE DADOS ---
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FILTROS ---
  const [filtro, setFiltro] = useState('todos'); 
  const [busca, setBusca] = useState('');

  // --- ESTADOS DO MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mesAtual, setMesAtual] = useState(new Date());
  const [horaSelecionada, setHoraSelecionada] = useState('');
  const [statusAgendamento, setStatusAgendamento] = useState('PENDENTE');

  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [respAgenda, respServicos, respClientes] = await Promise.all([
        api.get('/api/agendamentos/'),
        api.get('/api/servicos/'),
        api.get('/api/auth/clientes/')
      ]);
      
      const listaOrdenada = respAgenda.data.sort((a, b) => 
        new Date(b.data_hora_inicio) - new Date(a.data_hora_inicio)
      );

      setAgendamentos(listaOrdenada);
      setServicos(respServicos.data);
      setClientes(respClientes.data);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  }

async function carregarHorariosDinâmicos() {
    // Se não houver serviço ou data, limpa a lista e para a execução
    if (!servicosSelecionados.length || !dataSelecionada) {
      setHorariosDisponiveis([]);
      return;
    }

    try {
      const servicoId = servicosSelecionados[0];
      
      // FORMA CORRETA DE PEGAR A DATA LOCAL (YYYY-MM-DD)
      const ano = dataSelecionada.getFullYear();
      const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
      const dia = String(dataSelecionada.getDate()).padStart(2, '0');
      const dataFormatada = `${ano}-${mes}-${dia}`;

      const response = await api.get(`/api/agendamentos/horarios-disponiveis/`, {
        params: {
          servico_id: servicoId,
          data: dataFormatada
        }
      });
      
      // Atualiza o estado com o que veio do banco (Backend)
      setHorariosDisponiveis(response.data);
    } catch (error) {
      console.error("Erro ao buscar horários dinâmicos", error);
      setHorariosDisponiveis([]);
    }
  }

    useEffect(() => {
        carregarHorariosDinâmicos();
    }, [dataSelecionada, JSON.stringify(servicosSelecionados)]); 
    // O JSON.stringify garante que o React perceba mudanças dentro do Array de serviços

  const handleWhatsApp = (agenda) => {
    if (!agenda.cliente_telefone) return alert("Cliente sem telefone cadastrado.");
    const tel = agenda.cliente_telefone.replace(/\D/g, '');
    const nome = agenda.cliente_nome || "Cliente";
    const servico = agenda.servicos_detalhes?.[0]?.nome || "serviço";
    const d = new Date(agenda.data_hora_inicio);
    const data = d.toLocaleDateString('pt-BR');
    const hora = d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});

    let msg = agenda.status === 'PENDENTE' 
        ? `Olá *${nome}*! 👋\nAqui é do *Confia+*. Recebemos seu agendamento de *${servico}* para o dia *${data}* às *${hora}*.\nPodemos confirmar o horário?`
        : `Olá *${nome}*! 👋\nPassando para lembrar do seu horário de *${servico}* agendado para *${data}* às *${hora}*.\nEstamos te aguardando! 😉`;

    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDelete = async (id) => {
      if(window.confirm("Tem certeza que deseja excluir este agendamento?")) {
          try { await api.delete(`/api/agendamentos/${id}/`); loadData(); } catch (error) { alert("Erro ao excluir."); }
      }
  };

  const handleStatusChange = async (id, novoStatus) => {
      if(!window.confirm(`Mudar status para ${novoStatus}?`)) return;
      try { await api.patch(`/api/agendamentos/${id}/`, { status: novoStatus }); loadData(); } catch (error) { alert("Erro ao atualizar status."); }
  };

  const handleShowAdd = () => {
    setEditingId(null); setClienteSelecionado(''); setServicosSelecionados([]); setDataSelecionada(new Date()); setHoraSelecionada(''); setStatusAgendamento('PENDENTE'); setShowModal(true);
  };

  const handleShowEdit = (item) => {
    setEditingId(item.id); setClienteSelecionado(item.cliente); setServicosSelecionados(item.servicos);
    const d = new Date(item.data_hora_inicio); setDataSelecionada(d); setMesAtual(d);
    setHoraSelecionada(d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}));
    setStatusAgendamento(item.status); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!clienteSelecionado || servicosSelecionados.length === 0 || !dataSelecionada || !horaSelecionada) { return alert("Preencha todos os campos obrigatórios."); }
    const ano = dataSelecionada.getFullYear();
    const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
    const dia = String(dataSelecionada.getDate()).padStart(2, '0');
    const dataHoraFinal = `${ano}-${mes}-${dia}T${horaSelecionada}:00`;
    const payload = { cliente: clienteSelecionado, servicos: servicosSelecionados, data_hora_inicio: dataHoraFinal, status: statusAgendamento };

    try {
        if (editingId) await api.patch(`/agendamentos/${editingId}/`, payload);
        else await api.post('/api/agendamentos/', payload);
        setShowModal(false); loadData();
    } catch (error) { alert("Erro ao salvar."); }
  };

  const getDiasNoMes = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getDiaSemanaInicio = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const mudarMes = (offset) => setMesAtual(new Date(mesAtual.setMonth(mesAtual.getMonth() + offset)));
  const isSameDay = (d1, d2) => d1.getDate()===d2.getDate() && d1.getMonth()===d2.getMonth() && d1.getFullYear()===d2.getFullYear();

  const verificarOcupado = (horario) => {
      const diaStr = dataSelecionada.toDateString();
      return agendamentos.some(ag => {
          if (ag.status === 'CANCELADO' || (editingId && ag.id === editingId)) return false;
          const dAg = new Date(ag.data_hora_inicio);
          const horaAg = dAg.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
          return dAg.toDateString() === diaStr && horaAg === horario;
      });
  };

  const toggleServico = (id) => { setServicosSelecionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]); };

  const agendamentosFiltrados = agendamentos.filter(a => {
      const termo = busca.toLowerCase();
      const matchTexto = a.cliente_nome?.toLowerCase().includes(termo) || a.servicos_detalhes?.[0]?.nome?.toLowerCase().includes(termo);
      if(!matchTexto) return false;
      if (filtro === 'hoje') return new Date(a.data_hora_inicio).toDateString() === new Date().toDateString();
      if (filtro === 'pendentes') return a.status === 'PENDENTE';
      if (filtro === 'confirmados') return a.status === 'CONFIRMADO';
      return true;
  });

  const diasVazios = Array.from({ length: getDiaSemanaInicio(mesAtual) }, (_, i) => i);
  const diasDoMes = Array.from({ length: getDiasNoMes(mesAtual) }, (_, i) => i + 1);

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#F8F9FA'}}><Spinner animation="border" style={{color:'#002B55'}} /></div>;

  return (
    <div className="page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .page-wrapper { min-height: 100vh; background-color: rgba(246, 246, 246, 0.9); font-family: 'Inter', sans-serif; padding-bottom: 60px; }
        .header-bg { background: #002B55; padding: 40px 20px 80px 20px; border-radius: 0 0 70px 70px; color: white; margin-bottom: -40px; border-bottom: 6px solid #c7c5cc;
 }
        .container-limit { max-width: 1000px; margin: 0 auto; }
        
        .btn-back { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); border: none; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: 0.2s; }
        .btn-back:hover { background: white; color: #002B55; }

        .search-card { background: white; padding: 18px 30px; border-radius: 15px; border: 2px solid #E9ECEF; box-shadow: 0 10px 20px rgba(0,0,0,0.05); display: flex; gap: 20px; margin-bottom: 20px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .custom-input { border: none; background: #F1F3F5; padding: 10px 15px; border-radius: 7px; flex-grow: 1; outline: none; min-width: 200px; }

        .filter-pill { padding: 12px 20px; border: 1px solid #E9ECEF; border-radius: 20px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s; border: 1px solid transparent; white-space: nowrap; }
        .filter-pill.active { display: flex; gap: 5px; background: #002B55; color: white; font-size: 1rem; }
        .filter-pill.inactive { background: #ffffff8c; color: #555; border-color: #E9ECEF; }
        .filter-pill:hover:not(.active) { background: #E9ECEF; }

        .agenda-card { background: #fdfdfd; 20px; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border-left: 5px solid #ccc; transition: 0.5s; position: relative; }
        .agenda-card:hover { background: #f5f5f5; transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28); }
        .status-PENDENTE { border-left: 10px solid #FFC107; } .status-CONFIRMADO { border-left: 10px solid #2DCE89; }
        .status-CONCLUIDO { border-left: 10px solid #bff5ff; } .status-CANCELADO { border-left: 10px solid #F5365C; opacity: 0.7; }

        .client-avatar { width: 50px; height: 50px; border-radius: 50%; background: #E3F2FD; color: #002B55; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem; margin: 0px 10px 0px 30px}
        
        .btn-whatsapp { background: #1c9849; color: white; border: none; border-radius: 40px; padding: 6px 30px; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-whatsapp:hover { background: #128C7E; transform: scale(1.05); }

        /* --- BOTÕES DE AÇÃO GRANDES (NOVO) --- */
        .btn-action-large {
            width: 45px; height: 45px; border-radius: 12px; border: none; 
            display: flex; align-items: center; justify-content: center; 
            cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; 
            font-size: 1.2rem;
        }
        .btn-action-large:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
        
        .btn-check-lg { background-color: #E8F5E9; color: #19451b; }
        .btn-edit-lg  { background-color: #E3F2FD; color: #0f427d; }
        .btn-del-lg   { background-color: #FFEBEE; color: #811a1a; }
        .btn-done-lg  { background-color: #E0F7FA; color: #003032; border: 1px solid #00ACC1; width: auto; padding: 0 15px; font-weight: bold; font-size: 0.9rem;}

        /* MODAL STYLES */
        .modal-visual-header { background: #002B55; color: white; border: none; padding: 20px; }
        .modal-visual-header .btn-close { filter: invert(1); opacity: 1; }
        .section-title { font-size: 0.95rem; font-weight: 700; color: #002B55; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        
        .service-card { border: 1px solid #E9ECEF; border-radius: 8px; padding: 10px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; display: flex; justify-content: space-between; }
        .service-card:hover { background: #F8F9FA; }
        .service-card.selected { background: #E3F2FD; border-color: #002B55; color: #002B55; }
        
        .calendar-wrapper { border: 1px solid #E9ECEF; border-radius: 12px; padding: 15px; background: white; }
        .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-weight: 700; color: #002B55; }
        .week-days { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.75rem; color: #8898AA; margin-bottom: 5px; }
        .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
        .day-cell { height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
        .day-cell:hover { background: #F1F3F5; }
        .day-cell.selected { background: #002B55; color: white; font-weight: 700; }
        .day-cell.empty { cursor: default; background: transparent; }
        
        .time-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-height: 350px; overflow-y: auto; }
        .time-btn { border: 1px solid #E9ECEF; background: white; padding: 8px; border-radius: 8px; text-align: center; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
        .time-btn:hover { border-color: #002B55; color: #002B55; }
        .time-btn.selected { background: #002B55; color: white; border-color: #002B55; }
        .time-btn.disabled { background: #F1F3F5; color: #CCC; cursor: not-allowed; text-decoration: line-through; }
      `}</style>

      {/* HEADER */}
      <div className="header-bg">
          <div className="container-limit">
              <div className="d-flex align-items-center gap-4 mb-4">
                  <button className="btn-back" onClick={() => navigate('/admin-dashboard')}>
                      <FaArrowLeft />
                  </button>
                  <div>
                      <h2 style={{fontFamily: 'Libre Baskerville', margin: 0}}>Agenda</h2>
                      <span style={{opacity: 0.8}}>Gerencie horários e confirmações</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="container-limit px-3">
          
          {/* BUSCA E NOVO */}
          <div className="search-card">
              <div className="d-flex align-items-center flex-grow-1 gap-3">
                  <FaSearch className="text-muted"/>
                  <input type="text" className="custom-input" placeholder="Buscar cliente ou serviço..." value={busca} onChange={(e) => setBusca(e.target.value)}/>
              </div>
              <Button onClick={handleShowAdd} style={{background:'#002B55', border:'none', borderRadius:'10px', fontWeight:'600', padding:'10px 20px'}}>
                  <FaPlus className="me-2"/> Novo
              </Button>
          </div>

          {/* FILTROS RÁPIDOS */}
          <div className="d-flex gap-2 mb-5 overflow-auto pb-2">
              <div className={`filter-pill ${filtro === 'todos' ? 'active' : 'inactive'}`} onClick={() => setFiltro('todos')}>Todos</div>
              <div className={`filter-pill ${filtro === 'hoje' ? 'active' : 'inactive'}`} onClick={() => setFiltro('hoje')}>📅 Hoje</div>
              <div className={`filter-pill ${filtro === 'pendentes' ? 'active' : 'inactive'}`} onClick={() => setFiltro('pendentes')}>⏳ Pendentes</div>
              <div className={`filter-pill ${filtro === 'confirmados' ? 'active' : 'inactive'}`} onClick={() => setFiltro('confirmados')}>✅ Confirmados</div>
          </div>

          {/* LISTA DE CARDS */}
          {agendamentosFiltrados.length === 0 ? (
              <div className="text-center py-5 text-muted">
                  <FaCalendarAlt size={40} className="mb-3 opacity-25" />
                  <h5>Nenhum agendamento encontrado.</h5>
              </div>
          ) : agendamentosFiltrados.map(agenda => {
              const d = new Date(agenda.data_hora_inicio);
              return (
                  <div key={agenda.id} className={`agenda-card status-${agenda.status}`}>
                      <Row className="align-items-center g-3">
                          {/* Data/Hora */}
                          <Col xs={3} sm={2} className="text-center border-end">
                              <div className="fw-bold fs-5 text-dark">{d.getDate()}</div>
                              <div className="text-uppercase small text-muted fw-bold">{d.toLocaleDateString('pt-BR', {month: 'short'})}</div>
                              <div className="mt-2 badge bg-light text-dark border">
                                  {d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                              </div>
                          </Col>

                          {/* Info Cliente */}
                          <Col xs={9} sm={6}>
                              <div className="d-flex align-items-center gap-3">
                                  <div className="client-avatar">
                                      {agenda.cliente_nome ? agenda.cliente_nome.charAt(0).toUpperCase() : <FaUserCircle/>}
                                  </div>
                                  <div>
                                    <div>
                                      <h5 className="d-inline m-0 me-2 fw-bold text-dark">{agenda.cliente_nome || 'Cliente'}</h5>
                                          <Badge className="align-self-center p-2" bg={
                                              agenda.status === 'CONFIRMADO' ? 'success' : 
                                              agenda.status === 'PENDENTE' ? 'warning' : 
                                              agenda.status === 'CONCLUIDO' ? 'info' : 'secondary'
                                          }>
                                              {agenda.status}
                                          </Badge>
                                    </div>
                                      
                                      <div className="text-muted small mt-1">
                                          {agenda.servicos_detalhes?.map(s => s.nome).join(', ')} • R$ {agenda.servicos_detalhes?.reduce((acc, s) => acc + parseFloat(s.preco), 0).toFixed(2)}
                                      </div>
                                      <div className="d-flex flex-wrap gap-2 mt-3">
                                          
                                          {agenda.cliente_telefone && agenda.status !== 'CANCELADO' && (
                                              <button className="btn-whatsapp" onClick={() => handleWhatsApp(agenda)}>
                                                  <FaWhatsapp size={16}/> 
                                                  <span className="ms-1 d-none d-md-inline">{agenda.status === 'PENDENTE' ? 'Confirmar' : 'Lembrar'}</span>
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </Col>

                          {/* AÇÕES COM BOTÕES GRANDES */}
                          <Col xs={12} sm={4} className="d-flex justify-content-end align-items-center gap-2 border-top pt-3 pt-sm-0 border-sm-0">
                              
                              {/* Botão de Confirmar (Só aparece se pendente) */}
                              {agenda.status === 'PENDENTE' && (
                                  <button className="btn-action-large btn-check-lg" title="Confirmar" onClick={() => handleStatusChange(agenda.id, 'CONFIRMADO')}>
                                      <FaCheck />
                                  </button>
                              )}

                              {/* Botão de Concluir (Só aparece se confirmado) */}
                              {agenda.status === 'CONFIRMADO' && (
                                  <button className="btn-action-large btn-done-lg" onClick={() => handleStatusChange(agenda.id, 'CONCLUIDO')}>
                                      <FaCheck className="me-2"/> Concluir
                                  </button>
                              )}

                              {/* Editar */}
                              <button className="btn-action-large btn-edit-lg" title="Editar" onClick={() => handleShowEdit(agenda)}>
                                  <FaEdit />
                              </button>

                              {/* Excluir/Cancelar */}
                              <button className="btn-action-large btn-del-lg" title="Excluir/Cancelar" onClick={() => handleDelete(agenda.id)}>
                                  {agenda.status === 'CANCELADO' ? <FaTrash /> : <FaTimes />}
                              </button>
                          </Col>
                      </Row>
                  </div>
              );
          })}
      </div>

      {/* MODAL DE EDIÇÃO/CRIAÇÃO (MANTIDO) */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton className="modal-visual-header">
            <Modal.Title style={{fontFamily: 'Libre Baskerville'}}>
                {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
            </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
            <Row className="g-0">
                <Col md={7} className="p-4 border-end">
                    <div className="mb-4">
                        <h6 className="section-title"><FaUserCircle /> Cliente</h6>
                        <Form.Select value={clienteSelecionado} onChange={e => setClienteSelecionado(e.target.value)} className="custom-input" style={{width:'100%'}}>
                            <option value="">Selecione o Cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_completo || c.username}</option>)}
                        </Form.Select>
                    </div>

                    <div className="mb-4">
                        <h6 className="section-title"><FaCheck /> Serviços</h6>
                        <div style={{maxHeight: '150px', overflowY: 'auto'}}>
                            {servicos.map(s => (
                                <div key={s.id} className={`service-card ${servicosSelecionados.includes(s.id) ? 'selected' : ''}`} onClick={() => toggleServico(s.id)}>
                                    <span>{s.nome}</span>
                                    <span className="fw-bold">R$ {s.preco}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h6 className="section-title"><FaCalendarAlt /> Data</h6>
                        <div className="calendar-wrapper">
                            <div className="calendar-header">
                                <span style={{cursor:'pointer'}} onClick={() => mudarMes(-1)}><FaChevronLeft /></span>
                                <span>{mesAtual.toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}</span>
                                <span style={{cursor:'pointer'}} onClick={() => mudarMes(1)}><FaChevronRight /></span>
                            </div>
                            <div className="week-days"><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
                            <div className="days-grid">
                                {diasVazios.map(v => <div key={`v-${v}`} className="day-cell empty"></div>)}
                                {diasDoMes.map(dia => {
                                    const d = new Date(mesAtual); d.setDate(dia);
                                    const isSelected = isSameDay(d, dataSelecionada);
                                    return <div key={dia} className={`day-cell ${isSelected ? 'selected' : ''}`} onClick={() => { setDataSelecionada(d); setHoraSelecionada(''); }}>{dia}</div>
                                })}
                            </div>
                        </div>
                    </div>
                </Col>

                <Col md={5} className="p-4 bg-light d-flex flex-column">
                    <div className="mb-3">
                        <h6 className="section-title"><FaClock /> Horários Disponíveis</h6>
                        <div className="time-grid">
                            {horariosDisponiveis.length > 0 ? (
                                horariosDisponiveis.map(hora => (
                                    <div 
                                        key={hora} 
                                        className={`time-btn ${horaSelecionada === hora ? 'selected' : ''}`} 
                                        onClick={() => setHoraSelecionada(hora)}
                                    >
                                        {hora}
                                    </div>
                                ))
                            ) : (
                                <div className="text-muted small">Nenhum horário disponível para esta data.</div>
                            )}
                        </div>
                    </div>

                    {editingId && (
                        <div className="mb-3">
                            <h6 className="section-title">Status</h6>
                            <Form.Select value={statusAgendamento} onChange={e => setStatusAgendamento(e.target.value)}>
                                <option value="PENDENTE">Pendente</option>
                                <option value="CONFIRMADO">Confirmado</option>
                                <option value="CONCLUIDO">Concluído</option>
                                <option value="CANCELADO">Cancelado</option>
                            </Form.Select>
                        </div>
                    )}

                    <div className="mt-auto">
                        <Button className="w-100 py-2 fw-bold" style={{background: '#002B55', border: 'none'}} onClick={handleSubmit}>
                            {editingId ? 'Salvar Alterações' : 'Agendar'}
                        </Button>
                    </div>
                </Col>
            </Row>
        </Modal.Body>
      </Modal>

    </div>
  );
}