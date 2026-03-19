import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../Eventos/Eventos.css";

interface Evento {
  id_event: number;
  name_event: string;
  id_building: number | null;
  timedate_event: string | null;
  timedate_end: string | null;
  status_event: number;
  id_profe: number | null;
  id_user: string | null;           // UUID como string
  descrip_event: string | null;
  img_event: string | null;
  id_aula: number | null;
  capacidad_esperada: number;
  prioridad: number;
  edificios?: {
    name_building: string;
    code_building: string | null;
    descrip_building: string | null;
  } | null;
  aulas?: {
    nombre_aula: string;
    planta: string | null;          // 'baja' | 'alta' | 'sotano' | 'azotea'
    capacidad: number;
  } | null;
  profesor?: {
    nombre_profe: string;
  } | null;
}

interface Edificio {
  id_building: number;
  name_building: string;
  // No usamos capacidades por planta aquí (están en aulas)
}

interface Profesor {
  id_profe: number;
  nombre_profe: string;
}

interface Usuario {
  id_user: string;  // UUID
  name_user: string;
}

// ── Muestra planta + capacidad en la tabla ─────────────────
function PlantaCell({ planta, capacidad }: { planta: string | null; capacidad: number }) {
  const plantaLower = (planta || "baja").toLowerCase();
  const esBaja = plantaLower === "baja" || plantaLower === "sotano";
  const color = esBaja ? "#3b82f6" : "#8b5cf6";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
          backgroundColor: color,
        }} />
        <span style={{ fontSize: "12px", fontWeight: 600, color: color }}>
          {planta ? `Planta ${planta}` : "Sin planta"}
        </span>
      </div>
      <span style={{ fontSize: "11px", color: "#6b7280", paddingLeft: "13px" }}>
        {capacidad > 0 ? `${capacidad} personas` : "—"}
      </span>
    </div>
  );
}

// ── Celda Fecha Inicio / Fin ───────────────────────────────
function FechaCell({ inicio, fin }: { inicio: string | null; fin: string | null }) {
  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{
          fontSize: "10px", fontWeight: 700, color: "#fff",
          backgroundColor: "#3b82f6", borderRadius: "4px",
          padding: "1px 5px", letterSpacing: "0.3px",
        }}>
          INICIO
        </span>
        <span style={{ fontSize: "13px", color: "#111827" }}>{formatDate(inicio)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{
          fontSize: "10px", fontWeight: 700, color: "#fff",
          backgroundColor: fin ? "#8b5cf6" : "#d1d5db", borderRadius: "4px",
          padding: "1px 5px", letterSpacing: "0.3px",
        }}>
          FIN
        </span>
        <span style={{ fontSize: "13px", color: fin ? "#111827" : "#9ca3af" }}>
          {formatDate(fin)}
        </span>
      </div>
    </div>
  );
}

