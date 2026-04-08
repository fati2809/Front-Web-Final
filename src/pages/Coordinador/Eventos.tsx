import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getSession, clearSession } from "../../services/auth";
import "./Coordinador.css";

interface Evento {
  id_event: number;
  name_event: string;
  id_building: number | null;
  timedate_event: string | null;
  timedate_end: string | null;
  status_event: number;
  id_profe: number | null;
  id_user: string | null;
  descrip_event: string | null;
  img_event: string | null;
  id_aula: number | null;
  capacidad_esperada: number;
  prioridad: number;
  edificios?: { name_building: string } | null;
  aulas?: { nombre_aula: string; planta: string | null; capacidad: number } | null;
  profesor?: { nombre_profe: string } | null;
}

interface Edificio { id_building: number; name_building: string; }
interface Aula     { id_aula: number; nombre_aula: string; codigo_aula: string | null; id_building: number; planta: string | null; capacidad: number; tipo_aula: string | null; disponible: boolean; }
interface Profesor { id_profe: number | string; nombre_profe: string; email_profe: string | null; }
interface Usuario  { id_user: string; name_user: string; }

const PLANTA_BTN: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  baja:   { label: "Planta baja", color: "#3b82f6", bg: "#eff6ff", dot: "#3b82f6" },
  alta:   { label: "Planta alta", color: "#8b5cf6", bg: "#f5f3ff", dot: "#8b5cf6" },
  sotano: { label: "Sótano",      color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  azotea: { label: "Azotea",      color: "#10b981", bg: "#ecfdf5", dot: "#10b981" },
};

function PlantaCell({ planta, capacidad }: { planta: string | null; capacidad: number }) {
  const p     = (planta || "").toLowerCase();
  const color = p === "baja" ? "#3b82f6" : p === "alta" ? "#8b5cf6" : p === "sotano" ? "#f59e0b" : p === "azotea" ? "#10b981" : "#6b7280";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, backgroundColor: color }} />
        <span style={{ fontSize: "12px", fontWeight: 600, color }}>{planta ? `Planta ${planta}` : "Sin planta"}</span>
      </div>
      <span style={{ fontSize: "11px", color: "#6b7280", paddingLeft: "13px" }}>{capacidad > 0 ? `${capacidad} personas` : "—"}</span>
    </div>
  );
}

function FechaCell({ inicio, fin }: { inicio: string | null; fin: string | null }) {
  const fmt = (d: string | null) => d ? new Date(d).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", backgroundColor: "#3b82f6", borderRadius: "4px", padding: "1px 5px" }}>INICIO</span>
        <span style={{ fontSize: "13px", color: "#111827" }}>{fmt(inicio)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", backgroundColor: fin ? "#8b5cf6" : "#d1d5db", borderRadius: "4px", padding: "1px 5px" }}>FIN</span>
        <span style={{ fontSize: "13px", color: fin ? "#111827" : "#9ca3af" }}>{fmt(fin)}</span>
      </div>
    </div>
  );
}

const modalOverlay: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
  alignItems: "center", justifyContent: "center", zIndex: 1000,
};
const modalCard: React.CSSProperties = {
  background: "#fff", borderRadius: "12px", padding: "32px",
  width: "480px", display: "flex", flexDirection: "column",
  gap: "14px", maxHeight: "92vh", overflowY: "auto",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "-6px",
};

