import { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ConfigHorarios() {
  const navigate = useNavigate();
  const [horarios, setHorarios] = useState([]); // O que vem do banco
  const [loading, setLoading] = useState(true);

  const diasSemana = [
    { id: 0, nome: 'Segunda-feira' },
    { id: 1, nome: 'Terça-feira' },
    { id: 2, nome: 'Quarta-feira' },
    { id: 3, nome: 'Quinta-feira' },
    { id: 4, nome: 'Sexta-feira' },
    { id: 5, nome: 'Sábado' },
    { id: 6, nome: 'Domingo' },
  ];

  useEffect(() => {
    loadHorarios();
  }, []);

  async function loadHorarios() {
    try {
      const response = await api.get('/config/horarios/');
      setHorarios(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Função inteligente: Atualiza ou Cria
  async function handleSave(diaIndex, dadosAtuais) {
    try {
      const payload = {
        dia_semana: diaIndex,
        horario_abertura: dadosAtuais.abertura || '08:00',
        horario_fechamento: dadosAtuais.fechamento || '18:00',
        // Garante que fechado seja booleano (true/false)
        fechado: !!dadosAtuais.fechado 
      };

      console.log("Enviando:", payload); // Para você ver no F12

      if (dadosAtuais.id) {
        await api.patch(`/config/horarios/${dadosAtuais.id}/`, payload);
      } else {
        await api.post('/config/horarios/', payload);
      }
      
      loadHorarios();
      alert("Salvo com sucesso!");

    } catch (error) {
      console.error("Erro detalhado:", error.response);
      
      // Captura a mensagem exata do Django
      let msg = "Erro ao salvar.";
      if (error.response && error.response.data) {
          // Se for erro de duplicidade ("unique set"), traduzimos
          if (error.response.data.non_field_errors) {
              msg = "Você já configurou este dia. Recarregue a página.";
          } else {
              // Mostra o erro técnico (ex: {"dia_semana": ["Erro..."]})
              msg = JSON.stringify(error.response.data);
          }
      }
      alert(msg);
    }
  }

  if (loading) return <Container className="p-5"><Spinner animation="border"/></Container>;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>⚙️ Horários de Funcionamento</h2>
        <Button variant="secondary" onClick={() => navigate('/admin-dashboard')}>Voltar</Button>
      </div>

      <Alert variant="info">
        Configure aqui os horários em que seus clientes podem agendar serviços.
      </Alert>

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="bg-light">
          <tr>
            <th>Dia da Semana</th>
            <th>Abertura</th>
            <th>Fechamento</th>
            <th>Status</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {diasSemana.map((dia) => {
            // Tenta achar a configuração deste dia na lista que veio do banco
            const config = horarios.find(h => h.dia_semana === dia.id) || {};
            
            // Valores temporários para os inputs (controlados pelo DOM por simplicidade aqui)
            const inputIdAbertura = `abertura-${dia.id}`;
            const inputIdFechamento = `fechamento-${dia.id}`;
            const inputIdFechado = `fechado-${dia.id}`;

            return (
              <tr key={dia.id} style={{opacity: config.fechado ? 0.6 : 1}}>
                <td className="fw-bold">{dia.nome}</td>
                
                <td>
                  <Form.Control 
                    id={inputIdAbertura}
                    type="time" 
                    defaultValue={config.horario_abertura || '08:00'} 
                    disabled={config.fechado}
                  />
                </td>
                
                <td>
                  <Form.Control 
                    id={inputIdFechamento}
                    type="time" 
                    defaultValue={config.horario_fechamento || '18:00'} 
                    disabled={config.fechado}
                  />
                </td>

                <td>
                  <Form.Check 
                    type="switch"
                    id={inputIdFechado}
                    label={config.fechado ? "Fechado" : "Aberto"}
                    defaultChecked={config.fechado}
                    // Truque visual para atualizar a linha na hora (react state seria melhor, mas assim é mais rapido)
                    onChange={(e) => {
                        const row = e.target.closest('tr');
                        row.style.opacity = e.target.checked ? 0.6 : 1;
                        const inputs = row.querySelectorAll('input[type="time"]');
                        inputs.forEach(i => i.disabled = e.target.checked);
                    }}
                  />
                </td>

                <td>
                  <Button 
                    variant={config.id ? "outline-primary" : "success"} 
                    size="sm"
                    onClick={() => {
                        const abertura = document.getElementById(inputIdAbertura).value;
                        const fechamento = document.getElementById(inputIdFechamento).value;
                        const fechado = document.getElementById(inputIdFechado).checked;
                        
                        handleSave(dia.id, { id: config.id, abertura, fechamento, fechado });
                    }}
                  >
                    {config.id ? "Atualizar" : "Criar"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Container>
  );
}