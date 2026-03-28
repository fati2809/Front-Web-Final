import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Usuarios/Usuarios.css";

interface Edificio {
  id_building: number;
  name_building: string;
  code_building: string | null;
  imagen_url: string | null;
  lat_building: number;
  lon_building: number;
  id_div: number | null;
  name_div: string | null;
  capacidad_planta_baja: number;
  capacidad_planta_alta: number;
  capacidad_total: number;
}

interface Division {
  id_div: number;
  name_div: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "-8px",
};
const selectStyle: React.CSSProperties = { ...inputStyle };

function CapacidadCell({ baja, alta }: { baja: number; alta: number }) {
  const total = baja + alta;
  if (total === 0) return <span style={{ color: "#9ca3af", fontSize: "13px" }}>—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "130px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#3b82f6", flexShrink: 0 }} />
        <span style={{ fontSize: "12px", color: "#374151" }}>Planta baja: <strong>{baja}</strong></span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#8b5cf6", flexShrink: 0 }} />
        <span style={{ fontSize: "12px", color: "#374151" }}>Planta alta: <strong>{alta}</strong></span>
      </div>
      <div style={{ fontSize: "11px", color: "#6b7280", borderTop: "1px solid #f3f4f6", paddingTop: "3px", marginTop: "1px" }}>
        Total: <strong>{total}</strong>
      </div>
    </div>
  );
}

