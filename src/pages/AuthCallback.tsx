import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSupabaseSession,
  syncOAuthUser,
  saveSession,
} from "../services/auth";

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("[AuthCallback] Iniciando proceso de callback...");

        // Obtener sesión de Supabase Auth
        const session = await getSupabaseSession();
        console.log("[AuthCallback] Sesión obtenida:", session ? "✓" : "✗");

        if (!session) {
          throw new Error("No se pudo obtener la sesión");
        }

        // Sincronizar usuario con el backend
        console.log("[AuthCallback] Sincronizando usuario con backend...");
        const response = await syncOAuthUser();
        console.log("[AuthCallback] Respuesta del backend:", response);

        if (!response.success) {
          throw new Error(
            response.message || "Error al sincronizar el usuario",
          );
        }

        console.log("[AuthCallback] Usuario sincronizado:", response.user);

        // Verificar que sea Administrador
        if (response.user.rol !== "Administrador") {
          console.log(
            "[AuthCallback] Usuario no es Administrador, rol:",
            response.user.rol,
          );
          setError(
            `Registro exitoso. Tu cuenta ha sido creada con rol "${response.user.rol}". Para acceder al dashboard, contacta a un administrador para que actualice tu rol a "Administrador".`,
          );
          setTimeout(() => navigate("/"), 5000);
          return;
        }

        // Guardar sesión
        console.log("[AuthCallback] Guardando sesión y redirigiendo...");
        saveSession(response.user, {
          access_token: session.access_token,
          refresh_token: session.refresh_token || "",
          expires_at: session.expires_at || 0,
        });

        // Redirigir al dashboard
        navigate("/dashboard");
      } catch (err) {
        console.error("[AuthCallback] Error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error al procesar la autenticación",
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
          <h2>Error</h2>
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
