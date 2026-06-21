import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHeartbeat, FaCalendarAlt, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import AnimatedBackground from '../components/AnimatedBackground';

export default function SaudeFinanceira() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [diagnostico, setDiagnostico] = useState(null);

    useEffect(() => {
        setTimeout(() => {
            setDiagnostico({
                status: 'SAUDAVEL', 
                mensagem: 'Operação Saudável',
                dataAnalise: new Date().toLocaleDateString('pt-BR'),
                
                faturamento: 12450.00,
                despesas: 4120.00,
                pontoEquilibrio: 5000.00,
                lucratividade: 66.9,

                margemContribuicao: 58.5,
                liquidezCorrente: 2.1,
                capitalGiro: 3500.00,
                pmr: 14,

                sugestao: 'Seu negócio apresenta excelente eficiência e baixo risco de insolvência no curto prazo. Como seu Prazo Médio de Recebimento (PMR) está em 14 dias e seu Índice de Liquidez está robusto (2.1), você tem folga para negociar melhores prazos com fornecedores e reverter o capital de giro em novas frentes de marketing ou estoque.',
                
                historico: [
                    { mes: 'Jan', Faturamento: 9000, Despesas: 3800, PontoEquilibrio: 5000, CapitalGiro: 2800 },
                    { mes: 'Fev', Faturamento: 10500, Despesas: 4000, PontoEquilibrio: 5000, CapitalGiro: 3000 },
                    { mes: 'Mar', Faturamento: 11000, Despesas: 4200, PontoEquilibrio: 5000, CapitalGiro: 3100 },
                    { mes: 'Abr', Faturamento: 9800, Despesas: 3900, PontoEquilibrio: 5000, CapitalGiro: 2900 },
                    { mes: 'Mai', Faturamento: 13000, Despesas: 4500, PontoEquilibrio: 5000, CapitalGiro: 3400 },
                    { mes: 'Jun', Faturamento: 12450, Despesas: 4120, PontoEquilibrio: 5000, CapitalGiro: 3500 },
                ]
            });
            setLoading(false);
        }, 600);
    }, []);

    const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const getStatusStyles = (status) => {
        switch(status) {
            case 'SAUDAVEL':
                return { bg: '#DCFCE7', color: '#15803D', border: '#bbf7d0', icon: <FaCheckCircle /> };
            case 'ALERTA':
                return { bg: '#FEF9C3', color: '#A16207', border: '#fef08a', icon: <FaExclamationTriangle /> };
            default:
                return { bg: '#FEE2E2', color: '#B91C1C', border: '#fecaca', icon: <FaExclamationTriangle /> };
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', color: '#fff' }}>
                <div className="spinner-border" role="status"></div>
            </div>
        );
    }

    const statusStyle = getStatusStyles(diagnostico?.status);

    const pieData = [
        { name: 'Lucro Líquido', value: diagnostico.faturamento - diagnostico.despesas, color: '#0D9488' },
        { name: 'Despesas', value: diagnostico.despesas, color: '#f37b7b' }
    ];

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

                /* ADOTADO DE SERVICOS.JSX */
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

                /* BADGES DE CONTRASTE AJUSTADOS */
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

            {/* HEADER COM BOTÃO NO ESTILO DE SERVICOS.JSX */}
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
                
                {/* Badges alinhados à direita do header */}
                <div className="d-flex gap-3 flex-wrap">
                    <div className="status-badge-box">
                        {statusStyle.icon}
                        <span>{diagnostico?.mensagem.toUpperCase()}</span>
                    </div>
                    <div className="date-badge-box">
                        <FaCalendarAlt size={16} />
                        <span>Análise: <strong>{diagnostico?.dataAnalise}</strong></span>
                    </div>
                </div>
            </div>

            <div className="main-card">
                
                <div className="section-subtitle">Métricas Estruturais de Caixa</div>
                <div className="grid-indicators">
                    <div className="indicator-item">
                        <span className="indicator-label">Faturamento Total <FaInfoCircle className="indicator-info-icon" title="Entradas brutas no caixa" /></span>
                        <h3 className="indicator-value value-success">{formatMoney(diagnostico?.faturamento)}</h3>
                    </div>
                    <div className="indicator-item">
                        <span className="indicator-label">Despesas Totais <FaInfoCircle className="indicator-info-icon" title="Custo total operacional" /></span>
                        <h3 className="indicator-value value-danger">{formatMoney(diagnostico?.despesas)}</h3>
                    </div>
                    <div className="indicator-item">
                        <span className="indicator-label">Ponto de Equilíbrio <FaInfoCircle className="indicator-info-icon" title="O quanto precisa faturar para cobrir os custos" /></span>
                        <h3 className="indicator-value">{formatMoney(diagnostico?.pontoEquilibrio)}</h3>
                    </div>
                    <div className="indicator-item">
                        <span className="indicator-label">Capital de Giro Atual <FaInfoCircle className="indicator-info-icon" title="Reserva para sustentar a operação" /></span>
                        <h3 className="indicator-value" style={{color: '#0284C7'}}>{formatMoney(diagnostico?.capitalGiro)}</h3>
                    </div>
                </div>

                <div className="section-subtitle">Eficiência e Índices de Liquidez</div>
                <div className="grid-indicators">
                    <div className="indicator-item">
                        <span className="indicator-label">Lucratividade Real <FaInfoCircle className="indicator-info-icon" title="Percentual que sobra do faturamento" /></span>
                        <h3 className="indicator-value" style={{ color: '#0D9488' }}>{diagnostico?.lucratividade}%</h3>
                    </div>
                    <div className="indicator-item">
                        <span className="indicator-label">Margem de Contribuição <FaInfoCircle className="indicator-info-icon" title="O quanto cada venda ajuda a pagar as despesas fixas" /></span>
                        <h3 className="indicator-value" style={{ color: '#6366F1' }}>{diagnostico?.margemContribuicao}%</h3>
                    </div>
                    <div className="indicator-item">
                        <span className="indicator-label">Liquidez Corrente <FaInfoCircle className="indicator-info-icon" title="Capacidade de pagar contas de curto prazo. Ideal superior a 1.0" /></span>
                        <h3 className="indicator-value" style={{ color: diagnostico?.liquidezCorrente >= 1 ? '#16A34A' : '#DC2626' }}>{diagnostico?.liquidezCorrente}</h3>
                    </div>
                    <div className="indicator-item">
                        <span className="indicator-label">Prazo de Recebimento (PMR) <FaInfoCircle className="indicator-info-icon" title="Tempo médio em dias para ver a cor do dinheiro" /></span>
                        <h3 className="indicator-value" style={{ color: '#F59E0B' }}>{diagnostico?.pmr} dias</h3>
                    </div>
                </div>

                <div className="charts-grid">
                    <div className="chart-container-box">
                        <div className="chart-title">Evolução Mensal, Alvos e Capital de Giro</div>
                        <div style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer>
                                <ComposedChart data={diagnostico?.historico} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="mes" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(value) => formatMoney(value)} />
                                    <Legend />
                                    <Bar dataKey="Faturamento" fill="#002B55" radius={[4, 4, 0, 0]} barSize={25} />
                                    <Bar dataKey="Despesas" fill="#f37b7b" radius={[4, 4, 0, 0]} barSize={25} />
                                    <Line type="monotone" dataKey="PontoEquilibrio" stroke="#F97316" strokeWidth={2.5} name="Ponto de Equilíbrio" dot={false} />
                                    <Area type="monotone" dataKey="CapitalGiro" fill="#E0F2FE" stroke="#0284C7" name="Reserva de Giro" opacity={0.4} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-container-box d-flex flex-column justify-content-between">
                        <div className="chart-title">Comprometimento de Caixa</div>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatMoney(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="d-flex flex-column gap-1 align-items-center mt-2" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            <span style={{ color: '#0D9488' }}>● Margem de Lucro Disponível</span>
                            <span style={{ color: '#f37b7b' }}>● Custos e Despesas Absorvidas</span>
                        </div>
                    </div>
                </div>

                <div className="sugestao-box">
                    <h5 className="sugestao-title">
                        <FaHeartbeat color="#0284C7" /> Diagnóstico do Especialista
                    </h5>
                    <p className="sugestao-text">{diagnostico?.sugestao}</p>
                </div>
            </div>
        </div>
        </>
    );
}