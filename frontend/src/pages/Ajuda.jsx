import { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaMinus, FaVideo, FaWhatsapp, FaHeadset } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Ajuda() {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState(0);

  const duvidas = [
    {
      pergunta: "Como cadastrar um novo cliente?",
      resposta: "Para cadastrar um cliente, vá até o menu 'Clientes' ou use o card de atalho na tela inicial. Clique em 'Novo', preencha o nome e telefone e salve. Simples assim!",
      temVideo: true
    },
    {
      pergunta: "Como lançar uma despesa?",
      resposta: "Acesse o menu 'Despesas', clique em 'Nova Despesa', insira o valor, a descrição e a categoria (ex: Luz, Água). Isso ajuda a calcular seu lucro real.",
      temVideo: false
    },
    {
      pergunta: "Como funciona a calculadora de lucro?",
      resposta: "A calculadora pega o valor do seu serviço e subtrai os custos fixos e variáveis que você cadastrou, mostrando se você está cobrando o valor correto.",
      temVideo: true
    },
    {
      pergunta: "O sistema funciona no celular?",
      resposta: "Sim! O Confia+ é totalmente responsivo e funciona no navegador do seu celular, tablet ou computador.",
      temVideo: false
    },
    {
      pergunta: "Como registrar um pagamento?",
      resposta: "Vá em 'Registros' (Financeiro), encontre o agendamento e clique no botão de 'Receber'. Você pode registrar pagamentos parciais ou totais.",
      temVideo: false
    }
  ];

  const toggleAccordion = (index) => {
    setActiveKey(activeKey === index ? null : index);
  };

  return (
    <div className="ajuda-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        .ajuda-wrapper {
            font-family: 'Libre Baskerville', serif;
            background-color: #F4F6F8;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .page-header {
            background: #002B55;
            padding: 20px 40px;
            color: white;
            display: flex;
            align-items: center;
            gap: 20px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .faq-container {
            max-width: 800px;
            margin: 40px auto;
            width: 100%;
            padding: 0 20px;
            flex-grow: 1;
        }

        .faq-title {
            font-size: 1.8rem;
            color: #002B55;
            margin-bottom: 30px;
            font-weight: 700;
            text-align: center;
        }

        .accordion-item {
            background: white;
            border-radius: 10px;
            margin-bottom: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            overflow: hidden;
            border: 1px solid #E0E0E0;
        }

        .accordion-header {
            padding: 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            color: #333;
            font-size: 1.05rem;
            transition: 0.2s;
            background: #FFF;
        }
        .accordion-header:hover { background-color: #F9FAFB; color: #002B55; }

        .accordion-body {
            padding: 0 20px 20px 20px;
            color: #555;
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            display: none;
            background: #FFF;
        }
        .accordion-body.open { display: block; animation: fadeIn 0.3s ease; }

        .video-placeholder {
            background: #F0F0F0;
            height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            margin-top: 15px;
            color: #888;
            font-size: 0.9rem;
            flex-direction: column;
            gap: 10px;
            border: 1px dashed #CCC;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

        .support-card {
            background: #E3F2FD;
            border: 1px solid #BBDEFB;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            margin-top: 40px;
        }
      `}</style>

      {/* HEADER */}
      <div className="page-header">
          <Button variant="link" style={{color: 'white', padding: 0}} onClick={() => navigate('/admin-dashboard')}>
              <FaArrowLeft size={20} />
          </Button>
          <span style={{fontSize: '1.2rem', fontWeight: 'bold'}}>Central de Ajuda</span>
      </div>

      <div className="faq-container">
          <h2 className="faq-title">Como podemos ajudar?</h2>

          {duvidas.map((item, index) => (
              <div key={index} className="accordion-item">
                  <div className="accordion-header" onClick={() => toggleAccordion(index)}>
                      <span>{item.pergunta}</span>
                      {activeKey === index ? <FaMinus size={12} color="#002B55"/> : <FaPlus size={12} color="#AAA"/>}
                  </div>
                  <div className={`accordion-body ${activeKey === index ? 'open' : ''}`}>
                      <p>{item.resposta}</p>
                      {item.temVideo && (
                          <div className="video-placeholder">
                              <FaVideo size={24}/>
                              <span>Vídeo Tutorial (Em breve)</span>
                          </div>
                      )}
                  </div>
              </div>
          ))}

          <div className="support-card">
              <FaHeadset size={30} color="#002B55" className="mb-3"/>
              <h5 style={{color: '#002B55', fontWeight: 'bold'}}>Ainda precisa de ajuda?</h5>
              <p className="text-muted small">Nossa equipe de suporte está disponível para te atender.</p>
              <Button variant="success" className="rounded-pill px-4 mt-2">
                  <FaWhatsapp className="me-2"/> Falar no WhatsApp
              </Button>
          </div>
      </div>
    </div>
  );
}