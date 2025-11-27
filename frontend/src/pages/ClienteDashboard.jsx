import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';

export default function ClienteDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estados de Dados Gerais
  const [servicos, setServicos] = useState([]);
  const [meusAgendamentos, setMeusAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para a Lógica de Horários (UX Melhorada)
  const [horariosLoja, setHorariosLoja] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  // Estado do Formulário
  const [agendamentoData, setAgendamentoData] = useState({
    servico_id: '',
    data_hora: ''
  });

  // 1. Carrega dados iniciais (Serviços e Meus Agendamentos)
  useEffect(() => {
    async function loadData() {
      try {
        const [respServicos, respAgendamentos] = await Promise.all([
            api.get('/servicos/'),
            api.get('/agendamentos/')
        ]);

        setServicos(respServicos.data);
        setMeusAgendamentos(respAgendamentos.data);
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Monitora a escolha do serviço para buscar os horários do dono
  useEffect(() => {
    if (agendamentoData.servico_id) {
        fetchHorarios(agendamentoData.servico_id);
    } else {
        setHorariosLoja([]);
    }
  }, [agendamentoData.servico_id]);

  async function fetchHorarios(servicoId) {
    try {
        setLoadingHorarios(true);
        // Chama a rota pública que criamos no backend
        const response = await api.get(`/horarios/disponiveis/?servico_id=${servicoId}`);
        setHorariosLoja(response.data);
    } catch (error) {
        console.error("Erro ao buscar horários", error);
    } finally {
        setLoadingHorarios(false);
    }
  }

  // Envia o Agendamento
  async function handleAgendar(e) {
    e.preventDefault();
    if (!agendamentoData.servico_id || !agendamentoData.data_hora) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        await api.post('/agendamentos/', {
            servicos: [agendamentoData.servico_id],
            data_hora_inicio: agendamentoData.data_hora
        });
        
        alert("Agendamento realizado com sucesso!");
        
        // Limpa o form e recarrega a lista
        setAgendamentoData({ servico_id: '', data_hora: '' });
        const resp = await api.get('/agendamentos/');
        setMeusAgendamentos(resp.data);
        
    } catch (error) {
        console.error(error.response);
        // Tenta pegar a mensagem específica de validação de horário/conflito
        const msg = error.response?.data?.data_hora_inicio?.[0] || "Erro ao agendar. Tente outro horário.";
        alert(msg);
    }
  }

  if (loading) return (
    <Container className="vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
    </Container>
  );

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-primary px-4 mb-4 shadow">
        <span className="navbar-brand mb-0 h1">Olá, {user?.nome_completo || user?.username}</span>
        <Button variant="outline-light" size="sm" onClick={() => { logout(); navigate('/login'); }}>
            Sair
        </Button>
      </nav>

      <Container>
        <Row>
            {/* COLUNA DA ESQUERDA: FORMULÁRIO + HORÁRIOS */}
            <Col md={5} className="mb-4">
                <Card shadow="sm" className="border-0 mb-3">
                    <Card.Header className="bg-white fw-bold text-primary border-bottom-0 pt-3">
                        📅 Novo Agendamento
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleAgendar}>
                            <Form.Group className="mb-3">
                                <Form.Label>Escolha o Serviço:</Form.Label>
                                <Form.Select 
                                    value={agendamentoData.servico_id}
                                    onChange={e => setAgendamentoData({...agendamentoData, servico_id: e.target.value})}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {servicos.map(servico => (
                                        <option key={servico.id} value={servico.id}>
                                            {servico.nome} - R$ {servico.preco} ({servico.duracao_minutos} min)
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            {/* --- ÁREA VISUAL DE HORÁRIOS --- */}
                            <div className="mb-3 p-3 bg-light rounded border">
                                <h6 className="text-muted small fw-bold text-uppercase mb-3">
                                    🕒 Horários de Atendimento
                                </h6>
                                
                                {loadingHorarios ? (
                                    <div className="text-center py-2"><Spinner animation="border" size="sm" /></div>
                                ) : !agendamentoData.servico_id ? (
                                    <div className="text-center text-muted small fst-italic">
                                        Selecione um serviço acima para ver a disponibilidade.
                                    </div>
                                ) : horariosLoja.length === 0 ? (
                                    <Alert variant="warning" className="small py-2 mb-0">
                                        Horários não configurados pelo estabelecimento.
                                    </Alert>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm table-borderless small mb-0">
                                            <tbody>
                                                {horariosLoja.map(h => {
                                                    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
                                                    // Verifica se é o dia de hoje (JS: 0=Dom, Py: 0=Seg. Ajuste necessário)
                                                    // getDay(): 0=Dom, 1=Seg...
                                                    // h.dia_semana: 0=Seg...
                                                    // Conversão: (dia_semana + 1) % 7 == getDay()
                                                    const isHoje = new Date().getDay() === (h.dia_semana + 1) % 7; 
                                                    
                                                    return (
                                                        <tr key={h.id} className={isHoje ? "fw-bold text-primary bg-white" : "text-muted"}>
                                                            <td className="ps-2">
                                                                {dias[h.dia_semana]} 
                                                                {isHoje && <Badge bg="primary" className="ms-2" style={{fontSize:'0.6em'}}>HOJE</Badge>}
                                                            </td>
                                                            <td className="text-end pe-2">
                                                                {h.fechado ? (
                                                                    <span className="badge bg-secondary opacity-50">Fechado</span>
                                                                ) : (
                                                                    `${h.horario_abertura.slice(0,5)} - ${h.horario_fechamento.slice(0,5)}`
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Data e Hora:</Form.Label>
                                <Form.Control 
                                    type="datetime-local" 
                                    value={agendamentoData.data_hora}
                                    onChange={e => setAgendamentoData({...agendamentoData, data_hora: e.target.value})}
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Verifique a tabela acima antes de escolher.
                                </Form.Text>
                            </Form.Group>

                            <Button type="submit" variant="success" className="w-100 fw-bold">
                                Confirmar Agendamento
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>

            {/* COLUNA DA DIREITA: MEUS AGENDAMENTOS */}
            <Col md={7}>
                <h4 className="mb-3 text-secondary">Meus Agendamentos</h4>
                {meusAgendamentos.length === 0 ? (
                    <Alert variant="info">Você ainda não tem agendamentos futuros.</Alert>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {meusAgendamentos.map(agenda => (
                            <Card key={agenda.id} className="border-0 shadow-sm">
                                <Card.Body className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-1 fw-bold text-primary">
                                            {agenda.servicos_detalhes?.map(s => s.nome).join(', ')}
                                        </h6>
                                        <div className="text-muted small">
                                            📅 {new Date(agenda.data_hora_inicio).toLocaleDateString()} <br/>
                                            ⏰ {new Date(agenda.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                    <Badge bg={
                                        agenda.status === 'PENDENTE' ? 'warning' : 
                                        agenda.status === 'CONFIRMADO' ? 'success' : 
                                        agenda.status === 'CONCLUIDO' ? 'primary' : 'secondary'
                                    } className="p-2">
                                        {agenda.status}
                                    </Badge>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                )}
            </Col>
        </Row>
      </Container>
    </div>
  );
}