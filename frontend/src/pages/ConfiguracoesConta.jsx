import { useNavigate } from 'react-router-dom';
import { Row, Col, Spinner, Image } from 'react-bootstrap';
import AnimatedBackground from '../components/AnimatedBackground';
import { FaArrowLeft, FaLock, FaUserTimes, FaShieldAlt, FaChevronRight, FaCamera } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useRef, useState } from 'react';

export default function ConfiguracoesConta() {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('foto', file);

    try {
      setUploading(true);
      await api.patch('/auth/me/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await checkAuth(); // Atualiza o usuário no contexto
      alert('Foto atualizada com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar foto.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      
      <div className="config-wrapper">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          .config-wrapper { 
            min-height: 100vh; 
            background-color: transparent; 
            font-family: 'Inter', sans-serif; 
            padding: 40px 20px; 
          }
          .container-limit { max-width: 900px; margin: 0 auto; }
          
          /* HEADER (Igual ao PerfilLoja) */
          .page-header { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; }
          .btn-back-circle { 
            width: 45px; height: 45px; border-radius: 50%; 
            background: #F8F9FA; border: 1px solid #E9ECEF; color: #002B55; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 1.1rem; cursor: pointer; transition: 0.2s; 
          }
          .btn-back-circle:hover { background: #002B55; color: white; }
          
          .title-group h1 { 
            font-family: 'Libre Baskerville', serif; 
            font-weight: 700; font-size: 1.8rem; color: #ffffff; margin: 0; 
          }
          .title-group span { font-size: 0.9rem; color: #dfdfdf; }

          /* CARDS DE OPÇÃO */
          .option-card {
            background: white; 
            border-radius: 20px; 
            padding: 40px; 
            border: 1px solid white;
            box-shadow: 0 10px 30px rgba(0,43,85,0.05);
            transition: all 0.3s ease;
            cursor: pointer;
            height: 100%;
            display: flex; flex-direction: column; align-items: center; text-align: center;
            position: relative; overflow: hidden;
          }
          .option-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 15px 40px rgba(0,43,85,0.15); 
          }

          /* ÍCONES NOS CARDS */
          .icon-circle {
            width: 80px; height: 80px; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 2rem; margin-bottom: 20px;
            transition: 0.3s;
          }
          .option-card:hover .icon-circle { transform: scale(1.1); }

          .card-title { color: #002B55; font-weight: 700; margin-bottom: 10px; font-size: 1.25rem; }
          .card-desc { color: #64748B; font-size: 0.95rem; line-height: 1.5; margin-bottom: 25px; }

          /* BOTÃO FALSO "ACESSAR" */
          .action-link {
            margin-top: auto;
            font-weight: 700; font-size: 0.9rem;
            display: flex; align-items: center; gap: 8px;
            padding: 8px 20px; border-radius: 30px;
            transition: 0.2s;
          }
          
          /* CORES ESPECÍFICAS */
          .theme-blue .icon-circle { background: #E0F2FE; color: #0284C7; }
          .theme-blue .action-link { background: #F0F9FF; color: #0284C7; }
          .theme-blue:hover .action-link { background: #0284C7; color: white; }

          .theme-red .icon-circle { background: #FEE2E2; color: #DC2626; }
          .theme-red .action-link { background: #FEF2F2; color: #DC2626; }
          .theme-red:hover .action-link { background: #DC2626; color: white; }

          /* RODAPÉ SEGURO */
          .secure-badge {
            margin-top: 50px; text-align: center;
            display: flex; justify-content: center; align-items: center; gap: 8px;
            color: rgba(255,255,255,0.7); font-size: 0.85rem; font-weight: 500;
          }
        `}</style>

        <div className="container-limit">
          
          {/* HEADER (Igual ao PerfilLoja) */}
          <div className="page-header">
            <button className="btn-back-circle" onClick={() => navigate(-1)}>
              <FaArrowLeft />
            </button>
            <div className="title-group">
              <h1>Configurações</h1>
              <span>Gerencie a segurança da sua conta</span>
            </div>
          </div>

          {/* SESSÃO DE AVATAR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
            <div 
              style={{
                width: 120, height: 120, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',
                overflow: 'hidden', border: '3px solid rgba(255,255,255,0.2)'
              }}
            >
              {uploading ? (
                <Spinner animation="border" variant="light" />
              ) : user?.foto ? (
                <Image src={user.foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2.5rem', color: '#FFF', fontWeight: 'bold' }}>
                  {user?.nome_completo?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
              )}
              
              {/* BOTÃO DE CÂMERA SOBREPOSTO */}
              <div 
                onClick={() => fileInputRef.current.click()}
                style={{
                  position: 'absolute', bottom: 0, width: '100%', height: '35%',
                  backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
                  alignItems: 'center', cursor: 'pointer'
                }}
              >
                <FaCamera color="#FFF" size={18} />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            <h4 style={{ color: 'white', marginTop: 15, fontWeight: '600' }}>
              {user?.nome_completo || user?.username}
            </h4>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              Toque na câmera para alterar sua foto
            </span>
          </div>

          <Row className="g-4 justify-content-center">
            
            {/* CARD 1: ALTERAR SENHA (AZUL) */}
            <Col md={6} lg={5}>
              <div className="option-card theme-blue" onClick={() => navigate('/recuperar-senha')}>
                <div className="icon-circle">
                  <FaLock />
                </div>
                <h3 className="card-title">Alterar Senha</h3>
                <p className="card-desc">
                  Atualize sua senha periodicamente para manter sua conta protegida contra acessos não autorizados.
                </p>
                <div className="action-link">
                  Alterar Agora <FaChevronRight size={12}/>
                </div>
              </div>
            </Col>

            {/* CARD 2: EXCLUIR CONTA (VERMELHO) */}
            <Col md={6} lg={5}>
              <div className="option-card theme-red" onClick={() => navigate('/conta/excluir')}>
                <div className="icon-circle">
                  <FaUserTimes />
                </div>
                <h3 className="card-title">Excluir Conta</h3>
                <p className="card-desc">
                  Deseja encerrar sua jornada conosco? Essa ação excluirá permanentemente seus dados e histórico.
                </p>
                <div className="action-link">
                  Gerenciar Exclusão <FaChevronRight size={12}/>
                </div>
              </div>
            </Col>
            
          </Row>

          <div className="secure-badge">
             <FaShieldAlt /> Ambiente Seguro e Criptografado
          </div>

        </div>
      </div>
    </>
  );
}