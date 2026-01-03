import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/App.jsx' // Importando o App que já tem o Router dentro dele
import 'bootstrap/dist/css/bootstrap.min.css'; // Importante para o Bootstrap

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)