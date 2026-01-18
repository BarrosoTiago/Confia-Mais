import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// IMPORTANTE: Importe o componente de fundo
import AnimatedBackground from '../components/AnimatedBackground';

// Bibliotecas de arrastar
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Ícones
import { 
  FaUserFriends, FaHandshake, FaChartLine, 
  FaSignOutAlt, FaExpandArrowsAlt, FaEllipsisV, 
  FaCalendarAlt, FaUser, FaShoppingBag, FaDollarSign, 
  FaStore, FaCog, FaMoneyBillWave, FaCheck, FaTimes, FaInfo, FaCircle,
  FaListOl, FaCalculator, FaPercentage, FaStickyNote, FaHeart, FaRegCalendarCheck,
  FaGripVertical, FaPen, FaArrowUp, FaArrowDown, FaFileInvoiceDollar
} from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { Spinner, Alert, Badge, Modal, Button } from 'react-bootstrap';
import logotipoSystem from "../assets/logotipo1.svg";
import lightLogotipoSystem from "../assets/logotipo-light.svg"; 

// --- COMPONENTE DO CARD ARRASTÁVEL ---
function SortableCard({ id, children, editMode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    touchAction: 'none', 
    height: '100%',
    zIndex: isDragging ? 999 : 1,
    cursor: editMode ? 'grab' : 'default'
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`dashboard-card h-100 ${!editMode ? 'interactive' : ''}`}>
         {editMode && (
            <div {...attributes} {...listeners} className="drag-handle">
                <FaGripVertical color="#002B55" size={18} />
            </div>
         )}
         {children}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [financeiro, setFinanceiro] = useState({ receita: 0, despesas: 0, lucro: 0 });
  const [agendamentos, setAgendamentos] = useState([]);
  const [pagamentosHoje, setPagamentosHoje] = useState([]);

  // Estados Drag & Drop
  const [editMode, setEditMode] = useState(false);
  
  // Adicionado 'fiado' na ordem padrão dos cards
  const [cardOrder, setCardOrder] = useState([
      'receita_hoje', 'receita_mes', 'fiado', 'servicos_top', 
      'balanco', 'calculadora', 'fidelidade', 'anotacoes'
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Modal Pagamento
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [agendamentoParaConcluir, setAgendamentoParaConcluir] = useState(null);

  useEffect(() => {
    const savedOrder = localStorage.getItem('dashboard_order_v2');
    if (savedOrder) {
        setCardOrder(JSON.parse(savedOrder));
    }
    loadDashboardData();
    const intervalo = setInterval(() => loadDashboardData(), 10000); 
    return () => clearInterval(intervalo);
  }, []);

  function handleDragEnd(event) {
      const { active, over } = event;
      if (active.id !== over.id) {
          setCardOrder((items) => {
              const oldIndex = items.indexOf(active.id);
              const newIndex = items.indexOf(over.id);
              const newOrder = arrayMove(items, oldIndex, newIndex);
              localStorage.setItem('dashboard_order_v2', JSON.stringify(newOrder));
              return newOrder;
          });
      }
  }

  async function loadDashboardData() {
    try {
      const [respFinanceiro, respAgenda, respPagamentos] = await Promise.allSettled([
        api.get('/financeiro/transacoes/dashboard/'),
        api.get('/agendamentos/'),
        api.get('/pagamentos/')
      ]);

      if (respFinanceiro.status === 'fulfilled' && respFinanceiro.value?.data) {
          setFinanceiro(respFinanceiro.value.data);
      }
      
      if (respAgenda.status === 'fulfilled') {
          const dados = respAgenda.value.data;
          setAgendamentos(Array.isArray(dados) ? dados : []);
      }

      if (respPagamentos.status === 'fulfilled') {
          setPagamentosHoje(Array.isArray(respPagamentos.value.data) ? respPagamentos.value.data : []);
      }

    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  }

    async function handleStatusChange(id, novoStatus) {
        if (novoStatus === 'CANCELADO' && !window.confirm("Deseja realmente cancelar?")) return;
        
        if (novoStatus === 'CONCLUIDO') {
            const agenda = agendamentos.find(a => a.id === id);
            setAgendamentoParaConcluir(agenda);
            setShowPagamentoModal(true);
            return; 
        }

        try {
            await api.patch(`/agendamentos/${id}/`, { status: novoStatus });
            loadDashboardData();
        } catch (error) {
            alert("Erro ao atualizar status.");
        }
    }

    async function confirmarPagamentoEConcluir() {
        setShowPagamentoModal(false);
        navigate('/admin/financeiro', { state: { agendamentoId: agendamentoParaConcluir?.id } });
    }

  const handleLogout = () => { logout(); navigate("/login"); };

  const safeAgendamentos = Array.isArray(agendamentos) ? agendamentos : [];

  const calcularRecebidosHoje = () => {
      const hoje = new Date();
      hoje.setHours(0,0,0,0);
      return pagamentosHoje.reduce((total, pg) => {
          const dataPagamento = new Date(pg.created_at || pg.data || pg.data_pagamento);
          dataPagamento.setHours(0,0,0,0);
          return dataPagamento.getTime() === hoje.getTime() ? total + parseFloat(pg.valor) : total;
      }, 0);
  };

  const calcularReceitaMes = () => {
    const hoje = new Date();
    return pagamentosHoje.reduce((total, pg) => {
        const dataPagamento = new Date(pg.created_at || pg.data || pg.data_pagamento);
        return (dataPagamento.getMonth() === hoje.getMonth() && dataPagamento.getFullYear() === hoje.getFullYear()) ? total + parseFloat(pg.valor) : total;
    }, 0);
  };

  const calcularReceitaTotal = () => pagamentosHoje.reduce((total, pg) => total + parseFloat(pg.valor), 0);

  // CÁLCULO DE FIADO (CONTAS A RECEBER)
  // Soma o valor de todos os agendamentos com status 'PENDENTE'
  const totalFiado = safeAgendamentos
      .filter(a => a.status === 'PENDENTE')
      .reduce((total, item) => {
          const valor = item.servicos_detalhes?.[0]?.preco || 0;
          return total + parseFloat(valor);
      }, 0);

  const receitaHoje = calcularRecebidosHoje();
  const receitaMes = calcularReceitaMes(); 
  const receitaTotal = calcularReceitaTotal(); 
  const pendentes = safeAgendamentos.filter(a => a.status === 'PENDENTE').length;
  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const calcularServicosPopulares = () => {
    const contagem = {};
    let totalServicos = 0;
    safeAgendamentos.forEach(ag => {
        if (ag.status !== 'CANCELADO') {
            ag.servicos_detalhes?.forEach(serv => {
                const nome = serv.nome || 'Serviço';
                contagem[nome] = (contagem[nome] || 0) + 1;
                totalServicos++;
            });
        }
    });
    return Object.entries(contagem)
        .sort(([, a], [, b]) => b - a).slice(0, 3)
        .map(([nome, qtd]) => ({ nome, qtd, percentual: totalServicos > 0 ? (qtd / totalServicos) * 100 : 0 }));
  };
  const topServicos = calcularServicosPopulares();

  const getNomeEmpresa = () => {
      if (!user) return "EMPRESA";
      return (user.nome_fantasia || user.username || user.first_name || "EMPREENDEDOR").toUpperCase();
  };
  
  const nomeEmpresa = getNomeEmpresa();
  const userLogo = user?.foto || user?.logo || null; 
  const iniciais = nomeEmpresa.substring(0, 2).toUpperCase();

  // --- RENDERIZAÇÃO DOS CARDS ---
  const renderCard = (id) => {
      switch(id) {
          case 'receita_hoje':
              return (
                <div onClick={() => !editMode && navigate('/admin/financeiro')} className="h-100 d-flex flex-column justify-content-between p-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                         <div className="icon-box-finance icon-green"><FaArrowUp /></div>
                         <FaExpandArrowsAlt className="card-action-icon" />
                    </div>
                    <div>
                         <span className="card-label">Recebidos Hoje</span>
                         <h3 className="card-value-lg text-success">{formatMoney(receitaHoje)}</h3>
                    </div>
                </div>
              );
          case 'receita_mes':
              return (
                <div onClick={() => !editMode && navigate('/admin/financeiro')} className="h-100 d-flex flex-column justify-content-between p-1">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                         <div className="icon-box-finance icon-blue"><FaRegCalendarCheck /></div>
                         <FaExpandArrowsAlt className="card-action-icon" />
                    </div>
                    <div>
                         <span className="card-label">Entradas Mês</span>
                         <h3 className="card-value-lg text-primary">{formatMoney(receitaMes)}</h3>
                    </div>
                </div>
              );
          case 'fiado':
              return (
                  <div onClick={() => !editMode && navigate('/admin/agendamentos')} className="h-100 d-flex flex-column justify-content-between p-1">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                             {/* Ícone de Fatura/Dinheiro Laranja */}
                             <div className="icon-box-finance" style={{backgroundColor: '#FFEDD5', color: '#F97316'}}>
                                <FaFileInvoiceDollar />
                             </div>
                             <span className="card-label-bold">A Receber</span>
                        </div>
                        <FaExpandArrowsAlt className="card-action-icon" />
                    </div>
                    
                    <div className="flex-grow-1 d-flex flex-column justify-content-center">
                        <span className="card-label mb-1">Total Pendente</span>
                        <h3 className="card-value-lg" style={{color: '#F97316'}}>{formatMoney(totalFiado)}</h3>
                        <div className="mt-2 d-flex align-items-center gap-2">
                            <span style={{fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', background: '#F1F5F9', padding: '2px 8px', borderRadius: '10px'}}>
                                {pendentes} {pendentes === 1 ? 'cliente' : 'clientes'}
                            </span>
                        </div>
                    </div>
                  </div>
              );
          case 'servicos_top':
              return (
                  <div onClick={() => !editMode && navigate('/admin/servicos')} className="h-100 d-flex flex-column justify-content-between p-1">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                             <div className="icon-box-sm"><FaListOl /></div>
                             <span className="card-label-bold">Top Serviços</span>
                        </div>
                        <FaExpandArrowsAlt className="card-action-icon" />
                    </div>
                    <div className="flex-grow-1 d-flex flex-column justify-content-center">
                        {topServicos.length === 0 ? <div className="text-muted small text-center">Sem dados.</div> : topServicos.map((s, i) => (
                            <div className="meta-row mb-2" key={i}>
                                <div className="meta-labels">
                                    <span className="text-truncate" style={{maxWidth: '70%'}}>{s.nome}</span>
                                    <span className="text-muted">{s.qtd}</span>
                                </div>
                                <div className="prog-bar">
                                    <div className="fill-primary" style={{width: `${s.percentual}%`, opacity: 1 - (i * 0.2)}}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
              );
          case 'balanco':
              return (
                  <div onClick={() => !editMode && navigate('/admin/financeiro')} className="h-100 d-flex flex-column justify-content-between p-1">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                             <div className="icon-box-sm"><FaChartLine /></div>
                             <span className="card-label-bold">Balanço</span>
                        </div>
                        <FaExpandArrowsAlt className="card-action-icon" />
                    </div>
                    <div className="flex-grow-1 d-flex flex-column justify-content-center">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small">Total</span>
                            <span className="fw-bold">{formatMoney(receitaTotal)}</span>
                        </div>
                        <div className="prog-bar mb-3"><div className="fill-success" style={{width: '100%'}}></div></div>
                        
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small">Despesas</span>
                            <span className="fw-bold text-danger">- {formatMoney(financeiro.despesas)}</span>
                        </div>
                        <div className="prog-bar"><div className="fill-danger" style={{width: '100%'}}></div></div>
                    </div>
                  </div>
              );
          
          case 'calculadora':
              return (
                  <div onClick={() => !editMode && navigate('/admin/calculadora')} className="h-100 d-flex flex-column justify-content-center align-items-center text-center p-2">
                     <div className="icon-circle mb-2" style={{color: '#0D9488', background: '#CCFBF1'}}>
                        <FaCalculator size={20}/>
                     </div>
                     <h6 className="card-title-center">Calculadora</h6>
                     <span className="card-sub-text">Analisar Preços</span>
                  </div>
              );
          case 'fidelidade':
              return (
                  <div onClick={() => !editMode && navigate('/admin/clientes')} className="h-100 d-flex flex-column justify-content-center align-items-center text-center p-2">
                     <div className="icon-circle mb-2" style={{color: '#D97706', background: '#FEF3C7'}}>
                        <FaHeart size={20}/>
                     </div>
                     <h6 className="card-title-center">Fidelidade</h6>
                     <span className="card-sub-text">Gerenciar Pontos</span>
                  </div>
              );
          case 'anotacoes':
              return (
                  <div onClick={() => !editMode && navigate('/admin/anotacoes')} className="h-100 d-flex flex-column justify-content-center align-items-center text-center p-2">
                     <div className="icon-circle mb-2" style={{color: '#002B55', background: '#E0E7FF'}}>
                        <FaStickyNote size={20}/>
                     </div>
                     <h6 className="card-title-center">Anotações</h6>
                     <span className="card-sub-text">Bloco de Notas</span>
                  </div>
              );
          default: return null;
      }
  }

  if (loading) {
    return (
      <>
        <AnimatedBackground />
        <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'transparent'}}>
          <Spinner animation="border" style={{color: 'white'}} />
        </div>
      </>
    );
  }

  return (
    <>
    <AnimatedBackground />
    
    <div className="dashboard-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');

        /* PALETA DE CORES (CSS Variables) */
        :root {
            --col-navy: #002B55;
            --col-sky: #0284C7;
            --col-teal: #0D9488;
            --col-orange: #F97316;
            --col-danger: #f37b7b;
            --col-success: #48b994;
        }

        .dashboard-wrapper { 
            min-height: 100vh; 
            background-color: transparent;
            font-family: 'Plus Jakarta Sans', sans-serif; 
            overflow-x: hidden; 
            position: relative; 
            padding-bottom: 80px; 
            color: #1E293B;
        }

        /* --- BOTÃO MENU (TRANSPARENTE COM BORDA BRANCA) --- */
        .menu-trigger { 
            position: fixed; top: 25px; left: 30px; width: 55px; height: 55px; 
            background-color: transparent; /* Fundo transparente */
            border: 2px solid white; /* Borda Branca */
            border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            cursor: pointer; z-index: 1000; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: transform 0.2s; 
        }
        .menu-trigger:hover { 
            transform: scale(1.05); 
            background-color: rgba(255,255,255,0.1); 
        }
        /* Logo colorido restaurado */
        .logo-trigger { width: 30px; height: auto; }

        /* CARDS */
        .dashboard-card { 
            background-color: rgba(246, 246, 246, 0.9);
            backdrop-filter: blur(6px);
            border-radius: 16px; 
            padding: 24px; 
            box-shadow: 0 8px 32px 0 rgba(37, 144, 250, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.6);
            position: relative; 
            height: 100%; 
            display: flex; flex-direction: column; justify-content: center; 
            transition: all 0.45s ease; 
        }
        .dashboard-card.interactive:hover { 
            transform: translateY(-4px); 
            background-color: rgba(255, 255, 255, 1);
            box-shadow: 0 12px 40px 0 rgba(62, 106, 149, 0.15);
            border-color: #E2E8F0;
        }
        
        .drag-handle { 
            position: absolute; top: 10px; right: 10px; left: auto;
            width: 32px; height: 32px; background: #F1F5F9; border-radius: 8px; 
            display: flex; align-items: center; justify-content: center; cursor: grab; z-index: 20; 
        }
        .drag-handle:active { cursor: grabbing; }

        .icon-box-finance { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .icon-green { background-color: #DCFCE7; color: var(--col-success); }
        .icon-blue { background-color: #E0F2FE; color: var(--col-sky); }
        .icon-box-sm { color: #64748B; font-size: 1rem; }
        .card-action-icon { color: #94A3B8; cursor: pointer; transition: 0.2s; }
        .card-action-icon:hover { color: var(--col-navy); }
        .card-label { font-size: 0.875rem; color: #64748B; font-weight: 500; display: block; margin-bottom: 4px; }
        .card-label-bold { font-size: 0.95rem; color: #334155; font-weight: 700; }
        .card-value-lg { font-size: 1.75rem; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .text-success { color: var(--col-success) !important; }
        .text-primary { color: var(--col-sky) !important; }
        .icon-circle { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
        .card-title-center { font-weight: 700; color: #334155; margin-bottom: 2px; font-size: 1rem; }
        .card-sub-text { font-size: 0.75rem; color: #94A3B8; }

        .meta-row { width: 100%; }
        .meta-labels { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px; }
        .prog-bar { height: 6px; background: #F1F5F9; border-radius: 10px; overflow: hidden; width: 100%; }
        .fill-primary { background-color: var(--col-navy); height: 100%; border-radius: 10px; }
        .fill-success { background-color: var(--col-success); height: 100%; border-radius: 10px; }
        .fill-danger { background-color: var(--col-danger); height: 100%; border-radius: 10px; }
        
        .recent-section { margin-top: 50px; margin-bottom: 20px; }
        .recent-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .recent-title { color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 1.25rem; font-weight: 700; margin: 0; }
        
        .appointment-card { 
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
            border-radius: 12px; padding: 16px; margin-bottom: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
            border: 1px solid rgba(255, 255, 255, 0.5);
            display: flex; align-items: center; justify-content: space-between;
            transition: 0.20s;
        }
        .appointment-card:hover { transform: translateX(5px); background: #FFFFFF; }
        
        .date-box { 
            background-color: #F1F5F9; color: #475569; 
            padding: 8px 12px; border-radius: 8px; text-align: center; margin-right: 16px; min-width: 60px;
        }
        .date-day { font-size: 1.1rem; font-weight: 800; line-height: 1; }
        .date-month { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
        
        .status-badge { font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; }
        .bg-conf { background-color: #DCFCE7; color: var(--col-success); border: 1px solid #BBF7D0; }
        .bg-pend { background-color: #FEF9C3; color: #854D0E; border: 1px solid #FEF08A; }
        .bg-canc { background-color: #F1F5F9; color: #64748B; border: 1px solid #E2E8F0; }
        .bg-concl { background-color: #E0F2FE; color: var(--col-sky); border: 1px solid #BAE6FD; }

        .main-content { padding: 0 40px; max-width: 1200px; margin: 0 auto; }
        .top-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-top: 10px; }

        /* HEADER / TOP BAR */
        .top-bar { 
            display: flex; justify-content: flex-end; align-items: center; 
            padding: 20px 40px; margin-bottom: 10px; 
        }
        .btn-action-primary { 
            background-color: #FFFFFF; border: 1px solid #E2E8F0; color: var(--col-navy); 
            font-weight: 600; padding: 10px 24px; border-radius: 16px; 
            display: flex; align-items: center; gap: 8px; transition: all 0.2s; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .btn-action-primary:hover { background-color: #F8FAFC; transform: translateY(-2px); color: var(--col-sky); }
        .btn-action-secondary { 
            background-color: var(--col-success); border: none; font-weight: 600; padding: 10px 24px; border-radius: 30px; 
            display: flex; align-items: center; gap: 8px; transition: all 0.2s; color: white; 
        }
        .btn-action-secondary:hover { opacity: 0.9; transform: translateY(-2px); }
        .btn-logout-circle { 
            width: 42px; height: 42px; border-radius: 50%; background: transparent;
            border: 2px solid #fc1717; display: flex; align-items: center; justify-content: center; 
            color: var(--col-danger); transition: 0.2s; 
        }
        .btn-logout-circle:hover { background: #fc1717; color: white; transform: rotate(90deg); }

        /* SIDEBAR RESTAURADA */
        .sidebar-overlay { position: fixed; top: 0; left: 0; height: 100vh; width: 300px; background: transparent; z-index: 2000; display: flex; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .sidebar-overlay.open { transform: translateX(0); }
        .sidebar-dark-strip { width: 40px; background-color: var(--col-navy); height: 100%; display: flex; flex-direction: column; align-items: center; padding-top: 25px; }
        
        .sidebar-menu-content { 
            flex-grow: 2; background-color: #E6E6E6; padding: 40px 30px; 
            display: flex; flex-direction: column; box-shadow: 10px 0 30px rgba(0,0,0,0.1); 
        }
        
        .menu-item { 
            display: flex; align-items: center; gap: 15px; 
            color: var(--col-navy); 
            font-family: 'Libre Baskerville', serif; 
            font-size: 0.9rem; margin-bottom: 18px; 
            cursor: pointer; font-weight: 700; transition: 0.2s; 
        }
        .menu-item:hover { transform: translateX(5px); color: var(--col-sky); }
        
        .menu-section-title { 
            color: var(--col-navy); font-family: 'Libre Baskerville', serif;
            font-size: 0.9rem; font-weight: 700; margin-bottom: 20px; 
            margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; 
        }
        
        .menu-separator { height: 2px; background-color: #BBB; width: 50px; margin: 20px 0 30px 0; }

        .entrepreneur-section { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 5px; padding-top: 30px; border-top: 1px solid #CCC; cursor: pointer; }
        .logo-circle { width: 65px; height: 65px; border-radius: 50%; background: white; border: 1px solid var(--col-navy); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 8px; }
        .logo-initials { font-weight: 700; color: var(--col-navy); font-size: 2rem; font-family: 'Libre Baskerville', serif; }

        .fixed-footer-container { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; justify-content: center; padding: 15px; z-index: 50; pointer-events: none; }
        .company-name-footer { font-size: 0.9rem; font-weight: 700; color: #64748B; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(5px); padding: 6px 16px; border-radius: 6px; pointer-events: auto; border: 1px solid rgba(255, 255, 255, 0.3); border-top: 4.5px solid var(--col-sky); }
        .brand-logo-footer { position: fixed; bottom: 20px; right: 40px; font-weight: 800; color: rgba(255,255,255,0.5); font-size: 1.2rem; }
        .alert-pendentes { background: rgba(255, 247, 237, 0.9) !important; backdrop-filter: blur(5px); border: 1px solid rgba(255, 255, 255, 0.5) !important; color: #C2410C; }

        @media (max-width: 992px) {
            .main-content { padding: 0 20px; }
            .top-cards-grid { grid-template-columns: 1fr; }
            .brand-logo-footer { display: none; }
            .fixed-footer-container { display: none; }
        }
      `}</style>

      {/* HEADER SUPERIOR */}
      <div className="top-bar">
          <div className="d-flex gap-3">
            {editMode ? (
                <button className="btn-action-secondary" onClick={() => setEditMode(false)}>
                    <FaCheck /> Salvar Organização
                </button>
            ) : (
                <button className="btn-action-primary" onClick={() => setEditMode(true)}>
                    <FaPen size={14} /> Personalizar Tela
                </button>
            )}
            <button className="btn-logout-circle" onClick={handleLogout} title="Sair">
                <FaSignOutAlt />
            </button>
          </div>
      </div>

      {/* MENU TRIGGER (TRANSPARENTE + BORDA BRANCA + LOGO REAL) */}
      {!menuOpen && (
        <div className="menu-trigger" onClick={() => setMenuOpen(true)}>
             {/* Logo colorido original sem filtros */}
             <img src={lightLogotipoSystem} alt="C+" className="logo-trigger" onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
             <span style={{display:'none', fontWeight:'bold', color: 'white'}}>C+</span>
        </div>
      )}

          {/* SIDEBAR */}
        <div className={`sidebar-overlay ${menuOpen ? 'open' : ''}`}>
            {/* Removemos o FaInfo daqui (da faixa azul escura) */}
        <div className="sidebar-menu-content">
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', // Joga o logo para um lado e os botões para o outro
                alignItems: 'center', 
                marginBottom: '20px' 
            }}>
                
                <img 
                    src={logotipoSystem} 
                    alt="Logo" 
                    style={{ height: '35px', width: 'auto' }} 
                />

                {/* GRUPO DE BOTÕES ALINHADOS À DIREITA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* ÍCONE DE INFORMAÇÃO */}
                    <div 
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px' }} 
                        onClick={() => navigate('/admin/ajuda')}
                        title="Ajuda e Informações"
                    >
                        <FaInfo size={16} color="#002B55" style={{ opacity: 0.6 }} />
                    </div>

                    {/* BOTÃO FECHAR */}
                    <div 
                        style={{ 
                            border: '2px solid #002B55', 
                            borderRadius: '8px', 
                            padding: '4px', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }} 
                        onClick={() => setMenuOpen(false)}
                    >
                        <IoMdClose size={20} color="#002B55" />
                    </div>
                </div>
            </div>
        
              
              {/* SEÇÃO ITENS */}
              <div className="menu-section-title">ITENS</div>
              <div className="menu-item" onClick={() => navigate('/admin/agendamentos')}><FaUserFriends /> CLIENTES</div>
              <div className="menu-item" onClick={() => navigate('/admin/servicos')}><FaHandshake /> SERVIÇOS</div>
              <div className="menu-item" onClick={() => navigate('/admin/config-horarios')}><FaCog /> HORÁRIOS</div>
              <div className="menu-item" onClick={() => navigate('/admin/clientes')}><FaHeart /> FIDELIDADE</div>
              <div className="menu-item" onClick={() => navigate('/admin/anotacoes')}><FaStickyNote /> ANOTAÇÕES</div>

              {/* SEPARADOR */}
              <div className="menu-separator"></div>

              {/* SEÇÃO MEU NEGÓCIO */}
              <div className="menu-section-title">MEU NEGÓCIO</div>
              <div className="menu-item" onClick={() => navigate('/admin/financeiro')}><FaChartLine /> REGISTROS</div>
              <div className="menu-item" onClick={() => navigate('/admin/despesas')}><FaMoneyBillWave /> DESPESAS</div>
              <div className="menu-item" onClick={() => navigate('/admin/calculadora')}><FaCalculator /> SAÚDE FINANCEIRA</div>
              
              {/* PERFIL (RESTAURADO) */}
              <div className="entrepreneur-section" onClick={() => navigate('/admin/perfil')}>
                  <div className="logo-circle">
                      {userLogo ? <img src={userLogo} alt="Logo" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span className="logo-initials">{iniciais}</span>}
                  </div>
                  {/* Nome do Usuário Centralizado */}
                  <span style={{fontWeight:700, color:'#002B55', fontSize:'0.9rem', fontFamily: 'Libre Baskerville, serif'}}>{nomeEmpresa}</span>
                  <small style={{display:'block', color:'#666', fontSize:'0.75rem', fontWeight:600, letterSpacing:'1px', textDecoration:'underline',}}>MEU PERFIL</small>
              </div>
          </div>
      </div>

      <div className="main-content">
         {pendentes > 0 && (
             <Alert variant="warning" className="alert-pendentes shadow-sm border-0 d-flex align-items-center justify-content-center gap-2 mb-4 rounded-pill py-2" style={{fontSize:'0.9rem'}}>
                <FaCircle size={8} />
                <strong>{pendentes}</strong> solicitações pendentes. <u style={{cursor:'pointer'}} onClick={() => navigate('/admin/agendamentos')}>Revisar agora</u>
             </Alert>
         )}

         <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
             <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
                 <div className="top-cards-grid">
                     {cardOrder.map((id) => (
                         <SortableCard key={id} id={id} editMode={editMode}>
                             {renderCard(id)}
                         </SortableCard>
                     ))}
                 </div>
             </SortableContext>
         </DndContext>

         <div className="recent-section">
             <div className="recent-header">
                 <h2 className="recent-title ms-2">Últimos Agendamentos</h2>
                 <Button variant="link" className="text-decoration-none fw-bold p-0 text-white me-3" style={{fontSize:'0.9rem'}} onClick={() => navigate('/admin/agendamentos')}>Ver todos</Button>
             </div>
             
             {safeAgendamentos.slice(0, 5).map((t) => (
                 <div className="appointment-card" key={t.id}>
                     <div className="d-flex align-items-center">
                         <div className="date-box">
                             <div className="date-day">{new Date(t.data_hora_inicio).getDate()}</div>
                             <div className="date-month">{new Date(t.data_hora_inicio).toLocaleString('pt-BR', {month:'short'})}</div>
                         </div>
                         <div className="client-info">
                             <h6>{t.cliente_nome}</h6>
                             <small>
                                 {t.servicos_detalhes?.[0]?.nome || 'Serviço'}
                                 <span className="mx-1">•</span>
                                 {new Date(t.data_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                             </small>
                         </div>
                     </div>
                     
                     <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-dark d-none d-sm-block">
                            {t.servicos_detalhes?.[0]?.preco ? `R$ ${t.servicos_detalhes[0].preco}` : '-'}
                        </span>
                        
                        {t.status === 'PENDENTE' ? (
                            <div className="d-flex gap-2">
                                <Button size="sm" variant="success" className="rounded-circle p-0 d-flex align-items-center justify-content-center" style={{width:32, height:32}} onClick={() => handleStatusChange(t.id, 'CONFIRMADO')} title="Confirmar"><FaCheck size={12}/></Button>
                                <Button size="sm" variant="danger" className="rounded-circle p-0 d-flex align-items-center justify-content-center" style={{width:32, height:32}} onClick={() => handleStatusChange(t.id, 'CANCELADO')} title="Cancelar"><FaTimes size={12}/></Button>
                            </div>
                        ) : (
                            t.status === 'CONFIRMADO' ? (
                                <Badge className="status-badge bg-conf" style={{cursor:'pointer'}} onClick={() => handleStatusChange(t.id, 'CONCLUIDO')}>CONFIRMADO</Badge>
                            ) : (
                                <Badge className={`status-badge ${t.status === 'CONCLUIDO' ? 'bg-concl' : 'bg-canc'}`}>{t.status}</Badge>
                            )
                        )}
                     </div>
                 </div>
             ))}
             {safeAgendamentos.length === 0 && (
                 <div className="text-center py-5 text-muted border rounded-3" style={{background: 'rgba(255,255,255,0.8)'}}>
                     <FaCalendarAlt size={30} className="mb-3 opacity-25"/>
                     <p className="m-0">Nenhum agendamento recente.</p>
                 </div>
             )}
         </div>
      </div>
      
      <div className="fixed-footer-container">
          <div className="company-name-footer">{nomeEmpresa}</div>
      </div>
      <div className="brand-logo-footer">CONFIA +</div>

      <Modal show={showPagamentoModal} onHide={() => setShowPagamentoModal(false)} centered size="sm">
          <Modal.Header closeButton className="border-0 pb-0">
          </Modal.Header>
          <Modal.Body className="text-center pt-0 pb-4">
              <div style={{width:60, height:60, background:'#DCFCE7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto'}}>
                  <FaMoneyBillWave size={24} color="#16A34A" />
              </div>
              <h5 className="fw-bold mb-2">Confirmar Pagamento?</h5>
              <p className="text-muted small mb-4">
                  Isso irá concluir o agendamento e lançar <strong className="text-dark">R$ {agendamentoParaConcluir?.financeiro?.restante}</strong> no seu caixa de hoje.
              </p>
              <div className="d-grid gap-2">
                  <Button className="btn-action-secondary justify-content-center" onClick={confirmarPagamentoEConcluir}>
                      Confirmar Recebimento
                  </Button>
                  <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowPagamentoModal(false)}>
                      Cancelar
                  </Button>
              </div>
          </Modal.Body>
      </Modal>
    </div>
    </>
  );
}