// ── Selector de planta reactivo (ahora basado en aulas disponibles) ──────────────
function PlantaSelector({
  value,
  onChange,
  aulaCapacidad,
}: {
  value: string;
  onChange: (v: string) => void;
  aulaCapacidad: number;
}) {
  const opciones = [
    { key: "baja", label: "Planta baja", color: "#3b82f6", bg: "#eff6ff" },
    { key: "alta", label: "Planta alta", color: "#8b5cf6", bg: "#f5f3ff" },
    { key: "sotano", label: "Sótano", color: "#f59e0b", bg: "#fffbeb" },
    { key: "azotea", label: "Azotea", color: "#10b981", bg: "#ecfdf5" },
  ];

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {opciones.map(p => {
        const active = value === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            style={{
              flex: 1,
              minWidth: "110px",
              padding: "10px 8px",
              borderRadius: "10px",
              cursor: "pointer",
              border: `2px solid ${active ? p.color : "#e5e7eb"}`,
              backgroundColor: active ? p.bg : "#f9fafb",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: p.color }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: p.color }}>{p.label}</span>
            </div>
            <span style={{ fontSize: "12px", color: active ? p.color : "#9ca3af", fontWeight: active ? 700 : 400 }}>
              {aulaCapacidad > 0 ? `${aulaCapacidad} personas máx.` : "Capacidad según aula"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Semáforo prioridad ─────────────────────────────────────
const PRIORIDAD: Record<number, { label: string; color: string; bg: string; dot: string }> = {
  1: { label: "Baja", color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
  2: { label: "Media", color: "#d97706", bg: "#fef9c3", dot: "#eab308" },
  3: { label: "Alta", color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
};

function SemaforoBadge({ nivel }: { nivel: number }) {
  const cfg = PRIORIDAD[nivel] ?? PRIORIDAD[1];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "999px",
      backgroundColor: cfg.bg, color: cfg.color, fontSize: "12px", fontWeight: 600,
    }}>
      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function PrioridadSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {[1, 2, 3].map((n) => {
        const cfg = PRIORIDAD[n];
        const active = String(value) === String(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            style={{
              flex: 1,
              padding: "9px 6px",
              borderRadius: "8px",
              cursor: "pointer",
              border: `2px solid ${active ? cfg.dot : "#e5e7eb"}`,
              backgroundColor: active ? cfg.bg : "#f9fafb",
              color: cfg.color,
              fontWeight: 600,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: cfg.dot }} />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Estilos modales ────────────────────────────────────────
const modalOverlay: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
  alignItems: "center", justifyContent: "center", zIndex: 1000,
};
const modalCard: React.CSSProperties = {
  background: "#fff", borderRadius: "12px", padding: "32px",
  width: "480px", display: "flex", flexDirection: "column", gap: "14px",
  maxHeight: "92vh", overflowY: "auto",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "-6px",
};

// ─────────────────────────────────────────────────────────
function Eventos() {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventosData, setEventosData] = useState<Evento[]>([]);
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState("");

  const emptyAdd = {
    name_event: "",
    id_building: "",
    id_aula: "",
    timedate_event: "",
    timedate_end: "",
    id_profe: "",
    id_user: "",
    capacidad_esperada: "0",
    prioridad: "1",
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyAdd);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id_event: 0,
    name_event: "",
    id_building: "",
    id_aula: "",
    timedate_event: "",
    timedate_end: "",
    id_profe: "",
    id_user: "",
    capacidad_esperada: "0",
    prioridad: "1",
  });

  const fetchEventos = () =>
  fetch("http://localhost:8000/eventos")
    .then(r => {
      if (!r.ok) throw new Error(`Error ${r.status}`);
      return r.json();
    })
    .then(d => {
      setEventosData(Array.isArray(d) ? d : []);
      setLoading(false);
    })
    .catch(e => {
      console.error("fetchEventos:", e);
      setEventosData([]);   // ← esto evita el crash de .filter()
      setLoading(false);
    });
    
  const fetchEdificios = () =>
    fetch("http://localhost:8000/edificios")
      .then(r => r.json())
      .then(setEdificios)
      .catch(console.error);

  const fetchProfesores = () =>
    fetch("http://localhost:8000/profesores")
      .then(r => r.json())
      .then(setProfesores)
      .catch(console.error);

  const fetchUsuarios = () =>
    fetch("http://localhost:8000/usuarios") // Asegúrate de tener este endpoint
      .then(r => r.json())
      .then(setUsuarios)
      .catch(console.error);

  useEffect(() => {
    fetchEventos();
    fetchEdificios();
    fetchProfesores();
    fetchUsuarios();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowLogoutMenu(false);
    navigate("/", { replace: true });
  };

  const filteredEventos = eventosData.filter(e =>
    e.name_event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getNombreProfesor = (id: number | null) =>
    profesores.find(p => p.id_profe === id)?.nombre_profe ?? (id ? `Profesor ${id}` : "—");

  const getNombreUsuario = (id: string | null) =>
    usuarios.find(u => u.id_user === id)?.name_user ?? (id ? `Usuario ${id.slice(0, 8)}...` : "—");

  const getAulaCapacidad = (idAula: number | null) => {
    // Si tienes fetch de aulas, puedes mejorarlo; por ahora usamos 0 como fallback
    return 0; // ← Aquí podrías tener un estado con aulas y buscar
  };

  const handleAddSubmit = async () => {
    setModalError("");
    const capVal = parseInt(addForm.capacidad_esperada) || 0;

    // Validación fecha fin > inicio
    if (addForm.timedate_end && addForm.timedate_event && addForm.timedate_end <= addForm.timedate_event) {
      setModalError("La fecha/hora de fin debe ser posterior a la de inicio.");
      return;
    }

    // Nota: validación de capacidad contra aula se hace en backend ahora

    try {
      const res = await fetch("http://localhost:8000/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_event: addForm.name_event,
          id_building: addForm.id_building ? parseInt(addForm.id_building) : null,
          id_aula: addForm.id_aula ? parseInt(addForm.id_aula) : null,
          timedate_event: addForm.timedate_event || null,
          timedate_end: addForm.timedate_end || null,
          id_profe: addForm.id_profe ? parseInt(addForm.id_profe) : null,
          id_user: addForm.id_user || null,
          capacidad_esperada: capVal,
          prioridad: parseInt(addForm.prioridad) || 1,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setAddForm(emptyAdd);
        fetchEventos();
      } else {
        setModalError(data.detail || data.mensaje || "Error al agregar evento");
      }
    } catch {
      setModalError("No se pudo conectar con el servidor");
    }
  };

  const openEditModal = (ev: Evento) => {
    setModalError("");
    setEditForm({
      id_event: ev.id_event,
      name_event: ev.name_event || "",
      id_building: ev.id_building ? String(ev.id_building) : "",
      id_aula: ev.id_aula ? String(ev.id_aula) : "",
      timedate_event: ev.timedate_event ? ev.timedate_event.slice(0, 16) : "",
      timedate_end: ev.timedate_end ? ev.timedate_end.slice(0, 16) : "",
      id_profe: ev.id_profe ? String(ev.id_profe) : "",
      id_user: ev.id_user || "",
      capacidad_esperada: String(ev.capacidad_esperada ?? 0),
      prioridad: String(ev.prioridad ?? 1),
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setModalError("");
    const capVal = parseInt(editForm.capacidad_esperada) || 0;

    if (editForm.timedate_end && editForm.timedate_event && editForm.timedate_end <= editForm.timedate_event) {
      setModalError("La fecha/hora de fin debe ser posterior a la de inicio.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/eventos/${editForm.id_event}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_event: editForm.name_event || null,
          id_building: editForm.id_building ? parseInt(editForm.id_building) : null,
          id_aula: editForm.id_aula ? parseInt(editForm.id_aula) : null,
          timedate_event: editForm.timedate_event || null,
          timedate_end: editForm.timedate_end || null,
          id_profe: editForm.id_profe ? parseInt(editForm.id_profe) : null,
          id_user: editForm.id_user || null,
          capacidad_esperada: capVal,
          prioridad: parseInt(editForm.prioridad) || 1,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        fetchEventos();
      } else {
        setModalError(data.detail || data.mensaje || "Error al editar evento");
      }
    } catch {
      setModalError("No se pudo conectar con el servidor");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar el evento "${name}"?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/eventos/${id}`, { method: "DELETE" });
      if (res.ok) fetchEventos();
      else alert("Error al eliminar el evento");
    } catch {
      alert("No se pudo conectar con el servidor");
    }
  };

  const handleToggleStatus = async (ev: Evento) => {
    try {
      const res = await fetch(`http://localhost:8000/eventos/${ev.id_event}/toggle-status`, { method: "PATCH" });
      if (res.ok) fetchEventos();
    } catch {
      console.error("Error cambiando estado");
    }
  };

  // ── Campos del modal ───────────────────────────────────────
  const ModalFields = (
    form: typeof addForm | typeof editForm,
    setForm: React.Dispatch<React.SetStateAction<any>>,
    // edificioActual: Edificio | null // ya no lo usamos directamente
  ) => {
    const capVal = parseInt(form.capacidad_esperada) || 0;
    // Nota: capacidad máxima ahora depende del aula seleccionada (puedes mejorarlo con fetch)

    return (
      <>
        <span style={labelStyle}>Nombre del evento</span>
        <input
          style={inputStyle}
          placeholder="Nombre del evento"
          value={form.name_event}
          onChange={e => setForm((p: any) => ({ ...p, name_event: e.target.value }))}
        />

        <span style={labelStyle}>Edificio</span>
        <select
          style={inputStyle}
          value={form.id_building}
          onChange={e => setForm((p: any) => ({ ...p, id_building: e.target.value }))}
        >
          <option value="">Seleccionar edificio</option>
          {edificios.map(ed => (
            <option key={ed.id_building} value={ed.id_building}>
              {ed.name_building}
            </option>
          ))}
        </select>

        <span style={labelStyle}>Aula / Planta</span>
        <input
          style={inputStyle}
          placeholder="ID del aula (opcional)"
          value={form.id_aula}
          onChange={e => setForm((p: any) => ({ ...p, id_aula: e.target.value }))}
        />
        {/* Puedes reemplazar por un selector de aulas si fetchas las aulas */}
        <PlantaSelector
          value="baja" // ← Puedes hacer que sea editable si agregas campo planta en frontend
          onChange={() => {}} // ← Temporal, ya que planta viene de aula
          aulaCapacidad={0} // ← Actualizar con fetch de aula
        />

        <span style={labelStyle}>Fecha y hora de inicio</span>
        <input
          style={inputStyle}
          type="datetime-local"
          value={form.timedate_event}
          onChange={e => setForm((p: any) => ({ ...p, timedate_event: e.target.value }))}
        />

        <span style={labelStyle}>Fecha y hora de fin</span>
        <input
          style={{
            ...inputStyle,
            borderColor:
              form.timedate_end && form.timedate_event && form.timedate_end <= form.timedate_event
                ? "#ef4444"
                : "#d1d5db",
          }}
          type="datetime-local"
          value={form.timedate_end}
          min={form.timedate_event}
          onChange={e => setForm((p: any) => ({ ...p, timedate_end: e.target.value }))}
        />
        {form.timedate_end && form.timedate_event && form.timedate_end <= form.timedate_event && (
          <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "-8px" }}>
            ⚠️ La hora de fin debe ser posterior a la de inicio.
          </span>
        )}

        <span style={labelStyle}>Capacidad esperada (personas)</span>
        <input
          style={inputStyle}
          type="number"
          min="0"
          placeholder="Ej: 50"
          value={form.capacidad_esperada}
          onChange={e => setForm((p: any) => ({ ...p, capacidad_esperada: e.target.value }))}
        />

        <span style={labelStyle}>Prioridad</span>
        <PrioridadSelector
          value={form.prioridad}
          onChange={v => setForm((p: any) => ({ ...p, prioridad: v }))}
        />

        <span style={labelStyle}>Profesor</span>
        <select
          style={inputStyle}
          value={form.id_profe}
          onChange={e => setForm((p: any) => ({ ...p, id_profe: e.target.value }))}
        >
          <option value="">Seleccionar profesor</option>
          {profesores.map(pr => (
            <option key={pr.id_profe} value={pr.id_profe}>
              {pr.nombre_profe}
            </option>
          ))}
        </select>

        <span style={labelStyle}>Usuario</span>
        <select
          style={inputStyle}
          value={form.id_user}
          onChange={e => setForm((p: any) => ({ ...p, id_user: e.target.value }))}
        >
          <option value="">Seleccionar usuario</option>
          {usuarios.map(u => (
            <option key={u.id_user} value={u.id_user}>
              {u.name_user}
            </option>
          ))}
        </select>
      </>
    );
  };

  return (
    <div className="eventos-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate("/dashboard")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <span className="nav-text">Dashboard</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/usuarios")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="nav-text">Usuarios</span>
          </button>
          <button className="nav-item active" onClick={() => navigate("/eventos")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span className="nav-text">Eventos</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/edificios")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 22V12h6v10" />
                <path d="M3 9h18" />
              </svg>
            </span>
            <span className="nav-text">Edificios</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/divisiones")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h7v7H3z" />
                <path d="M14 3h7v7h-7z" />
                <path d="M3 14h7v7H3z" />
                <path d="M14 14h7v7h-7z" />
              </svg>
            </span>
            <span className="nav-text">Divisiones</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile" onClick={() => setShowLogoutMenu(!showLogoutMenu)}>
            <div className="user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="user-name">Admin</span>
          </div>
          {showLogoutMenu && (
            <div className="logout-menu">
              <button className="logout-btn" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <div className="top-nav">
          <span className="top-nav-text inactive">Dashboards</span>
          <span className="top-nav-separator">/</span>
          <span className="top-nav-text active">Eventos</span>
        </div>

        <div className="content-card">
          <div className="content-header">
            <div className="header-left">
              <h2 className="content-title">Eventos</h2>
              <button className="btn-primary" onClick={() => { setModalError(""); setShowAddModal(true); }}>
                Agregar
              </button>
            </div>
            <div className="header-right">
              <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar evento por nombre"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <p style={{ padding: "20px", textAlign: "center" }}>Cargando eventos...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Edificio</th>
                    <th>Aula / Planta</th>
                    <th>Fecha y Hora</th>
                    <th>Prioridad</th>
                    <th>Profesor</th>
                    <th>Usuario</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEventos.map(ev => (
                    <tr key={ev.id_event}>
                      <td className="cell-name">{ev.name_event || "Sin nombre"}</td>
                      <td>{ev.edificios?.name_building ?? (ev.id_building ? `Edificio ${ev.id_building}` : "—")}</td>
                      <td>
                        <PlantaCell
                          planta={ev.aulas?.planta ?? null}
                          capacidad={ev.aulas?.capacidad ?? ev.capacidad_esperada ?? 0}
                        />
                      </td>
                      <td>
                        <FechaCell inicio={ev.timedate_event} fin={ev.timedate_end} />
                      </td>
                      <td><SemaforoBadge nivel={ev.prioridad ?? 1} /></td>
                      <td>{getNombreProfesor(ev.id_profe)}</td>
                      <td>{getNombreUsuario(ev.id_user)}</td>
                      <td>
                        <span className={`status-badge ${ev.status_event === 0 ? "status-inactive" : "status-active"}`}>
                          {ev.status_event === 0 ? "Inactivo" : "Activo"}
                        </span>
                      </td>
                      <td className="cell-actions">
                        <button className="action-btn" title="Editar" onClick={() => openEditModal(ev)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className={`action-btn ${ev.status_event === 0 ? "action-btn-disabled" : ""}`}
                          title="Toggle Status"
                          onClick={() => handleToggleStatus(ev)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
                            <circle cx={ev.status_event === 0 ? "8" : "16"} cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          className="action-btn"
                          title="Eliminar"
                          style={{ color: "#dc2626" }}
                          onClick={() => handleDelete(ev.id_event, ev.name_event)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="content-footer"><p className="footer-text">© 2026</p></div>
        </div>
      </main>

      {/* MODAL AGREGAR */}
      {showAddModal && (
        <div style={modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Agregar Evento</h3>
            {modalError && (
              <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}
            {ModalFields(addForm, setAddForm)}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "4px" }}>
              <button className="btn-filter" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddSubmit}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showEditModal && (
        <div style={modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Editar Evento</h3>
            {modalError && (
              <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}
            {ModalFields(editForm, setEditForm)}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "4px" }}>
              <button className="btn-filter" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleEditSubmit}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Eventos;