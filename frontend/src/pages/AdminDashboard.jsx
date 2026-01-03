import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Ícones (Adicionei FaCalculator e FaPercentage)
import { 
  FaUserFriends, FaHandshake, FaChartLine, FaHeartbeat, 
  FaSignOutAlt, FaExpandArrowsAlt, FaEllipsisV, 
  FaCalendarAlt, FaUser, FaShoppingBag, FaDollarSign, 
  FaStore, FaCog, FaMoneyBillWave, FaCheck, FaTimes, FaInfo, FaCircle,
  FaListOl, FaCalculator, FaPercentage
} from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { Spinner, Alert, Badge } from 'react-bootstrap';

// Logo do Sistema
import logotipoSystem from "../assets/logotipo1.svg"; 

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [financeiro, setFinanceiro] = useState({ receita: 0, despesas: 0, lucro: 0 });
  const [agendamentos, setAgendamentos] = useState([]);

  useEffect(() => {
    loadDashboardData();
    const intervalo = setInterval(() => loadDashboardData(), 10000); 
    return () => clearInterval(intervalo);
  }, []);

  async function loadDashboardData() {
    try {
      const [respFinanceiro, respAgenda] = await Promise.allSettled([
        api.get('/financeiro/transacoes/dashboard/'),
        api.get('/agendamentos/')
      ]);

      if (respFinanceiro.status === 'fulfilled' && respFinanceiro.value?.data) {
          setFinanceiro(respFinanceiro.value.data);
      }
      
      if (respAgenda.status === 'fulfilled') {
          const dados = respAgenda.value.data;
          setAgendamentos(Array.isArray(dados) ? dados : []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, novoStatus) {
    if (novoStatus === 'CANCELADO' && !window.confirm("Deseja realmente cancelar?")) return;
    if (novoStatus === 'CONCLUIDO' && !window.confirm("Confirmar que o serviço foi realizado e o pagamento recebido?")) return;

    try {
      await api.patch(`/agendamentos/${id}/`, { status: novoStatus });
      loadDashboardData();
    } catch (error) {
      alert("Erro ao atualizar status.");
    }
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const safeAgendamentos = Array.isArray(agendamentos) ? agendamentos : [];

  const getValorRealPago = (item) => {
      if (item.financeiro && item.financeiro.pago !== undefined && item.financeiro.pago !== null) {
          return parseFloat(item.financeiro.pago);
      }
      return parseFloat(item.servicos_detalhes?.[0]?.preco || 0);
  };

  const calcularRecebidosHoje = () => {
      const hojeStr = new Date().toLocaleDateString(); 
      return safeAgendamentos.reduce((total, item) => {
          const dataItem = new Date(item.data_hora_inicio).toLocaleDateString();
          if (dataItem === hojeStr && item.status === 'CONCLUIDO') {
               return total + getValorRealPago(item);
          }
          return total;
      }, 0);
  };

  const calcularReceitaTotal = () => {
      return safeAgendamentos.reduce((total, item) => {
          if (item.status === 'CONCLUIDO') {
               return total + getValorRealPago(item);
          }
          return total;
      }, 0);
  };

  const receitaHoje = calcularRecebidosHoje();
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
      if (!user) return "";
      return (
          user.nome_fantasia || user.nome_empresa || user.nome_loja || user.empresa ||
          (user.first_name ? user.first_name + (user.last_name ? " " + user.last_name : "") : "") ||
          user.username || "EMPREENDEDOR"
      ).toUpperCase();
  };
  
  const nomeEmpresa = getNomeEmpresa();
  const userLogo = user?.foto || user?.logo || null; 
  const iniciais = nomeEmpresa.substring(0, 2).toUpperCase();

  if (loading) {
    return (
      <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#A8DADC'}}>
        <Spinner animation="border" style={{color: '#002B55'}} />
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        .dashboard-wrapper {
          min-height: 100vh; background-color: #A8DADC; font-family: 'Libre Baskerville', serif;
          overflow-x: hidden; position: relative; padding-bottom: 80px; 
        }

        .menu-trigger {
          position: fixed; top: 30px; left: 30px; width: 60px; height: 60px;
          background-color: #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 1000; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          transition: transform 0.2s; border: 2px solid #002B55;
        }
        .menu-trigger:hover { transform: scale(1.1); }
        .logo-trigger { width: 35px; height: auto; }

        .sidebar-overlay {
          position: fixed; top: 0; left: 0; height: 100vh; width: 340px;
          background-color: transparent; z-index: 2000; display: flex;
          transform: translateX(-100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .sidebar-overlay.open { transform: translateX(0); }

        .sidebar-dark-strip { width: 80px; background-color: #002B55; height: 100%; display: flex; flex-direction: column; align-items: center; padding-top: 30px; }
        .sidebar-menu-content { flex-grow: 1; background-color: #E6E6E6; padding: 40px 30px; display: flex; flex-direction: column; box-shadow: 5px 0 25px rgba(0,0,0,0.2); }
        .close-box { width: 40px; height: 40px; border: 2px solid #002B55; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-left: auto; margin-bottom: 20px; }
        .menu-section-title { color: #002B55; font-family: 'Libre Baskerville', serif; font-weight: 700; font-size: 0.9rem; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .menu-item { display: flex; align-items: center; gap: 15px; color: #002B55; font-family: 'Libre Baskerville', serif; font-size: 0.95rem; margin-bottom: 20px; cursor: pointer; font-weight: 700; transition: transform 0.2s; }
        .menu-item:hover { transform: translateX(8px); color: #004080; }
        .menu-separator { height: 2px; background-color: #BBB; width: 50px; margin: 15px 0 35px 0; }

        .entrepreneur-section { margin-top: auto; display: flex; flex-direction: column; align-items: center; cursor: pointer; padding-top: 20px; border-top: 1px solid #CCC; width: 100%; }
        .logo-circle { width: 70px; height: 70px; border-radius: 50%; background: #FFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 10px; border: 3px solid #002B55; overflow: hidden; }
        .logo-img-user { width: 100%; height: 100%; object-fit: cover; }
        .logo-initials { font-size: 1.8rem; font-weight: bold; color: #002B55; }

        .main-content { padding: 40px 60px; width: 100%; max-width: 1200px; margin: 0 auto; flex-grow: 1; display: flex; flex-direction: column; }
        .top-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-bottom: 50px; margin-top: 60px; }
        .dashboard-card { background-color: #F4F4F6; border-radius: 15px; padding: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.08); position: relative; min-height: 200px; transition: 0.2s; }
        .dashboard-card.interactive:hover { transform: translateY(-5px); cursor: pointer; border: 2px solid #002B55; }
        
        .card-header-icon { position: absolute; top: 15px; left: 15px; color: #000; font-size: 1.2rem; }
        .card-expand-icon { position: absolute; top: 15px; right: 15px; color: #8898AA; font-size: 0.9rem; cursor: pointer; }
        .card-title { font-family: 'Libre Baskerville', serif; font-weight: 400; font-size: 1.1rem; color: #000; margin-top: 5px; margin-bottom: 15px; padding-left: 20px; }
        .value-display { font-size: 2.2rem; color: #4CAF50; font-family: 'Libre Baskerville', serif; }
        .currency { font-size: 1rem; color: #4CAF50; vertical-align: super; }
        .sub-info { font-family: 'Libre Baskerville', serif; font-size: 0.8rem; color: #555; margin-top: 10px; }
        
        .meta-row { margin-bottom: 15px; }
        .meta-labels { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: bold; margin-bottom: 5px; font-family: 'Libre Baskerville', serif; }
        .prog-bar { height: 8px; background: #D9D9D9; display: flex; border-radius: 5px; overflow: hidden; }
        .fill-olive { background-color: #AFB42B; } .fill-blue { background-color: #002B55; } .fill-teal { background-color: #009688; }
        .fill-gold { background-color: #C0CA33; } .fill-green { background-color: #388E3C; } .fill-red { background-color: #D32F2F; }

        .table-card { background-color: #F4F4F6; border-radius: 15px; padding: 40px; box-shadow: 0 15px 35px rgba(0,0,0,0.08); min-height: 300px; position: relative; margin-bottom: 60px; }
        .table-header { display: grid; grid-template-columns: 1.2fr 1.5fr 1.5fr 1fr 1fr; text-align: center; margin-bottom: 30px; font-family: 'Libre Baskerville', serif; color: #000; }
        .th-item { display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 1rem; }
        .th-text { border-right: 1px solid #CCC; width: 100%; display: block; line-height: 15px; }
        .th-item:last-child .th-text { border-right: none; }
        .table-row { display: grid; grid-template-columns: 1.2fr 1.5fr 1.5fr 1fr 1fr; text-align: center; padding: 15px 0; font-family: 'Libre Baskerville', serif; color: #002B55; font-size: 0.95rem; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.05); }

        .fixed-footer-container {
            position: fixed; bottom: 0; left: 0; width: 100%;
            display: flex; justify-content: center; align-items: center;
            padding: 15px 40px; z-index: 50; pointer-events: none;
        }
        .company-name-footer {
            font-size: 1.2rem; text-transform: uppercase; letter-spacing: 2px; color: #002B55; 
            font-weight: 700; background: rgba(255, 255, 255, 0.85);
            padding: 5px 20px; border-radius: 20px; pointer-events: auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .brand-logo-footer { position: fixed; bottom: 20px; right: 40px; font-size: 1.5rem; color: #002B55; font-family: 'Libre Baskerville', serif; font-weight: 700; z-index: 50; }

        @media (max-width: 992px) {
            .main-content { padding: 20px; }
            .top-cards-grid { grid-template-columns: 1fr; margin-top: 80px; }
            .table-header { display: none; }
            .table-row { display: flex; flex-direction: column; gap: 10px; border-bottom: 1px solid #ccc; padding: 20px 0; }
            .fixed-footer-container { position: relative; margin-top: 20px; flex-direction: column; background: transparent; }
            .brand-logo-footer { position: relative; bottom: auto; right: auto; margin-top: 10px; }
        }
      `}</style>

      {!menuOpen && (
        <div className="menu-trigger" onClick={() => setMenuOpen(true)}>
             <img src={logotipoSystem} alt="C+" className="logo-trigger" onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
             <span style={{display:'none', fontWeight:'bold', color: '#002B55'}}>C+</span>
        </div>
      )}

      {/* --- MENU LATERAL --- */}
      <div className={`sidebar-overlay ${menuOpen ? 'open' : ''}`}>
          <div className="sidebar-dark-strip">
               <FaInfo size={20} color="white" style={{marginTop: 'auto', marginBottom: '20px', cursor:'pointer'}} />
          </div>
          <div className="sidebar-menu-content">
              <div className="close-box" onClick={() => setMenuOpen(false)}>
                  <IoMdClose size={24} color="#002B55" />
              </div>
              <div className="menu-section-title">ITENS</div>
              <div className="menu-item" onClick={() => {navigate('/admin/agendamentos'); setMenuOpen(false)}}><FaUserFriends /> CLIENTES</div>
              <div className="menu-item" onClick={() => {navigate('/admin/servicos'); setMenuOpen(false)}}><FaHandshake /> SERVIÇOS</div>
              <div className="menu-item" onClick={() => {navigate('/admin/config-horarios'); setMenuOpen(false)}}><FaCog /> HORÁRIOS</div>
              <div className="menu-separator"></div>
              <div className="menu-section-title">MEU NEGÓCIO</div>
              <div className="menu-item" onClick={() => {navigate('/admin/financeiro'); setMenuOpen(false)}}><FaChartLine /> REGISTROS</div>
              <div className="menu-item" onClick={() => {navigate('/admin/despesas'); setMenuOpen(false)}}><FaMoneyBillWave /> DESPESAS</div>
              
              {/* --- ITEM ALTERADO PARA CALCULADORA --- */}
              <div className="menu-item" onClick={() => {navigate('/admin/calculadora'); setMenuOpen(false)}}>
                  <FaCalculator /> SAÚDE FINANCEIRA
              </div>
              {/* -------------------------------------- */}
              
              <div className="entrepreneur-section" onClick={() => {navigate('/admin/perfil'); setMenuOpen(false)}}>
                  <div className="logo-circle">
                      {userLogo ? <img src={userLogo} alt="Logo" className="logo-img-user" /> : <span className="logo-initials">{iniciais}</span>}
                  </div>
                  <small style={{fontWeight: 'bold', color: '#333'}}>MEU PERFIL</small>
                  <div style={{marginTop: '10px', color: '#D32F2F', fontSize: '0.8rem', display: 'flex', alignItems:'center', gap:'5px'}} onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                      <FaSignOutAlt /> Sair
                  </div>
              </div>
          </div>
      </div>

      <div className="main-content">
         {pendentes > 0 && (
             <Alert variant="warning" className="shadow-sm border-0 text-center mb-0 mx-auto" style={{borderRadius: '10px', maxWidth: '600px'}}>
                <FaCircle size={10} color="#856404" className="me-2"/>
                <strong>{pendentes}</strong> novos agendamentos! <u style={{cursor:'pointer', marginLeft:'10px'}} onClick={() => navigate('/admin/agendamentos')}>Ver</u>
             </Alert>
         )}

         <div className="top-cards-grid">
             {/* Card 1: Receita */}
             <div className="dashboard-card">
                 <FaEllipsisV className="card-header-icon" size={14} />
                 <FaExpandArrowsAlt className="card-expand-icon" onClick={() => navigate('/admin/financeiro')} />
                 <h3 className="card-title">Recebidos Hoje</h3>
                 <div style={{paddingLeft: '20px'}}>
                    <span className="value-display">+ {formatMoney(receitaHoje).replace('R$', '')}</span>
                    <span className="currency">R$</span>
                    <div className="sub-info">Atendimentos concluídos: {safeAgendamentos.filter(a => new Date(a.data_hora_inicio).toDateString() === new Date().toDateString() && a.status === 'CONCLUIDO').length}</div>
                 </div>
             </div>

             {/* Card 2: Serviços */}
             <div className="dashboard-card">
                 <FaListOl className="card-header-icon" size={14} />
                 <FaExpandArrowsAlt className="card-expand-icon" />
                 <h3 className="card-title">Serviços Utilizados</h3>
                 <div style={{paddingLeft: '20px', paddingRight: '20px'}}>
                     {topServicos.length === 0 ? <div className="text-muted small">Sem dados.</div> : topServicos.map((servico, index) => (
                         <div className="meta-row" key={index}>
                             <div className="meta-labels"><span>{servico.nome}</span><span>{servico.qtd}</span></div>
                             <div className="prog-bar"><div className={index === 0 ? 'fill-olive' : index === 1 ? 'fill-blue' : 'fill-teal'} style={{width: `${servico.percentual}%`}}></div></div>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Card 3: Balanço */}
             <div className="dashboard-card">
                 <FaEllipsisV className="card-header-icon" size={14} />
                 <FaExpandArrowsAlt className="card-expand-icon" />
                 <h3 className="card-title">Balanço Geral</h3>
                 <div style={{paddingLeft: '20px', paddingRight: '20px'}}>
                     <div className="meta-row">
                         <div className="meta-labels"><span>Receita Total</span><span>{formatMoney(receitaTotal)}</span></div>
                         <div className="prog-bar"><div className="fill-gold" style={{width: '100%'}}></div></div>
                     </div>
                     <div className="meta-row">
                         <div className="meta-labels"><span>Lucro Real</span><span>{formatMoney(receitaTotal - financeiro.despesas)}</span></div>
                         <div className="prog-bar"><div className="fill-green" style={{width: (receitaTotal - financeiro.despesas) > 0 ? '100%' : '5%'}}></div></div>
                     </div>
                 </div>
             </div>

             {/* --- NOVO CARD: ATALHO PARA CALCULADORA --- */}
             <div className="dashboard-card interactive" onClick={() => navigate('/admin/calculadora')} style={{backgroundColor: '#E8F5E9', border: '1px solid #C8E6C9'}}>
                 <FaCalculator className="card-header-icon" size={16} color="#2E7D32"/>
                 <FaPercentage className="card-expand-icon" size={14} color="#2E7D32"/>
                 <h3 className="card-title" style={{color: '#1B5E20', fontWeight:'bold'}}>Calculadora de Lucro</h3>
                 <div style={{paddingLeft: '20px', paddingRight: '20px'}}>
                    <div className="sub-info" style={{marginBottom: '15px'}}>
                        Descubra se o preço do seu serviço está cobrindo os custos da loja.
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', color: '#2E7D32', fontWeight:'bold', fontSize:'0.9rem'}}>
                        <FaHeartbeat /> Analisar Saúde
                    </div>
                 </div>
             </div>
             {/* ------------------------------------------ */}

         </div>

         {/* Tabela */}
         <div className="table-card">
             <FaExpandArrowsAlt className="card-expand-icon" onClick={() => navigate('/admin/agendamentos')} />
             <div className="table-header">
                 <div className="th-item"><FaCalendarAlt className="th-icon"/><span className="th-text">Data - Hora</span></div>
                 <div className="th-item"><FaUser className="th-icon"/><span className="th-text">Cliente</span></div>
                 <div className="th-item"><FaShoppingBag className="th-icon"/><span className="th-text">Serviço</span></div>
                 <div className="th-item"><FaDollarSign className="th-icon"/><span className="th-text">Valor</span></div>
                 <div className="th-item"><FaCheck className="th-icon"/><span className="th-text">Ação</span></div>
             </div>
             {safeAgendamentos.slice(0, 5).map((t) => (
                 <div className="table-row" key={t.id}>
                     <div>{t.data_hora_inicio ? new Date(t.data_hora_inicio).toLocaleDateString() : '--'} - {t.data_hora_inicio ? new Date(t.data_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}</div>
                     <div>{t.cliente_nome}</div>
                     <div>{t.servicos_detalhes?.[0]?.nome || 'Serviço'}</div>
                     <div>{t.servicos_detalhes?.[0]?.preco ? `R$ ${t.servicos_detalhes[0].preco}` : '-'}</div>
                     <div style={{display:'flex', justifyContent:'center', gap:'10px'}}>
                        {t.status === 'PENDENTE' ? (
                            <>
                                <FaCheck style={{color:'green', cursor:'pointer'}} onClick={() => handleStatusChange(t.id, 'CONFIRMADO')} />
                                <FaTimes style={{color:'red', cursor:'pointer'}} onClick={() => handleStatusChange(t.id, 'CANCELADO')} />
                            </>
                        ) : (
                            t.status === 'CONFIRMADO' ? (
                                <Badge bg="success" style={{cursor:'pointer'}} onClick={() => handleStatusChange(t.id, 'CONCLUIDO')} title="Clique para receber">Confirmado</Badge>
                            ) : t.status === 'CONCLUIDO' ? (
                                <Badge bg="primary">Concluído</Badge>
                            ) : (
                                <Badge bg="secondary">{t.status}</Badge>
                            )
                        )}
                     </div>
                 </div>
             ))}
         </div>
      </div>

      <div className="fixed-footer-container">
          <div className="company-name-footer">{nomeEmpresa}</div>
      </div>
      <div className="brand-logo-footer">CONFIA +</div>

    </div>
  );
}