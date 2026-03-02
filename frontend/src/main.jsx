import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Questionario from './Questionario.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/questionario" element={<Questionario />} />
        {/* Adicionaremos a rota /escalas depois */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)