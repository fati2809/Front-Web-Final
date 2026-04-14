import { useState, useRef, useEffect } from "react";
import { useNotificacionesEventos } from "../pages/useNotificacionesEventos";
import type { NotifLocal } from "../pages/useNotificacionesEventos";

export function NotificacionesBell() {
  const { notifs, noLeidas, marcarLeida, marcarTodasLeidas, limpiar } = useNotificacionesEventos();
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  // Cierra al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });

  return (
    <div ref={ref} style={{ position: "relative" }}>

      {/* Botón campana */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: "relative", background: "none", border: "none",
          cursor: "pointer", padding: "6px", borderRadius: "8px",
          color: "#6b7280", display: "flex", alignItems: "center" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {noLeidas > 0 && (
          <span style={{
            position: "absolute", top: "2px", right: "2px",
            width: "17px", height: "17px", borderRadius: "50%",
            backgroundColor: "#ef4444", color: "#fff",
            fontSize: "10px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff",
          }}>
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: "340px", background: "#fff", borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb",
          zIndex: 1500, overflow: "hidden",
        }}>

          {/* Header del dropdown */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>
              Notificaciones {noLeidas > 0 && (
                <span style={{ marginLeft: "6px", padding: "1px 7px", borderRadius: "999px",
                  backgroundColor: "#fee2e2", color: "#dc2626", fontSize: "11px" }}>
                  {noLeidas} nuevas
                </span>
              )}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {noLeidas > 0 && (
                <button onClick={marcarTodasLeidas}
                  style={{ fontSize: "11px", color: "#3b82f6", background: "none",
                    border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Marcar todas
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={limpiar}
                  style={{ fontSize: "11px", color: "#9ca3af", background: "none",
                    border: "none", cursor: "pointer" }}>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifs.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center",
                color: "#9ca3af", fontSize: "13px" }}>
                Sin notificaciones por ahora
              </div>
            ) : notifs.map((n: NotifLocal) => (
              <div key={n.id}
                onClick={() => marcarLeida(n.id)}
                style={{
                  padding: "12px 16px", borderBottom: "1px solid #f9fafb",
                  backgroundColor: n.leida ? "#fff" : "#f0f9ff",
                  cursor: "pointer", transition: "background 0.15s",
                  display: "flex", gap: "10px", alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>📅</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: n.leida ? 400 : 700,
                    color: "#111827", marginBottom: "2px" }}>
                    {n.titulo}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {n.mensaje}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                    {fmt(n.created_at)}
                  </div>
                </div>
                {!n.leida && (
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%",
                    backgroundColor: "#3b82f6", flexShrink: 0, marginTop: "4px" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}