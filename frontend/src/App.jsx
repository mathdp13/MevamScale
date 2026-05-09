import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Perfil from './pages/Perfil';
import Home from './pages/Home';
import Ministerio from './pages/Ministerio';
import Ministerios from './pages/Ministerios';
import Agenda from './pages/Agenda';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/ministerios" element={<PrivateRoute><Ministerios /></PrivateRoute>} />
      <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
      <Route path="/ministerio/:id" element={<PrivateRoute><Ministerio /></PrivateRoute>} />
      <Route path="/agenda" element={<Agenda />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
