import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Registro from './Registro';
import Questionario from './Questionario';

// 🛡️ Componente de Segurança (Só deixa passar se tiver Token)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Rotas Protegidas (Precisa de Login) */}
      <Route 
        path="/questionario" 
        element={
          <PrivateRoute>
            <Questionario />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/escalas" 
        element={
          <PrivateRoute>
            <div className="text-white">Tela de Escalas em breve...</div>
          </PrivateRoute>
        } 
      />

      {/* Se tentar acessar qualquer coisa sem estar na lista, volta pro Login */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;