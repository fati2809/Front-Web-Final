import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Login from "./pages/Login/Login";
import Registro from "./pages/Login/Registro";
import ResetPassword from "./pages/Login/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard/Dashboard";
import Eventos from "./pages/Eventos/Eventos";
import Edificios from "./pages/Edificios";
import Usuarios from "./pages/Usuarios/Usuarios";
import Reportes from "./pages/Reportes";
import Divisiones from "./pages/Dashboard/Divisiones";
import ProtectedRoute from "./ProtectedRoute";
import Footer from "../src/components/Footer";
import OfflineFallback from "./FallbackOffline";

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

            <Route path="/" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/eventos"   element={<ProtectedRoute><Eventos /></ProtectedRoute>} />
            <Route path="/usuarios"  element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
            <Route path="/reportes"  element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
            <Route path="/edificios" element={<ProtectedRoute><Edificios /></ProtectedRoute>} />
            <Route path="/divisiones" element={<ProtectedRoute><Divisiones /></ProtectedRoute>} />

          </Route>
        </Routes>
      </BrowserRouter>
    </OfflineFallback>
  );
}

export default App;