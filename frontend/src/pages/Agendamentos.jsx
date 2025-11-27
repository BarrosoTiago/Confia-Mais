import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Badge, Row, Col, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// Ícone do WhatsApp (opcional, pode usar texto se preferir)
// Se não tiver ícone, pode usar emoji 📱 ou importar de uma lib
const WhatsAppIcon = () => <span style={{fontSize: '1.2em'}}>📱</span>;

export default function Agendamentos() {
  const navigate = useNavigate();
  
  // Dados
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  // Controles
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- NOVOS ESTADOS PARA FILTRO ---
  const [filtroData, setFiltroData] = useState(''); // Data no formato YYYY-MM-DD
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  // Formulário
  const [formData, setFormData] = useState({
    id: null, cliente: '', servicos: [], data_hora_inicio: '', status: 'PENDENTE'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [respAgenda, respServicos, respClientes] = await Promise.all([
        api.get('/agendamentos/'),
        api.get('/servicos/'),
        api.get('/auth/clientes/')
      ]);
      
      // Ordena: Mais recentes primeiro
      const listaOrdenada = respAgenda.data.sort((a, b) => 
        new Date(b.data_hora_inicio) - new Date(a.data_hora_inicio)
      );

      setAgendamentos(listaOrdenada);
      setServicos(respServicos.data);
      setClientes(respClientes.data);
    } catch (error) {
      alert("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  // --- NOVA FUNÇÃO: WHATSAPP ---
  const handleWhatsApp = (agenda) => {
    // 1. Limpa o número (deixa só dígitos)
    const telefone = agenda.cliente_telefone?.replace(/\D/g, '');
    
    if (!telefone) {
        alert("Este cliente não tem telefone cadastrado.");
        return;
    }

    // 2. Monta a mensagem amigável
    const data = new Date(agenda.data_hora_inicio).toLocaleDateString();
    const hora = new Date(agenda.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const servicoNome = agenda.servicos_detalhes?.[0]?.nome || "serviço";

    const msg = `Olá ${agenda.cliente_nome}! Tudo bem? Passando para lembrar do seu agendamento de *${servicoNome}* dia *${data} às ${hora}*.`;

    // 3. Abre o link
    // Nota: Adicione o código do país se não tiver (ex: 55 para Brasil)
    const numeroFinal = telefone.length <= 11 ? `55${telefone}` : telefone;
    window.open(`https://wa.me/${numeroFinal}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- LÓGICA DE FILTRAGEM ---
  // Isso acontece em tempo real, sem chamar o backend de novo
  const agendamentosFiltrados = agendamentos.filter(a => {
    // Filtro de Data
    let dataMatch = true;
    if (filtroData) {
        // Pega só a parte YYYY-MM-DD da data do agendamento
        const dataAgenda = new Date(a.data_hora_inicio).toISOString().slice(0, 10);
        dataMatch = dataAgenda === filtroData;
    }

    // Filtro de Status
    let statusMatch = true;
    if (filtroStatus !== 'TODOS') {
        statusMatch = a.status === filtroStatus;
    }

    return dataMatch && statusMatch;
  });


  // --- FUNÇÕES DO MODAL (IGUAIS AO ANTERIOR) ---
  const handleShowAdd = () => {
    setFormData({ id: null, cliente: '', servicos: [], data_hora_inicio: '', status: 'PENDENTE' });
    setShowModal(true);
  };

  const handleShowEdit = (item) => {
    let dataFormatada = '';
    if (item.data_hora_inicio) {
        dataFormatada = new Date(item.data_hora_inicio).toISOString().slice(0, 16);
    }
    setFormData({
        id: item.id,
        cliente: item.cliente,
        servicos: item.servicos,
        data_hora_inicio: dataFormatada,
        status: item.status
    });
    setShowModal(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (formData.servicos.length === 0) { alert("Selecione um serviço."); return; }

    try {
      const payload = { ...formData, servicos: Array.isArray(formData.servicos) ? formData.servicos : [formData.servicos] };
      
      if (formData.id) await api.patch(`/agendamentos/${formData.id}/`, payload);
      else await api.post('/agendamentos/', payload);
      
      setShowModal(false);
      loadData();
      alert("Salvo com sucesso!");
    } catch (error) {
        const msg = error.response?.data?.data_hora_inicio?.[0] || "Erro ao salvar.";
        alert(msg);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza?")) return;
    try {
      await api.delete(`/agendamentos/${id}/`);
      loadData();
    } catch (error) { alert("Erro ao excluir."); }
  }

  const handleServiceChange = (e) => {
    const options = e.target.options;
    const value = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) value.push(parseInt(options[i].value));
    }
    setFormData({...formData, servicos: value});
  };

  if (loading) return <Container className="vh-100 d-flex justify-content-center align-items-center"><Spinner animation="border"/></Container>;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary">📅 Agenda</h2>
        <div>
            <Button variant="secondary" className="me-2" onClick={() => navigate('/admin-dashboard')}>Voltar</Button>
            <Button variant="success" onClick={handleShowAdd}>+ Novo</Button>
        </div>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-light p-3 rounded shadow-sm mb-3 d-flex flex-wrap gap-3 align-items-end">
        <div>
            <label className="form-label small fw-bold text-muted">Filtrar por Data:</label>
            <input 
                type="date" 
                className="form-control" 
                value={filtroData} 
                onChange={e => setFiltroData(e.target.value)} 
            />
        </div>
        <div>
            <label className="form-label small fw-bold text-muted">Filtrar por Status:</label>
            <select 
                className="form-select" 
                value={filtroStatus} 
                onChange={e => setFiltroStatus(e.target.value)}
            >
                <option value="TODOS">Todos</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="CONFIRMADO">Confirmados</option>
                <option value="CONCLUIDO">Concluídos</option>
                <option value="CANCELADO">Cancelados</option>
            </select>
        </div>
        {/* Botão limpar filtros */}
        {(filtroData || filtroStatus !== 'TODOS') && (
            <Button variant="outline-secondary" onClick={() => {setFiltroData(''); setFiltroStatus('TODOS')}}>
                Limpar Filtros
            </Button>
        )}
      </div>

      <Table striped hover bordered responsive className="bg-white shadow-sm align-middle">
        <thead className="bg-light">
            <tr>
                <th>Data/Hora</th>
                <th>Cliente</th>
                <th>Serviços</th>
                <th>Status</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            {/* USAMOS A LISTA FILTRADA AQUI */}
            {agendamentosFiltrados.map(a => (
                <tr key={a.id}>
                    <td>
                        <strong>{new Date(a.data_hora_inicio).toLocaleDateString()}</strong> <br/>
                        {new Date(a.data_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </td>
                    <td>
                        {a.cliente_nome} <br/>
                        <small className="text-muted">{a.cliente_telefone || 'Sem tel'}</small>
                    </td>
                    <td>{a.servicos_detalhes?.map(s => <Badge key={s.id} bg="light" text="dark" className="me-1 border">{s.nome}</Badge>)}</td>
                    <td>
                        <Badge bg={
                            a.status === 'CONFIRMADO' ? 'success' :
                            a.status === 'PENDENTE' ? 'warning' :
                            a.status === 'CANCELADO' ? 'danger' : 'secondary'
                        }>{a.status}</Badge>
                    </td>
                    <td>
                        {/* BOTÃO WHATSAPP */}
                        <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="me-2" 
                            title="Enviar WhatsApp"
                            onClick={() => handleWhatsApp(a)}
                        >
                            <WhatsAppIcon />
                        </Button>

                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowEdit(a)}>✎</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(a.id)}>🗑</Button>
                    </td>
                </tr>
            ))}
            {agendamentosFiltrados.length === 0 && (
                <tr><td colSpan="5" className="text-center py-4">Nenhum agendamento encontrado com estes filtros.</td></tr>
            )}
        </tbody>
      </Table>

      {/* --- MODAL (MANTIDO IGUAL) --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
        <Modal.Header closeButton><Modal.Title>{formData.id ? 'Editar' : 'Novo'}</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Cliente</Form.Label>
                    <Form.Select value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} required>
                        <option value="">Selecione...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_completo || c.username}</option>)}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Início</Form.Label>
                    <Form.Control type="datetime-local" value={formData.data_hora_inicio} onChange={e => setFormData({...formData, data_hora_inicio: e.target.value})} required />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Serviços</Form.Label>
                    <Form.Select multiple value={formData.servicos} onChange={handleServiceChange} required style={{height: '100px'}}>
                        {servicos.map(s => <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco}</option>)}
                    </Form.Select>
                </Form.Group>
                {formData.id && (
                    <Form.Group className="mb-3"><Form.Label>Status</Form.Label>
                        <Form.Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                            <option value="PENDENTE">Pendente</option><option value="CONFIRMADO">Confirmado</option><option value="CONCLUIDO">Concluído</option><option value="CANCELADO">Cancelado</option>
                        </Form.Select>
                    </Form.Group>
                )}
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