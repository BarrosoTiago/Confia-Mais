import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Spinner, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import OnboardingHeader from '../components/OnboardingHeader';
import { 
  FaArrowLeft, FaHandshake, FaPlus, FaEdit, FaTrash, 
  FaClock, FaTag, FaCheckCircle, FaRocket 
} from 'react-icons/fa';

export default function Servicos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Verifica se está no modo Onboarding (Passo Final)
  const isOnboarding = searchParams.get('onboarding') === 'true';

  const [servicos, setServicos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    preco: '',
    duracao_minutos: 30,
    ativo: true
  });

  useEffect(() => {
    loadServicos();
  }, []);

  async function loadServicos() {
    try {
      const response = await api.get('/api/servicos/');
      setServicos(response.data);
    } catch (error) {
      console.error("Erro ao carregar serviços", error);
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÃO PARA FINALIZAR O ONBOARDING (COM FORMDATA P/ EVITAR ERRO 415) ---
  async function handleFinalizarOnboarding() {
    if (servicos.length === 0) {
        const confirm = window.confirm("Você ainda não cadastrou nenhum serviço. Deseja finalizar mesmo assim?");
        if (!confirm) return;
    }

    try {
        setLoading(true);
        console.log("Tentando finalizar onboarding...");

        // USAMOS FORMDATA: O backend espera multipart/form-data na rota de usuário
        const data = new FormData();
        data.append('setup_concluido', 'True');

        await api.patch('/auth/users/me/', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        
        // Sucesso!
        alert("🎉 Parabéns! Sua loja está configurada e pronta para uso.");
        
        // Força recarregamento total para atualizar o AuthContext e limpar cache
        window.location.href = '/admin-dashboard';
        
    } catch (error) {
        console.error("Erro detalhado:", error);
        let msg = "Erro ao finalizar configuração.";
        
        if (error.response) {
            if (error.response.status === 415) {
                msg += "\nErro de formato (415).";
            } else if (error.response.data) {
                msg += "\nDetalhe: " + JSON.stringify(error.response.data);
            }
        }
        alert(msg);
    } finally {
        setLoading(false);
    }
  }

  // Helpers
  const money = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Modal Functions
  const handleShowAdd = () => {
    setFormData({ id: null, nome: '', preco: '', duracao_minutos: 30, ativo: true });
    setShowModal(true);
  };

  const handleShowEdit = (item) => {
    setFormData({
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        duracao_minutos: item.duracao_minutos,
        ativo: item.ativo
    });
    setShowModal(true);
  };

async function handleSubmit(e) {
    e.preventDefault();
    try {
      // Cria o pacote com as conversões de número
      const payload = {
          ...formData,
          preco: parseFloat(formData.preco),
          duracao_minutos: parseInt(formData.duracao_minutos)
      };

      if (formData.id) {
          // Se tem ID, é Edição (PUT)
          await api.put(`/api/servicos/${formData.id}/`, payload);
      } else {
          // Se NÃO tem ID, é Cadastro Novo (POST)
          // Arrancamos o campo 'id' fora do payload para o Django não surtar
          delete payload.id; 
          await api.post('/api/servicos/', payload);
      }
      
      setShowModal(false);
      loadServicos();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar serviço. Verifique os dados.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza?")) return;
    try {
      await api.delete(`/api/servicos/${id}/`);
      loadServicos();
    } catch (error) {
      alert("Erro ao excluir.");
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

        <div className="servicos-wrapper">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            .servicos-wrapper {
                min-height: 100vh; background-color: transparent; font-family: 'Inter', sans-serif;
                padding: 40px 20px 100px 20px; overflow-x: hidden;
            }
            .container-limit { max-width: 1150px; margin: 0 auto; }

            /* HEADER */
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

            /* BOTÃO NOVO */
            .btn-new {
                background: #002B55; color: white; border: none; border-radius: 10px;
                padding: 12px 25px; font-weight: 600; display: flex; align-items: center; gap: 8px;
                transition: 0.2s; box-shadow: 0 4px 10px rgba(0,43,85,0.2);
            }
            .btn-new:hover { background: #004080; transform: translateY(-2px); }

            /* TABELA */
            .table-panel { background: white; border-radius: 16px; box-shadow: 0 5px 30px rgba(0,0,0,0.05); overflow: hidden; }
            .clean-table { width: 100%; border-collapse: collapse; }
            .clean-table thead th {
                background: #F8F9FA; color: #525F7F; font-family: 'Inter', sans-serif;
                font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
                padding: 20px 25px; border-bottom: 1px solid #E9ECEF;
            }
            .clean-table tbody tr { border-bottom: 1px solid #F1F3F5; transition: background 0.2s; }
            .clean-table tbody tr:hover { background: #FAFBFC; }
            .clean-table td { padding: 20px 25px; vertical-align: middle; }

            .service-name { font-weight: 700; color: #002B55; font-size: 1rem; display: flex; align-items: center; gap: 10px; }
            .service-icon-box { width: 40px; height: 40px; background: #E3F2FD; color: #1565C0; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
            .info-pill { background: #F6F9FC; color: #525F7F; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
            .price-text { font-weight: 700; color: #2DCE89; font-size: 1rem; }
            .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
            .st-active { color: #2DCE89; font-weight: 600; font-size: 0.9rem; } .st-active .status-dot { background: #2DCE89; }
            .st-inactive { color: #ADB5BD; font-weight: 600; font-size: 0.9rem; } .st-inactive .status-dot { background: #ADB5BD; }

            .actions-cell { display: flex; justify-content: flex-end; gap: 6px; }
            .btn-icon-action { background: #e2e1ff; width: 45px; height: 45px; border-radius: 5px; border: 1px solid; display: flex; align-items: center; justify-content: center; transition: 0.4s; cursor: pointer; font-size: 0.83rem; }
            .act-edit { border: 1px solid #E3F2FD; color: #1565C0; } .act-edit:hover { background: #2a69b0; color: white; }
            .act-delete { border: 1px solid #FFEBEE; color: #F5365C; } .act-delete:hover { background: #ed4768; color: white; }

            /* Modal */
            .modal-clean-header { background: #002B55; color: white; padding: 25px; border: none; }
            .modal-clean-header .btn-close { filter: invert(1); opacity: 1; }
            .custom-input { width: 100%; padding: 12px 15px; border-radius: 10px; border: 2px solid #F1F3F5; background: #F8F9FA; color: #002B55; font-weight: 500; font-size: 0.9rem; }
            .custom-input:focus { border-color: #002B55; background: white; outline: none; }

            /* CARD DE FINALIZAÇÃO DO ONBOARDING (PREMIUM DESIGN) */
            .finish-onboarding-card {
                background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
                border-radius: 24px;
                padding: 40px;
                margin-top: 40px;
                text-align: center;
                border: 1px solid #E2E8F0;
                box-shadow: 0 20px 50px rgba(0, 43, 85, 0.08);
                position: relative;
                overflow: hidden;
            }
            .finish-onboarding-card::before {
                content: '';
                position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                background: radial-gradient(circle, rgba(45, 206, 137, 0.05) 0%, transparent 60%);
                z-index: 0;
            }
            .finish-content { position: relative; z-index: 1; }
            .finish-title { font-family: 'Libre Baskerville', serif; font-size: 2rem; color: #002B55; margin-bottom: 15px; }
            .finish-desc { color: #64748B; font-size: 1.1rem; max-width: 500px; margin: 0 auto 30px auto; line-height: 1.6; }

            .btn-finish-all {
                background: #002B55; color: white; border: none; padding: 18px 50px; border-radius: 50px;
                font-weight: 700; font-size: 1.1rem; letter-spacing: 0.5px; transition: all 0.3s ease;
                box-shadow: 0 10px 30px rgba(0, 43, 85, 0.25); display: inline-flex; align-items: center; gap: 12px;
            }
            .btn-finish-all:hover { transform: translateY(-3px) scale(1.02); background: #003366; box-shadow: 0 15px 40px rgba(0, 43, 85, 0.35); }
        `}</style>

        <div className="container-limit">
            
            {/* 1. SE FOR ONBOARDING, MOSTRA O HEADER DE PROGRESSO */}
            {isOnboarding && (
                <div className="mb-4">
                    <div className="p-3 bg-white rounded shadow-sm">
                        <OnboardingHeader step={3} />
                    </div>
                </div>
            )}

            {/* HEADER DA PÁGINA */}
            <div className="page-header">
                <div className="header-left">
                    {/* Esconde botão voltar se estiver no onboarding para focar no fluxo */}
                    {!isOnboarding && (
                        <button className="btn-back-circle" onClick={() => navigate('/admin-dashboard')}>
                            <FaArrowLeft />
                        </button>
                    )}
                    <div className="title-group">
                        <h1><FaHandshake className="me-2" /> Serviços</h1>
                        <span>Catálogo de serviços oferecidos</span>
                    </div>
                </div>
                <button className="btn-new" onClick={handleShowAdd}>
                    <FaPlus /> Novo Serviço
                </button>
            </div>

            {/* TABELA */}
            <div className="table-panel">
                <Table className="clean-table mb-0" responsive>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Duração</th>
                            <th>Preço</th>
                            <th>Status</th>
                            <th className="text-end">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servicos.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">
                                {isOnboarding 
                                    ? "Cadastre seu primeiro serviço acima para continuar!" 
                                    : "Nenhum serviço cadastrado."}
                            </td></tr>
                        ) : servicos.map(s => (
                            <tr key={s.id} style={{opacity: s.ativo ? 1 : 0.6}}>
                                <td>
                                    <div className="service-name">
                                        <div className="service-icon-box"><FaTag /></div>
                                        {s.nome}
                                    </div>
                                </td>
                                <td>
                                    <span className="info-pill"><FaClock size={12}/> {s.duracao_minutos} min</span>
                                </td>
                                <td>
                                    <span className="price-text">{money(s.preco)}</span>
                                </td>
                                <td>
                                    {s.ativo ? (
                                        <div className="st-active"><span className="status-dot"></span> Ativo</div>
                                    ) : (
                                        <div className="st-inactive"><span className="status-dot"></span> Inativo</div>
                                    )}
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button className="btn-icon-action act-edit" onClick={() => handleShowEdit(s)} title="Editar">
                                            <FaEdit />
                                        </button>
                                        <button className="btn-icon-action act-delete" onClick={() => handleDelete(s.id)} title="Excluir">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* 2. CARTÃO DE FINALIZAÇÃO (NOVO DESIGN PREMIUM) */}
            {isOnboarding && (
                <div className="finish-onboarding-card">
                    <div className="finish-content">
                        <div style={{fontSize: '3rem', marginBottom: '20px'}}>🚀</div>
                        <h2 className="finish-title">Tudo pronto para começar!</h2>
                        <p className="finish-desc">
                            Você configurou seu perfil, horários e serviços com sucesso. 
                            Sua loja já está pronta para receber agendamentos.
                        </p>
                        <button className="btn-finish-all" onClick={handleFinalizarOnboarding}>
                            Concluir e Ir para o Painel <FaRocket />
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="modal-clean-header">
                    <Modal.Title style={{fontFamily: 'Libre Baskerville', color:'white'}}>
                        {formData.id ? 'Editar Serviço' : 'Novo Serviço'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">Nome do Serviço</Form.Label>
                            <Form.Control 
                                type="text" placeholder="Ex: Corte Masculino" required 
                                className="custom-input"
                                value={formData.nome}
                                onChange={e => setFormData({...formData, nome: e.target.value})}
                            />
                        </Form.Group>
                        
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">Preço (R$)</Form.Label>
                                    <Form.Control 
                                        type="number" step="0.01" required 
                                        className="custom-input"
                                        value={formData.preco}
                                        onChange={e => setFormData({...formData, preco: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">Duração (min)</Form.Label>
                                    <Form.Control 
                                        type="number" step="5" required 
                                        className="custom-input"
                                        value={formData.duracao_minutos}
                                        onChange={e => setFormData({...formData, duracao_minutos: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3 pt-2">
                            <Form.Check 
                                type="switch"
                                id="custom-switch"
                                label={formData.ativo ? "Serviço Ativo (Visível)" : "Serviço Inativo (Oculto)"}
                                checked={formData.ativo}
                                onChange={e => setFormData({...formData, ativo: e.target.checked})}
                                style={{fontWeight: '600', color: formData.ativo ? '#2DCE89' : '#ADB5BD'}}
                            />
                        </Form.Group>

                    </Modal.Body>
                    <Modal.Footer style={{border: 'none', paddingTop: 0}}>
                        <Button variant="light" onClick={() => setShowModal(false)} style={{borderRadius:'10px'}}>Cancelar</Button>
                        <Button type="submit" style={{background:'#002B55', border:'none', borderRadius:'10px', padding:'10px 30px'}}>
                            Salvar
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
        </div>
    </>
  );
}