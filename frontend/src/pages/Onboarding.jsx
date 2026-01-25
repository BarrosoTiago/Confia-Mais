import { useState } from 'react';
import { Container, Row, Col, Form, Button, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AnimatedBackground from '../components/AnimatedBackground';
import { FaStore, FaClock, FaCut, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Perfil, 2: Horários, 3: Serviços
  const [loading, setLoading] = useState(false);

  // ESTADOS DOS FORMULÁRIOS
  const [perfil, setPerfil] = useState({ nome_completo: '', telefone: '', endereco: '' });
  const [horario, setHorario] = useState({ inicio: '09:00', fim: '18:00', dias: [] });
  const [servico, setServico] = useState({ nome: '', preco: '', duracao: '30' });

  // PASSO 1: SALVAR PERFIL
  const handleSavePerfil = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/auth/users/me/', perfil);
      setStep(2);
    } catch (err) { alert('Erro ao salvar perfil.'); }
    setLoading(false);
  };

  // PASSO 2: SALVAR HORÁRIOS (Simplificado: Seg a Sex)
  const handleSaveHorario = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Cria horário padrão para Seg(0) a Sex(4)
      const diasSemana = [0, 1, 2, 3, 4]; 
      for (const dia of diasSemana) {
          await api.post('/horarios-config/', {
              dia_semana: dia,
              horario_abertura: horario.inicio,
              horario_fechamento: horario.fim,
              ativo: true
          });
      }
      setStep(3);
    } catch (err) { 
        // Se der erro (ex: já existe), apenas avança
        setStep(3); 
    }
    setLoading(false);
  };

  // PASSO 3: CRIAR PRIMEIRO SERVIÇO E FINALIZAR
  const handleFinish = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Cria o serviço
      await api.post('/servicos/', {
          nome: servico.nome,
          preco: parseFloat(servico.preco),
          duracao_minutos: parseInt(servico.duracao)
      });

      // 2. Marca setup como concluído no Backend
      await api.patch('/auth/users/me/', { setup_concluido: true });

      alert("🎉 Configuração concluída! Bem-vindo ao seu painel.");
      
      // Força recarregar para atualizar o contexto do usuário ou redireciona
      window.location.href = '/admin-dashboard';

    } catch (err) { alert('Erro ao finalizar.'); }
    setLoading(false);
  };

  // --- COMPONENTES VISUAIS ---
  return (
    <>
      <AnimatedBackground />
      <div className="onboarding-wrapper">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
            .onboarding-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'Inter', sans-serif; }
            .glass-card { background: white; border-radius: 20px; padding: 40px; width: 100%; max-width: 600px; box-shadow: 0 10px 40px rgba(0,43,85,0.1); border: 1px solid rgba(255,255,255,0.8); }
            .step-title { font-family: 'Libre Baskerville'; font-size: 1.5rem; color: #002B55; margin-bottom: 10px; }
            .step-desc { color: #666; margin-bottom: 30px; }
            .custom-input { background: #F8F9FA; border: 2px solid #E9ECEF; padding: 12px; border-radius: 10px; margin-bottom: 15px; width: 100%; }
            .btn-next { background: #002B55; color: white; width: 100%; padding: 12px; border-radius: 30px; border: none; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 20px; }
            .btn-next:hover { background: #004080; }
        `}</style>

        <div className="glass-card">
            {/* BARRA DE PROGRESSO */}
            <div className="mb-4">
                <ProgressBar now={(step / 3) * 100} variant="info" style={{height: '6px'}} />
                <div className="d-flex justify-content-between mt-2 small text-muted fw-bold">
                    <span style={{color: step >= 1 ? '#002B55' : '#ccc'}}>1. Perfil</span>
                    <span style={{color: step >= 2 ? '#002B55' : '#ccc'}}>2. Horários</span>
                    <span style={{color: step >= 3 ? '#002B55' : '#ccc'}}>3. Serviços</span>
                </div>
            </div>

            {/* PASSO 1: DADOS DA LOJA */}
            {step === 1 && (
                <Form onSubmit={handleSavePerfil}>
                    <div className="text-center mb-4">
                        <div style={{width:60, height:60, background:'#E3F2FD', color:'#002B55', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', margin:'0 auto 15px auto'}}>
                            <FaStore />
                        </div>
                        <h2 className="step-title">Vamos configurar sua Loja</h2>
                        <p className="step-desc">Primeiro, conte para seus clientes quem é você.</p>
                    </div>

                    <Form.Control required placeholder="Nome da Barbearia/Salão" className="custom-input"
                        value={perfil.nome_completo} onChange={e => setPerfil({...perfil, nome_completo: e.target.value})} 
                    />
                    <Form.Control required placeholder="Telefone / WhatsApp" className="custom-input"
                        value={perfil.telefone} onChange={e => setPerfil({...perfil, telefone: e.target.value})} 
                    />
                    <Form.Control required placeholder="Endereço Completo" className="custom-input"
                        value={perfil.endereco} onChange={e => setPerfil({...perfil, endereco: e.target.value})} 
                    />

                    <button type="submit" className="btn-next" disabled={loading}>
                        {loading ? 'Salvando...' : <>Próximo <FaArrowRight /></>}
                    </button>
                </Form>
            )}

            {/* PASSO 2: HORÁRIOS */}
            {step === 2 && (
                <Form onSubmit={handleSaveHorario}>
                    <div className="text-center mb-4">
                        <div style={{width:60, height:60, background:'#E3F2FD', color:'#002B55', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', margin:'0 auto 15px auto'}}>
                            <FaClock />
                        </div>
                        <h2 className="step-title">Horário de Funcionamento</h2>
                        <p className="step-desc">Defina um horário padrão para Segunda a Sexta.</p>
                    </div>

                    <Row>
                        <Col>
                            <label className="small fw-bold text-muted mb-1">Abertura</label>
                            <Form.Control type="time" className="custom-input"
                                value={horario.inicio} onChange={e => setHorario({...horario, inicio: e.target.value})} 
                            />
                        </Col>
                        <Col>
                            <label className="small fw-bold text-muted mb-1">Fechamento</label>
                            <Form.Control type="time" className="custom-input"
                                value={horario.fim} onChange={e => setHorario({...horario, fim: e.target.value})} 
                            />
                        </Col>
                    </Row>
                    <p className="small text-muted text-center mt-2">
                        * Você poderá configurar dias específicos e finais de semana detalhadamente depois no painel.
                    </p>

                    <button type="submit" className="btn-next" disabled={loading}>
                        {loading ? 'Salvando...' : <>Próximo <FaArrowRight /></>}
                    </button>
                </Form>
            )}

            {/* PASSO 3: PRIMEIRO SERVIÇO */}
            {step === 3 && (
                <Form onSubmit={handleFinish}>
                    <div className="text-center mb-4">
                        <div style={{width:60, height:60, background:'#E3F2FD', color:'#002B55', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', margin:'0 auto 15px auto'}}>
                            <FaCut />
                        </div>
                        <h2 className="step-title">Adicione um Serviço</h2>
                        <p className="step-desc">Cadastre pelo menos um serviço para começar.</p>
                    </div>

                    <Form.Control required placeholder="Nome do Serviço (ex: Corte de Cabelo)" className="custom-input"
                        value={servico.nome} onChange={e => setServico({...servico, nome: e.target.value})} 
                    />
                    <Row>
                        <Col>
                            <Form.Control required type="number" placeholder="Preço (R$)" className="custom-input"
                                value={servico.preco} onChange={e => setServico({...servico, preco: e.target.value})} 
                            />
                        </Col>
                        <Col>
                            <Form.Control required type="number" placeholder="Duração (min)" className="custom-input"
                                value={servico.duracao} onChange={e => setServico({...servico, duracao: e.target.value})} 
                            />
                        </Col>
                    </Row>

                    <button type="submit" className="btn-next" disabled={loading}>
                        {loading ? 'Finalizando...' : <><FaCheckCircle /> Concluir Configuração</>}
                    </button>
                </Form>
            )}

        </div>
      </div>
    </>
  );
}