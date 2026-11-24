import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

/* Carga diferida — cada página se descarga solo cuando se visita */
const Login           = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Modulos         = lazy(() => import('./pages/Modulos').then(m => ({ default: m.Modulos })));
const ModuloDetalle   = lazy(() => import('./pages/ModuloDetalle').then(m => ({ default: m.ModuloDetalle })));
const CrearModulo     = lazy(() => import('./pages/CrearModulo').then(m => ({ default: m.CrearModulo })));
const Usuarios        = lazy(() => import('./pages/Usuarios').then(m => ({ default: m.Usuarios })));
const Finanzas        = lazy(() => import('./pages/Finanzas').then(m => ({ default: m.Finanzas })));
const Metas           = lazy(() => import('./pages/Metas').then(m => ({ default: m.Metas })));
const Gym             = lazy(() => import('./pages/Gym').then(m => ({ default: m.Gym })));
const Notas           = lazy(() => import('./pages/Notas').then(m => ({ default: m.Notas })));
const Entretenimiento = lazy(() => import('./pages/Entretenimiento').then(m => ({ default: m.Entretenimiento })));
const Eventos         = lazy(() => import('./pages/Eventos').then(m => ({ default: m.Eventos })));
const Dashboard       = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SubmoduloDetalle= lazy(() => import('./pages/SubmoduloDetalle').then(m => ({ default: m.SubmoduloDetalle })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="grain" />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="drift-slow absolute -top-32 left-1/4 w-[36rem] h-[36rem] bg-emerald-500/[0.04] rounded-full blur-3xl" />
        <div className="drift-slower absolute top-1/2 -right-20 w-[28rem] h-[28rem] bg-emerald-500/[0.03] rounded-full blur-3xl" />
      </div>
      <Navbar />
      <main className="relative z-10">
        <Suspense fallback={<PageFallback />}>{children}</Suspense>
      </main>
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
        <Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Galería/Módulos */}
            <Route path="/" element={<SeccionRoute seccion="galeria"><Modulos /></SeccionRoute>} />
            <Route path="/modulos/nuevo" element={<AdminRoute><CrearModulo /></AdminRoute>} />
            <Route path="/modulos/:id" element={<SeccionRoute seccion="galeria"><ModuloDetalle /></SeccionRoute>} />
            <Route path="/modulos/:id/submodulos/:subId" element={<SeccionRoute seccion="galeria"><SubmoduloDetalle /></SeccionRoute>} />

            {/* Secciones */}
            <Route path="/finanzas"        element={<SeccionRoute seccion="finanzas"><Finanzas /></SeccionRoute>} />
            <Route path="/metas"           element={<SeccionRoute seccion="metas"><Metas /></SeccionRoute>} />
            <Route path="/gym"             element={<SeccionRoute seccion="gym"><Gym /></SeccionRoute>} />
            <Route path="/notas"           element={<SeccionRoute seccion="notas"><Notas /></SeccionRoute>} />
            <Route path="/entretenimiento" element={<SeccionRoute seccion="entretenimiento"><Entretenimiento /></SeccionRoute>} />
            <Route path="/eventos"         element={<SeccionRoute seccion="eventos"><Eventos /></SeccionRoute>} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<AuthRoute><Dashboard /></AuthRoute>} />

            {/* Solo admin */}
            <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
