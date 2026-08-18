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
import { Eventos } from './pages/Eventos';
import { SubmoduloDetalle } from './pages/SubmoduloDetalle';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="grain" />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="drift-slow absolute -top-32 left-1/4 w-[36rem] h-[36rem] bg-emerald-500/[0.04] rounded-full blur-3xl" />
        <div className="drift-slower absolute top-1/2 -right-20 w-[28rem] h-[28rem] bg-emerald-500/[0.03] rounded-full blur-3xl" />
      </div>
      <Navbar />
      <main className="relative z-10">{children}</main>
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

function SeccionRoute({ children, seccion }: { children: React.ReactNode; seccion: 'galeria'|'finanzas'|'metas'|'gym'|'notas'|'entretenimiento'|'eventos' }) {
  return (
    <ProtectedRoute seccion={seccion}>
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

          {/* Galería/Módulos — accesible según permiso "galeria" */}
          <Route path="/" element={<SeccionRoute seccion="galeria"><Modulos /></SeccionRoute>} />
          <Route path="/modulos/nuevo" element={<AdminRoute><CrearModulo /></AdminRoute>} />
          <Route path="/modulos/:id" element={<SeccionRoute seccion="galeria"><ModuloDetalle /></SeccionRoute>} />
          <Route path="/modulos/:id/submodulos/:subId" element={<SeccionRoute seccion="galeria"><SubmoduloDetalle /></SeccionRoute>} />

          {/* Secciones con permiso granular */}
          <Route path="/finanzas"        element={<SeccionRoute seccion="finanzas"><Finanzas /></SeccionRoute>} />
          <Route path="/metas"           element={<SeccionRoute seccion="metas"><Metas /></SeccionRoute>} />
          <Route path="/gym"             element={<SeccionRoute seccion="gym"><Gym /></SeccionRoute>} />
          <Route path="/notas"           element={<SeccionRoute seccion="notas"><Notas /></SeccionRoute>} />
          <Route path="/entretenimiento" element={<SeccionRoute seccion="entretenimiento"><Entretenimiento /></SeccionRoute>} />
          <Route path="/eventos"         element={<SeccionRoute seccion="eventos"><Eventos /></SeccionRoute>} />

          {/* Solo admin */}
          <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
