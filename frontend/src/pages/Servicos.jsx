import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Badge, Row, Col, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaHandshake, FaPlus, FaEdit, FaTrash, 
  FaClock, FaTag, FaCheckCircle, FaBan 
} from 'react-icons/fa';

export default function Servicos() {
  const navigate = useNavigate();
  
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
      const response = await api.get('/servicos/');
      setServicos(response.data);
    } catch (error) {
      alert("Erro ao carregar serviços.");
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
      if (formData.id) await api.put(`/servicos/${formData.id}/`, formData);
      else await api.post('/servicos/', formData);
      
      setShowModal(false);
      loadServicos();
    } catch (error) {
      alert("Erro ao salvar serviço.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza?")) return;
    try {
      await api.delete(`/servicos/${id}/`);
      loadServicos();
    } catch (error) {
      alert("Erro ao excluir.");
    }
  }

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#A8DADC'}}><Spinner animation="border" style={{color:'#002B55'}} /></div>;

  return (
    <div className="servicos-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .servicos-wrapper {
          min-height: 100vh; background-color: #A8DADC; font-family: 'Inter', sans-serif;
          padding: 40px 20px; overflow-x: hidden;
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
        .title-group h1 { font-family: 'Libre Baskerville', serif; font-weight: 700; font-size: 1.8rem; color: #002B55; margin: 0; }
        .title-group span { font-size: 0.9rem; color: #555; }

        /* BOTÃO NOVO */
        .btn-new {
            background: #002B55; color: white; border: none; border-radius: 10px;
            padding: 12px 25px; font-weight: 600; display: flex; align-items: center; gap: 8px;
            transition: 0.2s; box-shadow: 0 4px 10px rgba(0,43,85,0.2);
        }
        .btn-new:hover { background: #004080; transform: translateY(-2px); }

        /* TABELA UNIFICADA (CARD STYLE) */
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

        /* Células */
        .service-name { font-weight: 700; color: #002B55; font-size: 1rem; display: flex; align-items: center; gap: 10px; }
        .service-icon-box { 
            width: 40px; height: 40px; background: #E3F2FD; color: #1565C0; border-radius: 10px; 
            display: flex; align-items: center; justify-content: center; font-size: 1rem; 
        }
        
        .info-pill { 
            background: #F6F9FC; color: #525F7F; padding: 6px 12px; border-radius: 20px; 
            font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; 
        }
        
        .price-text { font-weight: 700; color: #2DCE89; font-size: 1rem; }

        /* Status */
        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
        .st-active { color: #2DCE89; font-weight: 600; font-size: 0.9rem; } .st-active .status-dot { background: #2DCE89; }
        .st-inactive { color: #ADB5BD; font-weight: 600; font-size: 0.9rem; } .st-inactive .status-dot { background: #ADB5BD; }

        /* Ações */
        .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
        .btn-icon-action {
            width: 35px; height: 35px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center;
            transition: 0.2s; cursor: pointer; font-size: 0.9rem;
        }
        .act-edit { background: #E3F2FD; color: #1565C0; } .act-edit:hover { background: #1565C0; color: white; }
        .act-delete { background: #FFEBEE; color: #F5365C; } .act-delete:hover { background: #F5365C; color: white; }

        /* Modal */
        .modal-clean-header { background: #002B55; color: white; padding: 25px; border: none; }
        .modal-clean-header .btn-close { filter: invert(1); opacity: 1; }
        
        .custom-input {
            width: 100%; padding: 12px 15px; border-radius: 10px; border: 2px solid #F1F3F5;
            background: #F8F9FA; color: #002B55; font-weight: 500; font-size: 0.9rem;
        }
        .custom-input:focus { border-color: #002B55; background: white; outline: none; }
      `}</style>

      <div className="container-limit">
          
          {/* HEADER */}
          <div className="page-header">
              <div className="header-left">
                  <button className="btn-back-circle" onClick={() => navigate('/admin-dashboard')}>
                      <FaArrowLeft />
                  </button>
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
                          <tr><td colSpan="5" className="text-center py-5 text-muted">Nenhum serviço cadastrado.</td></tr>
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
  );
}