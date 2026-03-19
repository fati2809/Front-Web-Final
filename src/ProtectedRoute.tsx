import { Navigate } from "react-router-dom";
import { getSession } from "./services/auth";

function ProtectedRoute({ children }: { children: any }) {
  const session = getSession();

  console.log("Verificando sesión:", session);

  // Si no hay sesión, redirigir al login
  if (!session || !session.user) {
    console.log("No hay sesión, redirigiendo a login");
    return <Navigate to="/" replace />;
  }

  // Verificar si la sesión ha expirado
  if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
    console.log("Sesión expirada, redirigiendo a login");
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  console.log("Usuario autorizado:", session.user.email_user);
  return <>{children}</>;
}

export default ProtectedRoute;
