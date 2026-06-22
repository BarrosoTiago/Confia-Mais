import { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Spinner, Form, Badge } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom'; // Adicionado useLocation
import AnimatedBackground from '../components/AnimatedBackground';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  FaArrowLeft, 
  FaSearch, 
  FaFilter, 
  FaMoneyBillWave, 
  FaClock, 
  FaCheckCircle 
} from 'react-icons/fa';

export default function EntradasMes() {
  const navigate = useNavigate();
  const location = useLocation(); // Captura a URL atual para sincronizar o estado inicial
  
  const [loading, setLoading] = useState(true);
  
  const [periodoAtivo, setPeriodoAtivo] = useState(() => {
    return location.state?.periodo || 'mes';
  });

  const [dadosPeriodo, setDadosPeriodo] = useState({
    texto_referencia: '',
    total_acumulado: 0,
    quantidade_entradas: 0,
    dados_grafico: [],
    entradas: []
  });
  

  const [searchTerm, setSearchTerm] = useState('');
  const [filterForma, setFilterForma] = useState('TODOS');

useEffect(() => {
    const periodoVindoDoMenu = location.state?.periodo;
    if (periodoVindoDoMenu && periodoVindoDoMenu !== periodoAtivo) {
      setPeriodoAtivo(periodoVindoDoMenu);
    }
  }, [location.state, periodoAtivo]);

  // Sincroniza o estado caso o usuário mude de opção usando o menu de contexto com a página já aberta
  useEffect(() => {
    if (location.pathname.endsWith('entradas-dia')) setPeriodoAtivo('dia');
    else if (location.pathname.endsWith('entradas-semana')) setPeriodoAtivo('semana');
    else if (location.pathname.endsWith('entradas-ano')) setPeriodoAtivo('ano');
    else setPeriodoAtivo('mes');
  }, [location.pathname]);

  useEffect(() => {
    fetchDadosPeriodo();
  }, [periodoAtivo]);

  async function fetchDadosPeriodo() {
    try {
      setLoading(true);
      const response = await api.get(`/api/financeiro/entradas-periodo/?periodo=${periodoAtivo}`);
      if (response.data) {
        setDadosPeriodo(response.data);
      }
    } catch (err) {
      console.error(`Erro ao carregar entradas por ${periodoAtivo}:`, err);
    } finally {
      setLoading(false);
    }
  }

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

  const getTituloDinamico = () => {
    switch (periodoAtivo) {
      case 'dia': return 'Entradas do Dia';
      case 'semana': return 'Entradas da Semana';
      case 'mes': return 'Entradas do Mês';
      case 'ano': return 'Entradas do Ano';
      default: return 'Entradas do Negócio';
    }
  };

  const getFormaBadge = (forma) => {
    switch(forma) {
      case 'PIX': return <Badge bg="info" className="text-dark py-1 px-2 fw-semibold">Pix</Badge>;
      case 'DINHEIRO': return <Badge bg="success" className="py-1 px-2 fw-semibold">Dinheiro</Badge>;
      case 'CARTAO_CREDITO': return <Badge bg="primary" className="py-1 px-2 fw-semibold">Crédito</Badge>;
      case 'CARTAO_DEBITO': return <Badge bg="secondary" className="py-1 px-2 fw-semibold">Débito</Badge>;
      default: return <Badge bg="light" text="dark" className="py-1 px-2">{forma || 'Outro'}</Badge>;
    }
  };

  const pagamentosFiltrados = (dadosPeriodo.entradas || []).filter(pag => {
    const term = searchTerm.toLowerCase();
    const clienteNome = (pag.cliente || 'Cliente').toLowerCase();
    const observacao = (pag.observacao || '').toLowerCase();
    
    const matchesSearch = clienteNome.includes(term) || observacao.includes(term);
    const matchesForma = filterForma === 'TODOS' || pag.forma_pagamento === filterForma;

    return matchesSearch && matchesForma;
  });

  const totalFiltradoAcumulado = pagamentosFiltrados.reduce((acc, curr) => acc + curr.valor, 0);
  const quantidadeFiltrada = pagamentosFiltrados.length;

  const getDadosGraficoFiltrados = () => {
    if (filterForma === 'TODOS' && searchTerm === '') {
      return dadosPeriodo.dados_grafico || [];
    }

    const mapaEstrutura = {};
    if (dadosPeriodo.dados_grafico) {
      dadosPeriodo.dados_grafico.forEach(ponto => {
        mapaEstrutura[ponto.label] = 0;
      });
    }

    pagamentosFiltrados.forEach(pag => {
      const dtPagamento = new Date(pag.data_pagamento);
      let chave = '';

      if (periodoAtivo === 'dia') {
        const hora = dtPagamento.getHours();
        const blocoHora = Math.floor(hora / 4) * 4;
        chave = `${blocoHora.toString().padStart(2, '0')}:00`;
      } else if (periodoAtivo === 'semana') {
        const mapeamentoDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dataFormatada = pag.data_pagamento.includes('T') ? pag.data_pagamento : `${pag.data_pagamento}T00:00:00`;
        const diaIndex = new Date(dataFormatada).getDay();
        chave = mapeamentoDias[diaIndex];
      } else if (periodoAtivo === 'ano') {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        chave = meses[dtPagamento.getMonth()];
      } else { 
        const diaDoMes = dtPagamento.getDate();
        if (diaDoMes <= 7) chave = 'Semana 1';
        else if (diaDoMes <= 14) chave = 'Semana 2';
        else if (diaDoMes <= 21) chave = 'Semana 3';
        else if (diaDoMes <= 28) chave = 'Semana 4';
        else chave = 'Semana 5';
      }

      if (mapaEstrutura[chave] !== undefined) {
        mapaEstrutura[chave] += pag.valor;
      }
    });

    return Object.keys(mapaEstrutura).map(label => ({
      label: label,
      valor: Number(mapaEstrutura[label].toFixed(2))
    }));
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#002B55', color: 'white', padding: '10px 15px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', fontSize: '0.85rem' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].payload.label}</p>
          <p style={{ margin: 0, color: '#2DCE89', fontWeight: 700 }}>{formatMoney(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const handleTabChange = (periodo) => {
    setPeriodoAtivo(periodo);
    // Atualiza a "bagagem" interna do histórico para que se o usuário atualizar a página, ela permaneça na aba certa
    navigate('/admin/financeiro/entradas-mes', { state: { periodo }, replace: true });
  };

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
          
          .tabs-periodo { background: #F4F6F9; padding: 6px; border-radius: 30px; border: 1px solid #E9ECEF; }
          .tabs-periodo .btn-tab { border: none; background: transparent; color: #525F7F; font-weight: 600; font-size: 0.9rem; padding: 8px 22px; border-radius: 24px; transition: all 0.3s ease; }
          .tabs-periodo .btn-tab.active { background: white; color: #002B55; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
          
          .chart-panel { background: white; border-radius: 20px; padding: 25px; box-shadow: 0 10px 30px rgba(0,43,85,0.04); margin-bottom: 30px; }
          .chart-panel h3 { font-size: 1rem; font-weight: 700; color: #002B55; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
          
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
          <div className="custom-header">
            <div className="header-left-side">
              {/* CORRIGIDO: Rota alterada para '/admin', retornando com segurança ao painel principal */}
              <button 
                className="btn-back-dashboard" 
                onClick={() => navigate(-1)} // <--- ALTERADO AQUI: Volta exatamente para a tela anterior
                title="Voltar ao Painel"
              >
                <FaArrowLeft />
              </button>
              <div className="title-group">
                <h1>{getTituloDinamico()}</h1>
                <span>Análise de receitas por faturamento temporal ({dadosPeriodo.texto_referencia})</span>
              </div>
            </div>

            {/* CORRIGIDO: Chamando handleTabChange para manter URL e estado sincronizados */}
            <div className="tabs-periodo">
              <button className={`btn-tab ${periodoAtivo === 'dia' ? 'active' : ''}`} onClick={() => handleTabChange('dia')}>Dia</button>
              <button className={`btn-tab ${periodoAtivo === 'semana' ? 'active' : ''}`} onClick={() => handleTabChange('semana')}>Semana</button>
              <button className={`btn-tab ${periodoAtivo === 'mes' ? 'active' : ''}`} onClick={() => handleTabChange('mes')}>Mês</button>
              <button className={`btn-tab ${periodoAtivo === 'ano' ? 'active' : ''}`} onClick={() => handleTabChange('ano')}>Ano</button>
            </div>
          </div>

          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spinner animation="border" style={{ color: 'white' }} />
            </div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="mini-stat-card theme-green">
                  <div className="mini-icon-circle"><FaCheckCircle /></div>
                  <div className="mini-stat-info">
                    <span>Faturamento Filtrado ({dadosPeriodo.label_periodo || 'Mês'})</span>
                    <h4>{formatMoney(totalFiltradoAcumulado)}</h4>
                  </div>
                </div>
                <div className="mini-stat-card theme-blue">
                  <div className="mini-icon-circle"><FaMoneyBillWave /></div>
                  <div className="mini-stat-info">
                    <span>Total de Recebimentos</span>
                    <h4>{quantidadeFiltrada} transações</h4>
                  </div>
                </div>
              </div>

              <div className="chart-panel">
                <h3>Fluxo de Entradas Monetárias</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={getDadosGraficoFiltrados()}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2DCE89" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#2DCE89" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECEF" />
                      <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#8898AA', fontSize: 12, fontWeight: 500 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#8898AA', fontSize: 11 }}
                        tickFormatter={(v) => `R$ ${v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="valor" 
                        stroke="#2DCE89" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorValor)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

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

              <div className="table-panel">
                <Table className="entries-table mb-0" responsive>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Data do Recebimento</th>
                      <th>Forma</th>
                      <th>Observação / Detalhes</th>
                      <th className="text-end">Valor Recebido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">
                          Nenhum recebimento registrado para os critérios selecionados.
                        </td>
                      </tr>
                    ) : (
                      pagamentosFiltrados.map((pag) => (
                        <tr key={pag.id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div className="avatar-circle">{(pag.cliente || 'C').charAt(0).toUpperCase()}</div>
                              <div className="client-title">{pag.cliente || 'Cliente'}</div>
                            </div>
                          </td>
                          <td>
                            <div className="text-muted small d-flex align-items-center gap-2">
                              <FaClock size={12} /> {formatDateTime(pag.data_pagamento)}
                            </div>
                          </td>
                          <td>
                            {getFormaBadge(pag.forma_pagamento)}
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
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}


