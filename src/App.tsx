import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { Login } from './pages/Login';
import { Modulos } from './pages/Modulos';
import { ModuloDetalle } from './pages/ModuloDetalle';
import { CrearModulo } from './pages/CrearModulo';
import { Usuarios } from './pages/Usuarios';
import { Finanzas } from './pages/Finanzas';
import { Metas } from './pages/Metas';
import { Gym } from './pages/Gym';
import { Notas } from './pages/Notas';
import { Entretenimiento } from './pages/Entretenimiento';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute rolesPermitidos={['admin']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthRoute><Modulos /></AuthRoute>} />
          <Route path="/modulos/nuevo" element={<AdminRoute><CrearModulo /></AdminRoute>} />
          <Route path="/modulos/:id" element={<AuthRoute><ModuloDetalle /></AuthRoute>} />
          <Route path="/finanzas" element={<AdminRoute><Finanzas /></AdminRoute>} />
          <Route path="/metas" element={<AdminRoute><Metas /></AdminRoute>} />
          <Route path="/gym" element={<AdminRoute><Gym /></AdminRoute>} />
          <Route path="/notas" element={<AdminRoute><Notas /></AdminRoute>} />
          <Route path="/entretenimiento" element={<AdminRoute><Entretenimiento /></AdminRoute>} />
          <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
