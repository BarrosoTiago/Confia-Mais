import { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Spinner, Form, Badge } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { 
  FaArrowLeft, 
  FaSearch, 
  FaFilter, 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaCoins,
  FaClock, 
  FaCheckCircle 
} from 'react-icons/fa';

export default function EntradasMes() {
  const navigate = useNavigate();
  
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterForma, setFilterForma] = useState('TODOS');
  
  // Estados para os mini-cards do mês corrente
  const [receitaMes, setReceitaMes] = useState(0);
  const [totalTransacoesMes, setTotalTransacoesMes] = useState(0);

  useEffect(() => {
    fetchDadosMensais();
  }, []);

  async function fetchDadosMensais() {
    try {
      setLoading(true);
      
      // 1. Busca o valor total consolidado do mês no dashboard financeiro
      const resDashboard = await api.get('/financeiro/dashboard/');
      if (resDashboard.data) {
        setReceitaMes(resDashboard.data.receita_mes || 0);
      }

      // 2. Busca todas as transações (pagamentos) efetuadas
      const resPagamentos = await api.get('/pagamentos/');
      const dadosBrutos = Array.isArray(resPagamentos.data) ? resPagamentos.data : [];
      
      // Pegamos o mês e ano atual para filtrar estritamente as entradas deste mês no Front-end
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      const transacoesDoMes = dadosBrutos.filter(pag => {
        const dataPag = new Date(pag.data_pagamento || pag.created_at || pag.data);
        return dataPag.getMonth() === mesAtual && dataPag.getFullYear() === anoAtual;
      });

      // Ordena por data mais recente
      transacoesDoMes.sort((a, b) => 
        new Date(b.data_pagamento || b.created_at || b.data) - new Date(a.data_pagamento || a.created_at || a.data)
      );

      setPagamentos(transacoesDoMes);
      setTotalTransacoesMes(transacoesDoMes.length);

    } catch (err) {
      console.error("Erro ao carregar entradas do mês:", err);
    } finally {
      setLoading(false);
    }
  }

  // Utilitários de Formatação
  const formatMoney = (val) => {
    if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
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

  // Retorna um Badge estilizado dinamicamente de acordo com a forma de pagamento cadastrada no backend
  const getFormaBadge = (forma) => {
    switch(forma) {
      case 'PIX':
        return <Badge bg="info" className="text-dark py-1 px-2 fw-semibold">Pix</Badge>;
      case 'DINHEIRO':
        return <Badge bg="success" className="py-1 px-2 fw-semibold">Dinheiro</Badge>;
      case 'CARTAO_CREDITO':
        return <Badge bg="primary" className="py-1 px-2 fw-semibold">Crédito</Badge>;
      case 'CARTAO_DEBITO':
        return <Badge bg="secondary" className="py-1 px-2 fw-semibold">Débito</Badge>;
      default:
        return <Badge bg="light" text="dark" className="py-1 px-2">{forma || 'Outro'}</Badge>;
    }
  };

  // Filtragem combinada (Termo de Busca por Cliente + Select de Forma de Pagamento)
  const pagamentosFiltrados = pagamentos.filter(pag => {
    const term = searchTerm.toLowerCase();
    
    // Suporta se o backend trouxer o nome do cliente direto no objeto ou através do agendamento expandido
    const clienteNome = (pag.cliente_nome || pag.agendamento_detalhes?.cliente_nome || 'Cliente').toLowerCase();
    const observacao = (pag.observacao || '').toLowerCase();
    
    const matchesSearch = clienteNome.includes(term) || observacao.includes(term);
    const matchesForma = filterForma === 'TODOS' || pag.forma_pagamento === filterForma || pag.forma === filterForma;

    return matchesSearch && matchesForma;
  });

  if (loading) {
    return (
      <>
        <AnimatedBackground />
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'transparent' }}>
          <Spinner animation="border" style={{ color: 'white' }} />
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <div className="entradas-mes-wrapper">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          .entradas-mes-wrapper { min-height: 100vh; background: transparent; font-family: 'Inter', sans-serif; padding: 40px 20px; }
          .container-limit { max-width: 1150px; margin: 0 auto; }
          
          .custom-header { background: white; border-radius: 20px; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,43,85,0.05); margin-bottom: 30px; gap: 20px; flex-wrap: wrap; }
          .header-left-side { display: flex; align-items: center; gap: 20px; }
          
          .btn-back-dashboard { width: 45px; height: 45px; border-radius: 50%; background: #F8F9FA; border: 1px solid #E9ECEF; color: #002B55; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer; transition: 0.2s; }
          .btn-back-dashboard:hover { background: #002B55; color: white; }
          
          .title-group h1 { font-family: 'Libre Baskerville', serif; font-weight: 700; font-size: 1.6rem; color: #002B55; margin: 0; }
          .title-group span { font-size: 0.85rem; color: #8898AA; }
          
          .filters-panel { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px rgba(0,43,85,0.02); margin-bottom: 25px; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .mini-stat-card { background: white; border-radius: 16px; padding: 22px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(0,43,85,0.03); }
          .mini-icon-circle { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
          .mini-stat-info span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #888; }
          .mini-stat-info h4 { margin: 0; font-size: 1.4rem; font-weight: 700; color: #002B55; }
          
          .theme-blue .mini-icon-circle { background: #E3F2FD; color: #1565C0; }
          .theme-green .mini-icon-circle { background: #E8F5E9; color: #2E7D32; }
          
          .table-panel { background: white; border-radius: 16px; box-shadow: 0 5px 30px rgba(0,0,0,0.05); overflow: hidden; }
          .entries-table { width: 100%; border-collapse: collapse; }
          .entries-table thead th { background: #F8F9FA; color: #525F7F; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 18px 25px; border-bottom: 1px solid #E9ECEF; }
          .entries-table tbody tr { border-bottom: 1px solid #F1F3F5; transition: background 0.2s; }
          .entries-table tbody tr:hover { background: #FAFBFC; }
          .entries-table td { padding: 18px 25px; vertical-align: middle; }
          
          .avatar-circle { width: 38px; height: 38px; border-radius: 50%; background: #E3F2FD; color: #1565C0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; }
          .client-title { font-weight: 700; color: #32325D; font-size: 0.95rem; }
          .val-positive { color: #2DCE89; font-weight: 700; font-size: 1.05rem; }
        `}</style>

        <div className="container-limit">
          {/* Cabeçalho Superior */}
          <div className="custom-header">
            <div className="header-left-side">
              <button className="btn-back-dashboard" onClick={() => navigate('/admin-dashboard')} title="Voltar ao Painel">
                <FaArrowLeft />
              </button>
              <div className="title-group">
                <h1>Entradas do Mês</h1>
                <span>Detalhamento analítico de receitas recebidas</span>
              </div>
            </div>
          </div>

          {/* Cards de Resumo Rápido */}
          <div className="stats-grid">
            <div className="mini-stat-card theme-green">
              <div className="mini-icon-circle"><FaCheckCircle /></div>
              <div className="mini-stat-info">
                <span>Faturamento Mensal (Líquido)</span>
                <h4>{formatMoney(receitaMes)}</h4>
              </div>
            </div>
            <div className="mini-stat-card theme-blue">
              <div className="mini-icon-circle"><FaMoneyBillWave /></div>
              <div className="mini-stat-info">
                <span>Total de Recebimentos</span>
                <h4>{totalTransacoesMes} transações</h4>
              </div>
            </div>
          </div>

          {/* Painel de Filtros Avançados */}
          <div className="filters-panel">
            <Row className="g-3 align-items-center">
              <Col md={7}>
                <Form.Group className="position-relative m-0">
                  <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
                  <Form.Control 
                    type="text" 
                    placeholder="Buscar por cliente ou observação..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '42px', borderRadius: '30px', background: '#F8F9FA', border: '1px solid #E9ECEF' }}
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group className="d-flex align-items-center m-0 gap-2">
                  <span className="text-muted small fw-bold text-nowrap"><FaFilter /> Forma:</span>
                  <Form.Select 
                    value={filterForma} 
                    onChange={(e) => setFilterForma(e.target.value)}
                    style={{ borderRadius: '30px', background: '#F8F9FA', border: '1px solid #E9ECEF' }}
                  >
                    <option value="TODOS">Todas as Formas</option>
                    <option value="PIX">Pix</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Tabela de Lançamentos Analíticos */}
          <div className="table-panel">
            <Table className="entries-table mb-0" responsive>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Data do Recebimento</th>
                  <th>Forma</th>
                  <th>Observação / Detalhe</th>
                  <th className="text-end">Valor Recebido</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      Nenhum recebimento registrado para os filtros aplicados neste mês.
                    </td>
                  </tr>
                ) : (
                  pagamentosFiltrados.map((pag) => {
                    const nomeCliente = pag.cliente_nome || pag.agendamento_detalhes?.cliente_nome || 'Cliente';
                    const dataFormatada = formatDateTime(pag.data_pagamento || pag.created_at || pag.data);
                    const formaDePagamento = pag.forma_pagamento || pag.forma;

                    return (
                      <tr key={pag.id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="avatar-circle">{nomeCliente.charAt(0).toUpperCase()}</div>
                            <div className="client-title">{nomeCliente}</div>
                          </div>
                        </td>
                        <td>
                          <div className="text-muted small d-flex align-items-center gap-2">
                            <FaClock size={12} /> {dataFormatada}
                          </div>
                        </td>
                        <td>
                          {getFormaBadge(formaDePagamento)}
                        </td>
                        <td>
                          <span className="text-muted small italic">
                            {pag.observacao ? pag.observacao : <span className="text-light-muted">Sem observações</span>}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className="val-positive">+{formatMoney(pag.valor)}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}