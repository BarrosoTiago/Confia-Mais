import React from 'react';
import ReactDOM from 'react-dom/client';
import App from "./pages/App.jsx";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx'; 

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider> {/* Envolva o App */}
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);