import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Despesas() {
  const navigate = useNavigate();
  
  const [despesas, setDespesas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    id: null, // Se tiver ID, é edição
    descricao: '',
    valor: '',
    data_despesa: '',
    categoria: 'Fixa' // Valor padrão
  });

  useEffect(() => {
    loadDespesas();
  }, []);

  async function loadDespesas() {
    try {
      const response = await api.get('/financeiro/despesas/');
      setDespesas(response.data);
    } catch (error) {
      alert("Erro ao carregar despesas.");
    } finally {
      setLoading(false);
    }
  }

  // Prepara o modal para NOVA despesa
  const handleShowAdd = () => {
    setFormData({ id: null, descricao: '', valor: '', data_despesa: '', categoria: 'Fixa' });
    setShowModal(true);
  };

  // Prepara o modal para EDITAR despesa
  const handleShowEdit = (item) => {
    setFormData({
        id: item.id,
        descricao: item.descricao,
        valor: item.valor,
        data_despesa: item.data_despesa,
        categoria: item.categoria || 'Fixa'
    });
    setShowModal(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (formData.id) {
        // Editar (PUT)
        await api.put(`/financeiro/despesas/${formData.id}/`, formData);
      } else {
        // Criar (POST)
        await api.post('/financeiro/despesas/', formData);
      }
      setShowModal(false);
      loadDespesas(); // Recarrega a lista
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar despesa.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta despesa?")) return;
    try {
      await api.delete(`/financeiro/despesas/${id}/`);
      loadDespesas();
    } catch (error) {
      alert("Erro ao excluir.");
    }
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>💰 Gerenciar Despesas</h2>
        <div>
            <Button variant="secondary" className="me-2" onClick={() => navigate('/admin-dashboard')}>
                Voltar
            </Button>
            <Button variant="success" onClick={handleShowAdd}>
                + Nova Despesa
            </Button>
        </div>
      </div>

      {/* TABELA DE LISTAGEM */}
      <Table striped hover bordered className="bg-white shadow-sm">
        <thead>
            <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th style={{width: '150px'}}>Ações</th>
            </tr>
        </thead>
        <tbody>
            {despesas.map(d => (
                <tr key={d.id}>
                    <td>{new Date(d.data_despesa).toLocaleDateString()}</td>
                    <td>{d.descricao}</td>
                    <td><Badge bg="info">{d.categoria}</Badge></td>
                    <td className="fw-bold text-danger">
                        - R$ {parseFloat(d.valor).toFixed(2)}
                    </td>
                    <td>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowEdit(d)}>✎</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(d.id)}>🗑</Button>
                    </td>
                </tr>
            ))}
            {despesas.length === 0 && !loading && (
                <tr><td colSpan="5" className="text-center">Nenhuma despesa cadastrada.</td></tr>
            )}
        </tbody>
      </Table>

      {/* MODAL DE FORMULÁRIO */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
            <Modal.Title>{formData.id ? 'Editar Despesa' : 'Nova Despesa'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Descrição</Form.Label>
                    <Form.Control 
                        type="text" placeholder="Ex: Conta de Luz" required 
                        value={formData.descricao}
                        onChange={e => setFormData({...formData, descricao: e.target.value})}
                    />
                </Form.Group>
                
                <Row>
                    <Col>
                        <Form.Group className="mb-3">
                            <Form.Label>Valor (R$)</Form.Label>
                            <Form.Control 
                                type="number" step="0.01" required 
                                value={formData.valor}
                                onChange={e => setFormData({...formData, valor: e.target.value})}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className="mb-3">
                            <Form.Label>Data</Form.Label>
                            <Form.Control 
                                type="date" required 
                                value={formData.data_despesa}
                                onChange={e => setFormData({...formData, data_despesa: e.target.value})}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3">
                    <Form.Label>Categoria</Form.Label>
                    <Form.Select 
                        value={formData.categoria}
                        onChange={e => setFormData({...formData, categoria: e.target.value})}
                    >
                        <option value="Fixa">Custo Fixo (Aluguel, Internet)</option>
                        <option value="Variavel">Custo Variável (Materiais, Comissão)</option>
                        <option value="Pessoal">Retirada Pessoal</option>
                    </Form.Select>
                </Form.Group>

            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button variant="primary" type="submit">Salvar</Button>
            </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}