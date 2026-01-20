import { useState, useEffect } from 'react';
import api from '../services/api';
import { Container, Form, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { 
  FaArrowLeft, FaClock, FaSave, FaCheckCircle, FaCopy, FaStoreSlash, FaStore, FaCoffee 
} from 'react-icons/fa';

export default function ConfigHorarios() {
  const navigate = useNavigate();
  const [horarios, setHorarios] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState(0); // Começa na Segunda (ID 0)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const diasSemana = [
    { id: 0, curto: 'SEG', nome: 'Segunda-feira' },
    { id: 1, curto: 'TER', nome: 'Terça-feira' },
    { id: 2, curto: 'QUA', nome: 'Quarta-feira' },
    { id: 3, curto: 'QUI', nome: 'Quinta-feira' },
    { id: 4, curto: 'SEX', nome: 'Sexta-feira' },
    { id: 5, curto: 'SÁB', nome: 'Sábado' },
    { id: 6, curto: 'DOM', nome: 'Domingo' },
  ];

  useEffect(() => {
    fetchHorarios();
  }, []);

    async function fetchHorarios() {
        try {
        const response = await api.get('/horarios/');
        const dadosBackend = Array.isArray(response.data) ? response.data : [];

        const diasFormatados = diasSemana.map(dia => {
            const existente = dadosBackend.find(h => h.dia_semana === dia.id);
            
            const base = {
                dia_semana: dia.id,
                horario_inicio: '08:00',
                horario_fim: '18:00',
                almoco_inicio: '',
                almoco_fim: '',
                ativo: dia.id < 5 
            };

            if (existente) {
            return {
                ...base,      // 1. Pega os valores padrão
                ...existente, // 2. Pega TUDO do banco (aqui já vem o ID, ativo, etc.)
                
                // 3. ABAIXO: Garantimos que os campos de hora e o ID estejam explicitamente corretos
                id: existente.id, 
                horario_inicio: existente.horario_inicio?.slice(0, 5) || '08:00',
                horario_fim: existente.horario_fim?.slice(0, 5) || '18:00',
                almoco_inicio: existente.almoco_inicio?.slice(0, 5) || '',
                almoco_fim: existente.almoco_fim?.slice(0, 5) || '',
                ativo: existente.ativo
            };
            }
            return base;
        });

        setHorarios(diasFormatados);
        } catch (error) {
        setNotification({ type: 'erro', text: "Erro ao carregar dados." });
        } finally {
        setLoading(false);
        }
    }

  // Atualiza o dia atual
  const handleChange = (campo, valor) => {
    const novos = [...horarios];
    novos[diaSelecionado][campo] = valor;
    setHorarios(novos);
  };

  // Replicar Horário para outros dias ativos
    const replicarHorario = () => {
        const diaAtual = horarios[diaSelecionado];
        
        const novos = horarios.map(d => {
            // Só aplica se o dia estiver ATIVO (exceto o próprio dia selecionado, que já é a origem)
            if (d.ativo && d.dia_semana !== diaAtual.dia_semana) {
                return {
                    ...d,
                    horario_inicio: diaAtual.horario_inicio,
                    horario_fim: diaAtual.horario_fim,
                    almoco_inicio: diaAtual.almoco_inicio,
                    almoco_fim: diaAtual.almoco_fim,
                    // Mantemos o d.ativo como true, pois é o filtro inicial
                };
            }
            return d; 
        });
        
        setHorarios(novos);
        setNotification({ type: 'sucesso', text: "Horário aplicado a todos os dias ativos!" });
        setTimeout(() => setNotification(null), 3000);
    };

const handleSaveAll = async () => {
    setSaving(true);
    setNotification(null);
    try {
      for (const dia of horarios) {
        const payload = {
          dia_semana: dia.dia_semana,
          horario_inicio: dia.horario_inicio,
          horario_fim: dia.horario_fim,
          almoco_inicio: dia.almoco_inicio || null,
          almoco_fim: dia.almoco_fim || null,
          ativo: dia.ativo // Enviamos o estado real (true ou false)
        };

        // CORREÇÃO: Usamos o 'id' que vem do banco (se existir)
        // Se não tiver ID, mas o usuário interagiu com ele, criamos o registro
        if (dia.id) {
          await api.put(`/horarios/${dia.id}/`, payload);
        } else {
          // Criamos o registro no banco mesmo que esteja desativado, 
          // para que o banco guarde essa preferência.
          await api.post('/horarios/', payload);
        }
      }

      setNotification({ type: 'sucesso', text: "Horários salvos com sucesso!" });
      await fetchHorarios(); // Recarrega para pegar os IDs novos do banco
    } catch (error) {
      console.error(error);
      setNotification({ type: 'erro', text: "Erro ao salvar as configurações." });
    } finally {
      setSaving(false);
    }
  };

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

  // Pega os dados do dia selecionado para renderizar o form
  const diaAtual = horarios[diaSelecionado];
  const temAlmoco = !!diaAtual?.almoco_inicio;

  return (
    <>
        <AnimatedBackground />

        <div className="config-wrapper">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            .config-wrapper {
            min-height: 100vh; background-color: transparent; font-family: 'Inter', sans-serif;
            padding: 30px 20px;
            }
            .container-box { max-width: 600px; margin: 0 auto; }

            /* HEADER */
            .page-header { display: flex; align-items: center; gap: 20px; margin-bottom: 25px; }
            .btn-back {
                background: white; border: none; width: 45px; height: 45px; border-radius: 50%;
                color: #002B55; display: flex; align-items: center; justify-content: center;
                font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            .header-title h1 { font-family: 'Libre Baskerville'; font-weight: 700; font-size: 1.8rem; color: #ffffff; margin: 0; }
            .header-title p { margin: 0; font-size: 0.9rem; color: #c5c5c5; opacity: 0.8; }

            /* ABAS (DIAS DA SEMANA) */
            .tabs-container {
                display: flex; justify-content: space-between; gap: 5px; margin-bottom: 20px;
                background: rgba(255,255,255,0.5); padding: 10px; border-radius: 15px;
            }
            .tab-btn {
                flex: 1; border: none; padding: 10px 0; border-radius: 10px;
                font-weight: 700; font-size: 0.85rem; display: flex; flex-direction: column; align-items: center; gap: 2px;
                transition: 0.2s; cursor: pointer;
            }
            /* Tab Normal (Não selecionada) */
            .tab-btn.normal { background: white; color: #888; opacity: 0.7; }
            
            /* Tab Selecionada */
            .tab-btn.selected { transform: scale(1.05); box-shadow: 0 4px 10px rgba(0,0,0,0.1); opacity: 1; }
            
            /* Cores baseadas no status (Aberto/Fechado) do dia */
            .tab-btn.open { background: white; color: #002B55; border-bottom: 3px solid #2DCE89; }
            .tab-btn.closed { background: #E9ECEF; color: #999; border-bottom: 3px solid #DDD; }
            
            .tab-btn.selected.open { background: #002B55; color: white; border-bottom: 3px solid #2DCE89; }
            .tab-btn.selected.closed { background: #6c757d; color: white; border-bottom: 3px solid #999; }

            /* CARTÃO PRINCIPAL */
            .main-card {
                background: white; border-radius: 20px; padding: 30px;
                box-shadow: 0 10px 30px rgba(0,43,85,0.1); position: relative; overflow: hidden;
            }
            
            /* Switch Grande */
            .big-switch-container {
                display: flex; justify-content: space-between; align-items: center;
                background: #F8F9FA; padding: 15px 20px; border-radius: 15px; margin-bottom: 25px;
                cursor: pointer; transition: 0.2s; border: 2px solid transparent;
            }
            .big-switch-container:hover { background: #E9ECEF; }
            .big-switch-container.active { border-color: #2DCE89; background: #E8F5E9; }
            
            .switch-label { font-weight: 700; font-size: 1.1rem; color: #002B55; display: flex; align-items: center; gap: 10px; }
            .status-text { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; }
            .st-open { color: #2DCE89; } .st-closed { color: #F5365C; }

            /* Inputs de Hora */
            .time-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #888; display: block; margin-bottom: 5px; }
            .big-input {
                width: 100%; border: 2px solid #E9ECEF; border-radius: 12px; padding: 12px;
                font-size: 1.2rem; font-weight: 600; color: #002B55; text-align: center;
                background: #FAFBFC;
            }
            .big-input:focus { border-color: #002B55; background: white; outline: none; }

            /* Botões de Ação */
            .btn-copy {
                background: transparent; border: 1px dashed #002B55; color: #002B55; width: 100%; padding: 12px;
                border-radius: 12px; font-weight: 600; margin-top: 25px; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            .btn-copy:hover { background: #F0F4F8; }

            .save-bar-fixed {
                position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 500px;
                background: #002B55; color: white; border: none; padding: 15px; border-radius: 50px;
                font-size: 1.1rem; font-weight: 700; display: flex; justify-content: center; align-items: center; gap: 10px;
                box-shadow: 0 10px 30px rgba(0,43,85,0.4); z-index: 100; transition: 0.2s;
            }
            .save-bar-fixed:hover { transform: translateX(-50%) scale(1.02); background: #003366; }

            /* Notificação */
            .notif-toast {
                position: fixed; top: 20px; right: 20px; background: white; padding: 15px 25px; border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.15); font-weight: 600; z-index: 1100; display: flex; align-items: center; gap: 10px;
                border-left: 5px solid #2DCE89;
            }
            .notif-toast.erro { border-left-color: #F5365C; color: #F5365C; }
            .notif-toast.sucesso { border-left-color: #2DCE89; color: #2DCE89; }
        `}</style>

        <div className="container-box">
            
            {/* Header */}
            <div className="page-header">
                <button className="btn-back" onClick={() => navigate('/admin-dashboard')}>
                    <FaArrowLeft />
                </button>
                <div className="header-title">
                    <h1>Horários</h1>
                    <p>Configure os dias que a loja abre</p>
                </div>
            </div>

            {/* Notificação */}
            {notification && (
                <div className={`notif-toast ${notification.type}`}>
                    {notification.type === 'sucesso' ? <FaCheckCircle /> : <FaStoreSlash />}
                    {notification.text}
                </div>
            )}

            {/* NAVEGAÇÃO DE DIAS (TABS) */}
            <div className="tabs-container">
                {horarios.map((dia, idx) => (
                    <button 
                        key={dia.dia_semana}
                        className={`tab-btn ${dia.ativo ? 'open' : 'closed'} ${diaSelecionado === idx ? 'selected' : 'normal'}`}
                        onClick={() => setDiaSelecionado(idx)}
                    >
                        {diasSemana[idx].curto}
                    </button>
                ))}
            </div>

            {/* CONTEÚDO DO DIA SELECIONADO */}
            {diaAtual && (
                <div className="main-card">
                    <h4 className="text-center mb-4" style={{color: '#002B55', fontWeight: 'bold'}}>
                        {diasSemana[diaSelecionado].nome}
                    </h4>

                    {/* Switch Principal Grande */}
                    <div 
                        className={`big-switch-container ${diaAtual.ativo ? 'active' : ''}`}
                        onClick={() => handleChange('ativo', !diaAtual.ativo)}
                    >
                        <div className="switch-label">
                            {diaAtual.ativo ? <FaStore /> : <FaStoreSlash />}
                            {diaAtual.ativo ? "Loja Aberta" : "Loja Fechada"}
                        </div>
                        <Form.Check 
                            type="switch"
                            checked={diaAtual.ativo}
                            readOnly
                            style={{transform: 'scale(1.3)', pointerEvents: 'none'}} 
                        />
                    </div>

                    {diaAtual.ativo ? (
                        <>
                            {/* Inputs de Horário */}
                            <Row className="g-3 mb-4">
                                <Col xs={6}>
                                    <label className="time-label">Abre às</label>
                                    <input 
                                        type="time" className="big-input"
                                        value={diaAtual.horario_inicio}
                                        onChange={(e) => handleChange('horario_inicio', e.target.value)}
                                    />
                                </Col>
                                <Col xs={6}>
                                    <label className="time-label">Fecha às</label>
                                    <input 
                                        type="time" className="big-input"
                                        value={diaAtual.horario_fim}
                                        onChange={(e) => handleChange('horario_fim', e.target.value)}
                                    />
                                </Col>
                            </Row>

                            {/* Seção Almoço */}
                            <div style={{borderTop: '1px dashed #DDD', paddingTop: '20px'}}>
                                <div 
                                    className="d-flex align-items-center gap-2 mb-3" 
                                    style={{cursor:'pointer', color: '#555', fontWeight: '600'}}
                                    onClick={() => {
                                        if(temAlmoco) {
                                            handleChange('almoco_inicio', '');
                                            handleChange('almoco_fim', '');
                                        } else {
                                            handleChange('almoco_inicio', '12:00');
                                            handleChange('almoco_fim', '13:00');
                                        }
                                    }}
                                >
                                    <div style={{
                                        width: '20px', height: '20px', border: temAlmoco ? 'none' : '2px solid #ccc',
                                        background: temAlmoco ? '#002B55' : 'transparent', borderRadius: '4px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                    }}>
                                        {temAlmoco && <FaCheckCircle size={12}/>}
                                    </div>
                                    <span>Fazer pausa para almoço?</span>
                                </div>

                                {temAlmoco && (
                                    <Row className="g-3">
                                        <Col xs={6}>
                                            <label className="time-label"><FaCoffee size={10}/> Sai</label>
                                            <input 
                                                type="time" className="big-input"
                                                value={diaAtual.almoco_inicio}
                                                onChange={(e) => handleChange('almoco_inicio', e.target.value)}
                                            />
                                        </Col>
                                        <Col xs={6}>
                                            <label className="time-label"><FaClock size={10}/> Volta</label>
                                            <input 
                                                type="time" className="big-input"
                                                value={diaAtual.almoco_fim}
                                                onChange={(e) => handleChange('almoco_fim', e.target.value)}
                                            />
                                        </Col>
                                    </Row>
                                )}
                            </div>

                            {/* Botão Copiar para outros dias */}
                            <button className="btn-copy" onClick={replicarHorario}>
                                <FaCopy /> Aplicar este horário a todos os dias ativos
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-4 text-muted">
                            <FaStoreSlash size={40} style={{opacity: 0.2, marginBottom: '10px'}} />
                            <p>Nenhum agendamento será permitido neste dia.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Botão Salvar Flutuante */}
            <button className="save-bar-fixed" onClick={handleSaveAll} disabled={saving}>
                {saving ? <Spinner size="sm" animation="border"/> : <><FaSave /> SALVAR ALTERAÇÕES</>}
            </button>

        </div>
        </div>
    </>
  );
}