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
          background-color: var(--bg-deep);
        }

        /* "ORBS" - Esferas de luz difusa */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px); /* Desfoque máximo para eliminar qualquer textura */
          opacity: 0.5;
          animation: floatOrb 20s infinite ease-in-out alternate;
        }

        /* Orb 1: A base azul escura que preenche o fundo */
        .orb-1 {
          top: -20%;
          left: -10%;
          width: 80vw;
          height: 80vw;
          background: var(--bg-navy);
          animation-duration: 25s;
        }

        /* Orb 2: O brilho ciano principal */
        .orb-2 {
          bottom: -10%;
          right: -10%;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle, var(--bg-glow) 0%, transparent 70%);
          opacity: 0.3;
          animation-duration: 30s;
          animation-delay: -5s;
        }

        /* Orb 3: Um ponto de luz secundário flutuando no meio */
        .orb-3 {
          top: 30%;
          left: 30%;
          width: 40vw;
          height: 40vw;
          background: radial-gradient(circle, #38bdf8 0%, transparent 60%);
          opacity: 0.2;
          animation-duration: 35s;
          animation-delay: -10s;
        }

        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, -50px) scale(1.1); }
        }

        /* Vinheta ultra-suave apenas para escurecer cantos levemente */
        .vignette {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%);
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