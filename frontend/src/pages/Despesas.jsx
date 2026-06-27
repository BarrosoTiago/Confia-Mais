import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
import api from '../services/api';
import AnimatedBackground from '../components/AnimatedBackground';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  FaArrowLeft, FaMoneyBillWave, FaPlus, FaEdit, FaTrash, 
  FaCalendarDay, FaFilter, FaSearch, FaClock
} from 'react-icons/fa';

export default function Despesas() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [periodoAtivo, setPeriodoAtivo] = useState('mes');
  const [showModal, setShowModal] = useState(false);
  
  const [dadosPeriodo, setDadosPeriodo] = useState({
    texto_referencia: '',
    total_acumulado: 0,
    quantidade_despesas: 0,
    dados_grafico: [], 
    despesas: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('TODOS');

  const [formData, setFormData] = useState({
    id: null,
    descricao: '',
    valor: '',
    data_despesa: '', 
    categoria: 'FIXA'
  });

  useEffect(() => {
    fetchDadosPeriodo();
  }, [periodoAtivo]);

  async function fetchDadosPeriodo() {
    try {
      setLoading(true);
      // CORREÇÃO 1: removido prefixo /api/ duplicado
      const response = await api.get(`/financeiro/despesas-periodo/?periodo=${periodoAtivo}`);
      if (response.data) {
        setDadosPeriodo(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar período das despesas:", err);
    } finally {
      setLoading(false);
    }
  }

  const money = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const getTituloDinamico = () => {
    switch (periodoAtivo) {
      case 'dia': return 'Despesas do Dia';
      case 'semana': return 'Despesas da Semana';
      case 'mes': return 'Despesas do Mês';
      case 'ano': return 'Despesas do Ano';
      default: return 'Despesas';
    }
  };

  const handleShowAdd = () => {
    setFormData({
      id: null,
      descricao: '',
      valor: '',
      data_despesa: new Date().toISOString().split('T')[0],
      categoria: 'FIXA'
    });
    setShowModal(true);
  };

  // CORREÇÃO 2: serializer retorna o campo como 'data', não 'data_despesa'
  const handleShowEdit = (item) => {
    setFormData({
      id: item.id,
      descricao: item.descricao,
      valor: item.valor,
      data_despesa: item.data,
      categoria: item.categoria || 'FIXA'
    });
    setShowModal(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      // CORREÇÃO 3: serializer espera o campo como 'data', não 'data_despesa'
      const payload = {
        descricao: formData.descricao,
        valor: formData.valor,
        data: formData.data_despesa,
        categoria: formData.categoria,
      };

      if (formData.id) {
        await api.put(`/despesas/${formData.id}/`, payload);
      } else {
        await api.post('/despesas/', payload);
      }
      setShowModal(false);
      fetchDadosPeriodo();
    } catch (error) {
      alert("Erro ao salvar despesa.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta despesa?")) return;
    try {
      await api.delete(`/despesas/${id}/`);
      fetchDadosPeriodo();
    } catch (error) {
      alert("Erro ao excluir.");
    }
  }

  const despesasFiltradas = (dadosPeriodo.despesas || []).filter(d => {
    const term = searchTerm.toLowerCase();
    const desc = d.descricao.toLowerCase();
    const matchesSearch = desc.includes(term);
    const matchesCat = filterCategoria === 'TODOS' || d.categoria === filterCategoria;
    return matchesSearch && matchesCat;
  });

  const totalFiltradoAcumulado = despesasFiltradas.reduce((acc, curr) => acc + curr.valor, 0);
  const quantidadeFiltrada = despesasFiltradas.length;

  const getDadosGraficoFiltrados = () => {
    if (filterCategoria === 'TODOS' && searchTerm === '') {
      return dadosPeriodo.dados_grafico || [];
    }

    const mapaEstrutura = {};
    if (dadosPeriodo.dados_grafico) {
      dadosPeriodo.dados_grafico.forEach(ponto => {
        mapaEstrutura[ponto.label] = 0;
      });
    }

    despesasFiltradas.forEach(d => {
      const dtDespesa = new Date(d.data_despesa);
      let chave = '';

      if (periodoAtivo === 'dia') {
        chave = "12:00";
      } else if (periodoAtivo === 'semana') {
        const diaIndex = new Date(d.data_despesa + 'T00:00:00').getDay();
        const mapeamentoDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        chave = mapeamentoDias[diaIndex];
      } else if (periodoAtivo === 'ano') {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        chave = meses[dtDespesa.getUTCMonth()];
      } else {
        const diaDoMes = dtDespesa.getUTCDate();
        if (diaDoMes <= 7) chave = 'Semana 1';
        else if (diaDoMes <= 14) chave = 'Semana 2';
        else if (diaDoMes <= 21) chave = 'Semana 3';
        else if (diaDoMes <= 28) chave = 'Semana 4';
        else chave = 'Semana 5';
      }

      if (mapaEstrutura[chave] !== undefined) {
        mapaEstrutura[chave] += d.valor;
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
          <p style={{ margin: 0, color: '#FF4C4C', fontWeight: 700 }}>{money(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const getBadgeClass = (cat) => {
    if (cat === 'VARIAVEL') return 'cat-variavel';
    if (cat === 'INVESTIMENTO') return 'cat-invest';
    return 'cat-fixa';
  };

  return (
    <>
      <AnimatedBackground />
      <div className="despesas-wrapper">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          .despesas-wrapper { min-height: 100vh; background: transparent; font-family: 'Inter', sans-serif; padding: 40px 20px; }
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
          
          .btn-new-expense { background: #C62828; color: white; border: none; border-radius: 30px; padding: 10px 25px; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 10px rgba(198, 40, 40, 0.2); height: 45px; }
          .btn-new-expense:hover { background: #B71C1C; transform: translateY(-2px); color: white;}
          
          .chart-panel { background: white; border-radius: 20px; padding: 25px; box-shadow: 0 10px 30px rgba(0,43,85,0.04); margin-bottom: 30px; }
          .chart-panel h3 { font-size: 1rem; font-weight: 700; color: #002B55; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .mini-stat-card { background: white; border-radius: 16px; padding: 22px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(0,43,85,0.03); }
          .mini-icon-circle { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
          .mini-stat-info span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #888; }
          .mini-stat-info h4 { margin: 0; font-size: 1.4rem; font-weight: 700; color: #002B55; }
          
          .theme-red .mini-icon-circle { background: #FFEBEE; color: #C62828; }
          .theme-blue .mini-icon-circle { background: #E3F2FD; color: #1565C0; }
          
          .filters-panel { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px rgba(0,43,85,0.02); margin-bottom: 25px; }
          
          .table-panel { background: white; border-radius: 16px; box-shadow: 0 5px 30px rgba(0,0,0,0.05); overflow: hidden; }
          .clean-table { width: 100%; border-collapse: collapse; }
          .clean-table thead th { background: #F8F9FA; color: #525F7F; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 18px 25px; border-bottom: 1px solid #E9ECEF; }
          .clean-table tbody tr { border-bottom: 1px solid #F1F3F5; transition: background 0.2s; }
          .clean-table tbody tr:hover { background: #FAFBFC; }
          .clean-table td { padding: 18px 25px; vertical-align: middle; }
          
          .date-cell { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #555; }
          .desc-text { font-weight: 700; color: #002B55; font-size: 1rem; }
          .value-text { font-weight: 700; color: #C62828; font-size: 1.05rem; }
          
          .cat-badge { padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .cat-fixa { background: #E3F2FD; color: #1565C0; }
          .cat-variavel { background: #FFF3E0; color: #EF6C00; }
          .cat-invest { background: #E8F5E9; color: #2E7D32; }
          
          .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
          .btn-icon-action { width: 35px; height: 35px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; transition: 0.2s; cursor: pointer; font-size: 0.9rem; }
          .act-edit { background: #E3F2FD; color: #1565C0; } .act-edit:hover { background: #1565C0; color: white; }
          .act-delete { background: #FFEBEE; color: #C62828; } .act-delete:hover { background: #C62828; color: white; }
          
          .modal-clean-header { background: #002B55; color: white; padding: 25px; border: none; }
          .modal-clean-header .btn-close { filter: invert(1); opacity: 1; }
          .custom-input { width: 100%; padding: 12px 15px; border-radius: 10px; border: 2px solid #F1F3F5; background: #F8F9FA; color: #002B55; font-weight: 500; font-size: 0.9rem; }
          .custom-input:focus { border-color: #002B55; background: white; outline: none; }
        `}</style>

        <div className="container-limit">
          <div className="custom-header">
            <div className="header-left-side">
              <button className="btn-back-dashboard" onClick={() => navigate('/admin-dashboard')} title="Voltar ao Painel">
                <FaArrowLeft />
              </button>
              <div className="title-group">
                <h1>{getTituloDinamico()}</h1>
                <span>Análise e balanço de saídas financeiras ({dadosPeriodo.texto_referencia})</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="tabs-periodo">
                <button className={`btn-tab ${periodoAtivo === 'dia' ? 'active' : ''}`} onClick={() => setPeriodoAtivo('dia')}>Dia</button>
                <button className={`btn-tab ${periodoAtivo === 'semana' ? 'active' : ''}`} onClick={() => setPeriodoAtivo('semana')}>Semana</button>
                <button className={`btn-tab ${periodoAtivo === 'mes' ? 'active' : ''}`} onClick={() => setPeriodoAtivo('mes')}>Mês</button>
                <button className={`btn-tab ${periodoAtivo === 'ano' ? 'active' : ''}`} onClick={() => setPeriodoAtivo('ano')}>Ano</button>
              </div>
              <button className="btn-new-expense" onClick={handleShowAdd}>
                <FaPlus /> Nova Despesa
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'white' }} />
            </div>
          ) : (
            <>
              <div className="chart-panel">
                <h3>Evolução de Custos no Período</h3>
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <AreaChart data={getDadosGraficoFiltrados()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF4C4C" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#FF4C4C" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
                      <XAxis dataKey="label" stroke="#8898AA" tick={{ fontSize: 11, fontWeight: 500 }} tickLine={false} />
                      <YAxis stroke="#8898AA" tick={{ fontSize: 11, fontWeight: 500 }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="valor" stroke="#C62828" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesas)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="stats-grid">
                <div className="mini-stat-card theme-red">
                  <div className="mini-icon-circle"><FaMoneyBillWave /></div>
                  <div className="mini-stat-info">
                    <span>Total Consumido</span>
                    <h4>{money(totalFiltradoAcumulado)}</h4>
                  </div>
                </div>
                <div className="mini-stat-card theme-blue">
                  <div className="mini-icon-circle"><FaClock /></div>
                  <div className="mini-stat-info">
                    <span>Nº de Despesas</span>
                    <h4>{quantidadeFiltrada} registros</h4>
                  </div>
                </div>
              </div>

              <div className="filters-panel">
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group className="position-relative">
                      <Form.Control 
                        type="text" 
                        placeholder="Pesquisar por descrição..." 
                        className="custom-input ps-5" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                      />
                      <FaSearch className="position-absolute text-muted" style={{ left: 18, top: 16 }} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="position-relative">
                      <Form.Select 
                        className="custom-input ps-5" 
                        value={filterCategoria} 
                        onChange={(e) => setFilterCategoria(e.target.value)}
                      >
                        <option value="TODOS">Todas as Categorias</option>
                        <option value="FIXA">Fixa</option>
                        <option value="VARIAVEL">Variável</option>
                        <option value="INVESTIMENTO">Investimento</option>
                      </Form.Select>
                      <FaFilter className="position-absolute text-muted" style={{ left: 18, top: 16 }} />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              <div className="table-panel">
                <Table responsive className="clean-table m-0">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th className="text-end">Valor</th>
                      <th className="text-end">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted">
                          Nenhuma despesa encontrada para os critérios selecionados.
                        </td>
                      </tr>
                    ) : (
                      despesasFiltradas.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="date-cell">
                              <FaCalendarDay className="text-muted" />
                              {formatDate(item.data)}
                            </div>
                          </td>
                          <td><span className="desc-text">{item.descricao}</span></td>
                          <td>
                            <span className={`cat-badge ${getBadgeClass(item.categoria)}`}>
                              {item.categoria || 'FIXA'}
                            </span>
                          </td>
                          <td className="text-end"><span className="value-text">{money(item.valor)}</span></td>
                          <td className="text-end">
                            <div className="actions-cell">
                              <button className="btn-icon-action act-edit" onClick={() => handleShowEdit(item)} title="Editar">
                                <FaEdit />
                              </button>
                              <button className="btn-icon-action act-delete" onClick={() => handleDelete(item.id)} title="Excluir">
                                <FaTrash />
                              </button>
                            </div>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="modal-clean-header">
          <Modal.Title style={{ fontFamily: 'Libre Baskerville', fontWeight: 700, fontSize: '1.3rem' }}>
            {formData.id ? 'Editar Registro de Despesa' : 'Cadastrar Nova Despesa'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4" style={{ background: '#FAFBFC' }}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-600 text-muted small uppercase">Descrição do Custo</Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    className="custom-input" 
                    placeholder="Ex: Aluguel da sala, Conta de luz, Compra de insumos"
                    value={formData.descricao} 
                    onChange={e => setFormData({ ...formData, descricao: e.target.value })} 
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-600 text-muted small uppercase">Valor (R$)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    required 
                    className="custom-input" 
                    placeholder="0,00"
                    value={formData.valor} 
                    onChange={e => setFormData({ ...formData, valor: e.target.value })} 
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-600 text-muted small uppercase">Data da Saída</Form.Label>
                  <Form.Control 
                    type="date" 
                    required 
                    className="custom-input" 
                    value={formData.data_despesa} 
                    onChange={e => setFormData({ ...formData, data_despesa: e.target.value })} 
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-600 text-muted small uppercase">Classificação / Categoria</Form.Label>
                  <Form.Select 
                    className="custom-input"
                    value={formData.categoria} 
                    onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                  >
                    <option value="FIXA">Fixa (Custos estruturais e recorrentes)</option>
                    <option value="VARIAVEL">Variável (Insumos, comissões, manutenções)</option>
                    <option value="INVESTIMENTO">Investimento (Marketing, cursos, equipamentos novos)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 p-3" style={{ background: '#F8F9FA' }}>
            <Button variant="link" className="text-muted fw-600 decoration-none" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" style={{ background: '#002B55', border: 'none', borderRadius: '10px', padding: '10px 25px', fontWeight: 600 }}>
              {formData.id ? 'Salvar Alterações' : 'Confirmar Saída'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}