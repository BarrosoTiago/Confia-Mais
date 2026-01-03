import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Badge, ProgressBar, Row, Col, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaWallet, FaCheckCircle, FaHistory, 
  FaUserCircle, FaMoneyBillWave, FaClock, FaChartPie, FaSearch 
} from 'react-icons/fa';

export default function Financeiro() {
  const navigate = useNavigate();
  
  // Estados
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resumo, setResumo] = useState({ aReceber: 0, recebido: 0, total: 0 });

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState(null);
  const [historicoPagamentos, setHistoricoPagamentos] = useState([]);
  const [novoPagamento, setNovoPagamento] = useState({ valor: '', forma: 'PIX', observacao: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const response = await api.get('/agendamentos/');
      const dadosBrutos = Array.isArray(response.data) ? response.data : [];
      const dadosValidos = dadosBrutos.filter(ag => ag.status !== 'CANCELADO');
      setAgendamentos(dadosValidos);
      calcularResumo(dadosValidos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function calcularResumo(dados) {
      let aReceber = 0;
      let recebido = 0;
      dados.forEach(ag => {
          const fin = ag.financeiro || { pago: 0, restante: 0 };
          recebido += parseFloat(fin.pago || 0);
          aReceber += parseFloat(fin.restante || 0);
      });
      setResumo({ aReceber, recebido, total: aReceber + recebido });
  }

  const filteredAgendamentos = agendamentos.filter(ag => {
      const term = searchTerm.toLowerCase();
      const cliente = ag.cliente_nome?.toLowerCase() || '';
      const servico = ag.servicos_detalhes?.[0]?.nome?.toLowerCase() || '';
      return cliente.includes(term) || servico.includes(term);
  });

  async function loadHistorico(agendamentoId) {
    try {
        const response = await api.get('/pagamentos/');
        const dados = Array.isArray(response.data) ? response.data : [];
        const filtrados = dados
            .filter(p => p.agendamento === agendamentoId)
            .sort((a, b) => new Date(b.data_pagamento || b.created_at) - new Date(a.data_pagamento || a.created_at));
        setHistoricoPagamentos(filtrados);
    } catch (error) {
        setHistoricoPagamentos([]);
    }
  }

  const money = (val) => {
      if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(val);
  };

  const formatDateTime = (isoString) => {
      if (!isoString) return '--/--';
      try {
          const date = new Date(isoString);
          if (isNaN(date.getTime())) return 'Inválido';
          return date.toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
          }).replace(',', ' às');
      } catch (e) {
          return '--/--';
      }
  };

  const handleOpenPay = async (agenda) => {
    if(!agenda) return;
    setSelectedAgenda(agenda);
    const restante = agenda.financeiro?.restante || 0;
    // Reseta o formulário
    setNovoPagamento({ valor: restante, forma: 'PIX', observacao: '' });
    await loadHistorico(agenda.id);
    setShowModal(true);
  };

  async function handleConfirmPayment(e) {
    e.preventDefault();
    if(!selectedAgenda) return;
    try {
        await api.post('/pagamentos/', {
            agendamento: selectedAgenda.id,
            valor: novoPagamento.valor,
            forma: novoPagamento.forma,
            observacao: novoPagamento.observacao
        });
        alert("Pagamento registrado!");
        setShowModal(false);
        loadData(); 
    } catch (error) {
        alert("Erro ao registrar.");
    }
  }

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#A8DADC'}}><Spinner animation="border" style={{color:'#002B55'}} /></div>;

  return (
    <div className="financeiro-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .financeiro-wrapper { min-height: 100vh; background-color: #A8DADC; font-family: 'Inter', sans-serif; padding: 40px 20px; overflow-x: hidden; }
        .container-limit { max-width: 1150px; margin: 0 auto; }

        /* HEADER */
        .finance-header { background: white; border-radius: 20px; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,43,85,0.05); margin-bottom: 30px; gap: 20px; flex-wrap: wrap; }
        .header-left { display: flex; align-items: center; gap: 20px; }
        .btn-back-circle { width: 45px; height: 45px; border-radius: 50%; background: #F8F9FA; border: 1px solid #E9ECEF; color: #002B55; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer; transition: 0.2s; }
        .btn-back-circle:hover { background: #002B55; color: white; }
        .title-group h1 { font-family: 'Libre Baskerville', serif; font-weight: 700; font-size: 1.6rem; color: #002B55; margin: 0; }
        .title-group span { font-size: 0.85rem; color: #8898AA; }

        .search-wrapper { position: relative; min-width: 300px; }
        .search-field { width: 100%; padding: 12px 20px 12px 45px; border-radius: 50px; border: 2px solid #F1F3F5; background: #F8F9FA; color: #002B55; font-weight: 500; font-size: 0.95rem; }
        .search-field:focus { border-color: #002B55; background: white; outline: none; }
        .search-icon-pos { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #adb5bd; }

        /* STATS */
        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin-bottom: 30px; }
        .stat-card { background: white; border-radius: 16px; padding: 25px; display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 15px rgba(0,43,85,0.03); }
        .icon-circle { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .stat-info span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #888; }
        .stat-info h3 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #002B55; font-family: 'Inter', sans-serif; }
        .green-theme .icon-circle { background: #E8F5E9; color: #2E7D32; }
        .yellow-theme .icon-circle { background: #FFF8E1; color: #F9A825; }
        .blue-theme .icon-circle { background: #E3F2FD; color: #1565C0; }

        /* TABELA */
        .unified-panel { background: white; border-radius: 16px; box-shadow: 0 5px 30px rgba(0,0,0,0.05); overflow: hidden; }
        .clean-table { width: 100%; border-collapse: collapse; }
        .clean-table thead th { background: #F8F9FA; color: #525F7F; font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 20px 25px; border-bottom: 1px solid #E9ECEF; }
        .clean-table tbody tr { border-bottom: 1px solid #F1F3F5; transition: background 0.2s; }
        .clean-table tbody tr:hover { background: #FAFBFC; }
        .clean-table td { padding: 20px 25px; vertical-align: middle; }

        .cell-client { display: flex; align-items: center; gap: 15px; }
        .client-avatar { width: 40px; height: 40px; border-radius: 50%; background: #E3F2FD; color: #1565C0; display: flex; align-items: center; justify-content: center; font-size: 1rem; fontWeight: 700; }
        .client-meta div { font-weight: 700; color: #32325D; font-size: 0.95rem; }
        .client-meta small { color: #8898AA; font-size: 0.85rem; display: flex; align-items: center; gap: 5px; margin-top: 3px; font-weight: 500; }

        .service-pill { background: #F6F9FC; color: #525F7F; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-block; }
        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
        .st-paid { color: #2DCE89; font-weight: 600; font-size: 0.9rem; } .st-paid .status-dot { background: #2DCE89; }
        .st-part { color: #FB6340; font-weight: 600; font-size: 0.9rem; } .st-part .status-dot { background: #FB6340; }
        .st-pend { color: #F5365C; font-weight: 600; font-size: 0.9rem; } .st-pend .status-dot { background: #F5365C; }

        .btn-icon-soft { width: 35px; height: 35px; border-radius: 10px; border: 1px solid #E9ECEF; background: white; color: #6c757d; display: flex; align-items: center; justify-content: center; transition: 0.2s; cursor: pointer; }
        .btn-icon-soft:hover { background: #F8F9FA; color: #002B55; border-color: #002B55; }
        .btn-receber { background: #002B55; color: white; border: none; border-radius: 20px; padding: 6px 18px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-receber:hover { background: #004080; }
        .btn-quitado { background: #E8F5E9; color: #2DCE89; border: none; border-radius: 20px; padding: 6px 15px; font-size: 0.8rem; font-weight: 700; cursor: default; }

        /* MODAL */
        .modal-clean-header { background: #002B55; color: white; padding: 25px; border: none; }
        /* CORREÇÃO DO ÍCONE FECHAR DO MODAL */
        .modal-clean-header .btn-close { filter: invert(1) grayscale(100%) brightness(200%); opacity: 1; }
        
        .history-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 10px; margin-bottom: 8px; border: 1px solid #F1F3F5; }
        .history-meta { display: flex; flex-direction: column; }
        .history-date { font-size: 0.8rem; color: #888; display: flex; align-items: center; gap: 5px; }
        .history-method { font-size: 0.9rem; font-weight: 600; color: #32325D; }
        .history-value { font-weight: 700; color: #2DCE89; font-size: 1rem; }
      `}</style>

      <div className="container-limit">
          
          <div className="finance-header">
              <div className="header-left">
                  <button className="btn-back-circle" onClick={() => navigate('/admin-dashboard')} title="Voltar">
                      <FaArrowLeft />
                  </button>
                  <div className="title-group">
                      <h1>Financeiro</h1>
                      <span>Gestão e histórico</span>
                  </div>
              </div>
              <div className="search-wrapper">
                  <FaSearch className="search-icon-pos" />
                  <input type="text" className="search-field" placeholder="Buscar cliente ou serviço..." 
                         value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
          </div>

          <div className="stats-row">
              <div className="stat-card green-theme">
                  <div className="icon-circle"><FaCheckCircle /></div>
                  <div className="stat-info"><span>Total Recebido</span><h3>{money(resumo.recebido)}</h3></div>
              </div>
              <div className="stat-card yellow-theme">
                  <div className="icon-circle"><FaClock /></div>
                  <div className="stat-info"><span>A Receber</span><h3>{money(resumo.aReceber)}</h3></div>
              </div>
              <div className="stat-card blue-theme">
                  <div className="icon-circle"><FaChartPie /></div>
                  <div className="stat-info"><span>Total Previsto</span><h3>{money(resumo.total)}</h3></div>
              </div>
          </div>

          <div className="unified-panel">
              <Table className="clean-table mb-0" responsive>
                  <thead>
                      <tr>
                          <th>Cliente / Data</th>
                          <th>Serviço</th>
                          <th>Status</th>
                          <th>Saldo</th>
                          <th className="text-end">Ação</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredAgendamentos.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-5 text-muted">Nenhum registro encontrado.</td></tr>
                      ) : filteredAgendamentos.map(ag => {
                          const fin = ag.financeiro || { total: 0, pago: 0, restante: 0, status_pagamento: 'PENDENTE' };
                          const percent = fin.total > 0 ? (fin.pago / fin.total) * 100 : 0;
                          
                          const dataF = formatDateTime(ag.data_hora_inicio || ag.data || ag.start_time || ag.created_at);
                          
                          let stClass = 'st-pend';
                          let stLabel = 'Pendente';
                          if (fin.status_pagamento === 'QUITADO') { stClass = 'st-paid'; stLabel = 'Quitado'; }
                          else if (fin.status_pagamento === 'PARCIAL') { stClass = 'st-part'; stLabel = 'Parcial'; }

                          return (
                              <tr key={ag.id}>
                                  <td>
                                      <div className="cell-client">
                                          <div className="client-avatar">{ag.cliente_nome?.charAt(0)}</div>
                                          <div className="client-meta">
                                              <div>{ag.cliente_nome}</div>
                                              <small><FaClock size={10} /> {dataF}</small>
                                          </div>
                                      </div>
                                  </td>
                                  <td><span className="service-pill">{ag.servicos_detalhes?.[0]?.nome || 'Serviço'}</span></td>
                                  <td>
                                      <div className={stClass}><span className="status-dot"></span> {stLabel}</div>
                                  </td>
                                  <td style={{minWidth:'150px'}}>
                                      <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', fontWeight:'600', marginBottom:'4px'}}>
                                          <span style={{color:'#2DCE89'}}>{money(fin.pago)}</span>
                                          <span style={{color:'#888'}}>{money(fin.total)}</span>
                                      </div>
                                      <ProgressBar now={percent} variant={percent >= 100 ? "success" : "warning"} style={{height:'5px', borderRadius:'10px'}} />
                                  </td>
                                  <td className="text-end">
                                      <div className="action-group" style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                                          <button className="btn-icon-soft" onClick={() => handleOpenPay(ag)} title="Ver Histórico">
                                              <FaHistory />
                                          </button>
                                          {fin.restante > 0 ? (
                                              <button className="btn-receber" onClick={() => handleOpenPay(ag)}>
                                                  <FaMoneyBillWave /> Receber
                                              </button>
                                          ) : (
                                              <span className="btn-quitado"><FaCheckCircle /> OK</span>
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </Table>
          </div>

          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton className="modal-clean-header">
                <Modal.Title style={{fontFamily: 'Libre Baskerville', fontSize:'1.2rem'}}>
                    {selectedAgenda?.financeiro?.restante > 0 ? "Registrar Pagamento" : "Detalhes Financeiros"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4" style={{background: '#F8F9FA'}}>
                {selectedAgenda && (
                    <>
                        {selectedAgenda.financeiro?.restante > 0 && (
                            <Form onSubmit={handleConfirmPayment} className="mb-4 bg-white p-3 rounded shadow-sm">
                                <h6 className="text-muted small fw-bold mb-3 text-uppercase">Novo Pagamento</h6>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Label className="small fw-bold text-muted">Valor (R$)</Form.Label>
                                        <Form.Control type="number" step="0.01" value={novoPagamento.valor} onChange={e=>setNovoPagamento({...novoPagamento, valor:e.target.value})} style={{fontWeight:'bold', color:'#002B55'}} />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="small fw-bold text-muted">Forma</Form.Label>
                                        <Form.Select value={novoPagamento.forma} onChange={e=>setNovoPagamento({...novoPagamento, forma:e.target.value})}>
                                            <option value="PIX">Pix</option>
                                            <option value="DINHEIRO">Dinheiro</option>
                                            <option value="CARTAO_CREDITO">Crédito</option>
                                            <option value="CARTAO_DEBITO">Débito</option>
                                        </Form.Select>
                                    </Col>
                                </Row>
                                {/* CAMPO DE OBSERVAÇÃO ADICIONADO */}
                                <Form.Group className="mt-3">
                                    <Form.Label className="small fw-bold text-muted">Observação (Opcional)</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Ex: Pagou entrada..."
                                        value={novoPagamento.observacao} 
                                        onChange={e=>setNovoPagamento({...novoPagamento, observacao:e.target.value})} 
                                    />
                                </Form.Group>

                                <div className="d-flex justify-content-end mt-3">
                                    <Button type="submit" size="sm" style={{background:'#002B55', border:'none', borderRadius:'20px', padding:'8px 20px'}}>Confirmar Pagamento</Button>
                                </div>
                            </Form>
                        )}

                        <div>
                            <h6 className="text-muted small fw-bold mb-3 text-uppercase d-flex align-items-center gap-2">
                                <FaHistory /> Histórico de Pagamentos
                            </h6>
                            {historicoPagamentos.length === 0 ? (
                                <p className="text-center text-muted small py-3">Nenhum pagamento registrado.</p>
                            ) : historicoPagamentos.map(h => (
                                <div key={h.id} className="history-item">
                                    <div className="history-meta">
                                        <div className="history-method">
                                            {h.forma} 
                                            {/* Mostra observação se existir */}
                                            {h.observacao && <span className="text-muted fw-normal ms-2" style={{fontSize:'0.8em'}}>- {h.observacao}</span>}
                                        </div>
                                        <div className="history-date">
                                            <FaClock size={10} /> 
                                            {formatDateTime(h.data_pagamento || h.created_at || h.data)}
                                        </div>
                                    </div>
                                    <div className="history-value">+{money(h.valor)}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Modal.Body>
          </Modal>
      </div>
    </div>
  );
}