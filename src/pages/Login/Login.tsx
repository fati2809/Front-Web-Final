import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { login, saveSession, signInWithGoogle } from "../../services/auth";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({
        email_user: email,
        pass_user: password,
      });

      if (data.success) {
        // Verificar que el usuario sea Administrador
        if (data.user.rol !== "Administrador") {
          setError(
            "Acceso denegado. Solo los administradores pueden iniciar sesión.",
          );
          setLoading(false);
          return;
        }

        // Guardar sesión con Supabase Auth
        saveSession(data.user, data.session);

        console.log("Login exitoso:", data.user);

        // Redirigir al dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate("/registro");
  };

  const handleForgotPasswordClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    navigate("/reset-password");
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      await signInWithGoogle();
      // La redirección a Google se maneja automáticamente
      // El callback regresará a /auth/callback
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Error al iniciar sesión con Google");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Bienvenido</h1>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                borderRadius: "8px",
                fontSize: "14px",
                marginBottom: "16px",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="forgot-password-container">
            <a
              href="#"
              className="forgot-password-link"
              onClick={handleForgotPasswordClick}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <div style={{ margin: "20px 0", textAlign: "center" }}>
            <span
              style={{
                color: "#6b7280",
                fontSize: "14px",
                display: "block",
                marginBottom: "12px",
              }}
            >
              O continúa con
            </span>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#9ca3af";
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
                  fill="#EA4335"
                />
              </svg>
              Continuar con Google
            </button>
          </div>
        </form>

        <p className="register-text">
          ¿Aún no tienes cuenta?{" "}
          <a href="#" className="register-link" onClick={handleRegisterClick}>
            Registrarte
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
