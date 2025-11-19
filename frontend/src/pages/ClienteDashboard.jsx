import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ClienteDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [servicos, setServicos] = useState([]);
  const [meusAgendamentos, setMeusAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para o formulário de agendamento rápido
  const [agendamentoData, setAgendamentoData] = useState({
    servico_id: '',
    data_hora: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        // Busca serviços e agendamentos em paralelo
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

  async function handleAgendar(e) {
    e.preventDefault();
    if (!agendamentoData.servico_id || !agendamentoData.data_hora) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        await api.post('/agendamentos/', {
            servicos: [agendamentoData.servico_id], // API espera uma lista de IDs
            data_hora_inicio: agendamentoData.data_hora
        });
        
        alert("Agendamento realizado com sucesso!");
        // Recarrega a lista para mostrar o novo
        const resp = await api.get('/agendamentos/');
        setMeusAgendamentos(resp.data);
        
    } catch (error) {
        // Mostra o erro que configuramos no Backend (ex: Conflito de horário)
        console.error(error.response);
        const msg = error.response?.data?.data_hora_inicio?.[0] || "Erro ao agendar.";
        alert(msg);
    }
  }

  if (loading) return <div className="p-5 text-center">Carregando...</div>;

  return (
    <div className="container-fluid bg-light min-vh-100">
      {/* Navbar Simples */}
      <nav className="navbar navbar-dark bg-primary px-4 mb-4">
        <span className="navbar-brand mb-0 h1">Olá, {user?.nome_completo || user?.username}</span>
        <button onClick={() => { logout(); navigate('/'); }} className="btn btn-outline-light btn-sm">
            Sair
        </button>
      </nav>

      <div className="container">
        <div className="row">
            
            {/* COLUNA DA ESQUERDA: AGENDAR NOVO */}
            <div className="col-md-5 mb-4">
                <div className="card shadow-sm border-0">
                    <div className="card-header bg-white fw-bold text-primary">
                        Novo Agendamento
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleAgendar}>
                            <div className="mb-3">
                                <label className="form-label">Escolha o Serviço:</label>
                                <select 
                                    className="form-select"
                                    value={agendamentoData.servico_id}
                                    onChange={e => setAgendamentoData({...agendamentoData, servico_id: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {servicos.map(servico => (
                                        <option key={servico.id} value={servico.id}>
                                            {servico.nome} - R$ {servico.preco} ({servico.duracao_minutos} min)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Data e Hora:</label>
                                <input 
                                    type="datetime-local" 
                                    className="form-control"
                                    value={agendamentoData.data_hora}
                                    onChange={e => setAgendamentoData({...agendamentoData, data_hora: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="btn btn-success w-100">
                                Confirmar Agendamento
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* COLUNA DA DIREITA: MEUS AGENDAMENTOS */}
            <div className="col-md-7">
                <h4 className="mb-3 text-secondary">Meus Agendamentos</h4>
                {meusAgendamentos.length === 0 ? (
                    <div className="alert alert-info">Você ainda não tem agendamentos.</div>
                ) : (
                    <div className="list-group shadow-sm">
                        {meusAgendamentos.map(agenda => (
                            <div key={agenda.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 fw-bold">
                                        {agenda.servicos_detalhes?.map(s => s.nome).join(', ')}
                                    </h6>
                                    <small className="text-muted">
                                        📅 {new Date(agenda.data_hora_inicio).toLocaleDateString()} às 
                                        {new Date(agenda.data_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </small>
                                </div>
                                <span className={`badge ${
                                    agenda.status === 'PENDENTE' ? 'bg-warning text-dark' : 
                                    agenda.status === 'CONFIRMADO' ? 'bg-success' : 'bg-secondary'
                                }`}>
                                    {agenda.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}