function CoordinadorEventos() {
  const navigate = useNavigate();
  const { user } = getSession();

  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [isOnline, setIsOnline]             = useState(navigator.onLine);
  const [searchTerm, setSearchTerm]         = useState("");
  const [loading, setLoading]               = useState(true);
  const [modalError, setModalError]         = useState("");
  const [showAddModal, setShowAddModal]     = useState(false);

  const [eventosData, setEventosData] = useState<Evento[]>([]);
  const [edificios, setEdificios]     = useState<Edificio[]>([]);
  const [aulas, setAulas]             = useState<Aula[]>([]);
  const [profesores, setProfesores]   = useState<Profesor[]>([]);
  const [usuarios, setUsuarios]       = useState<Usuario[]>([]);

  const emptyAdd = {
    name_event: "", id_building: "", id_aula: "", planta_event: "",
    timedate_event: "", timedate_end: "", id_profe: "", id_user: "",
    descrip_event: "", img_event: "", capacidad_esperada: "0", prioridad: "1",
  };
  const [addForm, setAddForm] = useState(emptyAdd);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const fetchEventos = () =>
    fetch(`${import.meta.env.VITE_API_URL}/eventos`)
      .then(r => r.json())
      .then(d => { setEventosData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => {
    const loadData = async () => {
      try {
        const [evs, eds, aus, profRes, usrRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/eventos`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL}/edificios`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL}/aulas`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL}/profesores`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL}/usuarios`).then(r => r.json()),
        ]);

        setEventosData(Array.isArray(evs) ? evs : []);
        setEdificios(Array.isArray(eds) ? eds : []);
        setAulas(Array.isArray(aus) ? aus : []);
        setUsuarios(Array.isArray(usrRes) ? usrRes.filter((u: any) => u.id_rol === 2) : []);

        const profesNormalizados = (Array.isArray(profRes) ? profRes : []).map((p: any) => ({
          id_profe:     p.id_profe,
          nombre_profe: p.nombre_profe ?? "Sin nombre",
          email_profe:  p.email_profe ?? null,
        }));

        const idsExistentes = new Set(profesNormalizados.map((p: any) => p.id_user).filter(Boolean));

        const usuariosProfes = (Array.isArray(usrRes) ? usrRes : [])
          .filter((u: any) => u.id_rol === 4 && !idsExistentes.has(u.id_user))
          .map((u: any) => ({
            id_profe:     `local-${u.id_user}`,
            nombre_profe: u.name_user,
            email_profe:  u.email_user,
          }));

        setProfesores([...profesNormalizados, ...usuariosProfes]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogout = () => { clearSession(); navigate("/", { replace: true }); };

  const getNombreEdificio = (ev: Evento) =>
    ev.edificios?.name_building
    ?? edificios.find(ed => ed.id_building === ev.id_building)?.name_building
    ?? (ev.id_building ? `Edificio ${ev.id_building}` : "—");

  const getPlanta = (ev: Evento): string | null =>
    ev.aulas?.planta ?? aulas.find(a => a.id_aula === ev.id_aula)?.planta ?? null;

  const getCapacidadAula = (ev: Evento): number =>
    ev.aulas?.capacidad ?? aulas.find(a => a.id_aula === ev.id_aula)?.capacidad ?? ev.capacidad_esperada ?? 0;

  const getNombreProfesor = (ev: Evento) =>
    ev.profesor?.nombre_profe
    ?? profesores.find(p => String(p.id_profe) === String(ev.id_profe))?.nombre_profe
    ?? (ev.id_profe ? `Profesor ${ev.id_profe}` : "—");

  const handleAddSubmit = async () => {
    setModalError("");
    if (!addForm.name_event.trim())  { setModalError("El nombre del evento es obligatorio."); return; }
    if (!addForm.timedate_event)     { setModalError("La fecha y hora de inicio son obligatorias."); return; }
    if (!addForm.timedate_end)       { setModalError("La fecha y hora de fin son obligatorias."); return; }
    if (!addForm.id_building)        { setModalError("Debes seleccionar un edificio."); return; }
    if (!addForm.id_profe)           { setModalError("Debes seleccionar un profesor."); return; }
    if (!addForm.id_user)            { setModalError("Debes seleccionar un usuario."); return; }
    if (addForm.timedate_end && addForm.timedate_event && addForm.timedate_end <= addForm.timedate_event) {
      setModalError("La fecha de fin debe ser posterior a la de inicio."); return;
    }

    const body = {
      name_event:         addForm.name_event,
      id_building:        addForm.id_building ? parseInt(addForm.id_building) : null,
      id_aula:            addForm.id_aula      ? parseInt(addForm.id_aula)     : null,
      timedate_event:     addForm.timedate_event || null,
      timedate_end:       addForm.timedate_end   || null,
      id_profe:           addForm.id_profe && !addForm.id_profe.startsWith("local-")
                            ? parseInt(addForm.id_profe) : null,
      id_user:            addForm.id_user        || null,
      descrip_event:      addForm.descrip_event  || null,
      img_event:          addForm.img_event       || null,
      capacidad_esperada: parseInt(addForm.capacidad_esperada) || 0,
      prioridad:          1,
    };

    if (!navigator.onLine) {
      const pending = JSON.parse(localStorage.getItem("pending_eventos") || "[]");
      pending.push(body);
      localStorage.setItem("pending_eventos", JSON.stringify(pending));
      setShowAddModal(false); setAddForm(emptyAdd);
      alert("Sin conexión. El evento se guardará cuando vuelva la conexión.");
      return;
    }

    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/eventos`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) { setShowAddModal(false); setAddForm(emptyAdd); fetchEventos(); }
      else        { setModalError(data.detail || "Error al agregar evento"); }
    } catch { setModalError("No se pudo conectar con el servidor"); }
  };

  const filteredEventos = eventosData.filter(e =>
    e.name_event?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const idBuilding       = addForm.id_building ? parseInt(addForm.id_building) : null;
  const idAula           = addForm.id_aula      ? parseInt(addForm.id_aula)     : null;
  const plantaActual     = addForm.planta_event || "";
  const aulaSeleccionada = aulas.find(a => a.id_aula === idAula) ?? null;
  const imgUrl           = addForm.img_event || "";
  const nowLocal         = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const plantasDisponibles = idBuilding
    ? [...new Set(aulas.filter(a => a.disponible && a.id_building === idBuilding && a.planta).map(a => a.planta!.toLowerCase()))]
    : [];

  const aulasFiltradas = aulas.filter(a =>
    a.disponible &&
    (!idBuilding   || a.id_building === idBuilding) &&
    (!plantaActual || a.planta?.toLowerCase() === plantaActual)
  );

  const capVal       = parseInt(addForm.capacidad_esperada) || 0;
  const overCap      = aulaSeleccionada ? capVal > aulaSeleccionada.capacidad : false;
  const plantaCfgSel = PLANTA_BTN[aulaSeleccionada?.planta?.toLowerCase() ?? ""] ?? null;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate("/coordinador/dashboard")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <span className="nav-text">Dashboard</span>
          </button>
          <button className="nav-item active" onClick={() => navigate("/coordinador/eventos")}>
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
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile" onClick={() => setShowLogoutMenu(!showLogoutMenu)}>
            <div className="user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="user-name">{user?.name_user ?? "Coordinador"}</span>
            <span title={isOnline ? "Online" : "Offline"} style={{
              width: "9px", height: "9px", borderRadius: "50%",
              backgroundColor: isOnline ? "#22c55e" : "#ef4444",
              flexShrink: 0, marginLeft: "auto",
              boxShadow: isOnline ? "0 0 0 2px rgba(34,197,94,0.25)" : "0 0 0 2px rgba(239,68,68,0.25)",
              transition: "background-color 0.3s, box-shadow 0.3s",
            }} />
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
          <span className="top-nav-text inactive">Coordinador</span>
          <span className="top-nav-separator">/</span>
          <span className="top-nav-text active">Eventos</span>
        </div>

        <div className="content-card">
          <div className="content-header">
            <div className="header-left">
              <h2 className="content-title">Eventos</h2>
              <button className="btn-primary" onClick={() => { setModalError(""); setShowAddModal(true); }}>Agregar</button>
            </div>
            <div className="header-right">
              <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input type="text" placeholder="Buscar evento por nombre" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} className="search-input" />
              </div>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <p style={{ padding: "20px", textAlign: "center" }}>Cargando eventos...</p>
            ) : filteredEventos.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>No hay eventos registrados.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Edificio</th>
                    <th>Aula / Planta</th>
                    <th>Fecha y Hora</th>
                    <th>Profesor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEventos.map(ev => (
                    <tr key={ev.id_event}>
                      <td className="cell-name">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {ev.img_event && (
                            <img src={ev.img_event} alt="" style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          )}
                          {ev.name_event || "Sin nombre"}
                        </div>
                      </td>
                      <td>{getNombreEdificio(ev)}</td>
                      <td><PlantaCell planta={getPlanta(ev)} capacidad={getCapacidadAula(ev)} /></td>
                      <td><FechaCell inicio={ev.timedate_event} fin={ev.timedate_end} /></td>
                      <td>{getNombreProfesor(ev)}</td>
                      <td>
                        <span className={`status-badge ${ev.status_event === 0 ? "status-inactive" : "status-active"}`}>
                          {ev.status_event === 0 ? "Inactivo" : "Activo"}
                        </span>
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

      {showAddModal && (
        <div style={modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Agregar Evento</h3>
            {modalError && (
              <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}

            <span style={labelStyle}>Nombre del evento *</span>
            <input style={inputStyle} placeholder="Nombre del evento" value={addForm.name_event}
              onChange={e => setAddForm(p => ({ ...p, name_event: e.target.value }))} />

            <span style={labelStyle}>Descripción</span>
            <input style={inputStyle} placeholder="Descripción (opcional)" value={addForm.descrip_event}
              onChange={e => setAddForm(p => ({ ...p, descrip_event: e.target.value }))} />

            <span style={labelStyle}>URL de imagen (opcional)</span>
            <input
              style={{ ...inputStyle, borderColor: imgUrl && !/\.(jpg|jpeg|png)$/i.test(imgUrl) ? "#ef4444" : "#d1d5db" }}
              placeholder="https://ejemplo.com/imagen.jpg" value={imgUrl}
              onChange={e => setAddForm(p => ({ ...p, img_event: e.target.value }))} />
            {imgUrl && !/\.(jpg|jpeg|png)$/i.test(imgUrl) && (
              <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "-8px" }}>Solo se permiten imágenes .jpg, .jpeg o .png</span>
            )}
            {imgUrl && /\.(jpg|jpeg|png)$/i.test(imgUrl) && (
              <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb", maxHeight: "120px" }}>
                <img src={imgUrl} alt="Preview" style={{ width: "100%", maxHeight: "120px", objectFit: "cover", display: "block" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}

            <span style={labelStyle}>Edificio *</span>
            <select style={inputStyle} value={addForm.id_building}
              onChange={e => setAddForm(p => ({ ...p, id_building: e.target.value, planta_event: "", id_aula: "" }))}>
              <option value="">Seleccionar edificio</option>
              {edificios.map(ed => <option key={ed.id_building} value={ed.id_building}>{ed.name_building}</option>)}
            </select>

            {idBuilding && plantasDisponibles.length > 0 && (
              <>
                <span style={labelStyle}>Planta</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {plantasDisponibles.map(p => {
                    const cfg    = PLANTA_BTN[p] ?? { label: `Planta ${p}`, color: "#6b7280", bg: "#f9fafb", dot: "#6b7280" };
                    const active = plantaActual === p;
                    const capMax = Math.max(0, ...aulas.filter(a => a.id_building === idBuilding && a.planta?.toLowerCase() === p).map(a => a.capacidad));
                    return (
                      <button key={p} type="button"
                        onClick={() => setAddForm(prev => ({ ...prev, planta_event: p, id_aula: "" }))}
                        style={{ flex: 1, padding: "9px 6px", borderRadius: "8px", cursor: "pointer", border: `2px solid ${active ? cfg.dot : "#e5e7eb"}`, backgroundColor: active ? cfg.bg : "#f9fafb", color: cfg.color, fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: cfg.dot }} />
                        {cfg.label}
                        <span style={{ fontSize: "11px", fontWeight: 400, color: active ? cfg.color : "#9ca3af" }}>hasta {capMax} p.</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {idBuilding && plantasDisponibles.length === 0 && (
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>No hay aulas disponibles para este edificio.</span>
            )}

            {plantaActual && (
              <>
                <span style={labelStyle}>Aula</span>
                <select style={inputStyle} value={addForm.id_aula}
                  onChange={e => setAddForm(p => ({ ...p, id_aula: e.target.value }))}>
                  <option value="">Sin aula asignada</option>
                  {aulasFiltradas.map(a => (
                    <option key={a.id_aula} value={a.id_aula}>
                      {a.nombre_aula}{a.codigo_aula ? ` (${a.codigo_aula})` : ""} — {a.tipo_aula ?? "Aula"} | {a.capacidad} personas
                    </option>
                  ))}
                </select>
                {aulaSeleccionada && plantaCfgSel && (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "10px 12px", borderRadius: "8px", backgroundColor: plantaCfgSel.bg, border: `1px solid ${plantaCfgSel.dot}`, fontSize: "12px", color: plantaCfgSel.color, fontWeight: 600 }}>
                    <span>🏢 Planta: <strong>{aulaSeleccionada.planta}</strong></span>
                    <span>👥 Capacidad: <strong>{aulaSeleccionada.capacidad} personas</strong></span>
                    {aulaSeleccionada.tipo_aula && <span>🏷️ Tipo: <strong>{aulaSeleccionada.tipo_aula}</strong></span>}
                  </div>
                )}
              </>
            )}

            <span style={labelStyle}>Fecha y hora de inicio *</span>
            <input style={inputStyle} type="datetime-local" value={addForm.timedate_event} min={nowLocal}
              onChange={e => setAddForm(p => ({ ...p, timedate_event: e.target.value }))} />

            <span style={labelStyle}>Fecha y hora de fin *</span>
            <input
              style={{ ...inputStyle, borderColor: addForm.timedate_end && addForm.timedate_event && addForm.timedate_end <= addForm.timedate_event ? "#ef4444" : "#d1d5db" }}
              type="datetime-local" value={addForm.timedate_end} min={addForm.timedate_event || nowLocal}
              onChange={e => setAddForm(p => ({ ...p, timedate_end: e.target.value }))} />
            {addForm.timedate_end && addForm.timedate_event && addForm.timedate_end <= addForm.timedate_event && (
              <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "-8px" }}>La fecha de fin debe ser posterior a la de inicio.</span>
            )}

            <span style={labelStyle}>Capacidad esperada</span>
            <input
              style={{ ...inputStyle, borderColor: overCap ? "#ef4444" : "#d1d5db" }}
              type="number" min="0"
              placeholder={aulaSeleccionada ? `Máx. ${aulaSeleccionada.capacidad}` : "Ej: 50"}
              value={addForm.capacidad_esperada}
              onChange={e => setAddForm(p => ({ ...p, capacidad_esperada: e.target.value }))} />
            {overCap && (
              <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "-8px" }}>
                ⚠️ Excede la capacidad del aula ({aulaSeleccionada!.capacidad} personas).
              </span>
            )}

            <span style={labelStyle}>Profesor *</span>
            <select style={inputStyle} value={addForm.id_profe}
              onChange={e => setAddForm(p => ({ ...p, id_profe: e.target.value }))}>
              <option value="">Seleccionar profesor</option>
              {profesores.map(pr => <option key={pr.id_profe} value={pr.id_profe}>{pr.nombre_profe}</option>)}
            </select>

            <span style={labelStyle}>Usuario *</span>
            <select style={inputStyle} value={addForm.id_user}
              onChange={e => setAddForm(p => ({ ...p, id_user: e.target.value }))}>
              <option value="">Seleccionar usuario</option>
              {usuarios.map(u => <option key={u.id_user} value={u.id_user}>{u.name_user}</option>)}
            </select>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "4px" }}>
              <button className="btn-filter" onClick={() => { setShowAddModal(false); setAddForm(emptyAdd); }}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddSubmit}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoordinadorEventos;