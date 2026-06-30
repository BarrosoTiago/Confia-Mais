import { useState, useEffect } from 'react';
import { Row, Col, Form, InputGroup, Button, Badge, Spinner, Modal, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';

import {
  FaArrowLeft, FaCalculator, FaStore, FaInfoCircle,
  FaExclamationTriangle, FaSyncAlt, FaListUl, FaChartLine,
  FaDatabase, FaClock, FaBoxOpen, FaCheckCircle, FaTag
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, Legend, PieChart, Pie
} from 'recharts';

// ── Tooltip simples inline ──────────────────────────────────────────────────
function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span style={{
          position: 'absolute', bottom: '130%', left: '50%',
          transform: 'translateX(-50%)',
          background: '#002B55', color: '#fff',
          fontSize: '0.72rem', fontWeight: 500,
          padding: '6px 10px', borderRadius: 8,
          zIndex: 999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
          lineHeight: 1.4,
          maxWidth: 220, 
          whiteSpace: 'normal', 
          textAlign: 'center',
        }}>
          {text}
          <span style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            border: '5px solid transparent',
            borderTopColor: '#002B55',
          }} />
        </span>
      )}
    </span>
  );
}

export default function CalculadoraPreco() {
  const navigate = useNavigate();
  const { setNotification } = useAuth();

  const [tipoGrafico, setTipoGrafico] = useState('barra');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(false);

  const [gastosFixos, setGastosFixos] = useState(0);
  const [horasTrabalhoDia, setHorasTrabalhoDia] = useState(8);
  const [diasTrabalhoMes, setDiasTrabalhoMes] = useState(22);

  const [showModalCustos, setShowModalCustos] = useState(false);
  const [detalhesCustos, setDetalhesCustos] = useState({
    aluguel: 0, contas: 0, sistemas: 0, salarioDono: 0, outros: 0
  });

  const [meusServicos, setMeusServicos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);

  const [tempoServico, setTempoServico] = useState(60);
  const [custoMateriais, setCustoMateriais] = useState(10);
  const [margemLucro, setMargemLucro] = useState(30);
  const [margemPadrao, setMargemPadrao] = useState(30);

  const [custoHora, setCustoHora] = useState(0);
  const [custoMaoDeObra, setCustoMaoDeObra] = useState(0);
  const [precoSugerido, setPrecoSugerido] = useState(0);
  const [lucroReal, setLucroReal] = useState(0);
  const [pontoEquilibrio, setPontoEquilibrio] = useState(0);
  const [alertas, setAlertas] = useState([]);

  // Quais passos o usuário já preencheu (para feedback visual progressivo)
  const passo1Ok = gastosFixos > 0;
  const passo2Ok = passo1Ok && servicoSelecionado !== null;

  useEffect(() => {
    async function fetchData() {
      try {
        const respServicos = await api.get('/servicos/');
        setMeusServicos(respServicos.data || []);
        try {
          const respCalc = await api.get('/calculadora/');
          const calc = respCalc.data?.[0];
          if (calc) {
            const margem = parseFloat(calc.margem_lucro_padrao) || 30;
            setMargemLucro(margem);
            setMargemPadrao(margem);
            setHorasTrabalhoDia(calc.horas_trabalho_mes ? Math.round(calc.horas_trabalho_mes / 22) : 8);
            if (parseFloat(calc.custo_fixo_mensal) > 0) setGastosFixos(parseFloat(calc.custo_fixo_mensal));
          }
        } catch (_) {}
        await carregarDespesasDoBanco();
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const carregarDespesasDoBanco = async () => {
    setLoadingFinanceiro(true);
    try {
      const response = await api.get('/financeiro/despesas-periodo/?periodo=mes');
      const totalDespesas = parseFloat(response.data.total_acumulado || 0);
      if (totalDespesas > 0) {
        setGastosFixos(totalDespesas);
        setNotification({ type: 'info', message: 'Custos sincronizados com as despesas cadastradas neste mês.' });
      } else {
        setNotification({ type: 'warning', message: 'Nenhuma despesa cadastrada este mês. Preencha os custos manualmente.' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Não foi possível carregar as despesas do financeiro.' });
    } finally {
      setLoadingFinanceiro(false);
    }
  };

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

  useEffect(() => {
    const horasMensais = horasTrabalhoDia * diasTrabalhoMes;
    const valorHoraTecnica = horasMensais > 0 ? (gastosFixos / horasMensais) : 0;
    const custoTempoServico = (valorHoraTecnica / 60) * tempoServico;
    const custoTotal = custoTempoServico + parseFloat(custoMateriais || 0);
    const precoFinal = custoTotal * (1 + (margemLucro / 100));
    const margemContribuicao = precoFinal - parseFloat(custoMateriais || 0);
    const qtdEquilibrio = margemContribuicao > 0 ? Math.ceil(gastosFixos / margemContribuicao) : 0;
    const lucro = precoFinal - custoTotal;

    setCustoHora(valorHoraTecnica);
    setCustoMaoDeObra(custoTempoServico);
    setPrecoSugerido(precoFinal);
    setLucroReal(lucro);
    setPontoEquilibrio(qtdEquilibrio);

    const novosAlertas = [];
    if (gastosFixos === 0) novosAlertas.push({ tipo: 'danger', msg: 'Custos fixos zerados. O preço calculado não reflete a realidade do seu negócio.' });
    if (servicoSelecionado) {
      // Usa margemPadrao (salva na API) para comparar, não a margem atual do slider
      const horasMensaisPadrao = horasTrabalhoDia * diasTrabalhoMes;
      const custoHoraPadrao = horasMensaisPadrao > 0 ? (gastosFixos / horasMensaisPadrao) : 0;
      const custoMaoDeObraPadrao = (custoHoraPadrao / 60) * tempoServico;
      const custoTotalPadrao = custoMaoDeObraPadrao + parseFloat(custoMateriais || 0);
      const precoComMargPadrao = custoTotalPadrao * (1 + (margemPadrao / 100));
      const precoAtualNum = parseFloat(servicoSelecionado.preco);
      const diferencaAlerta = precoComMargPadrao - precoAtualNum;
      const pct = precoAtualNum > 0 ? (diferencaAlerta / precoAtualNum) * 100 : 0;
      if (pct > 30) novosAlertas.push({ tipo: 'danger', msg: `Preço atual ${pct.toFixed(0)}% abaixo do ideal — risco de prejuízo por atendimento.` });
      else if (pct > 10) novosAlertas.push({ tipo: 'warning', msg: `Preço atual ${pct.toFixed(0)}% abaixo do ideal. Reajuste gradual recomendado.` });
    }
    if (margemLucro < 15) novosAlertas.push({ tipo: 'warning', msg: 'Margem abaixo de 15%. Qualquer imprevisto pode zerar o lucro.' });
    if (custoMateriais === 0) novosAlertas.push({ tipo: 'warning', msg: 'Nenhum custo de material informado. Há insumos neste serviço?' });
    setAlertas(novosAlertas);
  }, [gastosFixos, horasTrabalhoDia, diasTrabalhoMes, tempoServico, custoMateriais, margemLucro, servicoSelecionado]);

  const salvarParametrosCalculadora = async () => {
    try {
      const payload = {
        custo_fixo_mensal: gastosFixos,
        horas_trabalho_mes: horasTrabalhoDia * diasTrabalhoMes,
        margem_lucro_padrao: margemLucro,
      };
      const respGet = await api.get('/calculadora/');
      const calc = respGet.data?.[0];
      if (calc) await api.patch(`/calculadora/${calc.id}/`, payload);
      else await api.post('/calculadora/', payload);
    } catch (error) {
      console.error("Erro ao salvar calculadora:", error);
    }
  };

  const handleSalvarNovoPreco = async () => {
    if (!servicoSelecionado) return;
    setSaving(true);
    try {
      await api.patch(`/servicos/${servicoSelecionado.id}/`, { preco: precoSugerido.toFixed(2) });
      await salvarParametrosCalculadora();
      setNotification({ type: 'success', message: 'Preço e configurações salvos com sucesso!' });
      setMeusServicos(prev => prev.map(s => s.id === servicoSelecionado.id ? { ...s, preco: precoSugerido.toFixed(2) } : s));
      setServicoSelecionado(prev => ({ ...prev, preco: precoSugerido.toFixed(2) }));
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao atualizar o preço.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSomarCustosManuais = () => {
    const total = Number(detalhesCustos.aluguel) + Number(detalhesCustos.contas) +
      Number(detalhesCustos.sistemas) + Number(detalhesCustos.salarioDono) + Number(detalhesCustos.outros);
    setGastosFixos(total);
    setShowModalCustos(false);
  };

  const money = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const precoAtual = servicoSelecionado ? parseFloat(servicoSelecionado.preco) : 0;
  const diferenca = precoSugerido - precoAtual;
  const margemColor = margemLucro < 15 ? '#F5365C' : margemLucro < 25 ? '#FB6340' : '#2DCE89';
  const precoOk = servicoSelecionado && diferenca <= 0;

  const precoHeroLabel = (() => {
    if (precoOk) return 'Seu preço atual já está dentro do ideal';
    if (margemLucro < 15) return 'Atenção: preço no limite do risco';
    if (margemLucro < 30) return `Preço com ${margemLucro}% de lucro garantido`;
    return `Preço saudável com ${margemLucro}% de lucro`;
  })();

  return (
    <>
      <AnimatedBackground />
      <div className="calc-root">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

          /* ── ROOT ── */
          .calc-root {
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            padding: 36px 20px 60px;
          }
          .calc-wrap { max-width: 1200px; margin: 0 auto; }

          /* ── HEADER ── */
          .calc-header {
            display: flex;
            align-items: center;
            gap: 18px;
            margin-bottom: 32px;
          }
          .btn-back {
            width: 44px; height: 44px; border-radius: 50%;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.25);
            color: #fff; font-size: 1.1rem;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: background 0.2s;
            backdrop-filter: blur(4px);
          }
          .btn-back:hover { background: rgba(255,255,255,0.28); }
          .calc-header h1 {
            font-family: 'Libre Baskerville', serif;
            font-size: 1.75rem; font-weight: 700;
            color: #fff; margin: 0;
            line-height: 1.1;
          }
          .calc-header p { color: rgba(255,255,255,0.65); margin: 2px 0 0; font-size: 0.875rem; }

          /* ── BARRA DE PROGRESSO ── */
          .progress-bar-wrap {
            display: flex;
            align-items: center;
            gap: 0;
            margin-bottom: 28px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 14px;
            padding: 14px 20px;
            backdrop-filter: blur(4px);
          }
          .progress-step {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
          }
          .progress-step-num {
            width: 28px; height: 28px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.72rem; font-weight: 800;
            flex-shrink: 0;
            transition: all 0.25s;
          }
          .progress-step-num.done { background: #2DCE89; color: #fff; }
          .progress-step-num.active { background: #fff; color: #002B55; }
          .progress-step-num.idle { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.4); }
          .progress-step-text { line-height: 1.2; }
          .progress-step-title {
            font-size: 0.72rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.6px;
            transition: color 0.25s;
          }
          .progress-step-title.done { color: #2DCE89; }
          .progress-step-title.active { color: #fff; }
          .progress-step-title.idle { color: rgba(255,255,255,0.35); }
          .progress-step-sub {
            font-size: 0.67rem;
            color: rgba(255,255,255,0.4);
          }
          .progress-connector {
            width: 32px; height: 2px;
            border-radius: 1px;
            margin: 0 8px;
            flex-shrink: 0;
            transition: background 0.25s;
          }
          .progress-connector.done { background: #2DCE89; }
          .progress-connector.idle { background: rgba(255,255,255,0.12); }

          /* ── ALERTAS ── */
          .calc-alerts { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
          .calc-alert {
            display: flex; align-items: flex-start; gap: 10px;
            padding: 12px 16px; border-radius: 10px;
            font-size: 0.85rem; font-weight: 500;
          }
          .calc-alert.danger { background: #FEE2E2; color: #991B1B; border-left: 4px solid #F5365C; }
          .calc-alert.warning { background: #FEF3C7; color: #92400E; border-left: 4px solid #FB6340; }
          .calc-alert svg { flex-shrink: 0; margin-top: 2px; }

          /* ── CARDS ── */
          .calc-card {
            background: rgba(255,255,255,0.97);
            border-radius: 20px;
            padding: 28px;
            box-shadow: 0 8px 32px rgba(0,43,85,0.10);
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 0;
            transition: box-shadow 0.2s, opacity 0.2s;
          }
          .calc-card.dimmed {
            opacity: 0.55;
            pointer-events: none;
          }
          .calc-card-dark {
            background: #002B55;
            border-radius: 20px;
            padding: 28px;
            box-shadow: 0 8px 32px rgba(0,43,85,0.30);
            height: 100%;
            display: flex;
            flex-direction: column;
            transition: opacity 0.2s;
          }
          .calc-card-dark.dimmed {
            opacity: 0.5;
            pointer-events: none;
          }

          /* ── CARD TITLES ── */
          .calc-card-title {
            display: flex; align-items: center; gap: 10px;
            font-size: 0.7rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 1.2px;
            color: #8898AA;
            margin-bottom: 4px;
            padding-bottom: 14px;
            border-bottom: 1px solid #F1F3F5;
          }
          .calc-card-title svg { color: #002B55; font-size: 0.9rem; }
          .calc-card-title .step-badge {
            width: 22px; height: 22px;
            border-radius: 50%;
            background: #002B55;
            color: #fff;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.65rem; font-weight: 800;
            flex-shrink: 0;
          }
          .calc-card-title .step-badge.done { background: #2DCE89; }

          .calc-card-dark .calc-card-title {
            color: rgba(255,255,255,0.45);
            border-bottom-color: rgba(255,255,255,0.1);
          }
          .calc-card-dark .calc-card-title svg { color: rgba(255,255,255,0.6); }
          .calc-card-dark .calc-card-title .step-badge { background: rgba(255,255,255,0.15); }

          /* ── CARD SUBTITLE ── */
          .calc-card-subtitle {
            font-size: 0.75rem;
            color: #8898AA;
            margin-bottom: 20px;
            margin-top: 2px;
            line-height: 1.4;
          }
          .calc-card-dark .calc-card-subtitle { color: rgba(255,255,255,0.35); }

          /* ── FIELD LABEL ── */
          .field-label {
            font-size: 0.7rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.8px;
            color: #8898AA; margin-bottom: 6px;
            display: flex; align-items: center; justify-content: space-between;
            gap: 6px;
          }
          .field-label-inner { display: flex; align-items: center; gap: 5px; }

          /* ── INPUTS ── */
          .calc-input {
            border: 1.5px solid #E9ECEF !important;
            background: #F8F9FA !important;
            border-radius: 10px !important;
            padding: 11px 14px !important;
            color: #002B55 !important;
            font-weight: 600 !important;
            font-size: 0.95rem !important;
            transition: border-color 0.15s, background 0.15s;
          }
          .calc-input:focus {
            border-color: #002B55 !important;
            background: #fff !important;
            box-shadow: 0 0 0 3px rgba(0,43,85,0.08) !important;
          }
          .calc-select {
            border: 2px solid #002B55 !important;
            border-radius: 10px !important;
            padding: 12px 14px !important;
            color: #002B55 !important;
            font-weight: 700 !important;
            font-size: 0.9rem !important;
            background: #fff !important;
          }
          .calc-select:focus {
            box-shadow: 0 0 0 3px rgba(0,43,85,0.1) !important;
          }

          /* ── DIVIDER ── */
          .calc-divider { height: 1px; background: #F1F3F5; margin: 20px 0; }

          /* ── STAT PILLS ── */
          .stat-pill {
            background: #F8F9FA;
            border: 1px solid #E9ECEF;
            border-radius: 10px;
            padding: 12px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .stat-pill-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #8898AA; letter-spacing: 0.5px; }
          .stat-pill-value { font-size: 1rem; font-weight: 700; color: #002B55; }

          /* ── FONTES / SYNC BUTTONS ── */
          .fonte-bar {
            display: flex; gap: 8px; margin-top: 8px; margin-bottom: 18px;
          }
          .fonte-btn {
            flex: 1; display: flex; align-items: center; justify-content: center;
            gap: 6px; padding: 9px 10px;
            border-radius: 8px; border: 1.5px solid #E9ECEF;
            background: #F8F9FA; color: #525F7F;
            font-size: 0.78rem; font-weight: 700;
            cursor: pointer; transition: all 0.15s;
          }
          .fonte-btn:hover { border-color: #002B55; background: #EEF2F7; color: #002B55; }
          .fonte-btn svg { font-size: 0.85rem; }
          .fonte-btn-hint {
            font-size: 0.68rem;
            color: #8898AA;
            margin-top: 5px;
            text-align: center;
          }

          /* ── HORA TÉCNICA BOX ── */
          .hora-box {
            background: linear-gradient(135deg, #002B55 0%, #004080 100%);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            margin-top: auto;
          }
          .hora-box-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.55); margin-bottom: 4px; }
          .hora-box-value { font-size: 1.4rem; font-weight: 800; color: #fff; font-family: 'Libre Baskerville', serif; }
          .hora-box-hint { font-size: 0.67rem; color: rgba(255,255,255,0.4); margin-top: 4px; }

          /* ── LUCRO POR SERVIÇO ── */
          .lucro-tag {
            display: flex; justify-content: space-between; align-items: center;
            background: #F0FDF4; border: 1.5px solid #BBF7D0;
            border-radius: 10px; padding: 12px 16px; margin-top: 16px;
          }
          .lucro-tag-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px; color: #166534; }
          .lucro-tag-value { font-size: 1.05rem; font-weight: 800; color: #16A34A; }

          /* ── ZONA 1: COMPOSIÇÃO ── */
          .zona-composicao {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 14px;
            padding: 16px 18px;
            margin-bottom: 14px;
          }
          .zona-label {
            font-size: 0.62rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 1.2px;
            color: rgba(255,255,255,0.3);
            margin-bottom: 12px;
          }
          .composicao-linha {
            display: flex; justify-content: space-between; align-items: center;
            padding: 5px 0;
          }
          .composicao-linha + .composicao-linha {
            border-top: 1px solid rgba(255,255,255,0.06);
          }
          .composicao-linha-label {
            font-size: 0.78rem; color: rgba(255,255,255,0.45); font-weight: 500;
          }
          .composicao-linha-valor {
            font-size: 0.82rem; color: rgba(255,255,255,0.65); font-weight: 700;
            font-variant-numeric: tabular-nums;
          }
          .composicao-divisor {
            height: 1px; background: rgba(255,255,255,0.15);
            margin: 10px 0 12px;
          }
          .composicao-total-label {
            font-size: 0.65rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 1px;
            color: rgba(255,255,255,0.4);
            margin-bottom: 2px;
          }
          .composicao-total-valor {
            font-family: 'Libre Baskerville', serif;
            font-size: 2.6rem; font-weight: 700;
            color: #fff; line-height: 1;
          }

          /* ── ZONA 2: COMPARAÇÃO ── */
          .zona-comparacao {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 14px;
            padding: 16px 18px;
            margin-bottom: 14px;
          }
          .comparacao-row {
            display: flex; justify-content: space-between; align-items: baseline;
            margin-bottom: 6px;
          }
          .comparacao-item-label {
            font-size: 0.72rem; color: rgba(255,255,255,0.4); font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.5px;
          }
          .comparacao-item-valor {
            font-size: 1rem; font-weight: 800;
            font-variant-numeric: tabular-nums;
          }
          .comparacao-barra-wrap {
            position: relative; height: 6px;
            background: rgba(255,255,255,0.1);
            border-radius: 3px; margin: 10px 0 8px; overflow: hidden;
          }
          .comparacao-barra-atual {
            position: absolute; left: 0; top: 0; bottom: 0;
            background: rgba(255,255,255,0.25);
            border-radius: 3px;
            transition: width 0.4s ease;
          }
          .comparacao-barra-ideal {
            position: absolute; left: 0; top: 0; bottom: 0;
            border-radius: 3px;
            transition: width 0.4s ease;
          }
          .comparacao-delta {
            font-size: 0.78rem; font-weight: 800;
            display: flex; align-items: center; gap: 5px;
          }

          /* ── ESTADO VAZIO DO RESULTADO ── */
          .resultado-vazio {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 32px 16px;
            gap: 12px;
          }
          .resultado-vazio-icon {
            width: 52px; height: 52px;
            border-radius: 50%;
            background: rgba(255,255,255,0.08);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem;
            color: rgba(255,255,255,0.3);
          }
          .resultado-vazio-title {
            font-size: 0.9rem; font-weight: 700;
            color: rgba(255,255,255,0.6);
          }
          .resultado-vazio-sub {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.3);
            line-height: 1.5;
            max-width: 200px;
          }
          .resultado-vazio-step {
            display: flex; align-items: center; gap: 8px;
            background: rgba(255,255,255,0.06);
            border-radius: 8px; padding: 8px 14px;
            font-size: 0.75rem; font-weight: 600;
            color: rgba(255,255,255,0.45);
            width: 100%;
          }
          .resultado-vazio-step-num {
            width: 20px; height: 20px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            display: flex; align-items: center; justify-content: center;
            font-size: 0.65rem; font-weight: 800;
            color: rgba(255,255,255,0.4);
            flex-shrink: 0;
          }

          /* ── ZONA 3: APOIO ── */
          .zona-apoio {
            display: flex; gap: 10px;
            margin-bottom: 14px;
          }
          .apoio-pill {
            flex: 1;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 12px 14px;
            display: flex; flex-direction: column; gap: 3px;
          }
          .apoio-pill-label {
            font-size: 0.62rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.8px;
            color: rgba(255,255,255,0.3);
          }
          .apoio-pill-valor {
            font-size: 1.1rem; font-weight: 800; color: #fff;
            font-variant-numeric: tabular-nums;
          }
          .apoio-pill-sub {
            font-size: 0.67rem; color: rgba(255,255,255,0.3); line-height: 1.3;
          }

          /* ── MARGEM SLIDER ── */
          .margem-section { margin-bottom: 20px; }
          .margem-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .margem-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(255,255,255,0.45); }
          .margem-badge {
            font-size: 0.9rem; font-weight: 800;
            padding: 4px 14px; border-radius: 20px;
            color: #fff;
          }
          .margem-risk { font-size: 0.72rem; color: #F5365C; font-weight: 700; margin-top: 6px; }
          input[type=range].margem-slider {
            width: 100%; height: 6px;
            border-radius: 3px; outline: none; border: none;
            -webkit-appearance: none; cursor: pointer;
          }
          input[type=range].margem-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px; height: 20px;
            border-radius: 50%; background: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          }

          /* ── BOTÃO SALVAR ── */
          .btn-salvar {
            width: 100%; padding: 15px;
            border-radius: 12px; border: none;
            font-size: 0.9rem; font-weight: 800;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            cursor: pointer; transition: all 0.2s;
            letter-spacing: 0.3px;
            margin-top: auto;
          }
          .btn-salvar:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); }
          .btn-salvar:disabled { opacity: 0.5; cursor: default; }

          /* ── MODAL ── */
          .modal-field-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #8898AA; margin-bottom: 5px; }


          /* ── SEÇÃO GRÁFICO ── */
          .grafico-section {
            max-width: 1200px; margin: 24px auto 0;
            background: rgba(255,255,255,0.97);
            border-radius: 20px;
            padding: 28px 32px;
            box-shadow: 0 8px 32px rgba(0,43,85,0.10);
          }
          .grafico-header {
            display: flex; align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 24px;
            flex-wrap: wrap; gap: 16px;
          }
          .grafico-title {
            font-size: 0.7rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 1.2px;
            color: #8898AA; margin-bottom: 4px;
            display: flex; align-items: center; gap: 8px;
          }
          .grafico-title svg { color: #002B55; }
          .grafico-subtitle {
            font-size: 0.78rem; color: #8898AA; margin: 0;
          }
          .grafico-legenda {
            display: flex; gap: 20px; align-items: center; flex-wrap: wrap;
          }
          .legenda-item {
            display: flex; align-items: center; gap: 6px;
            font-size: 0.75rem; font-weight: 600; color: #525F7F;
          }
          .legenda-dot {
            width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0;
          }
          .grafico-indicadores {
            display: flex; gap: 12px; margin-top: 28px;
            flex-wrap: wrap;
          }
          .indicador-card {
            flex: 1; min-width: 140px;
            background: #F8F9FA; border: 1px solid #E9ECEF;
            border-radius: 12px; padding: 14px 16px;
          }
          .indicador-label {
            font-size: 0.65rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.8px;
            color: #8898AA; margin-bottom: 6px;
            display: flex; align-items: center; gap: 6px;
          }
          .indicador-dot {
            width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0;
          }
          .indicador-valor {
            font-size: 1.3rem; font-weight: 800; color: #002B55;
            font-variant-numeric: tabular-nums;
          }
          .indicador-pct {
            font-size: 0.75rem; font-weight: 600; margin-top: 2px;
          }
          .grafico-empty {
            text-align: center; padding: 40px 20px;
            color: #8898AA; font-size: 0.85rem;
          }
          /* ── SEÇÃO GRÁFICO ── */
          .grafico-secao {
            margin-top: 28px;
            background: rgba(255,255,255,0.97);
            border-radius: 20px;
            padding: 28px 32px;
            box-shadow: 0 8px 32px rgba(0,43,85,0.10);
          }
          .grafico-header {
            display: flex; align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 28px;
            flex-wrap: wrap; gap: 16px;
          }
          .grafico-title {
            font-size: 0.7rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 1.2px;
            color: #8898AA; margin-bottom: 4px;
            display: flex; align-items: center; gap: 8px;
          }
          .grafico-title svg { color: #002B55; }
          .grafico-subtitle {
            font-size: 0.8rem; color: #525F7F; font-weight: 500;
          }
          .grafico-legenda {
            display: flex; gap: 20px; flex-wrap: wrap;
          }
          .legenda-item {
            display: flex; align-items: center; gap: 7px;
            font-size: 0.75rem; font-weight: 600; color: #525F7F;
          }
          .legenda-dot {
            width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0;
          }
          .grafico-indicadores {
            display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap;
          }
          .indicador-card {
            flex: 1; min-width: 140px;
            border-radius: 14px; padding: 16px 18px;
            display: flex; flex-direction: column; gap: 4px;
          }
          .indicador-label {
            font-size: 0.65rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.8px;
          }
          .indicador-valor {
            font-size: 1.4rem; font-weight: 800;
            font-family: 'Libre Baskerville', serif;
            line-height: 1.1;
          }
          .indicador-pct {
            font-size: 0.75rem; font-weight: 700;
          }
          .indicador-barra {
            height: 4px; border-radius: 2px;
            margin-top: 8px; background: rgba(0,0,0,0.08);
            overflow: hidden;
          }
          .indicador-barra-fill {
            height: 100%; border-radius: 2px;
            transition: width 0.4s ease;
          }

          /* ── RESPONSIVE ── */
          @media (max-width: 991px) {
            .calc-card, .calc-card-dark { margin-bottom: 16px; }
            .preco-hero-value { font-size: 2.2rem; }
            .progress-bar-wrap { flex-wrap: wrap; gap: 10px; }
            .progress-connector { display: none; }
          }
        `}</style>

        <div className="calc-wrap">

          {/* HEADER */}
          <div className="calc-header">
            <button className="btn-back" onClick={() => navigate('/admin-dashboard')}>
              <FaArrowLeft />
            </button>
            <div>
              <h1>Precificação</h1>
              <p>Descubra o preço real dos seus serviços — sem chute, com base nos seus custos</p>
            </div>
          </div>

          {/* BARRA DE PROGRESSO / FLUXO */}
          <div className="progress-bar-wrap">
            <div className="progress-step">
              <div className={`progress-step-num ${passo1Ok ? 'done' : 'active'}`}>
                {passo1Ok ? <FaCheckCircle size={11} /> : '1'}
              </div>
              <div className="progress-step-text">
                <div className={`progress-step-title ${passo1Ok ? 'done' : 'active'}`}>
                  Seus custos
                </div>
                <div className="progress-step-sub">Quanto você gasta por mês</div>
              </div>
            </div>
            <div className={`progress-connector ${passo1Ok ? 'done' : 'idle'}`} />
            <div className="progress-step">
              <div className={`progress-step-num ${passo2Ok ? 'done' : passo1Ok ? 'active' : 'idle'}`}>
                {passo2Ok ? <FaCheckCircle size={11} /> : '2'}
              </div>
              <div className="progress-step-text">
                <div className={`progress-step-title ${passo2Ok ? 'done' : passo1Ok ? 'active' : 'idle'}`}>
                  O serviço
                </div>
                <div className="progress-step-sub">Tempo e materiais usados</div>
              </div>
            </div>
            <div className={`progress-connector ${passo2Ok ? 'done' : 'idle'}`} />
            <div className="progress-step">
              <div className={`progress-step-num ${passo2Ok ? 'active' : 'idle'}`}>3</div>
              <div className="progress-step-text">
                <div className={`progress-step-title ${passo2Ok ? 'active' : 'idle'}`}>
                  Resultado
                </div>
                <div className="progress-step-sub">Preço ideal calculado</div>
              </div>
            </div>
          </div>

          {/* ALERTAS */}
          {alertas.length > 0 && (
            <div className="calc-alerts">
              {alertas.map((a, i) => (
                <div key={i} className={`calc-alert ${a.tipo}`}>
                  <FaExclamationTriangle />
                  <span>{a.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── NOVA ORDEM: Custos (1) → Serviço (2) → Resultado (3) ── */}
          <Row className="g-4 align-items-stretch">

            {/* ── COLUNA 1: CUSTOS ── */}
            <Col lg={4}>
              <div className="calc-card">
                <div className="calc-card-title">
                  <span className={`step-badge ${passo1Ok ? 'done' : ''}`}>
                    {passo1Ok ? <FaCheckCircle size={10} /> : '1'}
                  </span>
                  <FaStore /> Seus Custos Mensais
                </div>
                <p className="calc-card-subtitle">
                  Tudo que você paga todo mês para manter o negócio funcionando — aluguel, contas, sistemas e seu próprio salário.
                </p>

                {/* GASTOS MENSAIS */}
                <div className="field-label" style={{ marginBottom: 6 }}>
                  <span className="field-label-inner">
                    Total de gastos mensais
                    {loadingFinanceiro && <Spinner size="sm" style={{ width: 12, height: 12 }} />}
                  </span>
                </div>
                <InputGroup className="mb-2">
                  <InputGroup.Text style={{ background: '#F8F9FA', border: '1.5px solid #E9ECEF', borderRight: 'none', borderRadius: '10px 0 0 10px', color: '#8898AA', fontWeight: 700, fontSize: '0.8rem' }}>
                    R$
                  </InputGroup.Text>
                  <Form.Control
                    type="number"
                    className="calc-input"
                    style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                    value={gastosFixos}
                    onChange={e => setGastosFixos(Number(e.target.value))}
                  />
                </InputGroup>

                {gastosFixos === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: '#F5365C', fontWeight: 700, margin: '4px 0 0' }}>
                    ⚠ Preencha aqui para começar
                  </p>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: '#2DCE89', fontWeight: 600, margin: '4px 0 0' }}>
                    ✓ Custo base definido
                  </p>
                )}

                {/* FONTES */}
                <div className="fonte-bar" style={{ marginTop: 12 }}>
                  <button className="fonte-btn" onClick={carregarDespesasDoBanco} disabled={loadingFinanceiro}>
                    {loadingFinanceiro ? <Spinner size="sm" style={{ width: 11, height: 11 }} /> : <FaDatabase />}
                    Puxar do financeiro
                  </button>
                  <button className="fonte-btn" onClick={() => setShowModalCustos(true)}>
                    <FaListUl /> Preencher item a item
                  </button>
                </div>
                <p className="fonte-btn-hint">
                  Puxe as despesas já cadastradas no financeiro ou preencha manualmente abaixo
                </p>

                <div className="calc-divider" style={{ margin: '16px 0 20px' }} />

                {/* JORNADA */}
                <div className="field-label" style={{ marginBottom: 10 }}>
                  <span className="field-label-inner">
                    Sua jornada de trabalho
                    <Tooltip text="Usamos isso para calcular o custo de cada hora que você trabalha.">
                      <FaInfoCircle size={11} style={{ color: '#8898AA', cursor: 'help' }} />
                    </Tooltip>
                  </span>
                </div>
                <Row className="g-2 mb-4">
                  <Col>
                    <div className="field-label">Horas/dia</div>
                    <Form.Control
                      type="number"
                      className="calc-input"
                      value={horasTrabalhoDia}
                      onChange={e => setHorasTrabalhoDia(Number(e.target.value))}
                    />
                  </Col>
                  <Col>
                    <div className="field-label">Dias/mês</div>
                    <Form.Control
                      type="number"
                      className="calc-input"
                      value={diasTrabalhoMes}
                      onChange={e => setDiasTrabalhoMes(Number(e.target.value))}
                    />
                  </Col>
                </Row>

                {/* HORA TÉCNICA */}
                <div className="hora-box" style={{ marginTop: 'auto' }}>
                  <div className="hora-box-label">Custo da sua hora de trabalho</div>
                  <div className="hora-box-value">{money(custoHora)}</div>
                  <div className="hora-box-hint">
                    Seus custos ÷ horas disponíveis no mês
                  </div>
                </div>
              </div>
            </Col>

            {/* ── COLUNA 2: SERVIÇO ── */}
            <Col lg={4}>
              <div className={`calc-card ${!passo1Ok ? 'dimmed' : ''}`}>
                <div className="calc-card-title">
                  <span className={`step-badge ${passo2Ok ? 'done' : ''}`}>
                    {passo2Ok ? <FaCheckCircle size={10} /> : '2'}
                  </span>
                  <FaCalculator /> O Serviço
                </div>
                <p className="calc-card-subtitle">
                  {!passo1Ok
                    ? 'Preencha seus custos mensais primeiro (Passo 1) para liberar esta etapa.'
                    : 'Selecione um serviço e informe quanto tempo ele leva e o que você gasta de material.'
                  }
                </p>

                {/* SELETOR */}
                <div className="field-label" style={{ marginBottom: 6 }}>Qual serviço calcular?</div>
                {loading ? (
                  <div className="text-center py-3"><Spinner size="sm" style={{ color: '#002B55' }} /></div>
                ) : (
                  <Form.Select
                    className="calc-select mb-4"
                    onChange={e => handleSelectServico(e.target.value)}
                    value={servicoSelecionado?.id || ""}
                  >
                    <option value="">Escolha um serviço...</option>
                    {meusServicos.map(s => (
                      <option key={s.id} value={s.id}>{s.nome} — {money(s.preco)}</option>
                    ))}
                  </Form.Select>
                )}

                <div className="calc-divider" />

                {/* DURAÇÃO */}
                <div className="field-label" style={{ marginBottom: 6 }}>
                  <span className="field-label-inner">
                    <FaClock style={{ fontSize: '0.75rem' }} />
                    Duração do serviço
                    <Tooltip text="Quanto tempo você fica trabalhando neste serviço, do início ao fim.">
                      <FaInfoCircle size={11} style={{ color: '#8898AA', cursor: 'help' }} />
                    </Tooltip>
                  </span>
                </div>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="number"
                    className="calc-input"
                    value={tempoServico}
                    onChange={e => setTempoServico(Number(e.target.value))}
                  />
                  <InputGroup.Text style={{ background: '#F8F9FA', border: '1.5px solid #E9ECEF', borderLeft: 'none', borderRadius: '0 10px 10px 0', color: '#8898AA', fontWeight: 700, fontSize: '0.8rem' }}>
                    min
                  </InputGroup.Text>
                </InputGroup>

                {/* MATERIAIS */}
                <div className="field-label" style={{ marginBottom: 6 }}>
                  <span className="field-label-inner">
                    <FaBoxOpen style={{ fontSize: '0.75rem' }} />
                    Custo de materiais por atendimento
                    <Tooltip text="Produtos, insumos ou descartáveis consumidos neste serviço. Coloque 0 se não usar nada.">
                      <FaInfoCircle size={11} style={{ color: '#8898AA', cursor: 'help' }} />
                    </Tooltip>
                  </span>
                </div>
                <InputGroup className="mb-2">
                  <InputGroup.Text style={{ background: '#F8F9FA', border: '1.5px solid #E9ECEF', borderRight: 'none', borderRadius: '10px 0 0 10px', color: '#8898AA', fontWeight: 700, fontSize: '0.8rem' }}>
                    R$
                  </InputGroup.Text>
                  <Form.Control
                    type="number"
                    className="calc-input"
                    style={{ borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                    value={custoMateriais}
                    onChange={e => setCustoMateriais(Number(e.target.value))}
                  />
                </InputGroup>
                <p style={{ fontSize: '0.73rem', color: '#8898AA', margin: '4px 0 0' }}>
                  Ex: tinta, luvas, produtos de limpeza...
                </p>


              </div>
            </Col>

            {/* ── COLUNA 3: RESULTADO ── */}
            <Col lg={4}>
              <div className={`calc-card-dark ${!passo2Ok ? 'dimmed' : ''}`}>
                <div className="calc-card-title">
                  <span className="step-badge">3</span>
                  <FaChartLine /> Resultado
                </div>
                <p className="calc-card-subtitle">
                  {!passo2Ok
                    ? 'Complete os passos 1 e 2 para ver o preço ideal calculado.'
                    : 'Preço calculado com base nos seus custos reais.'
                  }
                </p>

                {/* ESTADO VAZIO */}
                {!passo2Ok ? (
                  <div className="resultado-vazio">
                    <div className="resultado-vazio-icon">
                      <FaCalculator />
                    </div>
                    <div className="resultado-vazio-title">Aguardando os dados</div>
                    <div className="resultado-vazio-sub">
                      Preencha os passos anteriores para ver o preço ideal calculado automaticamente.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 8 }}>
                      <div className="resultado-vazio-step">
                        <div className={`resultado-vazio-step-num`} style={{ background: passo1Ok ? '#2DCE8933' : undefined, color: passo1Ok ? '#2DCE89' : undefined }}>
                          {passo1Ok ? '✓' : '1'}
                        </div>
                        {passo1Ok ? 'Custos mensais definidos' : 'Informe seus custos mensais'}
                      </div>
                      <div className="resultado-vazio-step">
                        <div className="resultado-vazio-step-num">2</div>
                        Selecione um serviço
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ZONA 1 — COMPOSIÇÃO DO PREÇO */}
                    <div className="zona-composicao">
                      <div className="zona-label">Como o preço é formado</div>

                      <div className="composicao-linha">
                        <span className="composicao-linha-label">Mão de obra ({tempoServico} min)</span>
                        <span className="composicao-linha-valor">{money(custoMaoDeObra)}</span>
                      </div>
                      <div className="composicao-linha">
                        <span className="composicao-linha-label">Materiais por atendimento</span>
                        <span className="composicao-linha-valor">{money(custoMateriais)}</span>
                      </div>
                      <div className="composicao-linha">
                        <span className="composicao-linha-label">Margem de lucro ({margemLucro}%)</span>
                        <span className="composicao-linha-valor" style={{ color: margemColor }}>{money(precoSugerido - custoMaoDeObra - parseFloat(custoMateriais))}</span>
                      </div>

                      <div className="composicao-divisor" />

                      <div className="composicao-total-label">{precoHeroLabel}</div>
                      <div className="composicao-total-valor">{money(precoSugerido)}</div>
                    </div>

                    {/* ZONA 2 — COMPARAÇÃO COM PREÇO ATUAL */}
                    {servicoSelecionado && (
                      <div className="zona-comparacao">
                        <div className="zona-label">Comparação com o preço atual</div>

                        <div className="comparacao-row">
                          <span className="comparacao-item-label">Você cobra hoje</span>
                          <span className="comparacao-item-valor" style={{ color: 'rgba(255,255,255,0.6)' }}>{money(precoAtual)}</span>
                        </div>
                        <div className="comparacao-row">
                          <span className="comparacao-item-label">Preço calculado</span>
                          <span className="comparacao-item-valor" style={{ color: '#fff' }}>{money(precoSugerido)}</span>
                        </div>

                        <div className="comparacao-barra-wrap">
                          <div
                            className="comparacao-barra-atual"
                            style={{ width: `${Math.min((precoAtual / precoSugerido) * 100, 100)}%` }}
                          />
                          <div
                            className="comparacao-barra-ideal"
                            style={{
                              width: '100%',
                              background: precoOk ? '#2DCE89' : 'rgba(255,255,255,0.08)',
                              border: precoOk ? 'none' : '1px dashed rgba(255,255,255,0.2)',
                            }}
                          />
                        </div>

                        <div className="comparacao-delta" style={{ color: precoOk ? '#2DCE89' : '#F5365C' }}>
                          {precoOk
                            ? <><FaCheckCircle /> Preço atual já cobre o ideal</>
                            : <>▲ Reajuste necessário de {money(diferenca)}</>
                          }
                        </div>
                      </div>
                    )}

{/* ZONA 3 — APOIO: equilíbrio + lucro */}
                    <div className="zona-apoio">
                      <div className="apoio-pill">
                        <span className="apoio-pill-label">Ponto de equilíbrio</span>
                        <span className="apoio-pill-valor">{pontoEquilibrio}×/mês</span>
                        <span className="apoio-pill-sub">atendimentos para cobrir os custos fixos</span>
                      </div>
                      <div className="apoio-pill">
                        <span className="apoio-pill-label">Lucro por atendimento</span>
                        <span className="apoio-pill-valor" style={{ color: '#2DCE89' }}>{money(lucroReal)}</span>
                        <span className="apoio-pill-sub">com a margem atual de {margemLucro}%</span>
                      </div>
                    </div>

                    {/* MARGEM */}
                    <div className="margem-section">
                      <div className="margem-header">
                        <span className="margem-label">
                          Margem de lucro
                          <Tooltip text="Percentual de lucro adicionado sobre o custo total. Abaixo de 15% é arriscado.">
                            {' '}<FaInfoCircle size={10} style={{ color: 'rgba(255,255,255,0.35)', cursor: 'help', verticalAlign: 'middle' }} />
                          </Tooltip>
                        </span>
                        <span className="margem-badge" style={{ background: margemColor }}>
                          {margemLucro}%
                        </span>
                      </div>
                      <input
                        type="range"
                        className="margem-slider"
                        min="0" max="100" step="5"
                        value={margemLucro}
                        onChange={e => setMargemLucro(Number(e.target.value))}
                        style={{
                          background: `linear-gradient(to right, ${margemColor} 0%, ${margemColor} ${margemLucro}%, rgba(255,255,255,0.15) ${margemLucro}%, rgba(255,255,255,0.15) 100%)`
                        }}
                      />
                      {margemLucro < 15 && (
                        <div className="margem-risk">⚠ Margem de risco — aumente para proteger o negócio</div>
                      )}
                    </div>

                    {/* BOTÃO */}
                    <button
                      className="btn-salvar"
                      style={{ background: '#2DCE89', color: '#fff' }}
                      onClick={handleSalvarNovoPreco}
                      disabled={saving}
                    >
                      {saving
                        ? <><Spinner size="sm" /> Salvando...</>
                        : <><FaSyncAlt /> Aplicar este preço ao serviço</>
                      }
                    </button>
                  </>
                )}
              </div>
            </Col>
          </Row>

          {/* ── NOVO BLOCO: SEÇÃO 4 (GRÁFICO) ABAIXO DA SEÇÃO 1 E 2 ── */}
          {/* Esta linha foi adicionada para criar a linha inferior que fica apenas abaixo do lado esquerdo */}
          <Row>
            <Col lg={12} md={12}>
              {passo1Ok && meusServicos.length > 0 && (() => {
                const horasMensais = horasTrabalhoDia * diasTrabalhoMes;
                const custoHoraCalc = horasMensais > 0 ? gastosFixos / horasMensais : 0;

                const dadosGrafico = meusServicos
                  .filter(s => s.ativo !== false)
                  .map(s => {
                    const maoDeObra = parseFloat(((custoHoraCalc / 60) * (s.duracao_minutos || 60)).toFixed(2));
                    const materiais = servicoSelecionado?.id === s.id ? parseFloat(custoMateriais || 0) : 0;
                    const custoTotal = maoDeObra + materiais;
                    const margem = parseFloat((custoTotal * (margemLucro / 100)).toFixed(2));
                    return {
                      nome: s.nome.length > 18 ? s.nome.slice(0, 16) + '…' : s.nome,
                      nomeCompleto: s.nome,
                      maoDeObra,
                      materiais,
                      margem,
                      total: custoTotal + margem,
                      ativo: servicoSelecionado?.id === s.id,
                    };
                  })
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 8);

                // Dados formatados especificamente para o gráfico de Pizza (composição do selecionado ou do primeiro)
                const sel = servicoSelecionado
                  ? dadosGrafico.find(d => d.nomeCompleto === servicoSelecionado.nome)
                  : dadosGrafico[0];
                
                const totalSel = sel ? sel.maoDeObra + sel.materiais + sel.margem : 0;
                const pctMao = totalSel > 0 ? ((sel.maoDeObra / totalSel) * 100).toFixed(0) : 0;
                const pctMat = totalSel > 0 ? ((sel.materiais / totalSel) * 100).toFixed(0) : 0;
                const pctMar = totalSel > 0 ? ((sel.margem / totalSel) * 100).toFixed(0) : 0;

                const dadosPizza = sel ? [
                  { name: 'Mão de obra', value: sel.maoDeObra, fill: '#3B82F6' },
                  { name: 'Materiais', value: sel.materiais, fill: '#FB6340' },
                  { name: 'Margem de lucro', value: sel.margem, fill: '#2DCE89' }
                ] : [];

                const CustomTooltip = ({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const total = payload.reduce((s, p) => s + p.value, 0);
                  return (
                    <div style={{ background: '#002B55', borderRadius: 10, padding: '12px 16px', fontSize: '0.78rem', color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                      <div style={{ fontWeight: 800, marginBottom: 8 }}>{label || payload[0].name}</div>
                      {payload.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill || p.payload.fill, display: 'inline-block' }} />
                            {p.name}
                          </span>
                          <span style={{ fontWeight: 700, color: '#fff' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value)}</span>
                        </div>
                      ))}
                      {tipoGrafico === 'barra' && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                          <span>Total</span>
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <div className="grafico-secao" style={{ marginTop: '24px' }}>
                    <div className="grafico-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <div className="grafico-title">
                          <FaChartLine /> {tipoGrafico === 'barra' ? 'Composição do preço por serviço' : `Composição: ${sel?.nomeCompleto || ''}`}
                        </div>
                        <div className="grafico-subtitle">
                          {tipoGrafico === 'barra' 
                            ? 'Veja como mão de obra, materiais e margem se distribuem em cada serviço' 
                            : 'Distribuição percentual dos custos e margem do serviço selecionado'}
                        </div>
                      </div>

                      {/* SELETOR DE TIPO DE GRÁFICO */}
                      <div className="grafico-controles" style={{ display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 8, gap: 4 }}>
                        <button 
                          onClick={() => setTipoGrafico('barra')}
                          style={{ border: 'none', background: tipoGrafico === 'barra' ? '#fff' : 'transparent', padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, color: tipoGrafico === 'barra' ? '#002B55' : '#64748B', boxShadow: tipoGrafico === 'barra' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                        >
                          Barras
                        </button>
                        <button 
                          onClick={() => setTipoGrafico('pizza')}
                          style={{ border: 'none', background: tipoGrafico === 'pizza' ? '#fff' : 'transparent', padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, color: tipoGrafico === 'pizza' ? '#002B55' : '#64748B', boxShadow: tipoGrafico === 'pizza' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                        >
                          Pizza
                        </button>
                      </div>

                      <div className="grafico-legenda">
                        {[
                          { cor: '#3B82F6', label: 'Mão de obra' },
                          { cor: '#FB6340', label: 'Materiais' },
                          { cor: '#2DCE89', label: 'Margem de lucro' },
                        ].map(({ cor, label }) => (
                          <div key={label} className="legenda-item">
                            <span className="legenda-dot" style={{ background: cor }} />
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RENDERIZAÇÃO CONDICIONAL DO TIPO DE GRÁFICO */}
                    {tipoGrafico === 'barra' ? (
                      <ResponsiveContainer width="100%" height={Math.max(180, dadosGrafico.length * 48)}>
                        <BarChart
                          data={dadosGrafico}
                          layout="vertical"
                          margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                          barSize={20}
                        >
                          <XAxis
                            type="number"
                            tickFormatter={v => `R$${v.toFixed(0)}`}
                            tick={{ fontSize: 11, fill: '#8898AA', fontWeight: 600 }}
                            axisLine={false} tickLine={false}
                          />
                          <YAxis
                            type="category" dataKey="nome" width={110}
                            tick={({ x, y, payload }) => (
                              <text x={x} y={y} dy={4} textAnchor="end" fontSize={12}
                                fontWeight={dadosGrafico.find(d => d.nome === payload.value)?.ativo ? 800 : 500}
                                fill={dadosGrafico.find(d => d.nome === payload.value)?.ativo ? '#002B55' : '#8898AA'}>
                                {payload.value}
                              </text>
                            )}
                            axisLine={false} tickLine={false}
                          />
                          <ReTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,43,85,0.04)' }} />
                          <Bar dataKey="maoDeObra" name="Mão de obra" stackId="a" fill="#3B82F6">
                            {dadosGrafico.map((entry, i) => (
                              <Cell key={i} fill="#3B82F6" opacity={entry.ativo ? 1 : 0.45} />
                            ))}
                          </Bar>
                          <Bar dataKey="materiais" name="Materiais" stackId="a" fill="#FB6340">
                            {dadosGrafico.map((entry, i) => (
                              <Cell key={i} fill="#FB6340" opacity={entry.ativo ? 1 : 0.45} />
                            ))}
                          </Bar>
                          <Bar dataKey="margem" name="Margem de lucro" stackId="a" fill="#2DCE89" radius={[0,4,4,0]}>
                            {dadosGrafico.map((entry, i) => (
                              <Cell key={i} fill="#2DCE89" opacity={entry.ativo ? 1 : 0.45} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={dadosPizza}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {dadosPizza.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ReTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}

                    {sel && (
                      <div className="grafico-indicadores">
                        <div className="indicador-card" style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE' }}>
                          <span className="indicador-label" style={{ color: '#1D4ED8' }}>Mão de obra</span>
                          <span className="indicador-valor" style={{ color: '#1E40AF' }}>{money(sel.maoDeObra)}</span>
                          <span className="indicador-pct" style={{ color: '#3B82F6' }}>{pctMao}% do preço total</span>
                          <div className="indicador-barra">
                            <div className="indicador-barra-fill" style={{ width: `${pctMao}%`, background: '#3B82F6' }} />
                          </div>
                        </div>
                        <div className="indicador-card" style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA' }}>
                          <span className="indicador-label" style={{ color: '#C2410C' }}>Materiais</span>
                          <span className="indicador-valor" style={{ color: '#9A3412' }}>{money(sel.materiais)}</span>
                          <span className="indicador-pct" style={{ color: '#FB6340' }}>{pctMat}% do preço total</span>
                          <div className="indicador-barra">
                            <div className="indicador-barra-fill" style={{ width: `${pctMat}%`, background: '#FB6340' }} />
                          </div>
                        </div>
                        <div className="indicador-card" style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0' }}>
                          <span className="indicador-label" style={{ color: '#15803D' }}>Margem de lucro</span>
                          <span className="indicador-valor" style={{ color: '#166534' }}>{money(sel.margem)}</span>
                          <span className="indicador-pct" style={{ color: '#2DCE89' }}>{pctMar}% do preço total</span>
                          <div className="indicador-barra">
                            <div className="indicador-barra-fill" style={{ width: `${pctMar}%`, background: '#2DCE89' }} />
                          </div>
                        </div>
                        <div className="indicador-card" style={{ background: '#002B55', border: '1.5px solid #003d7a' }}>
                          <span className="indicador-label" style={{ color: 'rgba(255,255,255,0.45)' }}>Preço calculado</span>
                          <span className="indicador-valor" style={{ color: '#fff' }}>{money(sel.total)}</span>
                          <span className="indicador-pct" style={{ color: 'rgba(255,255,255,0.4)' }}>com {margemLucro}% de margem</span>
                          <div className="indicador-barra" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <div className="indicador-barra-fill" style={{ width: '100%', background: 'rgba(255,255,255,0.3)' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Col>
          </Row>

        </div>

        {/* MODAL CUSTOS MANUAIS */}
        <Modal show={showModalCustos} onHide={() => setShowModalCustos(false)} centered>
          <Modal.Header closeButton style={{ background: '#002B55', borderBottom: 'none' }}>
            <Modal.Title style={{ fontFamily: 'Libre Baskerville', color: '#fff', fontSize: '1.1rem' }}>
              Seus Custos Fixos Mensais
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ background: '#F8F9FA', padding: '24px' }}>
            <p style={{ fontSize: '0.8rem', color: '#8898AA', marginBottom: 20 }}>
              Preencha cada categoria com o quanto você gasta por mês. O total será usado como base do cálculo.
            </p>
            {[
              { key: 'aluguel', label: 'Aluguel / espaço', hint: 'Valor mensal do ponto comercial ou coworking' },
              { key: 'contas', label: 'Contas (luz, água, internet)', hint: 'Média mensal das contas do negócio' },
              { key: 'sistemas', label: 'Sistemas e softwares', hint: 'Assinaturas de apps, ERP, ferramentas...' },
              { key: 'salarioDono', label: 'Pró-labore (seu salário)', hint: 'O quanto você retira todo mês para você' },
              { key: 'outros', label: 'Outros custos fixos', hint: 'Contabilidade, seguros, transporte, etc.' },
            ].map(({ key, label, hint }) => (
              <Form.Group className="mb-3" key={key}>
                <div className="modal-field-label">{label}</div>
                {hint && <p style={{ fontSize: '0.7rem', color: '#8898AA', marginBottom: 5, marginTop: -2 }}>{hint}</p>}
                <InputGroup>
                  <InputGroup.Text style={{ background: '#fff', border: '1.5px solid #E9ECEF', borderRight: 'none', color: '#8898AA', fontWeight: 700, fontSize: '0.8rem' }}>R$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    className="calc-input"
                    style={{ borderLeft: 'none', borderRadius: '0 10px 10px 0' }}
                    value={detalhesCustos[key]}
                    onChange={e => setDetalhesCustos({ ...detalhesCustos, [key]: e.target.value })}
                  />
                </InputGroup>
              </Form.Group>
            ))}

            {/* TOTAL PRÉVIA */}
            <div style={{ background: '#002B55', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Total mensal</span>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
                {money(
                  Number(detalhesCustos.aluguel || 0) + Number(detalhesCustos.contas || 0) +
                  Number(detalhesCustos.sistemas || 0) + Number(detalhesCustos.salarioDono || 0) +
                  Number(detalhesCustos.outros || 0)
                )}
              </span>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ background: '#F8F9FA', borderTop: '1px solid #E9ECEF', gap: 8 }}>
            <Button variant="light" onClick={() => setShowModalCustos(false)} style={{ borderRadius: 8, fontWeight: 600 }}>
              Cancelar
            </Button>
            <Button onClick={handleSomarCustosManuais} style={{ background: '#002B55', border: 'none', borderRadius: 8, fontWeight: 700, padding: '8px 24px' }}>
              Usar este valor
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </>
  );
}