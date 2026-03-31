import { useState } from "react";
import { signInWithGoogle } from "../../services/auth";
import logo from "../../assets/logo2.jpeg";
import "./Login.css";

function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
      // La redirección a Google se maneja automáticamente
      // El callback regresará a /auth/callback
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Error al iniciar sesión con Google");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="login-container">
    <div className="login-card">

      {/* IZQUIERDA */}
      <div className="login-left">

        <h2 className="welcome-text">Te damos la bienvenida a:</h2>

        <img
          src={logo}
          alt="MapPosting Logo"
          className="login-logo"
        />

        <h1 className="login-title">Iniciar Sesión</h1>

        {error && <div className="error-box">{error}</div>}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="google-button"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.540-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
          </svg>

          {loading ? "Redirigiendo..." : "Continuar con Google"}
        </button>
      </div>

      {/* DERECHA */}
      <div className="login-right">
        
      </div>

    </div>
  </div>
);

}

export default Login;
