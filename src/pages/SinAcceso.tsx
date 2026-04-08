import { useNavigate } from "react-router-dom";

function SinAcceso() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1rem",
        textAlign: "center",
      }}
    >
      <h1>🚫 Sin acceso</h1>
      <p>No tienes permiso para ver esta página.</p>
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "0.5rem 1.5rem",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "#3b82f6",
          color: "#fff",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        Volver al inicio
      </button>
    </div>
  );
}

export default SinAcceso;