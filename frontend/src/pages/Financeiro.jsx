import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Badge, ProgressBar, Row, Col, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { 
  FaArrowLeft, FaCheckCircle, FaHistory, 
  FaMoneyBillWave, FaClock, FaChartPie, FaSearch, 
  FaEdit, FaTrash, FaTimes, FaExclamationCircle
} from 'react-icons/fa';

export default function Financeiro() {
  const navigate = useNavigate();
  
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para os cards superiores
  const [resumo, setResumo] = useState({ aReceber: 0, recebido: 0, total: 0 });
  const [receitaMes, setReceitaMes] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState(null);
  const [historicoPagamentos, setHistoricoPagamentos] = useState([]);
  
  const [pagamentoForm, setPagamentoForm] = useState({ valor: '', forma_pagamento: 'PIX', observacao: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
    loadDashboardStats();
  }, []);

  // Busca estatísticas consolidadas (Card 1: Entradas do Mês)
  async function loadDashboardStats() {
    try {
      const response = await api.get('/financeiro/dashboard/');
      if (response.data) {
        setReceitaMes(response.data.receita_mes || 0);
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      const response = await api.get('/agendamentos/');
      const dadosBrutos = Array.isArray(response.data) ? response.data : [];
      // Filtramos cancelados, mas mantemos Pendentes para a listagem (sem contar no saldo)
      const dadosValidos = dadosBrutos.filter(ag => ag.status !== 'CANCELADO');
      setAgendamentos(dadosValidos);
      calcularResumo(dadosValidos);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  // REGRA: Só conta "A Receber" se o agendamento estiver CONFIRMADO
  function calcularResumo(dados) {
      let aReceber = 0;
      let recebido = 0;
      dados.forEach(ag => {
          const fin = ag.financeiro || { pago: 0, restante: 0, total: 0 };
          recebido += parseFloat(fin.pago || 0);
          
          // LOGICA: Só entra no saldo de "A Receber" se o empreendedor já confirmou o agendamento
          if (ag.status === 'CONFIRMADO') {
              aReceber += parseFloat(fin.restante || 0);
          }
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
        const filtrados = dados.filter(p => 
            p.agendamento === agendamentoId || p.agendamento_id === agendamentoId
        );
        
        setHistoricoPagamentos(filtrados.sort((a, b) => 
            new Date(b.data_pagamento || b.created_at) - new Date(a.data_pagamento || a.created_at)
        ));
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
          return date.toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
          }).replace(',', ' às');
      } catch (e) { return '--/--'; }
  };

  const handleOpenPay = async (agenda) => {
    if(!agenda) return;
    setSelectedAgenda(agenda);
    setEditingId(null);
    const restante = agenda.financeiro?.restante || 0;
    setPagamentoForm({ valor: restante, forma_pagamento: 'PIX', observacao: '' });
    await loadHistorico(agenda.id);
    setShowModal(true);
  };

  const handleEditClick = (pagamento) => {
      setEditingId(pagamento.id);
      setPagamentoForm({
          valor: pagamento.valor,
          forma_pagamento: pagamento.forma_pagamento,
          observacao: pagamento.observacao || ''
      });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      const restante = selectedAgenda?.financeiro?.restante || 0;
      setPagamentoForm({ valor: restante, forma_pagamento: 'PIX', observacao: '' });
  };

  const handleDeleteClick = async (id) => {
      if(!window.confirm("Tem certeza que deseja excluir este pagamento?")) return;
      try {
          await api.delete(`/pagamentos/${id}/`);
          await loadHistorico(selectedAgenda.id);
          await loadData();
          await loadDashboardStats();
          alert("Pagamento removido.");
      } catch (error) {
          alert("Erro ao excluir.");
      }
  };

async function handleSavePayment(e) {
    e.preventDefault();
    if(!selectedAgenda || isSubmitting) return;

    const valorNumerico = parseFloat(pagamentoForm.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
        alert("Por favor, insira um valor válido maior que zero.");
        return;
    }

    // CORREÇÃO CRÍTICA DO FRONTEND: 
    // Buscamos o valor total direto do objeto financeiro injetado no agendamento, 
    // ou calculamos usando a propriedade correta: 'servicos_detalhes'
    const totalServicos = parseFloat(selectedAgenda.financeiro?.total) || 
                          selectedAgenda.servicos_detalhes?.reduce((acc, s) => acc + parseFloat(s.preco), 0) || 0;
                          
    const totalPagoAteAgora = historicoPagamentos?.reduce((acc, p) => acc + parseFloat(p.valor), 0) || 0;
    
    // Se estiver editando um pagamento, o valor antigo dele não pode jogar o teto para baixo
    const valorIgnorarEdicao = editingId ? (historicoPagamentos.find(p => p.id === editingId)?.valor || 0) : 0;
    const saldoRestante = totalServicos - (totalPagoAteAgora - parseFloat(valorIgnorarEdicao));

    if (valorNumerico > saldoRestante) {
        alert(`Operação cancelada! O valor do pagamento (R$ ${valorNumerico.toFixed(2)}) não pode ser maior do que o saldo restante a pagar (R$ ${saldoRestante.toFixed(2)}).`);
        return;
    }

    try {
        setIsSubmitting(true);
        
        // CORREÇÃO DE CONTEXTO: O Serializer do Django espera receber a FK no campo 'agendamento'
        const payload = {
            agendamento: selectedAgenda.id,
            valor: valorNumerico,
            forma_pagamento: pagamentoForm.forma_pagamento,
            observacao: pagamentoForm.observacao
        };

        if (editingId) {
            await api.patch(`/pagamentos/${editingId}/`, payload);
        } else {
            await api.post('/pagamentos/', payload);
        }
        
        await Promise.all([
            loadHistorico(selectedAgenda.id),
            loadData(),
            loadDashboardStats()
        ]);
        
        setEditingId(null);
        setPagamentoForm({ valor: '', forma_pagamento: 'PIX', observacao: '' });
        setShowModal(false);
        alert("Pagamento processado com sucesso!");
    } catch (error) {
        console.error("Erro ao salvar:", error);
        if (error.response?.data?.valor) {
            alert(error.response.data.valor[0] || error.response.data.valor);
        } else if (error.response?.data?.erro) {
            alert(error.response.data.erro);
        } else {
            alert("Não foi possível processar o pagamento. Verifique as restrições de valores.");
        }
    } finally {
        setIsSubmitting(false);
    }
}

  return (
    <>
        <AnimatedBackground />
        <div className="financeiro-wrapper">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            .financeiro-wrapper { min-height: 100vh; background: transparent; font-family: 'Inter', sans-serif; padding: 40px 20px; overflow-x: hidden; }
            .container-limit { max-width: 1150px; margin: 0 auto; }
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
            .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin-bottom: 30px; }
            .stat-card { background: white; border-radius: 16px; padding: 25px; display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 15px rgba(0,43,85,0.03); }
            .icon-circle { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
            .stat-info span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #888; }
            .stat-info h3 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #002B55; font-family: 'Inter', sans-serif; }
            .green-theme .icon-circle { background: #E8F5E9; color: #2E7D32; }
            .yellow-theme .icon-circle { background: #FFF8E1; color: #F9A825; }
            .blue-theme .icon-circle { background: #E3F2FD; color: #1565C0; }
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
            .modal-clean-header { background: #002B55; color: white; padding: 25px; border: none; }
            .modal-clean-header .btn-close { filter: invert(1) grayscale(100%) brightness(200%); opacity: 1; }
            .history-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 10px; margin-bottom: 8px; border: 1px solid #F1F3F5; transition: 0.2s; }
            .history-item:hover { border-color: #002B55; }
            .history-meta { display: flex; flex-direction: column; }
            .history-date { font-size: 0.8rem; color: #888; display: flex; align-items: center; gap: 5px; }
            .history-method { font-size: 0.9rem; font-weight: 600; color: #32325D; }
            .history-value { font-weight: 700; color: #2DCE89; font-size: 1rem; }
            .history-actions { display: flex; gap: 5px; opacity: 0.5; transition: 0.2s; }
            .history-item:hover .history-actions { opacity: 1; }
            .btn-action-mini { border: none; background: #F1F3F5; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #525F7F; transition: 0.2s; }
            .btn-action-mini:hover { background: #002B55; color: white; }
            .btn-action-mini.delete:hover { background: #D32F2F; color: white; }
            .badge-warning-soft { background: #FFF8E1; color: #F9A825; font-size: 0.7rem; padding: 4px 8px; border-radius: 5px; font-weight: 700; }
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
                    <input type="text" className="search-field" placeholder="Buscar cliente..." 
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-card green-theme">
                    <div className="icon-circle"><FaCheckCircle /></div>
                    <div className="stat-info"><span>Entradas do Mês</span><h3>{money(receitaMes)}</h3></div>
                </div>
                <div className="stat-card yellow-theme">
                    <div className="icon-circle"><FaMoneyBillWave /></div>
                    <div className="stat-info"><span>Total Recebido</span><h3>{money(resumo.recebido)}</h3></div>
                </div>
                <div className="stat-card blue-theme">
                    <div className="icon-circle"><FaChartPie /></div>
                    <div className="stat-info"><span>A Receber (Confirmados)</span><h3>{money(resumo.aReceber)}</h3></div>
                </div>
            </div>

            <div className="unified-panel">
                <Table className="clean-table mb-0" responsive>
                    <thead>
                        <tr>
                            <th>Cliente / Data</th>
                            <th>Serviço</th>
                            <th>Status Pagamento</th>
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
                            const dataF = formatDateTime(ag.data_hora_inicio || ag.data);
                            
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
                                    <td>
                                      <div className="d-flex flex-column gap-1">
                                        <span className="service-pill">{ag.servicos_detalhes?.[0]?.nome || 'Serviço'}</span>
                                        {ag.status === 'PENDENTE' && <span className="badge-warning-soft"><FaExclamationCircle /> Aguardando Confirmação</span>}
                                      </div>
                                    </td>
                                    <td>
                                        <div className={stClass}><span className="status-dot"></span> {stLabel}</div>
                                    </td>
                                    <td style={{minWidth:'150px'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', fontWeight:'600', marginBottom:'4px'}}>
                                            <span style={{color:'#2DCE89'}}>{money(fin.pago)}</span>
                                            <span style={{color:'#888'}}>{money(fin.total)}</span>
                                        </div>
                                        <ProgressBar now={percent} variant={fin.status_pagamento === 'QUITADO' ? "success" : "warning"} style={{height:'5px', borderRadius:'10px'}} />
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
                        {editingId ? "Editar Pagamento" : "Gestão de Pagamentos"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4" style={{background: '#F8F9FA'}}>
                    {selectedAgenda && (
                        <>
                            <Form onSubmit={handleSavePayment} className="mb-4 bg-white p-3 rounded shadow-sm" style={{borderLeft: editingId ? '4px solid #FB6340' : '4px solid #002B55'}}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="text-muted small fw-bold m-0 text-uppercase">
                                        {editingId ? "Editando Registro" : "Novo Pagamento"}
                                    </h6>
                                    {editingId && (
                                        <Badge bg="warning" text="dark" style={{cursor:'pointer'}} onClick={handleCancelEdit}>
                                            <FaTimes /> Cancelar Edição
                                        </Badge>
                                    )}
                                </div>

                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Label className="small fw-bold text-muted">Valor (R$)</Form.Label>
                                        <Form.Control type="number" step="0.01" 
                                            value={pagamentoForm.valor} 
                                            onChange={e=>setPagamentoForm({...pagamentoForm, valor:e.target.value})} 
                                            style={{fontWeight:'bold', color: editingId ? '#FB6340' : '#002B55'}} 
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="small fw-bold text-muted">Forma</Form.Label>
                                        <Form.Select 
                                            value={pagamentoForm.forma_pagamento} 
                                            onChange={e=>setPagamentoForm({...pagamentoForm, forma_pagamento:e.target.value})}
                                        >
                                            <option value="PIX">Pix</option>
                                            <option value="DINHEIRO">Dinheiro</option>
                                            <option value="CARTAO_CREDITO">Crédito</option>
                                            <option value="CARTAO_DEBITO">Debito</option>
                                        </Form.Select>
                                    </Col>
                                </Row>
                                <Form.Group className="mt-3">
                                    <Form.Label className="small fw-bold text-muted">Observação</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Ex: Sinal, parcela 1..."
                                        value={pagamentoForm.observacao} 
                                        onChange={e=>setPagamentoForm({...pagamentoForm, observacao:e.target.value})} 
                                    />
                                </Form.Group>

                                <div className="d-flex justify-content-end mt-3">
                                    <Button 
                                        type="submit" 
                                        size="sm" 
                                        disabled={isSubmitting} // Desabilita visualmente o botão
                                        style={{
                                            background: editingId ? '#FB6340' : '#002B55', 
                                            border:'none', borderRadius:'20px', padding:'8px 20px',
                                            opacity: isSubmitting ? 0.7 : 1
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Processando...
                                            </>
                                        ) : (
                                            editingId ? "Salvar Alteração" : "Confirmar Pagamento"
                                        )}
                                    </Button>
                                </div>
                            </Form>

                            <div>
                                <h6 className="text-muted small fw-bold mb-3 text-uppercase d-flex align-items-center gap-2">
                                    <FaHistory /> Histórico de Pagamentos
                                </h6>
                                {historicoPagamentos.length === 0 ? (
                                    <p className="text-center text-muted small py-3">Nenhum pagamento registrado.</p>
                                ) : historicoPagamentos.map(h => (
                                    <div key={h.id} className="history-item" style={{opacity: editingId === h.id ? 0.5 : 1}}>
                                        <div className="history-meta">
                                            <div className="history-method">
                                                {h.forma_pagamento} 
                                                {h.observacao && <span className="text-muted fw-normal ms-2" style={{fontSize:'0.8em'}}>- {h.observacao}</span>}
                                            </div>
                                            <div className="history-date">
                                                <FaClock size={10} /> 
                                                {h.data_formatada || formatDateTime(h.data_pagamento || h.created_at)}
                                            </div>
                                        </div>
                                        
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="history-value">+{money(h.valor)}</div>
                                            <div className="history-actions">
                                                <button className="btn-action-mini" onClick={() => handleEditClick(h)} title="Editar" disabled={editingId !== null}>
                                                    <FaEdit size={12} />
                                                </button>
                                                <button className="btn-action-mini delete" onClick={() => handleDeleteClick(h.id)} title="Excluir" disabled={editingId !== null}>
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </div>
        </div>
     </>
  );
}