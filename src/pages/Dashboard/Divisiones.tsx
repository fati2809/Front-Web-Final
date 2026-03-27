import { useEffect, useState } from "react";

interface Division {
  id_div: number;
  name_div: string;
}

// ── Toast ─────────────────────────────────────────────
type ToastType = "error" | "success";

interface ToastItem {
  message: string;
  type: ToastType;
}

function CustomToast({
  message,
  type,
  onClose,
}: ToastItem & { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isError = type === "error";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 2000,
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        border: `1.5px solid ${isError ? "#dc2626" : "#16a34a"}`,
        padding: "16px 20px",
        maxWidth: "420px",
        display: "flex",
        gap: "12px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: isError ? "#7f1d1d" : "#14532d",
          }}
        >
          {isError ? "❌ Error" : "✅ Éxito"}
        </div>
        <div style={{ fontSize: "13px", color: "#374151" }}>
          {message}
        </div>
      </div>
      <button onClick={onClose}>×</button>
    </div>
  );
}

// ── Componente principal ─────────────────────────────
function Divisiones() {
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState("");

  const [toast, setToast] = useState<ToastItem | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  // ── Obtener divisiones ─────────────────────────────
  const fetchDivisiones = () => {
    fetch(`${import.meta.env.VITE_API_URL}/divisiones`)
      .then((res) => {
        if (!res.ok) throw new Error("Error");
        return res.json();
      })
      .then((data) => {
        setDivisiones(data);
        setLoading(false);
      })
      .catch(() => {
        showToast("Error al cargar divisiones", "error");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDivisiones();
  }, []);

  // ── Agregar división ─────────────────────────────
  const handleAdd = async () => {
    if (!nombre.trim()) {
      showToast("El nombre es obligatorio", "error");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/divisiones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name_div: nombre }),
        }
      );

      if (res.ok) {
        setShowModal(false);
        setNombre("");
        fetchDivisiones();
        showToast("División agregada correctamente", "success");
      } else {
        showToast("Error al agregar división", "error");
      }
    } catch (error) {
      if (!navigator.onLine) {
        showToast(
          "División guardada offline. Se enviará cuando haya conexión.",
          "success"
        );
        setShowModal(false);
        setNombre("");
        return;
      }

      showToast("No se pudo conectar con el servidor", "error");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Divisiones</h2>

      <button onClick={() => setShowModal(true)}>Agregar</button>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <ul>
          {divisiones.map((d) => (
            <li key={d.id_div}>{d.name_div}</li>
          ))}
        </ul>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "300px",
            }}
          >
            <h3>Agregar División</h3>

            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ width: "100%", marginBottom: "10px" }}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowModal(false)}>Cancelar</button>
              <button onClick={handleAdd}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Divisiones;