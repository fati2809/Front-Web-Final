import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login          from "./pages/Login/Login";
import Registro       from "./pages/Login/Registro";
import ResetPassword  from "./pages/Login/ResetPassword";
import AuthCallback   from "./pages/AuthCallback";

// Admin
import Dashboard  from "./pages/Dashboard/Dashboard";
import Eventos    from "./pages/Eventos/Eventos";
import Edificios  from "./pages/Edificios";
import Usuarios   from "./pages/Usuarios/Usuarios";
import Reportes   from "./pages/Reportes";
import Divisiones from "./pages/Dashboard/Divisiones";

// Coordinador
import CoordinadorDashboard from "./pages/Coordinador/Dashboard";
import CoordinadorEventos   from "./pages/Coordinador/Eventos";

// Usuario
import UsuarioDashboard from "./pages/Usuario/Dashboard";

//Profesor
import ProfesorEventos from "./pages/Profesor/Eventos";


// Otros
import ProtectedRoute  from "./ProtectedRoute";
import Footer          from "../src/components/Footer";
import OfflineFallback from "./FallbackOffline";
import SinAcceso       from "./pages/SinAcceso";

function Layout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <OfflineFallback>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>

            {/* Públicas */}
            <Route path="/"               element={<Login />} />
            <Route path="/registro"       element={<Registro />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback"  element={<AuthCallback />} />
            <Route path="/sin-acceso"     element={<SinAcceso />} />

            {/* Admin */}
            <Route path="/dashboard"   element={<ProtectedRoute allowedRoles={["administrador"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/eventos"     element={<ProtectedRoute allowedRoles={["administrador"]}><Eventos /></ProtectedRoute>} />
            <Route path="/usuarios"    element={<ProtectedRoute allowedRoles={["administrador"]}><Usuarios /></ProtectedRoute>} />
            <Route path="/reportes"    element={<ProtectedRoute allowedRoles={["administrador"]}><Reportes /></ProtectedRoute>} />
            <Route path="/edificios"   element={<ProtectedRoute allowedRoles={["administrador"]}><Edificios /></ProtectedRoute>} />
            <Route path="/divisiones"  element={<ProtectedRoute allowedRoles={["administrador"]}><Divisiones /></ProtectedRoute>} />

            {/* Coordinador */}
            <Route path="/coordinador/dashboard" element={<ProtectedRoute allowedRoles={["coordinador", "administrador"]}><CoordinadorDashboard /></ProtectedRoute>} />
            <Route path="/coordinador/eventos"   element={<ProtectedRoute allowedRoles={["coordinador", "administrador"]}><CoordinadorEventos /></ProtectedRoute>} />

            {/* Profesor */}
            <Route path="/profesor/eventos" element={<ProtectedRoute allowedRoles={["profesor"]}><ProfesorEventos /></ProtectedRoute>}
/>
            {/* Usuario */}
            <Route path="/usuario/dashboard" element={<ProtectedRoute allowedRoles={["usuario", "coordinador", "administrador"]}><UsuarioDashboard /></ProtectedRoute>} />

          </Route>
        </Routes>
      </BrowserRouter>
    </OfflineFallback>
  );
}

export default App;