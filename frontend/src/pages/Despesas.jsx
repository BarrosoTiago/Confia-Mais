import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Row, Col, Spinner, Badge } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaMoneyBillWave, FaPlus, FaEdit, FaTrash, 
  FaCalendarDay, FaTag, FaFileInvoiceDollar 
} from 'react-icons/fa';

export default function Despesas() {
  const navigate = useNavigate();
  
  const [despesas, setDespesas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    id: null,
    descricao: '',
    valor: '',
    data: '', 
    categoria: 'FIXA'
  });

  useEffect(() => {
    loadDespesas();
  }, []);

  async function loadDespesas() {
    try {
      const response = await api.get('/despesas/');
      // Ordenar por data (mais recente primeiro)
      const listaOrdenada = response.data.sort((a, b) => new Date(b.data) - new Date(a.data));
      setDespesas(listaOrdenada);
    } catch (error) {
      alert("Erro ao carregar despesas.");
    } finally {
      setLoading(false);
    }
  }

  // Helpers
  const money = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateString) => {
      if(!dateString) return '-';
      const date = new Date(dateString);
      // Ajuste para fuso horário se necessário, ou usar string simples
      return date.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
  };

  // Modal Functions
  const handleShowAdd = () => {
    setFormData({ id: null, descricao: '', valor: '', data: new Date().toISOString().split('T')[0], categoria: 'FIXA' });
    setShowModal(true);
  };

  const handleShowEdit = (item) => {
    setFormData({
        id: item.id,
        descricao: item.descricao,
        valor: item.valor,
        data: item.data, 
        categoria: item.categoria || 'FIXA'
    });
    setShowModal(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (formData.id) await api.put(`/despesas/${formData.id}/`, formData);
      else await api.post('/despesas/', formData);
      
      setShowModal(false);
      loadDespesas(); 
    } catch (error) {
      alert("Erro ao salvar despesa.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta despesa?")) return;
    try {
      await api.delete(`/despesas/${id}/`);
      loadDespesas();
    } catch (error) {
      alert("Erro ao excluir.");
    }
  }

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#A8DADC'}}><Spinner animation="border" style={{color:'#002B55'}} /></div>;

  return (
    <div className="despesas-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .despesas-wrapper {
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

        /* BOTÃO NOVA DESPESA */
        .btn-new-expense {
            background: #C62828; color: white; border: none; border-radius: 10px;
            padding: 12px 25px; font-weight: 600; display: flex; align-items: center; gap: 8px;
            transition: 0.2s; box-shadow: 0 4px 10px rgba(198, 40, 40, 0.2);
        }
        .btn-new-expense:hover { background: #B71C1C; transform: translateY(-2px); }

        /* TABELA UNIFICADA */
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
        .date-cell { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #555; }
        .desc-text { font-weight: 700; color: #002B55; font-size: 1rem; }
        .value-text { font-weight: 700; color: #C62828; font-size: 1rem; } /* Vermelho para despesa */

        /* Badges de Categoria */
        .cat-badge { padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .cat-fixa { background: #E3F2FD; color: #1565C0; }
        .cat-variavel { background: #FFF3E0; color: #EF6C00; }
        .cat-invest { background: #E8F5E9; color: #2E7D32; }

        /* Ações */
        .actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
        .btn-icon-action {
            width: 35px; height: 35px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center;
            transition: 0.2s; cursor: pointer; font-size: 0.9rem;
        }
        .act-edit { background: #E3F2FD; color: #1565C0; } .act-edit:hover { background: #1565C0; color: white; }
        .act-delete { background: #FFEBEE; color: #C62828; } .act-delete:hover { background: #C62828; color: white; }

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
                      <h1><FaMoneyBillWave className="me-2" /> Despesas</h1>
                      <span>Controle de saídas e custos</span>
                  </div>
              </div>
              <button className="btn-new-expense" onClick={handleShowAdd}>
                  <FaPlus /> Nova Despesa
              </button>
          </div>

          {/* TABELA */}
          <div className="table-panel">
              <Table className="clean-table mb-0" responsive>
                  <thead>
                      <tr>
                          <th>Data</th>
                          <th>Descrição</th>
                          <th>Categoria</th>
                          <th>Valor</th>
                          <th className="text-end">Ações</th>
                      </tr>
                  </thead>
                  <tbody>
                      {despesas.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-5 text-muted">Nenhuma despesa registrada.</td></tr>
                      ) : despesas.map(d => {
                          // Lógica de badge
                          let badgeClass = 'cat-fixa';
                          if (d.categoria === 'VARIAVEL') badgeClass = 'cat-variavel';
                          if (d.categoria === 'INVESTIMENTO') badgeClass = 'cat-invest';

                          return (
                              <tr key={d.id}>
                                  <td>
                                      <div className="date-cell">
                                          <FaCalendarDay size={14} style={{opacity:0.5}}/>
                                          {formatDate(d.data)}
                                      </div>
                                  </td>
                                  <td>
                                      <span className="desc-text">{d.descricao}</span>
                                  </td>
                                  <td>
                                      <span className={`cat-badge ${badgeClass}`}>
                                          {d.categoria}
                                      </span>
                                  </td>
                                  <td>
                                      <span className="value-text">- {money(d.valor)}</span>
                                  </td>
                                  <td>
                                      <div className="actions-cell">
                                          <button className="btn-icon-action act-edit" onClick={() => handleShowEdit(d)} title="Editar">
                                              <FaEdit />
                                          </button>
                                          <button className="btn-icon-action act-delete" onClick={() => handleDelete(d.id)} title="Excluir">
                                              <FaTrash />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </Table>
          </div>

          {/* MODAL */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton className="modal-clean-header">
                <Modal.Title style={{fontFamily: 'Libre Baskerville', color:'white'}}>
                    {formData.id ? 'Editar Despesa' : 'Nova Despesa'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Descrição</Form.Label>
                        <Form.Control 
                            type="text" placeholder="Ex: Conta de Luz" required 
                            className="custom-input"
                            value={formData.descricao}
                            onChange={e => setFormData({...formData, descricao: e.target.value})}
                        />
                    </Form.Group>
                    
                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Valor (R$)</Form.Label>
                                <Form.Control 
                                    type="number" step="0.01" required 
                                    className="custom-input"
                                    value={formData.valor}
                                    onChange={e => setFormData({...formData, valor: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Data</Form.Label>
                                <Form.Control 
                                    type="date" required 
                                    className="custom-input"
                                    value={formData.data}
                                    onChange={e => setFormData({...formData, data: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Categoria</Form.Label>
                        <Form.Select 
                            className="custom-input"
                            value={formData.categoria}
                            onChange={e => setFormData({...formData, categoria: e.target.value})}
                        >
                            <option value="FIXA">Fixa (Aluguel, Internet, etc)</option>
                            <option value="VARIAVEL">Variável (Materiais, Comissão)</option>
                            <option value="INVESTIMENTO">Investimento / Melhorias</option>
                        </Form.Select>
                    </Form.Group>

                </Modal.Body>
                <Modal.Footer style={{border: 'none', paddingTop: 0}}>
                    <Button variant="light" onClick={() => setShowModal(false)} style={{borderRadius:'10px'}}>Cancelar</Button>
                    <Button type="submit" style={{background:'#C62828', border:'none', borderRadius:'10px', padding:'10px 30px'}}>
                        Salvar
                    </Button>
                </Modal.Footer>
            </Form>
          </Modal>
      </div>
    </div>
  );
}