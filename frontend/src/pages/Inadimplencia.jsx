import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Spinner, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaExclamationCircle, FaUser, FaCalendarAlt, FaMoneyBillWave, FaClock, FaWhatsapp } from 'react-icons/fa';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import AnimatedBackground from '../components/AnimatedBackground';
import api from '../services/api'; // Caso vá integrar com a API depois

export default function Inadimplencia() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [inadimplentes, setInadimplentes] = useState([]);
    const [resumo, setResumo] = useState({ totalDevido: 0, quantidade: 0 });
    
    useEffect(() => {
            const carregarInadimplentes = async () => {
                try {
                    setLoading(true);
                    // Faz a requisição para o novo endpoint criado no Django
                    const resposta = await api.get('/inadimplencia/');
                    
                    setInadimplentes(resposta.data.inadimplentes);
                    setResumo({
                        totalDevido: resposta.data.totalDevido,
                        quantidade: resposta.data.quantidade
                    });
                } catch (erro) {
                    console.error("Erro ao carregar dados de inadimplência:", erro);
                    // Opcional: Tratar o erro ou exibir um alerta amigável
                } finally {
                    setLoading(false);
                }
            };

            carregarInadimplentes();
        }, []);

    const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Função auxiliar para gerar o link do WhatsApp com mensagem de cobrança amigável
    const handleCobrancaWhatsapp = (cliente, valor, servico, telefone) => {
        const mensagem = `Olá, ${cliente}! Tudo bem? Passando para lembrar que o seu agendamento de "${servico}" foi concluído com sucesso, mas ainda não identificamos o pagamento do valor de ${formatMoney(valor)}. Caso precise do Pix ou de outra forma de pagamento, estamos à disposição!`;
        window.open(`https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`, '_blank');
    };

    if (loading) {
        return (
            <>
                <AnimatedBackground />
                <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Spinner animation="border" style={{ color: 'white' }} />
                </div>
            </>
        );
    }

    // Dados para o gráfico de barras (Dias de atraso por cliente)
    const chartData = inadimplentes.map(item => ({
        Nome: item.cliente.split(' ')[0], // Apenas o primeiro nome para não quebrar o layout
        'Valor Devido': item.valor,
        'Dias de Atraso': item.diasAtraso
    }));

    return (
        <>
        <AnimatedBackground />
        <div className="inadimplencia-wrapper">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

                .inadimplencia-wrapper {
                    min-height: 100vh;
                    background-color: transparent;
                    font-family: 'Inter', sans-serif;
                    padding: 40px 20px 100px 20px;
                }
                .container-limit { max-width: 1200px; margin: 0 auto; }

                /* HEADER (IDÊNTICO AO DE SERVICOS) */
                .page-header {
                    display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px;
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

                /* CARDS DE RESUMO OPERACIONAL */
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .summary-card {
                    background: white; padding: 25px; border-radius: 16px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
                    display: flex; align-items: center; gap: 20px;
                }
                .icon-box-danger { width: 50px; height: 50px; background: #FEE2E2; color: #DC2626; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
                .icon-box-warning { width: 50px; height: 50px; background: #FEF3C7; color: #D97706; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
                
                .summary-details h4 { margin: 0; font-size: 1.6rem; font-weight: 700; color: #002B55; }
                .summary-details span { font-size: 0.85rem; color: #64748B; font-weight: 500; text-transform: uppercase; }

                /* CONTEÚDO PRINCIPAL (D DOIS COLUNAS) */
                .main-layout {
                    display: grid; grid-template-columns: 2fr 1fr; gap: 25px;
                }

                /* TABELA PERSONALIZADA */
                .table-panel { background: white; border-radius: 16px; box-shadow: 0 5px 30px rgba(0,0,0,0.05); overflow: hidden; }
                .clean-table { width: 100%; border-collapse: collapse; }
                .clean-table thead th {
                    background: #F8F9FA; color: #525F7F; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
                    padding: 20px 25px; border-bottom: 1px solid #E9ECEF;
                }
                .clean-table tbody tr { border-bottom: 1px solid #F1F3F5; transition: background 0.2s; }
                .clean-table tbody tr:hover { background: #FAFBFC; }
                .clean-table td { padding: 20px 25px; vertical-align: middle; }

                .client-name { font-weight: 700; color: #002B55; font-size: 0.95rem; display: flex; align-items: center; gap: 10px; }
                .client-avatar { width: 35px; height: 35px; background: #E2E8F0; color: #475569; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; }
                
                .info-pill { background: #F6F9FC; color: #525F7F; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
                .price-text { font-weight: 700; color: #DC2626; font-size: 1rem; }

                /* BOTÃO DE COBRANÇA WHATSAPP */
                .btn-whatsapp {
                    background: #25D366; color: white; border: none; border-radius: 8px;
                    padding: 8px 14px; font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;
                    transition: 0.2s; cursor: pointer;
                }
                .btn-whatsapp:hover { background: #128C7E; transform: translateY(-1px); }

                .chart-panel {
                    background: white; border-radius: 16px; padding: 20px; box-shadow: 0 5px 30px rgba(0,0,0,0.05); height: fit-content;
                }
                .chart-title { font-size: 0.9rem; font-weight: 700; color: #002B55; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }

                @media (max-width: 992px) {
                    .main-layout { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="container-limit">
                
                {/* HEADER COM BOTÃO VOLTAR REAPROVEITADO */}
                <div className="page-header">
                    <div className="header-left">
                        <button className="btn-back-circle" onClick={() => navigate('/admin-dashboard')}>
                            <FaArrowLeft />
                        </button>
                        <div className="title-group">
                            <h1><FaExclamationCircle className="me-2 text-warning" /> Inadimplência</h1>
                            <span>Serviços concluídos aguardando pagamento</span>
                        </div>
                    </div>
                </div>

                {/* VISÃO OPERACIONAL RÁPIDA */}
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="icon-box-danger"><FaMoneyBillWave /></div>
                        <div className="summary-details">
                            <span>Total a Receber Retido</span>
                            <h4>{formatMoney(resumo.totalDevido)}</h4>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="icon-box-warning"><FaUser /></div>
                        <div className="summary-details">
                            <span>Clientes Pendentes</span>
                            <h4>{resumo.quantidade}</h4>
                        </div>
                    </div>
                </div>

                {/* ESTRUTURA DE CONTEÚDO */}
                <div className="main-layout">
                    
                    {/* COLUNA DA ESQUERDA: LISTA DE DEVEDORES */}
                    <div className="table-panel">
                        <Table className="clean-table mb-0" responsive>
                            <thead>
                                <tr>
                                    <th>Cliente / Serviço</th>
                                    <th>Conclusão</th>
                                    <th>Atraso</th>
                                    <th>Valor</th>
                                    <th className="text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inadimplentes.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            🎉 Excelente! Nenhuma pendência de pagamento ativa no momento.
                                        </td>
                                    </tr>
                                ) : (
                                    inadimplentes.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div>
                                                    <div className="client-name">
                                                        <div className="client-avatar"><FaUser size={12} /></div>
                                                        {item.cliente}
                                                    </div>
                                                    <small className="text-muted d-block ms-4 ps-2">{item.servico}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="info-pill"><FaCalendarAlt size={12}/> {item.dataConclusao}</span>
                                            </td>
                                            <td>
                                                <Badge bg={item.diasAtraso > 10 ? 'danger' : 'warning'} className="p-2">
                                                    <FaClock className="me-1" /> {item.diasAtraso} dias
                                                </Badge>
                                            </td>
                                            <td>
                                                <span className="price-text">{formatMoney(item.valor)}</span>
                                            </td>
                                            <td className="text-end">
                                                <button 
                                                    className="btn-whatsapp"
                                                    onClick={() => handleCobrancaWhatsapp(item.cliente, item.valor, item.servico, item.telefone)}
                                                >
                                                    <FaWhatsapp size={16} /> Cobrar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* COLUNA DA DIREITA: GRÁFICO DO RECHARTS */}
                    <div className="chart-panel">
                        <div className="chart-title">Volume Retido por Cliente</div>
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="Nome" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(value) => formatMoney(value)} />
                                    <Bar dataKey="Valor Devido" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={25} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        </>
    );
}