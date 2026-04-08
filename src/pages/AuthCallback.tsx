import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSupabaseSession,
  syncOAuthUser,
  saveSession,
} from "../services/auth";

const ROLE_ROUTES: Record<string, string> = {
  administrador: "/dashboard",
  coordinador:   "/coordinador/dashboard",
  profesor:      "/profesor/eventos", 
  usuario:       "/usuario/dashboard",
};

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const handleCallback = async () => {
      try {
        console.log("[AuthCallback] Iniciando proceso de callback...");

        const session = await getSupabaseSession();
        console.log("[AuthCallback] Sesión obtenida:", session ? "✓" : "✗");

        if (!session) {
          throw new Error("No se pudo obtener la sesión");
        }

        console.log("[AuthCallback] Sincronizando usuario con backend...");
        const response = await syncOAuthUser();
        console.log("[AuthCallback] Respuesta del backend:", response);

        if (!response.success) {
          throw new Error(response.message || "Error al sincronizar el usuario");
        }

        const rolNormalizado = response.user.rol?.toLowerCase().trim();
        console.log("[AuthCallback] Rol detectado:", rolNormalizado);

        console.log("ROL ORIGINAL:", response.user.rol);
        console.log("ROL NORMALIZADO:", rolNormalizado);

        console.log("[AuthCallback] Rol detectado:", rolNormalizado);

        const destination = ROLE_ROUTES[rolNormalizado];

        if (!destination) {
          setError(
            `Tu cuenta fue creada con rol "${response.user.rol}". ` +
            `Contacta a un administrador para que actualice tu acceso.`
          );
          setTimeout(() => navigate("/"), 5000);
          return;
        }

        saveSession(response.user, {
          access_token:  session.access_token,
          refresh_token: session.refresh_token || "",
          expires_at:    session.expires_at || 0,
        });

        console.log("[AuthCallback] Redirigiendo a:", destination);
        navigate(destination, { replace: true });

      } catch (err) {
        console.error("[AuthCallback] Error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error al procesar la autenticación"
        );
        setTimeout(() => navigate("/"), 5000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            padding: "20px",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            borderRadius: "8px",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <h2>Acceso restringido</h2>
          <p>{error}</p>
          <p style={{ marginTop: "10px", fontSize: "14px" }}>
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2>Procesando autenticación...</h2>
        <p>Por favor espera un momento...</p>
      </div>
    </div>
  );
}

export default AuthCallback;