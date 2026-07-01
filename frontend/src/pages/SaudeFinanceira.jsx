import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaHeartbeat, FaCalendarAlt, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { ResponsiveContainer, ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import AnimatedBackground from '../components/AnimatedBackground';

export default function SaudeFinanceira() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(false);
    const [dados, setDados] = useState(null);

    useEffect(() => {
        fetchSaudeFinanceira();
    }, []);

    async function fetchSaudeFinanceira() {
        try {
            setLoading(true);
            setErro(false);
            const response = await api.get('/financeiro/saude-financeira/');
            if (response.data) {
                setDados(response.data);
            }
        } catch (err) {
            console.error('Erro ao carregar saúde financeira:', err);
            setErro(true);
        } finally {
            setLoading(false);
        }
    }

    const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'SAUDAVEL':
                return { bg: '#DCFCE7', color: '#15803D', border: '#bbf7d0', icon: <FaCheckCircle />, label: 'OPERAÇÃO SAUDÁVEL' };
            case 'ALERTA':
                return { bg: '#FEF9C3', color: '#A16207', border: '#fef08a', icon: <FaExclamationTriangle />, label: 'ATENÇÃO NECESSÁRIA' };
            default:
                return { bg: '#FEE2E2', color: '#B91C1C', border: '#fecaca', icon: <FaExclamationTriangle />, label: 'SITUAÇÃO CRÍTICA' };
        }
    };

    // Deriva um status de diagnóstico a partir das métricas reais retornadas pela API
    const calcularDiagnostico = (metricas) => {
        if (!metricas) return { status: 'ALERTA', sugestao: '' };

        const { margem_lucro, liquidez, pmr, pmp, total_pendente } = metricas;

        let status = 'SAUDAVEL';
        if (margem_lucro < 0 || liquidez < 0.8) {
            status = 'CRITICO';
        } else if (margem_lucro < 10 || liquidez < 1.2 || total_pendente > 0) {
            status = 'ALERTA';
        }

        let sugestao = '';
        if (status === 'SAUDAVEL') {
            sugestao = `Sua margem de lucro está em ${margem_lucro}% e seu índice de liquidez em ${liquidez}, indicando uma operação equilibrada. `;
        } else if (status === 'ALERTA') {
            sugestao = `Sua margem de lucro está em ${margem_lucro}% e seu índice de liquidez em ${liquidez}. Vale atenção redobrada ao fluxo de caixa nos próximos meses. `;
        } else {
            sugestao = `Sua margem de lucro está em ${margem_lucro}% e seu índice de liquidez em ${liquidez}, sinalizando risco para a operação no curto prazo. `;
        }

        if (pmr != null && pmp != null) {
            if (pmr > pmp) {
                sugestao += `Seu Prazo Médio de Recebimento (${pmr} dias) está maior que o de Pagamento (${pmp} dias), o que pode pressionar o caixa — considere renegociar prazos com fornecedores ou antecipar recebíveis.`;
            } else {
                sugestao += `Seu Prazo Médio de Recebimento (${pmr} dias) está dentro ou abaixo do Prazo de Pagamento (${pmp} dias), o que é favorável para o seu capital de giro.`;
            }
        } else if (pmr != null && pmp == null) {
            sugestao += `Seu Prazo Médio de Recebimento está em ${pmr} dias. Ainda não há despesas com data de vencimento cadastrada para calcular o Prazo Médio de Pagamento — cadastre o vencimento das próximas despesas para ativar essa comparação.`;
        }

        if (total_pendente > 0) {
            sugestao += ` Há ${formatMoney(total_pendente)} em valores pendentes de recebimento — acompanhe a tela de Inadimplência para cobrança.`;
        }

        return { status, sugestao };
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', color: '#fff' }}>
                <Spinner animation="border" role="status"></Spinner>
            </div>
        );
    }

    if (erro || !dados) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh', color: '#fff', gap: '15px' }}>
                <FaExclamationTriangle size={32} />
                <p>Não foi possível carregar os dados de saúde financeira.</p>
                <button className="btn-back-circle" onClick={() => navigate('/admin-dashboard')}>
                    <FaArrowLeft />
                </button>
            </div>
        );
    }

    const { metricas, grafico_fluxo, grafico_inadimplencia, grafico_margins } = dados;
    const { status, sugestao } = calcularDiagnostico(metricas);
    const statusStyle = getStatusStyles(status);
    const dataAnalise = new Date().toLocaleDateString('pt-BR');

    return (
        <>
            <AnimatedBackground />
            <div className="saude-financeira-wrapper">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');

                    .saude-financeira-wrapper {
                        min-height: 100vh;
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        color: #1E293B;
                        padding: 40px 20px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }

                    .page-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 30px;
                        flex-wrap: wrap;
                        gap: 20px;
                    }
                    .header-left { display: flex; align-items: center; gap: 20px; }

                    .btn-back-circle {
                        width: 45px; height: 45px; border-radius: 50%; background: #F8F9FA; border: 1px solid #E9ECEF;
                        color: #002B55; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
                        cursor: pointer; transition: 0.2s;
                    }
                    .btn-back-circle:hover { background: #002B55; color: white; }

                    .title-group h1 { font-family: 'Libre Baskerville', serif; font-weight: 700; font-size: 1.8rem; color: #ffffff; margin: 0; }
                    .title-group span { font-size: 0.9rem; color: #cdcdcd; }

                    .status-badge-box {
                        background-color: ${statusStyle.bg};
                        color: ${statusStyle.color};
                        border: 2px solid ${statusStyle.border};
                        padding: 10px 20px;
                        border-radius: 30px;
                        font-weight: 700;
                        font-size: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        letter-spacing: 0.5px;
                    }

                    .date-badge-box {
                        background-color: #FFFFFF;
                        color: #002B55;
                        border: 2px solid #E2E8F0;
                        padding: 10px 20px;
                        border-radius: 14px;
                        font-weight: 600;
                        font-size: 0.9rem;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
                    }
                    .date-badge-box svg { color: #0284C7; }

                    .main-card {
                        background-color: rgba(246, 246, 246, 0.95);
                        backdrop-filter: blur(8px);
                        border-radius: 20px;
                        padding: 35px;
                        box-shadow: 0 10px 35px rgba(0, 43, 85, 0.15);
                        border: 1px solid rgba(255, 255, 255, 0.7);
                        margin-bottom: 30px;
                    }

                    .section-subtitle {
                        font-size: 1.1rem;
                        font-weight: 700;
                        color: #002B55;
                        margin-bottom: 20px;
                        border-left: 4px solid #0284C7;
                        padding-left: 10px;
                    }

                    .grid-indicators {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                        gap: 20px;
                        margin-bottom: 35px;
                    }

                    .indicator-item {
                        background: #FFFFFF;
                        border: 1px solid #E2E8F0;
                        padding: 20px;
                        border-radius: 14px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.02);
                    }

                    .indicator-label {
                        font-size: 0.75rem;
                        color: #64748B;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 6px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .indicator-info-icon { color: #94A3B8; cursor: help; }
                    .indicator-value { font-size: 1.5rem; font-weight: 700; color: #002B55; margin: 0; }
                    .value-success { color: #48b994; }
                    .value-danger { color: #f37b7b; }

                    .charts-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr;
                        gap: 25px;
                        margin-bottom: 35px;
                    }

                    .charts-side-column {
                        display: flex;
                        flex-direction: column;
                        gap: 25px;
                    }

                    .chart-container-box {
                        background: #FFFFFF;
                        border: 1px solid #E2E8F0;
                        border-radius: 16px;
                        padding: 20px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                    }

                    .chart-title { font-size: 0.95rem; font-weight: 700; color: #002B55; margin-bottom: 20px; }

                    .sugestao-box {
                        background-color: #F8FAFC;
                        border-left: 5px solid #0284C7;
                        padding: 20px;
                        border-radius: 4px 12px 12px 4px;
                    }

                    .sugestao-title {
                        font-weight: 700;
                        color: #002B55;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .sugestao-text { font-size: 0.95rem; color: #475569; line-height: 1.6; margin: 0; }

                    @media (max-width: 992px) {
                        .charts-grid { grid-template-columns: 1fr; }
                    }
                `}</style>

                <div className="page-header">
                    <div className="header-left">
                        <button className="btn-back-circle" onClick={() => navigate('/admin-dashboard')}>
                            <FaArrowLeft />
                        </button>
                        <div className="title-group">
                            <h1>Saúde Financeira</h1>
                            <span>Diagnóstico e inteligência analítica de caixa</span>
                        </div>
                    </div>

                    <div className="d-flex gap-3 flex-wrap">
                        <div className="status-badge-box">
                            {statusStyle.icon}
                            <span>{statusStyle.label}</span>
                        </div>
                        <div className="date-badge-box">
                            <FaCalendarAlt size={16} />
                            <span>Análise: <strong>{dataAnalise}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="main-card">

                    <div className="section-subtitle">Métricas Estruturais de Caixa</div>
                    <div className="grid-indicators">
                        <div className="indicator-item">
                            <span className="indicator-label">Ponto de Equilíbrio <FaInfoCircle className="indicator-info-icon" title="O quanto precisa faturar para cobrir os custos" /></span>
                            <h3 className="indicator-value">{formatMoney(metricas.ponto_equilibrio)}</h3>
                        </div>
                        <div className="indicator-item">
                            <span className="indicator-label">Capital de Giro Atual <FaInfoCircle className="indicator-info-icon" title="Reserva para sustentar a operação" /></span>
                            <h3 className="indicator-value" style={{ color: '#0284C7' }}>{formatMoney(metricas.capital_giro)}</h3>
                        </div>
                        <div className="indicator-item">
                            <span className="indicator-label">Total Pendente <FaInfoCircle className="indicator-info-icon" title="Valores em aberto a receber" /></span>
                            <h3 className="indicator-value value-danger">{formatMoney(metricas.total_pendente)}</h3>
                        </div>
                        <div className="indicator-item">
                            <span className="indicator-label">Margem de Lucro <FaInfoCircle className="indicator-info-icon" title="Percentual que sobra do faturamento" /></span>
                            <h3 className="indicator-value" style={{ color: metricas.margem_lucro >= 0 ? '#0D9488' : '#DC2626' }}>{metricas.margem_lucro}%</h3>
                        </div>
                    </div>

                    <div className="section-subtitle">Eficiência e Prazos</div>
                    <div className="grid-indicators">
                        <div className="indicator-item">
                            <span className="indicator-label">Liquidez <FaInfoCircle className="indicator-info-icon" title="Capacidade de pagar contas de curto prazo. Ideal superior a 1.0" /></span>
                            <h3 className="indicator-value" style={{ color: metricas.liquidez >= 1 ? '#16A34A' : '#DC2626' }}>{metricas.liquidez}</h3>
                        </div>
                        <div className="indicator-item">
                            <span className="indicator-label">Prazo de Recebimento (PMR) <FaInfoCircle className="indicator-info-icon" title="Tempo médio em dias para receber" /></span>
                            <h3 className="indicator-value" style={{ color: '#F59E0B' }}>{metricas.pmr} dias</h3>
                        </div>
                        <div className="indicator-item">
                            <span className="indicator-label">Prazo de Pagamento (PMP) <FaInfoCircle className="indicator-info-icon" title="Tempo médio em dias para pagar fornecedores. Requer despesas com data de vencimento cadastrada." /></span>
                            <h3 className="indicator-value" style={{ color: '#6366F1' }}>{metricas.pmp != null ? `${metricas.pmp} dias` : 'Sem dados'}</h3>
                        </div>
                    </div>

                    <div className="charts-grid">
                        <div className="chart-container-box">
                            <div className="chart-title">Fluxo de Caixa — Entradas x Saídas (últimos meses)</div>
                            <div style={{ width: '100%', height: 320 }}>
                                <ResponsiveContainer>
                                    <ComposedChart data={grafico_fluxo} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value) => formatMoney(value)} />
                                        <Legend />
                                        <Bar dataKey="entradas" name="Entradas" fill="#002B55" radius={[4, 4, 0, 0]} barSize={25} />
                                        <Bar dataKey="saidas" name="Saídas" fill="#f37b7b" radius={[4, 4, 0, 0]} barSize={25} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="charts-side-column">
                            <div className="chart-container-box">
                                <div className="chart-title">Inadimplência por Atraso</div>
                                <div style={{ width: '100%', height: 180 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={grafico_inadimplencia} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                {(grafico_inadimplencia || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatMoney(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="d-flex flex-column gap-1 align-items-center mt-2" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                    {(grafico_inadimplencia || []).map((entry, index) => (
                                        <span key={index} style={{ color: entry.color }}>● {entry.name}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="chart-container-box">
                                <div className="chart-title">Despesas Fixas x Variáveis</div>
                                <div style={{ width: '100%', height: 140 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={grafico_margins} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip formatter={(value) => formatMoney(value)} />
                                            <Bar dataKey="margem" fill="#0284C7" radius={[4, 4, 0, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sugestao-box">
                        <h5 className="sugestao-title">
                            <FaHeartbeat color="#0284C7" /> Diagnóstico do Especialista
                        </h5>
                        <p className="sugestao-text">{sugestao}</p>
                    </div>
                </div>
            </div>
        </>
    );
}