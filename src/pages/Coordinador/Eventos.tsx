import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getSession, clearSession } from "../../services/auth";
import "./Coordinador.css";
import { useGoogleCalendar } from "../Eventos/useGoogleCalendar";

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
  edificios?: { name_building: string; code_building: string | null; descrip_building: string | null } | null;
  aulas?: { nombre_aula: string; planta: string | null; capacidad: number } | null;
  profesor?: { nombre_profe: string } | null;
  google_event_id?: string | null;
}

interface Edificio {
  id_building: number;
  name_building: string;
  code_building: string | null;
  descrip_building: string | null;
}

interface Aula {
  id_aula: number;
  nombre_aula: string;
  codigo_aula: string | null;
  id_building: number;
  planta: string | null;
  capacidad: number;
  tipo_aula: string | null;
  disponible: boolean;
}

interface Profesor {
  id_profe: string;
  nombre_profe: string;
  id_user: string | null;
  email_profe: string | null;
}

interface Usuario {
  id_user: string;
  name_user: string;
  email_user: string;
}

type ToastType = "displaced" | "reassigned" | "calendar_success" | "calendar_error" | "email_success";
interface ToastItem { message: string; type: ToastType; }

function WarningToast({ message, type, onClose }: ToastItem & { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [onClose]);

  const config: Record<ToastType, { border: string; iconBg: string; iconColor: string; titleColor: string; title: string }> = {
    displaced:       { border: "#f59e0b", iconBg: "#fef3c7", iconColor: "#f59e0b", titleColor: "#92400e", title: "⚡ Evento desplazado por prioridad" },
    reassigned:      { border: "#3b82f6", iconBg: "#eff6ff", iconColor: "#3b82f6", titleColor: "#1e40af", title: "ℹ️ Evento reasignado automáticamente" },
    calendar_success:{ border: "#16a34a", iconBg: "#dcfce7", iconColor: "#16a34a", titleColor: "#14532d", title: "📅 Guardado en Google Calendar" },
    calendar_error:  { border: "#dc2626", iconBg: "#fee2e2", iconColor: "#dc2626", titleColor: "#7f1d1d", title: "❌ Error en Google Calendar" },
    email_success:   { border: "#7c3aed", iconBg: "#f5f3ff", iconColor: "#7c3aed", titleColor: "#4c1d95", title: "✉️ Invitación enviada al profesor" },
  };
  const cfg = config[type];
  return (
    <div style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 2000, background: "#fff", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: `1.5px solid ${cfg.border}`, padding: "16px 20px", maxWidth: "420px", display: "flex", gap: "12px", animation: "slideInToast 0.3s ease" }}>
      <style>{`@keyframes slideInToast { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0, backgroundColor: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {type === "displaced"        && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4" /><path d="M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>}
        {type === "reassigned"       && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
        {type === "calendar_success" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
        {type === "calendar_error"   && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
        {type === "email_success"    && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.iconColor} strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: cfg.titleColor, marginBottom: "4px" }}>{cfg.title}</div>
        <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.5" }}>{message}</div>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "0", alignSelf: "flex-start", fontSize: "18px", lineHeight: 1 }}>×</button>
    </div>
  );
}

function GoogleCalIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color || "#1a73e8"} strokeWidth="2" />
      <line x1="16" y1="2" x2="16" y2="6" stroke={color || "#1a73e8"} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" stroke={color || "#1a73e8"} strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" stroke={color || "#1a73e8"} strokeWidth="2" />
      <text x="12" y="19" textAnchor="middle" fontSize="8" fontWeight="bold" fill={color || "#1a73e8"}>G</text>
    </svg>
  );
}

function GoogleCalendarButton({ isReady, isSignedIn, status, onSignIn, onSignOut }: {
  isReady: boolean; isSignedIn: boolean; status: string; onSignIn: () => void; onSignOut: () => void;
}) {
  const loading = status === "loading";
  if (!isReady)
    return <button disabled style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#f9fafb", color: "#9ca3af", fontSize: "13px", cursor: "not-allowed" }}><GoogleCalIcon size={16} color="#9ca3af" /> Cargando Google…</button>;
  if (!isSignedIn)
    return <button onClick={onSignIn} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 14px", borderRadius: "8px", border: "1px solid #dadce0", background: "#fff", color: "#3c4043", fontSize: "13px", fontWeight: 500, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}><GoogleCalIcon size={16} /> Conectar Google Calendar</button>;
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
        <GoogleCalIcon size={14} color="#16a34a" />{loading ? "Sincronizando…" : "Calendar conectado"}
      </span>
      <button onClick={onSignOut} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: "12px", cursor: "pointer" }}>Desconectar</button>
    </div>
  );
}

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

const PRIORIDAD: Record<number, { label: string; color: string; bg: string; dot: string }> = {
  1: { label: "Baja",  color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
  2: { label: "Media", color: "#d97706", bg: "#fef9c3", dot: "#eab308" },
  3: { label: "Alta",  color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
};

function SemaforoBadge({ nivel }: { nivel: number }) {
  const cfg = PRIORIDAD[nivel] ?? PRIORIDAD[1];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", backgroundColor: cfg.bg, color: cfg.color, fontSize: "12px", fontWeight: 600 }}>
      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cfg.dot, flexShrink: 0 }} />{cfg.label}
    </span>
  );
}


const PLANTA_BTN: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  baja:   { label: "Planta baja", color: "#3b82f6", bg: "#eff6ff", dot: "#3b82f6" },
  alta:   { label: "Planta alta", color: "#8b5cf6", bg: "#f5f3ff", dot: "#8b5cf6" },
  sotano: { label: "Sótano",      color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  azotea: { label: "Azotea",      color: "#10b981", bg: "#ecfdf5", dot: "#10b981" },
};

const modalOverlay: React.CSSProperties = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalCard: React.CSSProperties    = { background: "#fff", borderRadius: "12px", padding: "32px", width: "480px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "92vh", overflowY: "auto" };
const inputStyle: React.CSSProperties  = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" };
const labelStyle: React.CSSProperties  = { fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "-6px" };

function detectWarningType(msg: string): "displaced" | "reassigned" {
  if (msg.toLowerCase().includes("desplaz") || msg.toLowerCase().includes("prioridad")) return "displaced";
  return "reassigned";
}

function CoordinadorEventos() {
  const navigate = useNavigate();
  const gcal     = useGoogleCalendar();
  const { user } = getSession();

  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [searchTerm, setSearchTerm]         = useState("");
  const [eventosData, setEventosData]       = useState<Evento[]>([]);
  const [edificios, setEdificios]           = useState<Edificio[]>([]);
  const [aulas, setAulas]                   = useState<Aula[]>([]);
  const [profesores, setProfesores]         = useState<Profesor[]>([]);
  const [usuarios, setUsuarios]             = useState<Usuario[]>([]);
  const [loading, setLoading]               = useState(true);
  const [modalError, setModalError]         = useState("");
  const [toast, setToast]                   = useState<ToastItem | null>(null);
  const [isOnline, setIsOnline]             = useState(navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  const emptyAdd = {
    name_event: "", id_building: "", id_aula: "", planta_event: "",
    timedate_event: "", timedate_end: "", id_profe: "", id_user: "",
    descrip_event: "", img_event: "", capacidad_esperada: "0", prioridad: "1",
  };

  const [showAddModal, setShowAddModal]   = useState(false);
  const [addForm, setAddForm]             = useState(emptyAdd);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id_event: 0, name_event: "", id_building: "", id_aula: "", planta_event: "",
    timedate_event: "", timedate_end: "", id_profe: "", id_user: "",
    descrip_event: "", img_event: "", capacidad_esperada: "0", prioridad: "1",
    google_event_id: null as string | null,
  });

  const showToast = (message: string, type: ToastType) => setToast({ message, type });

  useEffect(() => {
    if (gcal.errorMsg && gcal.status === "error") showToast(gcal.errorMsg, "calendar_error");
  }, [gcal.errorMsg, gcal.status]);

  const fetchEventos = () =>
    fetch(`${import.meta.env.VITE_API_URL}/eventos`)
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then(d => { setEventosData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { console.error("fetchEventos:", e); setEventosData([]); setLoading(false); });

  const fetchProfesores = async () => {
    try {
      const [profRes, userRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/profesores`),
        fetch(`${import.meta.env.VITE_API_URL}/usuarios`)
      ]);
      const profesData   = await profRes.json();
      const usuariosData = await userRes.json();

      const profesNormalizados = (Array.isArray(profesData) ? profesData : []).map((p: any) => ({
        id_profe:     String(p.id_profe),
        nombre_profe: p.nombre_profe ?? "Sin nombre",
        id_user:      p.id_user ?? null,
        email_profe:  p.email_profe ?? null,
      }));

      const idsExistentes = new Set(profesNormalizados.map((p: any) => p.id_user).filter(Boolean));

      const usuariosProfes = (Array.isArray(usuariosData) ? usuariosData : [])
        .filter((u: any) => u.id_rol === 4 && !idsExistentes.has(u.id_user))
        .map((u: any) => ({
          id_profe:     `local-${u.id_user}`,
          nombre_profe: u.name_user,
          id_user:      u.id_user,
          email_profe:  u.email_user,
        }));

      setProfesores([...profesNormalizados, ...usuariosProfes]);
    } catch (error) {
      console.error("Error cargando profesores:", error);
    }
  };

  useEffect(() => {
    fetchEventos();
    fetch(`${import.meta.env.VITE_API_URL}/edificios`).then(r => r.json()).then(d => setEdificios(Array.isArray(d) ? d : [])).catch(console.error);
    fetch(`${import.meta.env.VITE_API_URL}/aulas`).then(r => r.json()).then(d => setAulas(Array.isArray(d) ? d : [])).catch(console.error);
    fetchProfesores();
    fetch(`${import.meta.env.VITE_API_URL}/usuarios`)
      .then(r => r.json())
      .then(d => setUsuarios(Array.isArray(d) ? d.filter((u: any) => u.id_rol === 2) : []))
      .catch(console.error);

    const syncPending = async () => {
      const pending = JSON.parse(localStorage.getItem("pending_eventos") || "[]");
      if (pending.length === 0) return;
      try {
        for (const ev of pending)
          await fetch(`${import.meta.env.VITE_API_URL}/eventos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ev) });
        localStorage.removeItem("pending_eventos");
        fetchEventos();
      } catch (err) { console.error("Error sincronizando eventos pendientes", err); }
    };

    syncPending();
    window.addEventListener("online", syncPending);
    return () => window.removeEventListener("online", syncPending);
  }, []);

  const getNombreEdificio = (ev: Evento) =>
    ev.edificios?.name_building
    ?? edificios.find(ed => ed.id_building === ev.id_building)?.name_building
    ?? (ev.id_building ? `Edificio ${ev.id_building}` : "—");

  const getPlanta = (ev: Evento): string | null =>
    ev.aulas?.planta ?? aulas.find(a => a.id_aula === ev.id_aula)?.planta ?? null;

  const getCapacidadAula = (ev: Evento): number =>
    ev.aulas?.capacidad ?? aulas.find(a => a.id_aula === ev.id_aula)?.capacidad ?? ev.capacidad_esperada ?? 0;

  // 👇 Busca también por id_user para profesores locales como Yanny
  const getNombreProfesor = (ev: Evento) =>
    ev.profesor?.nombre_profe
    ?? profesores.find(p => String(p.id_profe) === String(ev.id_profe))?.nombre_profe
    ?? profesores.find(p => p.id_user === ev.id_user)?.nombre_profe
    ?? (ev.id_profe ? `Profesor ${ev.id_profe}` : "—");


  const handleLogout = () => { clearSession(); navigate("/", { replace: true }); };

  const filteredEventos = (Array.isArray(eventosData) ? eventosData : []).filter(e =>
    e.name_event?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const buildBody = (form: typeof addForm | typeof editForm) => ({
    name_event:         form.name_event || null,
    id_building:        form.id_building ? parseInt(form.id_building) : null,
    id_aula:            form.id_aula     ? parseInt(form.id_aula)     : null,
    timedate_event:     form.timedate_event || null,
    timedate_end:       form.timedate_end   || null,
    id_profe:           form.id_profe && !form.id_profe.startsWith("local-")
                          ? parseInt(form.id_profe) : null,
    id_user_profe:      form.id_profe?.startsWith("local-")
                          ? form.id_profe.replace("local-", "") : null,
    id_user:            form.id_user || null,
    descrip_event:      (form as any).descrip_event || null,
    img_event:          (form as any).img_event     || null,
    capacidad_esperada: parseInt(form.capacidad_esperada) || 0,
    prioridad: 1,
  });

  const validateForm = (form: typeof addForm | typeof editForm): string => {
    if (!form.name_event.trim())  return "El nombre del evento es obligatorio.";
    if (!form.timedate_event)     return "La fecha y hora de inicio son obligatorias.";
    if (!form.timedate_end)       return "La fecha y hora de fin son obligatorias.";
    if (!form.id_building)        return "Debes seleccionar un edificio.";
    if (!form.id_profe)           return "Debes seleccionar un profesor.";
    if (!form.id_user)            return "Debes seleccionar un usuario.";
    if ((form as any).img_event && !/\.(jpg|jpeg|png)$/i.test((form as any).img_event))
      return "La URL de la imagen debe terminar en .jpg, .jpeg o .png";
    if (form.timedate_event && form.timedate_event < new Date().toISOString().slice(0, 16))
      return "La fecha de inicio no puede ser en el pasado.";
    if (form.timedate_end && form.timedate_end < new Date().toISOString().slice(0, 16))
      return "La fecha de fin no puede ser en el pasado.";
    if (form.timedate_end && form.timedate_event && form.timedate_end <= form.timedate_event)
      return "La hora de fin debe ser posterior a la de inicio.";
    return "";
  };

  const handleAddSubmit = async () => {
    setModalError("");
    const err = validateForm(addForm);
    if (err) { setModalError(err); return; }
    const body = buildBody(addForm);

    if (!navigator.onLine) {
      const pending = JSON.parse(localStorage.getItem("pending_eventos") || "[]");
      pending.push(body);
      localStorage.setItem("pending_eventos", JSON.stringify(pending));
      setShowAddModal(false); setAddForm(emptyAdd);
      alert("Sin conexión. El evento se guardará y enviará automáticamente cuando vuelva la conexión.");
      return;
    }

    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/eventos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        if (data.reasignaciones?.length > 0) {
          const r = data.reasignaciones[0];
          if (r.reasignado) setTimeout(() => showToast(`"${r.evento_movido}" fue movido a ${r.nombre_edificio_nuevo} por conflicto de prioridad.`, "displaced"), 150);
        }
        if (data.warning) setTimeout(() => showToast(data.warning, detectWarningType(data.warning)), 150);
        if (data.email_enviado) {
          const profe = profesores.find(p => String(p.id_profe) === String(addForm.id_profe));
          setTimeout(() => showToast(`Invitación enviada automáticamente a ${profe?.email_profe ?? "el profesor"}.`, "email_success"), 300);
        }
        if (gcal.isSignedIn && addForm.timedate_event) {
          const edificioNombre   = edificios.find(e => e.id_building === parseInt(addForm.id_building))?.name_building;
          const aulaSeleccionada = aulas.find(a => a.id_aula === parseInt(addForm.id_aula));
          const googleId         = await gcal.saveEvent({
            name_event: addForm.name_event, timedate_event: addForm.timedate_event,
            timedate_end_event: addForm.timedate_end || null, name_building: edificioNombre ?? null,
            planta_event: aulaSeleccionada?.planta ?? null, capacidad_event: parseInt(addForm.capacidad_esperada) || 0,
          });
          if (googleId)           showToast(`"${addForm.name_event}" agregado a tu Google Calendar.`, "calendar_success");
          else if (gcal.errorMsg) showToast(gcal.errorMsg, "calendar_error");
        }
        setAddForm(emptyAdd);
        fetchEventos();
      } else {
        setModalError(data.detail || data.mensaje || "Error al agregar evento");
      }
    } catch { setModalError("No se pudo conectar con el servidor"); }
  };

  const openEditModal = (ev: Evento) => {
    setModalError("");
    setEditForm({
      id_event:           ev.id_event,
      name_event:         ev.name_event || "",
      id_building:        ev.id_building ? String(ev.id_building) : "",
      id_aula:            ev.id_aula     ? String(ev.id_aula)     : "",
      planta_event:       ev.aulas?.planta ?? aulas.find(a => a.id_aula === ev.id_aula)?.planta ?? "",
      timedate_event:     ev.timedate_event ? ev.timedate_event.slice(0, 16) : "",
      timedate_end:       ev.timedate_end   ? ev.timedate_end.slice(0, 16)   : "",
      id_profe:           ev.id_profe ? String(ev.id_profe) : "",
      id_user:            ev.id_user  || "",
      descrip_event:      ev.descrip_event || "",
      img_event:          ev.img_event     || "",
      capacidad_esperada: String(ev.capacidad_esperada ?? 0),
      prioridad:          String(ev.prioridad ?? 1),
      google_event_id:    ev.google_event_id ?? null,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setModalError("");
    const err = validateForm(editForm);
    if (err) { setModalError(err); return; }
    const body = buildBody(editForm);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/eventos/${editForm.id_event}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        if (data.warning) setTimeout(() => showToast(data.warning, detectWarningType(data.warning)), 150);
        if (gcal.isSignedIn && editForm.google_event_id && editForm.timedate_event) {
          const edificioNombre   = edificios.find(e => e.id_building === parseInt(editForm.id_building))?.name_building;
          const aulaSeleccionada = aulas.find(a => a.id_aula === parseInt(editForm.id_aula));
          const ok               = await gcal.updateEvent(editForm.google_event_id, {
            name_event: editForm.name_event, timedate_event: editForm.timedate_event,
            timedate_end_event: editForm.timedate_end || null, name_building: edificioNombre ?? null,
            planta_event: aulaSeleccionada?.planta ?? null, capacidad_event: parseInt(editForm.capacidad_esperada) || 0,
          });
          if (ok)                 showToast(`"${editForm.name_event}" actualizado en Google Calendar.`, "calendar_success");
          else if (gcal.errorMsg) showToast(gcal.errorMsg, "calendar_error");
        }
        fetchEventos();
      } else { setModalError(data.detail || data.mensaje || "Error al editar evento"); }
    } catch { setModalError("No se pudo conectar con el servidor"); }
  };

  const handleSaveToCalendar = async (ev: Evento) => {
    const googleId = await gcal.saveEvent({
      name_event: ev.name_event, timedate_event: ev.timedate_event ?? "",
      timedate_end_event: ev.timedate_end, name_building: getNombreEdificio(ev),
      planta_event: getPlanta(ev), capacidad_event: ev.capacidad_esperada,
    });
    if (googleId)           showToast(`"${ev.name_event}" guardado en tu Google Calendar.`, "calendar_success");
    else if (gcal.errorMsg) showToast(gcal.errorMsg, "calendar_error");
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar el evento "${name}"?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/eventos/${id}`, { method: "DELETE" });
      if (res.ok) fetchEventos();
      else        alert("Error al eliminar el evento");
    } catch { alert("No se pudo conectar con el servidor"); }
  };

  const handleToggleStatus = async (ev: Evento) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/eventos/${ev.id_event}/toggle-status`, { method: "PATCH" });
      if (res.ok) fetchEventos();
    } catch { console.error("Error cambiando estado"); }
  };

  const ModalFields = (form: typeof addForm | typeof editForm, setForm: React.Dispatch<React.SetStateAction<any>>) => {
    const idBuilding       = form.id_building ? parseInt(form.id_building) : null;
    const idAula           = form.id_aula      ? parseInt(form.id_aula)     : null;
    const plantaActual     = (form as any).planta_event || "";
    const aulaSeleccionada = aulas.find(a => a.id_aula === idAula) ?? null;
    const imgUrl           = (form as any).img_event || "";
    const nowLocal         = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const plantasDisponibles = idBuilding ? [...new Set(aulas.filter(a => a.disponible && a.id_building === idBuilding && a.planta).map(a => a.planta!.toLowerCase()))] : [];
    const aulasFiltradas     = aulas.filter(a => a.disponible && (!idBuilding || a.id_building === idBuilding) && (!plantaActual || a.planta?.toLowerCase() === plantaActual));
    const capMaxPlanta       = plantaActual && idBuilding ? Math.max(0, ...aulas.filter(a => a.id_building === idBuilding && a.planta?.toLowerCase() === plantaActual).map(a => a.capacidad)) : null;
    const capVal             = parseInt(form.capacidad_esperada) || 0;
    const overCap            = aulaSeleccionada ? capVal > aulaSeleccionada.capacidad : false;
    const plantaCfgSel       = PLANTA_BTN[aulaSeleccionada?.planta?.toLowerCase() ?? ""] ?? null;
    const profeSeleccionado  = form.id_profe ? profesores.find(p => String(p.id_profe) === String(form.id_profe)) ?? null : null;

    return (
      <>
        <span style={labelStyle}>Nombre del evento *</span>
        <input style={{ ...inputStyle, borderColor: !(form as any).name_event?.trim() && modalError ? "#ef4444" : "#d1d5db" }} placeholder="Nombre del evento" value={form.name_event} onChange={e => setForm((p: any) => ({ ...p, name_event: e.target.value }))} />

        <span style={labelStyle}>Descripción</span>
        <input style={inputStyle} placeholder="Descripción (opcional)" value={(form as any).descrip_event || ""} onChange={e => setForm((p: any) => ({ ...p, descrip_event: e.target.value }))} />

        <span style={labelStyle}>URL de imagen (opcional)</span>
        <input style={{ ...inputStyle, borderColor: imgUrl && !/\.(jpg|jpeg|png)$/i.test(imgUrl) ? "#ef4444" : "#d1d5db" }} placeholder="https://ejemplo.com/imagen.jpg" value={imgUrl} onChange={e => setForm((p: any) => ({ ...p, img_event: e.target.value }))} />
        {imgUrl && !/\.(jpg|jpeg|png)$/i.test(imgUrl) && <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "-8px" }}>Solo se permiten imágenes con extensión .jpg, .jpeg o .png</span>}
        {imgUrl && /\.(jpg|jpeg|png)$/i.test(imgUrl) && (
          <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb", maxHeight: "120px" }}>
            <img src={imgUrl} alt="Preview" style={{ width: "100%", maxHeight: "120px", objectFit: "cover", display: "block" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}

        <span style={labelStyle}>Edificio *</span>
        <select style={inputStyle} value={form.id_building} onChange={e => setForm((p: any) => ({ ...p, id_building: e.target.value, planta_event: "", id_aula: "" }))}>
          <option value="">Seleccionar edificio</option>
          {edificios.map(ed => <option key={ed.id_building} value={ed.id_building}>{ed.name_building}</option>)}
        </select>

        {idBuilding && (
          <>
            <span style={labelStyle}>Planta</span>
            {plantasDisponibles.length === 0 ? (
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>No hay aulas registradas para este edificio.</span>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                {plantasDisponibles.map(p => {
                  const cfg    = PLANTA_BTN[p] ?? { label: `Planta ${p}`, color: "#6b7280", bg: "#f9fafb", dot: "#6b7280" };
                  const active = plantaActual === p;
                  const capMax = Math.max(0, ...aulas.filter(a => a.id_building === idBuilding && a.planta?.toLowerCase() === p).map(a => a.capacidad));
                  return (
                    <button key={p} type="button" onClick={() => setForm((prev: any) => ({ ...prev, planta_event: p, id_aula: "" }))}
                      style={{ flex: 1, padding: "9px 6px", borderRadius: "8px", cursor: "pointer", border: `2px solid ${active ? cfg.dot : "#e5e7eb"}`, backgroundColor: active ? cfg.bg : "#f9fafb", color: cfg.color, fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.15s" }}>
                      <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: cfg.dot }} />
                      {cfg.label}
                      <span style={{ fontSize: "11px", fontWeight: 400, color: active ? cfg.color : "#9ca3af" }}>hasta {capMax} p.</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {plantaActual && (
          <>
            <span style={labelStyle}>Aula</span>
            <select style={inputStyle} value={form.id_aula} onChange={e => setForm((p: any) => ({ ...p, id_aula: e.target.value }))}>
              <option value="">Sin aula asignada</option>
              {aulasFiltradas.map(a => <option key={a.id_aula} value={a.id_aula}>{a.nombre_aula}{a.codigo_aula ? ` (${a.codigo_aula})` : ""} — {a.tipo_aula ?? "Aula"} | {a.capacidad} personas</option>)}
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
        <input style={inputStyle} type="datetime-local" value={form.timedate_event} min={nowLocal} onChange={e => setForm((p: any) => ({ ...p, timedate_event: e.target.value }))} />

        <span style={labelStyle}>Fecha y hora de fin *</span>
        <input style={{ ...inputStyle, borderColor: form.timedate_end && form.timedate_event && form.timedate_end <= form.timedate_event ? "#ef4444" : "#d1d5db" }} type="datetime-local" value={form.timedate_end} min={form.timedate_event || nowLocal} onChange={e => setForm((p: any) => ({ ...p, timedate_end: e.target.value }))} />
        {form.timedate_end && form.timedate_event && form.timedate_end <= form.timedate_event && <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "-8px" }}>La hora de fin debe ser posterior a la de inicio.</span>}

        <span style={labelStyle}>Capacidad esperada (personas)</span>
        <input style={{ ...inputStyle, borderColor: overCap ? "#ef4444" : "#d1d5db" }} type="number" min="0" placeholder={aulaSeleccionada ? `Máx. ${aulaSeleccionada.capacidad}` : capMaxPlanta ? `Máx. ${capMaxPlanta}` : "Ej: 50"} value={form.capacidad_esperada} onChange={e => setForm((p: any) => ({ ...p, capacidad_esperada: e.target.value }))} />
        {overCap && <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "-8px" }}>⚠️ Excede la capacidad del aula ({aulaSeleccionada!.capacidad} personas).</span>}

        <span style={labelStyle}>Profesor *</span>
        <select style={inputStyle} value={form.id_profe} onChange={e => setForm((p: any) => ({ ...p, id_profe: e.target.value }))}>
          <option value="">Seleccionar profesor</option>
          {profesores.map(pr => <option key={`profe-${pr.id_profe}`} value={pr.id_profe}>{pr.nombre_profe}{pr.email_profe ? " ✓" : " ⚠"}</option>)}
        </select>

        {profeSeleccionado && (
          profeSeleccionado.email_profe ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #86efac", fontSize: "13px", color: "#14532d" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>Invitación enviada automáticamente a <strong>{profeSeleccionado.email_profe}</strong></span>
            </div>
          ) : (
            <div style={{ padding: "10px 14px", backgroundColor: "#fffbeb", borderRadius: "8px", border: "1px solid #fcd34d", fontSize: "13px", color: "#92400e" }}>
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>⚠️ Sin correo vinculado — no se enviará invitación</div>
              <div style={{ fontSize: "12px", color: "#78350f" }}>Ve al módulo de <strong>Profesores</strong> y vincula a <strong>{profeSeleccionado.nombre_profe}</strong> con su cuenta de usuario.</div>
            </div>
          )
        )}

        <span style={labelStyle}>Usuario *</span>
        <select style={inputStyle} value={form.id_user} onChange={e => setForm((p: any) => ({ ...p, id_user: e.target.value }))}>
          <option value="">Seleccionar usuario</option>
          {usuarios.map(u => <option key={u.id_user} value={u.id_user}>{u.name_user} — {u.email_user}</option>)}
        </select>
      </>
    );
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate("/Coordinador/dashboard")}>
            <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg></span>
            <span className="nav-text">Dashboard</span>
          </button>
          <button className="nav-item active" onClick={() => navigate("/Coordinador/eventos")}>
            <span className="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></span>
            <span className="nav-text">Eventos</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile" onClick={() => setShowLogoutMenu(!showLogoutMenu)}>
            <div className="user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <span className="user-name">{user?.name_user ?? "Coordinador"}</span>
            <span title={isOnline ? "Online" : "Offline"} style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: isOnline ? "#22c55e" : "#ef4444", flexShrink: 0, marginLeft: "auto", boxShadow: isOnline ? "0 0 0 2px rgba(34,197,94,0.25)" : "0 0 0 2px rgba(239,68,68,0.25)", transition: "background-color 0.3s, box-shadow 0.3s" }} />
          </div>
          {showLogoutMenu && (
            <div className="logout-menu">
              <button className="logout-btn" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
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
              <button className="btn-primary" onClick={() => { setModalError(""); setShowAddModal(true); }}>Agregar</button>
            </div>
            <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <GoogleCalendarButton isReady={gcal.isReady} isSignedIn={gcal.isSignedIn} status={gcal.status} onSignIn={gcal.signIn} onSignOut={gcal.signOut} />
              <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input type="text" placeholder="Buscar evento por nombre" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
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
                    <th>Nombre</th><th>Edificio</th><th>Aula / Planta</th>
                    <th>Fecha y Hora</th><th>Prioridad</th><th>Profesor</th>
                    <th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEventos.map(ev => (
                    <tr key={ev.id_event}>
                      <td className="cell-name">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {ev.img_event && <img src={ev.img_event} alt="" style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                          {ev.name_event || "Sin nombre"}
                        </div>
                      </td>
                      <td>{getNombreEdificio(ev)}</td>
                      <td><PlantaCell planta={getPlanta(ev)} capacidad={getCapacidadAula(ev)} /></td>
                      <td><FechaCell inicio={ev.timedate_event} fin={ev.timedate_end} /></td>
                      <td><SemaforoBadge nivel={ev.prioridad ?? 1} /></td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span>{getNombreProfesor(ev)}</span>
                          {(() => {
                            const profe = profesores.find(p => String(p.id_profe) === String(ev.id_profe))
                                       ?? profesores.find(p => p.id_user === ev.id_user);
                            if (!profe) return null;
                            return profe.email_profe ? (
                              <span style={{ fontSize: "11px", color: "#16a34a", display: "flex", alignItems: "center", gap: "3px" }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                {profe.email_profe}
                              </span>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#f59e0b" }}>⚠ Sin correo</span>
                            );
                          })()}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${ev.status_event === 0 ? "status-inactive" : "status-active"}`}>
                          {ev.status_event === 0 ? "Inactivo" : "Activo"}
                        </span>
                      </td>
                      <td className="cell-actions">
                        {gcal.isSignedIn && (
                          <button className="action-btn" title="Guardar en Google Calendar" onClick={() => handleSaveToCalendar(ev)}>
                            <GoogleCalIcon size={15} color="#1a73e8" />
                          </button>
                        )}
                        <button className="action-btn" title="Editar" onClick={() => openEditModal(ev)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button className={`action-btn ${ev.status_event === 0 ? "action-btn-disabled" : ""}`} title="Toggle Status" onClick={() => handleToggleStatus(ev)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="5" width="22" height="14" rx="7" ry="7" /><circle cx={ev.status_event === 0 ? "8" : "16"} cy="12" r="3" /></svg>
                        </button>
                        <button className="action-btn" title="Eliminar" style={{ color: "#dc2626" }} onClick={() => handleDelete(ev.id_event, ev.name_event)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
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

      {showAddModal && (
        <div style={modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Agregar Evento</h3>
            {modalError && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>{modalError}</div>}
            {ModalFields(addForm, setAddForm)}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "4px" }}>
              <button className="btn-filter" onClick={() => { setShowAddModal(false); setAddForm(emptyAdd); }}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddSubmit}>{gcal.isSignedIn ? "Guardar y añadir a Calendar" : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Editar Evento</h3>
            {modalError && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px" }}>{modalError}</div>}
            {ModalFields(editForm, setEditForm)}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "4px" }}>
              <button className="btn-filter" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleEditSubmit}>{gcal.isSignedIn && editForm.google_event_id ? "Guardar y actualizar Calendar" : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <WarningToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default CoordinadorEventos;