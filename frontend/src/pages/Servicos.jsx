import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

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
    duracao_minutos: 30, // Valor padrão sugerido
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

  // Abrir Modal para NOVO
  const handleShowAdd = () => {
    setFormData({ id: null, nome: '', preco: '', duracao_minutos: 30, ativo: true });
    setShowModal(true);
  };

  // Abrir Modal para EDITAR
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
      if (formData.id) {
        // Editar (PUT)
        await api.put(`/servicos/${formData.id}/`, formData);
      } else {
        // Criar (POST)
        await api.post('/servicos/', formData);
      }
      setShowModal(false);
      loadServicos(); // Recarrega a lista
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar serviço.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza? Isso não apagará agendamentos passados.")) return;
    try {
      await api.delete(`/servicos/${id}/`);
      loadServicos();
    } catch (error) {
      alert("Erro ao excluir.");
    }
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>✂️ Gerenciar Serviços</h2>
        <div>
            <Button variant="secondary" className="me-2" onClick={() => navigate('/admin-dashboard')}>
                Voltar
            </Button>
            <Button variant="primary" onClick={handleShowAdd}>
                + Novo Serviço
            </Button>
        </div>
      </div>

      <Table striped hover bordered className="bg-white shadow-sm align-middle">
        <thead>
            <tr>
                <th>Nome</th>
                <th>Duração</th>
                <th>Preço</th>
                <th>Status</th>
                <th style={{width: '150px'}}>Ações</th>
            </tr>
        </thead>
        <tbody>
            {servicos.map(s => (
                <tr key={s.id} style={{opacity: s.ativo ? 1 : 0.6}}>
                    <td>{s.nome}</td>
                    <td>{s.duracao_minutos} min</td>
                    <td className="fw-bold text-success">
                        R$ {parseFloat(s.preco).toFixed(2)}
                    </td>
                    <td>
                        {s.ativo ? 
                            <Badge bg="success">Ativo</Badge> : 
                            <Badge bg="secondary">Inativo</Badge>
                        }
                    </td>
                    <td>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowEdit(s)}>✎</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(s.id)}>🗑</Button>
                    </td>
                </tr>
            ))}
            {servicos.length === 0 && !loading && (
                <tr><td colSpan="5" className="text-center">Nenhum serviço cadastrado.</td></tr>
            )}
        </tbody>
      </Table>

      {/* MODAL DE FORMULÁRIO */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
            <Modal.Title>{formData.id ? 'Editar Serviço' : 'Novo Serviço'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Nome do Serviço</Form.Label>
                    <Form.Control 
                        type="text" placeholder="Ex: Corte Masculino" required 
                        value={formData.nome}
                        onChange={e => setFormData({...formData, nome: e.target.value})}
                    />
                </Form.Group>
                
                <Row>
                    <Col>
                        <Form.Group className="mb-3">
                            <Form.Label>Preço (R$)</Form.Label>
                            <Form.Control 
                                type="number" step="0.01" required 
                                value={formData.preco}
                                onChange={e => setFormData({...formData, preco: e.target.value})}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className="mb-3">
                            <Form.Label>Duração (min)</Form.Label>
                            <Form.Control 
                                type="number" step="5" required 
                                value={formData.duracao_minutos}
                                onChange={e => setFormData({...formData, duracao_minutos: e.target.value})}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Check 
                    type="switch"
                    id="custom-switch"
                    label="Serviço Ativo (Visível para clientes)"
                    checked={formData.ativo}
                    onChange={e => setFormData({...formData, ativo: e.target.checked})}
                />

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