function Edificios() {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [edificiosData, setEdificiosData] = useState<Edificio[]>([]);
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState("");

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const emptyAdd = {
    name_building: "", code_building: "", imagen_url: "",
    lat_building: "", lon_building: "", id_div: "",
    capacidad_planta_baja: "0", capacidad_planta_alta: "0",
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyAdd);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id_building: 0, name_building: "", code_building: "",
    imagen_url: "", lat_building: "", lon_building: "", id_div: "",
    capacidad_planta_baja: "0", capacidad_planta_alta: "0",
  });

  // ── Fetch functions ───────────────────────────────────────────────────────
  const fetchEdificios = () => {
    fetch(`${import.meta.env.VITE_API_URL}/edificios`)
      .then(r => r.json())
      .then(d => { setEdificiosData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  };

  const fetchDivisiones = () => {
    fetch(`${import.meta.env.VITE_API_URL}/divisiones`)
      .then(r => r.json())
      .then(d => setDivisiones(d))
      .catch(console.error);
  };

  // ── Sync offline al reconectar ────────────────────────────────────────────
  useEffect(() => {
    const syncPending = async () => {
      const pending = JSON.parse(localStorage.getItem("pending_edificios") || "[]");
      if (pending.length === 0) return;
      try {
        for (const ed of pending) {
          await fetch(`${import.meta.env.VITE_API_URL}/edificios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ed),
          });
        }
        localStorage.removeItem("pending_edificios");
        fetchEdificios();
      } catch (err) {
        console.error("Error sincronizando edificios pendientes", err);
      }
    };

    window.addEventListener("online", syncPending);
    return () => window.removeEventListener("online", syncPending);
  }, []);

  // ── Montaje inicial ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchEdificios();
    fetchDivisiones();

    const syncPending = async () => {
      const pending = JSON.parse(localStorage.getItem("pending_edificios") || "[]");
      if (pending.length === 0) return;
      try {
        for (const ed of pending) {
          await fetch(`${import.meta.env.VITE_API_URL}/edificios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ed),
          });
        }
        localStorage.removeItem("pending_edificios");
        fetchEdificios();
      } catch (err) {
        console.error("Error sincronizando edificios pendientes", err);
      }
    };

    syncPending();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user"); localStorage.removeItem("token");
    setShowLogoutMenu(false); navigate("/", { replace: true });
  };

  const filteredEdificios = edificiosData.filter(e =>
    e.name_building.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.code_building ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const buildBody = (form: typeof addForm | typeof editForm) => ({
    name_building: (form as any).name_building,
    code_building: (form as any).code_building || null,
    imagen_url: (form as any).imagen_url || null,
    lat_building: parseFloat((form as any).lat_building),
    lon_building: parseFloat((form as any).lon_building),
    id_div: (form as any).id_div ? parseInt((form as any).id_div) : null,
    capacidad_planta_baja: parseInt((form as any).capacidad_planta_baja) || 0,
    capacidad_planta_alta: parseInt((form as any).capacidad_planta_alta) || 0,
  });

  // ── Crear edificio ────────────────────────────────────────────────────────
  const handleAddSubmit = async () => {
    setModalError("");

    if (!addForm.name_building.trim()) {
      setModalError("El nombre del edificio es obligatorio.");
      return;
    }

    const body = buildBody(addForm);

    // 🔌 SIN INTERNET
    if (!navigator.onLine) {
      const pending = JSON.parse(localStorage.getItem("pending_edificios") || "[]");
      pending.push(body);
      localStorage.setItem("pending_edificios", JSON.stringify(pending));
      setShowAddModal(false);
      setAddForm(emptyAdd);
      alert("Sin conexión. El edificio se guardará y enviará automáticamente cuando vuelva la conexión.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/edificios`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) { setShowAddModal(false); setAddForm(emptyAdd); fetchEdificios(); }
      else setModalError(data.detail || "Error al agregar edificio");
    } catch {
      setModalError("No se pudo conectar con el servidor");
    }
  };

  const openEditModal = (e: Edificio) => {
    setModalError("");
    setEditForm({
      id_building: e.id_building,
      name_building: e.name_building,
      code_building: e.code_building ?? "",
      imagen_url: e.imagen_url ?? "",
      lat_building: String(e.lat_building),
      lon_building: String(e.lon_building),
      id_div: e.id_div ? String(e.id_div) : "",
      capacidad_planta_baja: String(e.capacidad_planta_baja ?? 0),
      capacidad_planta_alta: String(e.capacidad_planta_alta ?? 0),
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setModalError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/edificios/${editForm.id_building}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(editForm)),
      });
      const data = await res.json();
      if (res.ok) { setShowEditModal(false); fetchEdificios(); }
      else setModalError(data.detail || "Error al editar edificio");
    } catch {
      setModalError("No se pudo conectar con el servidor");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar el edificio "${name}"?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/edificios/${id}`, { method: "DELETE" });
      if (res.ok) fetchEdificios();
      else alert("Error al eliminar el edificio");
    } catch { alert("No se pudo conectar con el servidor"); }
  };

  const modalStyle: React.CSSProperties = {
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 1000,
  };
  const cardStyle: React.CSSProperties = {
    background: "#fff", borderRadius: "12px", padding: "32px",
    width: "440px", display: "flex", flexDirection: "column", gap: "14px",
    maxHeight: "92vh", overflowY: "auto",
  };

  const CapacidadSection = (
    form: typeof addForm | typeof editForm,
    setForm: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const baja = parseInt((form as any).capacidad_planta_baja) || 0;
    const alta = parseInt((form as any).capacidad_planta_alta) || 0;
    return (
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>
          CAPACIDAD DEL EDIFICIO
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#3b82f6", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#3b82f6", display: "inline-block" }} />
              Planta baja
            </label>
            <input
              style={{ ...inputStyle, borderColor: "#bfdbfe" }}
              type="number" min="0" placeholder="Ej: 150"
              value={(form as any).capacidad_planta_baja}
              onChange={(e) => setForm((p: any) => ({ ...p, capacidad_planta_baja: e.target.value }))}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#8b5cf6", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#8b5cf6", display: "inline-block" }} />
              Planta alta
            </label>
            <input
              style={{ ...inputStyle, borderColor: "#ddd6fe" }}
              type="number" min="0" placeholder="Ej: 100"
              value={(form as any).capacidad_planta_alta}
              onChange={(e) => setForm((p: any) => ({ ...p, capacidad_planta_alta: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
          Capacidad total:
          <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", background: "#e0f2fe", padding: "2px 10px", borderRadius: "999px" }}>
            {baja + alta} personas
          </span>
        </div>
      </div>
    );
  };

  const CommonFields = (
    form: typeof addForm | typeof editForm,
    setForm: React.Dispatch<React.SetStateAction<any>>
  ) => (
    <>
      <span style={labelStyle}>Nombre</span>
      <input style={inputStyle} placeholder="Nombre del edificio" value={(form as any).name_building}
        onChange={(e) => setForm((p: any) => ({ ...p, name_building: e.target.value }))} />

      <span style={labelStyle}>Código</span>
      <input style={inputStyle} placeholder="Ej: ED-01" value={(form as any).code_building}
        onChange={(e) => setForm((p: any) => ({ ...p, code_building: e.target.value }))} />

      <span style={labelStyle}>División</span>
      <select style={selectStyle} value={(form as any).id_div}
        onChange={(e) => setForm((p: any) => ({ ...p, id_div: e.target.value }))}>
        <option value="">Seleccionar división</option>
        {divisiones.map(d => (
          <option key={d.id_div} value={d.id_div}>{d.name_div}</option>
        ))}
      </select>

      {CapacidadSection(form, setForm)}

      <span style={labelStyle}>Latitud</span>
      <input style={inputStyle} placeholder="Ej: 20.5888" type="number" step="any" value={(form as any).lat_building}
        onChange={(e) => setForm((p: any) => ({ ...p, lat_building: e.target.value }))} />

      <span style={labelStyle}>Longitud</span>
      <input style={inputStyle} placeholder="Ej: -100.3899" type="number" step="any" value={(form as any).lon_building}
        onChange={(e) => setForm((p: any) => ({ ...p, lon_building: e.target.value }))} />

      <span style={labelStyle}>URL de imagen</span>
      <input style={inputStyle} placeholder="https://..." value={(form as any).imagen_url}
        onChange={(e) => setForm((p: any) => ({ ...p, imagen_url: e.target.value }))} />
    </>
  );

  return (
    <div className="usuarios-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate("/dashboard")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
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
          <button className="nav-item" onClick={() => navigate("/eventos")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span className="nav-text">Eventos</span>
          </button>
          <button className="nav-item active" onClick={() => navigate("/edificios")}>
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
                <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" />
                <path d="M3 14h7v7H3z" /><path d="M14 14h7v7h-7z" />
              </svg>
            </span>
            <span className="nav-text">Divisiones</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div
            className="user-profile"
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
          >
            <div className="user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="user-name">Admin</span>
            <span
              title={isOnline ? "Online" : "Offline"}
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: isOnline ? "#22c55e" : "#ef4444",
                flexShrink: 0,
                marginLeft: "auto",
                boxShadow: isOnline
                  ? "0 0 0 2px rgba(34,197,94,0.25)"
                  : "0 0 0 2px rgba(239,68,68,0.25)",
                transition: "background-color 0.3s, box-shadow 0.3s",
              }}
            />
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
          <span className="top-nav-text active">Edificios</span>
        </div>

        <div className="content-card">
          <div className="content-header">
            <div className="header-left">
              <h2 className="content-title">Edificios</h2>
              <button className="btn-primary" onClick={() => { setModalError(""); setShowAddModal(true); }}>
                Agregar
              </button>
            </div>
            <div className="header-right">
              <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input type="text" placeholder="Buscar por nombre o código"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input" />
              </div>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <p style={{ padding: "20px", textAlign: "center" }}>Cargando edificios...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>División</th>
                    <th>Capacidad</th>
                    <th>Latitud</th>
                    <th>Longitud</th>
                    <th>Imagen</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEdificios.map((ed) => (
                    <tr key={ed.id_building}>
                      <td className="cell-name">{ed.name_building}</td>
                      <td>{ed.code_building ?? "—"}</td>
                      <td>{ed.name_div ?? "—"}</td>
                      <td>
                        <CapacidadCell
                          baja={ed.capacidad_planta_baja ?? 0}
                          alta={ed.capacidad_planta_alta ?? 0}
                        />
                      </td>
                      <td>{ed.lat_building}</td>
                      <td>{ed.lon_building}</td>
                      <td>
                        {ed.imagen_url ? (
                          <img src={ed.imagen_url} alt={ed.name_building}
                            style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : "—"}
                      </td>
                      <td className="cell-actions">
                        <button className="action-btn" title="Editar" onClick={() => openEditModal(ed)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="action-btn" title="Eliminar" style={{ color: "#dc2626" }}
                          onClick={() => handleDelete(ed.id_building, ed.name_building)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
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
        <div style={modalStyle} onClick={() => setShowAddModal(false)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Agregar Edificio</h3>
            {modalError && (
              <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}
            {CommonFields(addForm, setAddForm)}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn-filter" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddSubmit}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showEditModal && (
        <div style={modalStyle} onClick={() => setShowEditModal(false)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Editar Edificio</h3>
            {modalError && (
              <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}
            {CommonFields(editForm, setEditForm)}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn-filter" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleEditSubmit}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Edificios;