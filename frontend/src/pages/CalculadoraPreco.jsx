import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button, OverlayTrigger, Tooltip, Badge, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FaArrowLeft, FaCalculator, FaStore, FaLightbulb, 
  FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaSyncAlt, FaListUl, FaChartLine, FaDatabase
} from 'react-icons/fa';

export default function CalculadoraPreco() {
  const navigate = useNavigate();
  const { setNotification } = useAuth();

  // --- ESTADOS GERAIS ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(false);
  
  // --- DADOS DA EMPRESA ---
  const [gastosFixos, setGastosFixos] = useState(0); // Começa zerado para carregar do banco
  const [horasTrabalhoDia, setHorasTrabalhoDia] = useState(8);
  const [diasTrabalhoMes, setDiasTrabalhoMes] = useState(22);

  // --- MODAL DE DETALHAMENTO DE CUSTOS (MANUAL) ---
  const [showModalCustos, setShowModalCustos] = useState(false);
  const [detalhesCustos, setDetalhesCustos] = useState({
      aluguel: 0, contas: 0, sistemas: 0, salarioDono: 0, outros: 0
  });

  // --- SELEÇÃO DE SERVIÇO ---
  const [meusServicos, setMeusServicos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);

  // --- VARIÁVEIS DO CÁLCULO ---
  const [tempoServico, setTempoServico] = useState(60); 
  const [custoMateriais, setCustoMateriais] = useState(10); 
  const [margemLucro, setMargemLucro] = useState(30); 

  // --- RESULTADOS ---
  const [custoHora, setCustoHora] = useState(0);
  const [custoMaoDeObra, setCustoMaoDeObra] = useState(0);
  const [precoSugerido, setPrecoSugerido] = useState(0);
  const [lucroReal, setLucroReal] = useState(0);
  const [pontoEquilibrio, setPontoEquilibrio] = useState(0);

  // 1. CARREGAR DADOS INICIAIS (SERVIÇOS + FINANCEIRO)
  useEffect(() => {
    async function fetchData() {
        try {
            // Busca Serviços
            const respServicos = await api.get('/servicos/');
            setMeusServicos(respServicos.data || []);

            // Busca Despesas do Financeiro (Reutilizando endpoint do Dashboard)
            await carregarDespesasDoBanco();

        } catch (error) {
            console.error("Erro ao carregar dados", error);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, []);

  // FUNÇÃO PARA BUSCAR DESPESAS REAIS
  const carregarDespesasDoBanco = async () => {
      setLoadingFinanceiro(true);
      try {
          const response = await api.get('/financeiro/transacoes/dashboard/');
          // O endpoint retorna { receita: X, despesas: Y, lucro: Z }
          const totalDespesas = parseFloat(response.data.despesas || 0);
          
          if (totalDespesas > 0) {
              setGastosFixos(totalDespesas);
              // Notificação sutil que atualizou
              // setNotification({ type: 'info', message: 'Custos fixos atualizados com base no financeiro.' });
          } else {
              // Se não tiver despesa cadastrada, mantem um valor padrão ou 0
              if(gastosFixos === 0) setGastosFixos(2000); 
          }
      } catch (error) {
          console.error("Erro ao buscar financeiro", error);
      } finally {
          setLoadingFinanceiro(false);
      }
  };

  // 2. SELECIONAR SERVIÇO
  const handleSelectServico = (id) => {
      const servico = meusServicos.find(s => String(s.id) === String(id));
      if (servico) {
          setServicoSelecionado(servico);
          setTempoServico(servico.duracao_minutos || 60);
      } else {
          setServicoSelecionado(null);
          setTempoServico(60);
      }
  };

  // 3. CÁLCULOS PRINCIPAIS (Reage a mudanças)
  useEffect(() => {
    const horasMensais = horasTrabalhoDia * diasTrabalhoMes;
    const valorHoraTecnica = horasMensais > 0 ? (gastosFixos / horasMensais) : 0;
    
    const custoTempoServico = (valorHoraTecnica / 60) * tempoServico;
    const custoTotal = custoTempoServico + parseFloat(custoMateriais || 0);
    
    const precoFinal = custoTotal * (1 + (margemLucro / 100));
    
    const margemContribuicao = precoFinal - parseFloat(custoMateriais || 0);
    const qtdEquilibrio = margemContribuicao > 0 ? Math.ceil(gastosFixos / margemContribuicao) : 0;

    setCustoHora(valorHoraTecnica);
    setCustoMaoDeObra(custoTempoServico);
    setPrecoSugerido(precoFinal);
    setLucroReal(precoFinal - custoTotal);
    setPontoEquilibrio(qtdEquilibrio);

  }, [gastosFixos, horasTrabalhoDia, diasTrabalhoMes, tempoServico, custoMateriais, margemLucro]);

  // 4. ATUALIZAR PREÇO NO BANCO
  const handleSalvarNovoPreco = async () => {
      if(!servicoSelecionado) return;
      setSaving(true);
      try {
          await api.patch(`/servicos/${servicoSelecionado.id}/`, {
              preco: precoSugerido.toFixed(2)
          });
          setNotification({ type: 'success', message: `Preço atualizado com sucesso!` });
          
          setMeusServicos(prev => prev.map(s => 
              s.id === servicoSelecionado.id ? {...s, preco: precoSugerido.toFixed(2)} : s
          ));
          setServicoSelecionado(prev => ({...prev, preco: precoSugerido.toFixed(2)}));
      } catch (error) {
          setNotification({ type: 'error', message: "Erro ao atualizar o preço." });
      } finally {
          setSaving(false);
      }
  };

  // 5. SOMAR DETALHES DO MODAL MANUAL
  const handleSomarCustosManuais = () => {
      const total = 
        Number(detalhesCustos.aluguel) + Number(detalhesCustos.contas) + 
        Number(detalhesCustos.sistemas) + Number(detalhesCustos.salarioDono) + 
        Number(detalhesCustos.outros);
      setGastosFixos(total);
      setShowModalCustos(false);
  };

  const money = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const precoAtual = servicoSelecionado ? parseFloat(servicoSelecionado.preco) : 0;
  const diferenca = precoSugerido - precoAtual;

  return (
    <div className="calc-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .calc-page { min-height: 100vh; background-color: #A8DADC; font-family: 'Inter', sans-serif; padding: 40px 20px; }
        .container-limit { max-width: 1200px; margin: 0 auto; }
        .page-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
        .btn-back-circle { width: 50px; height: 50px; border-radius: 50%; background: white; border: none; color: #002B55; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition: 0.2s; }
        .btn-back-circle:hover { transform: scale(1.1); background: #002B55; color: white; }
        .premium-card { background: white; border-radius: 20px; padding: 25px; border: none; box-shadow: 0 10px 25px rgba(0,43,85,0.05); height: 100%; position: relative; display: flex; flex-direction: column; }
        .card-title-custom { font-family: 'Libre Baskerville'; font-size: 1.1rem; color: #002B55; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #F1F3F5; padding-bottom: 15px; }
        .input-label { font-size: 0.75rem; font-weight: 700; color: #8898AA; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; }
        .custom-input { border: 2px solid #F1F3F5; background: #FAFBFC; border-radius: 12px; padding: 10px; color: #002B55; font-weight: 600; }
        .custom-input:focus { border-color: #002B55; background: white; outline: none; box-shadow: none; }
        .service-selector { border: 2px solid #002B55; background: #fff; padding: 12px; border-radius: 12px; font-weight: bold; color: #002B55; width: 100%; cursor: pointer; }
        .result-highlight { background: #002B55; color: white; border-radius: 15px; padding: 25px; text-align: center; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(0,43,85,0.2); }
        .result-value { font-family: 'Libre Baskerville'; font-size: 2.5rem; font-weight: 700; margin: 5px 0; }
        .breakeven-box { background: #FFF8E1; border: 1px solid #FFECB3; color: #F57F17; padding: 10px; border-radius: 10px; font-size: 0.85rem; margin-top: 15px; display: flex; align-items: center; gap: 10px; }
        .btn-sync { border: none; background: transparent; color: #002B55; font-weight: bold; font-size: 0.8rem; display: flex; align-items: center; gap: 5px; cursor: pointer; padding: 0; }
        .btn-sync:hover { color: #2DCE89; text-decoration: underline; }
        @media (max-width: 992px) { .premium-card { margin-bottom: 20px; } }
      `}</style>

      <div className="container-limit">
        <div className="page-header">
            <button className="btn-back-circle" onClick={() => navigate('/admin-dashboard')}>
                <FaArrowLeft />
            </button>
            <div className="title-group">
                <h2 style={{fontFamily: 'Libre Baskerville', fontWeight: 700, color: '#002B55', margin: 0}}>Precificação</h2>
                <span className="text-muted">Integração Financeira Ativa</span>
            </div>
        </div>

        <Row className="g-4">
            
            {/* 1. SELEÇÃO DO SERVIÇO */}
            <Col lg={4}>
                <div className="premium-card">
                    <div className="card-title-custom">
                        <FaCalculator /> Selecione o Serviço
                    </div>
                    {loading ? <div className="text-center p-3"><Spinner size="sm"/></div> : (
                        <Form.Group className="mb-4">
                            <div className="input-label">Qual serviço vamos calcular?</div>
                            <Form.Select className="service-selector" onChange={(e) => handleSelectServico(e.target.value)} value={servicoSelecionado?.id || ""}>
                                <option value="">-- Escolha um serviço --</option>
                                {meusServicos.map(s => (
                                    <option key={s.id} value={s.id}>{s.nome} (Atual: {money(s.preco)})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    )}
                    <hr className="my-4" style={{opacity: 0.1}}/>
                    <Form.Group className="mb-3">
                        <div className="input-label">Tempo (min)</div>
                        <Form.Control type="number" className="custom-input" value={tempoServico} onChange={(e) => setTempoServico(Number(e.target.value))} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <div className="input-label">
                            Custo Materiais (R$)
                            <OverlayTrigger placement="top" overlay={<Tooltip>Gasto extra por cliente.</Tooltip>}>
                                <FaInfoCircle style={{cursor:'help', color:'#002B55', marginLeft:5}}/>
                            </OverlayTrigger>
                        </div>
                        <Form.Control type="number" className="custom-input" value={custoMateriais} onChange={(e) => setCustoMateriais(Number(e.target.value))} />
                    </Form.Group>
                </div>
            </Col>

            {/* 2. CUSTOS FIXOS (INTEGRADO) */}
            <Col lg={4}>
                <div className="premium-card">
                    <div className="card-title-custom justify-content-between">
                        <span><FaStore /> Custos Fixos</span>
                    </div>
                    
                    <Form.Group className="mb-2">
                        <div className="input-label">
                            Gastos Mensais Totais
                            {loadingFinanceiro && <Spinner size="sm" className="ms-2"/>}
                        </div>
                        <InputGroup>
                            <InputGroup.Text style={{borderRadius: '12px 0 0 12px', background: 'white'}}>R$</InputGroup.Text>
                            <Form.Control type="number" className="custom-input" style={{borderRadius: '0 12px 12px 0'}} 
                                value={gastosFixos} onChange={(e) => setGastosFixos(Number(e.target.value))} />
                        </InputGroup>
                        <Form.Text className="text-muted small">Inclua salários e contas.</Form.Text>
                    </Form.Group>

                    {/* BARRA DE AÇÕES DOS CUSTOS */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                         <button className="btn-sync" onClick={carregarDespesasDoBanco} title="Puxar do Módulo Financeiro">
                             <FaDatabase /> Usar Financeiro
                         </button>
                         <button className="btn-sync" onClick={() => setShowModalCustos(true)} style={{color:'#666'}} title="Somar Manualmente">
                             <FaListUl /> Somar Manual
                         </button>
                    </div>

                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <div className="input-label">Horas/Dia</div>
                                <Form.Control type="number" className="custom-input" value={horasTrabalhoDia} onChange={(e) => setHorasTrabalhoDia(Number(e.target.value))} />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3">
                                <div className="input-label">Dias/Mês</div>
                                <Form.Control type="number" className="custom-input" value={diasTrabalhoMes} onChange={(e) => setDiasTrabalhoMes(Number(e.target.value))} />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="mt-3 p-2 rounded text-center bg-light border">
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize:'0.7rem'}}>Custo da Hora Técnica</small>
                        <div className="text-primary fw-bold">{money(custoHora)}</div>
                    </div>
                </div>
            </Col>

            {/* 3. ANÁLISE */}
            <Col lg={4}>
                <div className="premium-card" style={{border: '2px solid #002B55', background: '#F4F6F8'}}>
                    <div className="card-title-custom justify-content-center">
                        <FaLightbulb className="text-warning"/> Resultado
                    </div>

                    <div className="text-center mb-3">
                        <div className="input-label justify-content-center mb-2">Margem de Lucro</div>
                        <div className="d-flex align-items-center gap-2">
                            <input type="range" className="form-range" min="0" max="100" step="5" value={margemLucro} onChange={(e) => setMargemLucro(Number(e.target.value))} />
                            <Badge bg="primary" pill>{margemLucro}%</Badge>
                        </div>
                    </div>

                    <div className="result-highlight">
                        <div style={{fontSize:'0.75rem', textTransform:'uppercase', opacity:0.8}}>Preço Ideal</div>
                        <div className="result-value">{money(precoSugerido)}</div>
                    </div>

                    {servicoSelecionado && (
                        <div className="d-flex justify-content-between px-2 mb-3 small">
                            <span>Atual: <b>{money(precoAtual)}</b></span>
                            <span className={diferenca > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                                {diferenca > 0 ? `Subir ${money(diferenca)}` : 'Preço OK'}
                            </span>
                        </div>
                    )}
                    
                    <div className="breakeven-box">
                        <FaChartLine size={20} />
                        <div>Ponto de Equilíbrio: <b>{pontoEquilibrio}</b> serviços/mês para pagar os custos fixos.</div>
                    </div>

                    <Button 
                        className="w-100 mt-4 rounded-pill py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" 
                        style={{background: servicoSelecionado ? '#2DCE89' : '#ccc', border:'none', pointerEvents: servicoSelecionado ? 'all' : 'none'}}
                        onClick={handleSalvarNovoPreco}
                        disabled={saving || !servicoSelecionado}
                    >
                        {saving ? <Spinner size="sm"/> : <><FaSyncAlt /> Atualizar Preço</>}
                    </Button>
                </div>
            </Col>
        </Row>
      </div>

      {/* MODAL MANUAL (MANTIDO CASO QUEIRA CALCULAR FORA DO SISTEMA) */}
      <Modal show={showModalCustos} onHide={() => setShowModalCustos(false)} centered>
          <Modal.Header closeButton><Modal.Title>Somar Custos Manualmente</Modal.Title></Modal.Header>
          <Modal.Body>
              {/* Campos do modal iguais ao anterior... */}
              <Form.Group className="mb-2"><Form.Label>Aluguel</Form.Label><Form.Control type="number" value={detalhesCustos.aluguel} onChange={e => setDetalhesCustos({...detalhesCustos, aluguel: e.target.value})} /></Form.Group>
              <Form.Group className="mb-2"><Form.Label>Contas</Form.Label><Form.Control type="number" value={detalhesCustos.contas} onChange={e => setDetalhesCustos({...detalhesCustos, contas: e.target.value})} /></Form.Group>
              <Form.Group className="mb-2"><Form.Label>Sistemas</Form.Label><Form.Control type="number" value={detalhesCustos.sistemas} onChange={e => setDetalhesCustos({...detalhesCustos, sistemas: e.target.value})} /></Form.Group>
              <Form.Group className="mb-2"><Form.Label>Salário (Pró-labore)</Form.Label><Form.Control type="number" value={detalhesCustos.salarioDono} onChange={e => setDetalhesCustos({...detalhesCustos, salarioDono: e.target.value})} /></Form.Group>
              <Form.Group className="mb-2"><Form.Label>Outros</Form.Label><Form.Control type="number" value={detalhesCustos.outros} onChange={e => setDetalhesCustos({...detalhesCustos, outros: e.target.value})} /></Form.Group>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModalCustos(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSomarCustosManuais}>Usar Soma</Button>
          </Modal.Footer>
      </Modal>

    </div>
  );
}