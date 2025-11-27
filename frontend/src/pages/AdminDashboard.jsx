import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Importando componentes visuais do Bootstrap
import { Container, Row, Col, Card, Table, Badge, Button, Spinner } from 'react-bootstrap';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [financeiro, setFinanceiro] = useState({ receita: 0, despesas: 0, lucro: 0 });
  const [agendamentos, setAgendamentos] = useState([]);

  // Função para carregar tudo assim que a tela abre
  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      // Buscamos duas coisas ao mesmo tempo (Paralelismo)
      const [respFinanceiro, respAgenda] = await Promise.all([
        api.get('/financeiro/transacoes/dashboard/'),
        api.get('/agendamentos/')
      ]);

      setFinanceiro(respFinanceiro.data);
      setAgendamentos(respAgenda.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard", error);
      alert("Erro ao carregar dados. Verifique se o servidor está rodando.");
    } finally {
      setLoading(false);
    }
  }

  // Função para mudar o status do agendamento (Aprovar/Cancelar/Concluir)
  async function handleStatusChange(id, novoStatus) {
    if(!window.confirm(`Deseja realmente marcar como ${novoStatus}?`)) return;

    try {
      await api.patch(`/agendamentos/${id}/`, { status: novoStatus });
      loadDashboardData(); // Recarrega a lista para atualizar a tela
    } catch (error) {
      alert("Erro ao atualizar status.");
    }
  }

  // Formatador de Dinheiro (R$)
  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid className="bg-light min-vh-100 p-0">
      {/* --- NAVBAR --- */}
      <nav className="navbar navbar-dark bg-dark px-4 mb-4 shadow">
        <span className="navbar-brand mb-0 h1">Painel do Empreendedor</span>
        <div className="d-flex gap-3 align-items-center">
            <span className="text-white small">Olá, {user?.username}</span>
            <Button variant="outline-light" size="sm" onClick={() => { logout(); navigate('/login'); }}>
                Sair
            </Button>
        </div>
      </nav>

      <Container>
        
        {/* --- CABEÇALHO FINANCEIRO E BOTÕES DE GESTÃO --- */}
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="text-secondary mb-0">Resumo do Mês</h4>
            
            {/* Agrupamento dos botões */}
            <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm" onClick={() => navigate('/admin/servicos')}>
                    ✂️ Serviços
                </Button>
                
                {/* NOVO BOTÃO ADICIONADO */}
                <Button variant="outline-dark" size="sm" onClick={() => navigate('/admin/config-horarios')}>
                    ⚙️ Horários
                </Button>

                <Button variant="outline-danger" size="sm" onClick={() => navigate('/admin/despesas')}>
                    💰 Despesas
                </Button>
            </div>
        </div>

        {/* --- CARDS FINANCEIROS --- */}
        <Row className="mb-5">
            <Col md={4}>
                <Card className="text-white bg-success mb-3 shadow-sm h-100"
                style={{ cursor: 'pointer' }} // Faz a mãozinha aparecer
                onClick={() => navigate('/admin/financeiro')} // O comando de ir para a tela
                >
                    <Card.Body>
                        <Card.Title>Receita (Entradas)</Card.Title>
                        <Card.Text className="fs-2 fw-bold">
                            {formatMoney(financeiro.receita)}
                        </Card.Text>
                        <small>Clique para gerenciar →</small>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={4}>
                <Card className="text-white bg-danger mb-3 shadow-sm h-100">
                    <Card.Body>
                        <Card.Title>Despesas (Saídas)</Card.Title>
                        <Card.Text className="fs-2 fw-bold">
                            {formatMoney(financeiro.despesas)}
                        </Card.Text>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={4}>
                <Card className={`text-white mb-3 shadow-sm h-100 ${financeiro.lucro >= 0 ? 'bg-primary' : 'bg-warning'}`}>
                    <Card.Body>
                        <Card.Title>Lucro Líquido</Card.Title>
                        <Card.Text className="fs-2 fw-bold">
                            {formatMoney(financeiro.lucro)}
                        </Card.Text>
                    </Card.Body>
                </Card>
            </Col>
        </Row>

        {/* --- TABELA DE AGENDAMENTOS --- */}
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="text-secondary">Próximos Agendamentos</h4>
            <Button variant="primary" size="sm" onClick={() => navigate('/admin/agendamentos')}>
                Gerenciar Agenda Completa
            </Button>
        </div>

        <Card className="shadow-sm border-0 mb-5">
            <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                    <tr>
                        <th>Cliente</th>
                        <th>Serviço(s)</th>
                        <th>Data e Hora</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {agendamentos.map((agenda) => (
                        <tr key={agenda.id}>
                            <td className="fw-bold">{agenda.cliente_nome}</td>
                            <td>
                                {agenda.servicos_detalhes?.map(s => (
                                    <div key={s.id} className="small text-muted">{s.nome}</div>
                                ))}
                            </td>
                            <td>
                                {new Date(agenda.data_hora_inicio).toLocaleDateString()} <br/>
                                <small>{new Date(agenda.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </td>
                            <td>
                                <Badge bg={
                                    agenda.status === 'CONFIRMADO' ? 'success' :
                                    agenda.status === 'PENDENTE' ? 'warning' :
                                    agenda.status === 'CANCELADO' ? 'danger' : 'secondary'
                                }>
                                    {agenda.status}
                                </Badge>
                            </td>
                            <td>
                                {agenda.status === 'PENDENTE' && (
                                    <>
                                        <Button variant="outline-success" size="sm" className="me-2" 
                                            onClick={() => handleStatusChange(agenda.id, 'CONFIRMADO')} title="Aprovar">
                                            ✔
                                        </Button>
                                        <Button variant="outline-danger" size="sm"
                                            onClick={() => handleStatusChange(agenda.id, 'CANCELADO')} title="Recusar">
                                            ✖
                                        </Button>
                                    </>
                                )}
                                {agenda.status === 'CONFIRMADO' && (
                                    <Button variant="outline-primary" size="sm"
                                        onClick={() => handleStatusChange(agenda.id, 'CONCLUIDO')}>
                                        Concluir Serviço
                                    </Button>
                                )}
                                {agenda.status === 'CONCLUIDO' && (
                                    <span className="text-success small">Finalizado</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {agendamentos.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center py-4 text-muted">
                                Nenhuma agenda encontrada.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </Card>

      </Container>
    </Container>
  );
}