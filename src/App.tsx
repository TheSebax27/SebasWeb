import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Modulos } from './pages/Modulos';
import { ModuloDetalle } from './pages/ModuloDetalle';
import { CrearModulo } from './pages/CrearModulo';
import { Usuarios } from './pages/Usuarios';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Modulos />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/modulos/nuevo"
            element={
              <ProtectedRoute rolesPermitidos={['admin']}>
                <Layout>
                  <CrearModulo />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/modulos/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ModuloDetalle />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute rolesPermitidos={['admin']}>
                <Layout>
                  <Usuarios />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
