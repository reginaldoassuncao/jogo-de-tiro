import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Não vamos usar o index.css padrão, nosso App.jsx importa Game.css
// import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 