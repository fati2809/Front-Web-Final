import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { resetPassword } from "../../services/auth";
import "./Login.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setLoading(true);

    try {
      const data = await resetPassword(email);

      if (data.success) {
        setSuccess(
          "Se ha enviado un enlace de recuperación a tu correo electrónico. Por favor revisa tu bandeja de entrada.",
        );
        setEmail("");
      } else {
        setError(data.message || "Error al enviar el correo de recuperación");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("No se pudo conectar con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Recuperar Contraseña</h1>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#d1fae5",
                color: "#059669",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="tu-email@ejemplo.com"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
          </button>

          <div className="login-footer">
            <a href="/" onClick={handleBackClick}>
              Volver al inicio de sesión
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
