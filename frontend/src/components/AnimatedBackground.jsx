import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="clean-ocean-container">
      <style>{`
        :root {
          --bg-deep: #020617;   /* Fundo quase preto (Slate 950) */
          --bg-navy: #172554;   /* Azul Profundo (Blue 950) */
          --bg-glow: #0ea5e9;   /* Azul Céu (Sky 500) */
        }

.clean-ocean-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          overflow: hidden;
          /* Base: Um azul aço ligeiramente mais profundo */
          background-color: #003583; 
        }

        /* Esferas com saturação levemente ajustada */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.55; /* Aumentado ligeiramente para acompanhar o ganho de cor */
          animation: floatOrb 20s infinite ease-in-out alternate;
        }

        /* Orb 1: Azul Médio Sereno */
        .orb-1 {
          top: -15%;
          left: -10%;
          width: 90vw;
          height: 90vw;
          background: #3969b6; 
          animation-duration: 25s;
        }

        /* Orb 2: Ciano Glacial */
        .orb-2 {
          bottom: -10%;
          right: -5%;
          width: 75vw;
          height: 75vw;
          background: radial-gradient(circle, #3ad2ed 0%, transparent 60%);
          opacity: 0.45;
          animation-duration: 30s;
          animation-delay: -3s;
        }

        /* Orb 3: Lavanda Suave Profundo */
        .orb-3 {
          top: 20%;
          left: 30%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, #6b65b7 0%, transparent 70%);
          opacity: 0.35;
          animation-duration: 35s;
          animation-delay: -7s;
        }

        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, -40px) scale(1.05); }
        }

        /* Vinheta sutil */
        .vignette {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at center, transparent 40%, rgba(20, 30, 48, 0.25) 100%);
            pointer-events: none;
        }

      `}</style>
      
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      
      <div className="vignette"></div>
    </div>
  );
};

export default AnimatedBackground;