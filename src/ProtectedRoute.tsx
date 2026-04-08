import { Navigate } from "react-router-dom";
import { getSession } from "./services/auth";

interface Props {
  children: any;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: Props) {
  const session = getSession();

  console.log("Verificando sesión:", session);

  if (!session || !session.user) {
    console.log("No hay sesión, redirigiendo a login");
    return <Navigate to="/" replace />;
  }

  if (
    session.session?.expires_at &&
    new Date(session.session.expires_at * 1000) < new Date()
  ) {
    console.log("Sesión expirada, redirigiendo a login");
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const rolUsuario = session.user.rol?.toLowerCase().trim();
    console.log("Rol del usuario:", rolUsuario, "| Roles permitidos:", allowedRoles);

    if (!rolUsuario || !allowedRoles.includes(rolUsuario)) {
      console.log("Rol no autorizado, redirigiendo a /sin-acceso");
      return <Navigate to="/sin-acceso" replace />;
    }
  }

  console.log("Usuario autorizado:", session.user.email_user);
  return <>{children}</>;
}

export default ProtectedRoute;