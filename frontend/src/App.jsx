import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Registro from './Registro';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;