// src/utils/formatDate.js

// Formata apenas a data (Ex: 25/12/2023)
export const formatData = (dataISO) => {
    if (!dataISO) return "";
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
};

// Formata apenas a hora (Ex: 14:30)
export const formatHora = (dataISO) => {
    if (!dataISO) return "";
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Formata Data e Hora completas (Ex: 25/12/2023 14:30)
export const formatDataHora = (dataISO) => {
    if (!dataISO) return "";
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    });
};