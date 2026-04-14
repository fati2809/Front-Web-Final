import { useState, useEffect, useCallback, useRef } from "react";

export interface NotifLocal {
  id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export function useNotificacionesEventos(intervaloMs = 20000) {
  const [notifs, setNotifs]     = useState<NotifLocal[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const isFirstRun              = useRef(true);

  // Lee las notificaciones guardadas en localStorage al montar
  useEffect(() => {
    const guardadas = JSON.parse(localStorage.getItem("admin_notifs") || "[]");
    setNotifs(guardadas);
    setNoLeidas(guardadas.filter((n: NotifLocal) => !n.leida).length);
  }, []);

  const guardarNotifs = (nuevas: NotifLocal[]) => {
    // Guarda solo las últimas 30 para no inflar el localStorage
    const recorte = nuevas.slice(0, 30);
    localStorage.setItem("admin_notifs", JSON.stringify(recorte));
    setNotifs(recorte);
    setNoLeidas(recorte.filter(n => !n.leida).length);
  };

  const checkEventosNuevos = useCallback(async () => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/eventos`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return;

      const ultimoIdVisto = parseInt(localStorage.getItem("ultimo_id_evento") || "0");
      const eventosNuevos = data.filter((ev: any) => ev.id_event > ultimoIdVisto);

      // Primera carga: solo marca el máximo sin notificar
      if (isFirstRun.current) {
        const maxId = Math.max(...data.map((ev: any) => ev.id_event));
        localStorage.setItem("ultimo_id_evento", String(maxId));
        isFirstRun.current = false;
        return;
      }

      if (eventosNuevos.length === 0) return;

      // Genera una notificación por cada evento nuevo
      const nuevasNotifs: NotifLocal[] = eventosNuevos.map((ev: any) => ({
        id:         `ev-${ev.id_event}`,
        titulo:     `📅 Nuevo evento creado`,
        mensaje:    `"${ev.name_event}" fue registrado${ev.edificios?.name_building ? ` en ${ev.edificios.name_building}` : ""}.`,
        leida:      false,
        created_at: ev.timedate_event ?? new Date().toISOString(),
      }));

      // Actualiza el último ID visto
      const nuevoMaxId = Math.max(...eventosNuevos.map((ev: any) => ev.id_event));
      localStorage.setItem("ultimo_id_evento", String(nuevoMaxId));

      // Merge con las notificaciones existentes
      const anteriores = JSON.parse(localStorage.getItem("admin_notifs") || "[]");
      guardarNotifs([...nuevasNotifs, ...anteriores]);

    } catch { /* silencioso */ }
  }, []);

  // Polling
  useEffect(() => {
    checkEventosNuevos(); // primera llamada inmediata
    const interval = setInterval(checkEventosNuevos, intervaloMs);
    return () => clearInterval(interval);
  }, [checkEventosNuevos, intervaloMs]);

  const marcarLeida = (id: string) => {
    const actualizadas = notifs.map(n => n.id === id ? { ...n, leida: true } : n);
    guardarNotifs(actualizadas);
  };

  const marcarTodasLeidas = () => {
    const actualizadas = notifs.map(n => ({ ...n, leida: true }));
    guardarNotifs(actualizadas);
  };

  const limpiar = () => {
    localStorage.removeItem("admin_notifs");
    setNotifs([]);
    setNoLeidas(0);
  };

  return { notifs, noLeidas, marcarLeida, marcarTodasLeidas, limpiar };
}