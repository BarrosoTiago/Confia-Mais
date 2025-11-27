import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Badge, ProgressBar, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Financeiro() {
  const navigate = useNavigate();
  
  const [transacoes, setTransacoes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransacao, setSelectedTransacao] = useState(null);
  
  // Dados do Pagamento
  const [pagamentoData, setPagamentoData] = useState({
    valor: '',
    forma_pagamento: 'PIX',
    observacao: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await api.get('/financeiro/transacoes/');
      setTransacoes(response.data);
    } catch (error) {
      alert("Erro ao carregar financeiro.");
    }
  }

  // Abre o modal para registrar pagamento em uma transação específica
  const handleOpenPay = (transacao) => {
    setSelectedTransacao(transacao);
    // Sugere o valor restante automaticamente
    setPagamentoData({
        valor: transacao.saldo_restante, 
        forma_pagamento: 'PIX', 
        observacao: ''
    });
    setShowModal(true);
  };

  async function handleRegisterPayment(e) {
    e.preventDefault();
    if(!selectedTransacao) return;

    try {
        // LOG para vermos se os dados estão certos
        console.log("Enviando pagamento:", {
            transacao: selectedTransacao.id,
            valor: pagamentoData.valor,
            forma_pagamento: pagamentoData.forma_pagamento
        });

        await api.post('/financeiro/pagamentos/', {
            transacao: selectedTransacao.id,
            valor: pagamentoData.valor, // AGORA ESTÁ CERTO
            forma_pagamento: pagamentoData.forma_pagamento,
            observacao: pagamentoData.observacao
        });
        
        alert("Pagamento registrado!");
        setShowModal(false);
        loadData(); // Atualiza a tabela
    } catch (error) {
        console.error(error);
        // Mostra erro detalhado se o backend reclamar
        const msg = error.response?.data ? JSON.stringify(error.response.data) : "Erro ao registrar pagamento.";
        alert(msg);
    }
  }

  // Função auxiliar para formatar dinheiro
  const money = (val) => new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(val);

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-success">💸 Controle de Cobranças</h2>
        <Button variant="secondary" onClick={() => navigate('/admin-dashboard')}>Voltar</Button>
      </div>

      <Table striped hover bordered responsive className="bg-white shadow-sm align-middle">
        <thead className="bg-light">
            <tr>
                <th>ID</th>
                <th>Cliente / Agendamento</th>
                <th>Valor Total</th>
                <th>Já Pago</th>
                <th>Status</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            {transacoes.map(t => {
                // Calcula porcentagem para barra de progresso
                const percent = (parseFloat(t.valor_pago) / parseFloat(t.valor_total)) * 100;
                
                return (
                    <tr key={t.id}>
                        <td>#{t.id}</td>
                        <td>
                            <strong>{t.cliente_nome || 'Cliente Desconhecido'}</strong> <br/>
                            <small className="text-muted">Agendamento #{t.agendamento}</small>
                        </td>
                        <td className="fw-bold">{money(t.valor_total)}</td>
                        <td>
                            {money(t.valor_pago)}
                            <ProgressBar now={percent} variant="success" style={{height: '5px', marginTop: '5px'}} />
                        </td>
                        <td>
                            <Badge bg={
                                t.status_pagamento === 'PAGO' ? 'success' :
                                t.status_pagamento === 'PARCIAL' ? 'warning' : 'danger'
                            }>
                                {t.status_pagamento}
                            </Badge>
                        </td>
                        <td>
                            {t.status_pagamento !== 'PAGO' && (
                                <Button variant="outline-success" size="sm" onClick={() => handleOpenPay(t)}>
                                    💲 Receber
                                </Button>
                            )}
                            {t.status_pagamento === 'PAGO' && (
                                <span className="text-success small">✔ Quitado</span>
                            )}
                        </td>
                    </tr>
                );
            })}
        </tbody>
      </Table>

      {/* MODAL DE PAGAMENTO */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
            <Modal.Title>Registrar Recebimento</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRegisterPayment}>
            <Modal.Body>
                {selectedTransacao && (
                    <div className="alert alert-info mb-3">
                        <strong>Cliente:</strong> {selectedTransacao.cliente_nome} <br/>
                        <strong>Falta Pagar:</strong> {money(selectedTransacao.saldo_restante)}
                    </div>
                )}

                <Form.Group className="mb-3">
                    <Form.Label>Valor a Receber (R$)</Form.Label>
                    <Form.Control 
                        type="number" step="0.01" required
                        value={pagamentoData.valor}
                        onChange={e => setPagamentoData({...pagamentoData, valor: e.target.value})}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Forma de Pagamento</Form.Label>
                    <Form.Select 
                        value={pagamentoData.forma_pagamento}
                        onChange={e => setPagamentoData({...pagamentoData, forma_pagamento: e.target.value})}
                    >
                        <option value="PIX">Pix</option>
                        <option value="DINHEIRO">Dinheiro</option>
                        <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                        <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Observação (Opcional)</Form.Label>
                    <Form.Control 
                        type="text" 
                        placeholder="Ex: Sinal de 50%"
                        value={pagamentoData.observacao}
                        onChange={e => setPagamentoData({...pagamentoData, observacao: e.target.value})}
                    />
                </Form.Group>

                {/* HISTÓRICO DE PAGAMENTOS JÁ FEITOS */}
                {selectedTransacao && selectedTransacao.pagamentos.length > 0 && (
                    <div className="mt-4">
                        <h6>Histórico:</h6>
                        <ul className="list-group list-group-flush small">
                            {selectedTransacao.pagamentos.map(p => (
                                <li key={p.id} className="list-group-item d-flex justify-content-between">
                                    <span>{new Date(p.data_pagamento).toLocaleDateString()} - {p.forma_pagamento}</span>
                                    <span className="fw-bold">{money(p.valor)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button variant="success" type="submit">Confirmar Pagamento</Button>
            </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}