import { FaStore, FaClock, FaCut, FaCheck } from 'react-icons/fa';

export default function OnboardingHeader({ step }) {
    // Definição dos passos
    const steps = [
        { num: 1, icon: <FaStore />, label: "Perfil" },
        { num: 2, icon: <FaClock />, label: "Horários" },
        { num: 3, icon: <FaCut />, label: "Serviços" },
    ];

    // Calcula porcentagem da barra de progresso (fundo)
    const progressPercent = ((step - 1) / (steps.length - 1)) * 100;

    return (
        <div className="w-100 mb-4">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;600&display=swap');

                .stepper-container {
                    position: relative;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 20px auto 40px auto;
                    max-width: 600px;
                    font-family: 'Inter', sans-serif;
                }

                /* Linha de Fundo (Cinza) */
                .progress-line-bg {
                    position: absolute;
                    top: 25px;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: #E2E8F0;
                    border-radius: 4px;
                    z-index: 0;
                }

                /* Linha de Progresso (Azul) */
                .progress-line-fill {
                    position: absolute;
                    top: 25px;
                    left: 0;
                    height: 4px;
                    background: #002B55;
                    border-radius: 4px;
                    transition: width 0.5s ease-in-out;
                    z-index: 1;
                }

                /* Círculo do Passo */
                .step-circle {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    background: white;
                    border: 3px solid #E2E8F0;
                    color: #94A3B8;
                    z-index: 2;
                    transition: all 0.4s ease;
                    position: relative;
                }

                /* Estado: Ativo (Passo Atual) */
                .step-circle.active {
                    border-color: #002B55;
                    color: #002B55;
                    box-shadow: 0 0 0 5px rgba(0, 43, 85, 0.1);
                    transform: scale(1.1);
                }

                /* Estado: Concluído */
                .step-circle.completed {
                    background: #002B55;
                    border-color: #002B55;
                    color: white;
                }

                /* Texto abaixo do círculo */
                .step-label {
                    position: absolute;
                    top: 60px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #94A3B8;
                    white-space: nowrap;
                    transition: color 0.3s;
                }
                .step-circle.active .step-label { color: #002B55; font-weight: 700; }
                .step-circle.completed .step-label { color: #002B55; }

                /* Título e Subtítulo */
                .header-text { text-align: center; margin-bottom: 20px; }
                .header-text h2 { 
                    font-family: 'Libre Baskerville', serif; 
                    color: #002B55; 
                    font-size: 1.8rem; 
                    margin-bottom: 5px; 
                }
                .header-text p { color: #64748B; font-size: 0.95rem; }
            `}</style>

            {/* Texto de Boas-vindas Dinâmico */}
            <div className="header-text">
                {step === 1 && (
                    <>
                        <h2>Bem-vindo ao Confia+</h2>
                        <p>Vamos configurar sua loja em 3 passos rápidos.</p>
                    </>
                )}
                {step === 2 && (
                    <>
                        <h2>Horários de Atendimento</h2>
                        <p>Defina quando seus clientes podem agendar.</p>
                    </>
                )}
                {step === 3 && (
                    <>
                        <h2>Serviços Oferecidos</h2>
                        <p>Cadastre o que você faz de melhor.</p>
                    </>
                )}
            </div>

            {/* Stepper Visual */}
            <div className="stepper-container">
                <div className="progress-line-bg"></div>
                <div className="progress-line-fill" style={{ width: `${progressPercent}%` }}></div>

                {steps.map((s) => {
                    const isCompleted = step > s.num;
                    const isActive = step === s.num;

                    return (
                        <div 
                            key={s.num} 
                            className={`step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                        >
                            {isCompleted ? <FaCheck size={16} /> : s.icon}
                            <span className="step-label">{s.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}