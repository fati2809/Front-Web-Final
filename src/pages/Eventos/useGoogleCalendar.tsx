import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    gapi: {
      load: (lib: string, cb: () => void) => void;
      client: {
        init: (cfg: { discoveryDocs: string[] }) => Promise<void>;
        calendar: {
          events: {
            insert: (p: { calendarId: string; resource: GCalEvent }) => Promise<{ result: GCalResult }>;
            update: (p: { calendarId: string; eventId: string; resource: GCalEvent }) => Promise<{ result: GCalResult }>;
          };
        };
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (r: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

interface GCalEvent {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end:   { dateTime: string; timeZone: string };
}
interface GCalResult { id: string; htmlLink: string }

export interface EventoParaCalendar {
  name_event:         string;
  timedate_event:     string | Date;
  timedate_end_event?: string | Date | null;
  name_building?:     string | null;
  planta_event?:      string | null;
  capacidad_event?:   number | null;
}

export type CalendarStatus = "idle" | "loading" | "success" | "error";

export interface UseGoogleCalendarReturn {
  isReady:     boolean;
  isSignedIn:  boolean;
  status:      CalendarStatus;
  errorMsg:    string | null;
  signIn:      () => void;
  signOut:     () => void;
  saveEvent:   (ev: EventoParaCalendar) => Promise<string | null>;
  updateEvent: (googleEventId: string, ev: EventoParaCalendar) => Promise<boolean>;
}

// ── Configuración ─────────────────────────────────────────────────────────────
const CLIENT_ID      = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const ALLOWED_DOMAIN = "uteq.edu.mx";
const SCOPES         = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email";
const DISCOVERY      = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const TZ             = Intl.DateTimeFormat().resolvedOptions().timeZone;

function buildGCalEvent(ev: EventoParaCalendar): GCalEvent {
  const start = new Date(ev.timedate_event);
  const end   = ev.timedate_end_event
    ? new Date(ev.timedate_end_event)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const location = [
    ev.name_building,
    ev.planta_event ? `Planta ${ev.planta_event}` : null,
  ].filter(Boolean).join(" – ");

  const description = [
    ev.capacidad_event ? `👥 Capacidad: ${ev.capacidad_event} personas` : null,
    ev.planta_event    ? `🏢 Planta: ${ev.planta_event}`                : null,
  ].filter(Boolean).join("\n");

  return {
    summary:     ev.name_event,
    location:    location || undefined,
    description: description || undefined,
    start: { dateTime: start.toISOString(), timeZone: TZ },
    end:   { dateTime: end.toISOString(),   timeZone: TZ },
  };
}

async function getEmailFromToken(accessToken: string): Promise<string | null> {
  return fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then(r => r.json())
    .then(data => data.email ?? null)
    .catch(() => null);
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [isReady,    setIsReady]    = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [status,     setStatus]     = useState<CalendarStatus>("idle");
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  const tokenClientRef = useRef<{ requestAccessToken: (o?: { prompt?: string }) => void } | null>(null);
  const pendingRef     = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn("[useGoogleCalendar] Agrega VITE_GOOGLE_CLIENT_ID en .env.local");
      return;
    }

    let gapiReady = false;
    let gisReady  = false;

    const tryInit = () => {
      if (!gapiReady || !gisReady) return;

      window.gapi.client.init({ discoveryDocs: [DISCOVERY] }).then(() => {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope:     SCOPES,
          callback:  async (response) => {
            if (response.error) {
              setErrorMsg(`Error de autenticación: ${response.error}`);
              setStatus("error");
              return;
            }

            // ── Validar que el correo sea @uteq.edu.mx ────────────────────────
            const email = await getEmailFromToken(response.access_token!);
            if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
              setErrorMsg(`Acceso restringido. Solo cuentas @${ALLOWED_DOMAIN} pueden conectar Google Calendar.`);
              setStatus("error");
              return;
            }

            setIsSignedIn(true);
            setStatus("idle");
            setErrorMsg(null);

            if (pendingRef.current) {
              pendingRef.current();
              pendingRef.current = null;
            }
          },
        });
        setIsReady(true);
      });
    };

    const gapiScript  = document.createElement("script");
    gapiScript.src    = "https://apis.google.com/js/api.js";
    gapiScript.onload = () => {
      window.gapi.load("client", () => { gapiReady = true; tryInit(); });
    };

    const gisScript  = document.createElement("script");
    gisScript.src    = "https://accounts.google.com/gsi/client";
    gisScript.onload = () => { gisReady = true; tryInit(); };

    document.body.appendChild(gapiScript);
    document.body.appendChild(gisScript);

    return () => {
      document.body.removeChild(gapiScript);
      document.body.removeChild(gisScript);
    };
  }, []);

  const signIn = useCallback(() => {
    if (!tokenClientRef.current) return;
    tokenClientRef.current.requestAccessToken({ prompt: "consent" });
  }, []);

  const signOut = useCallback(() => {
    setIsSignedIn(false);
    setStatus("idle");
    setErrorMsg(null);
  }, []);

  const saveEvent = useCallback(async (ev: EventoParaCalendar): Promise<string | null> => {
    if (!isReady) return null;

    const doSave = async (): Promise<string | null> => {
      setStatus("loading");
      setErrorMsg(null);
      try {
        const res = await window.gapi.client.calendar.events.insert({
          calendarId: "primary",
          resource:   buildGCalEvent(ev),
        });
        setStatus("success");
        return res.result.id;
      } catch (err: any) {
        const msg = err?.result?.error?.message || "Error al guardar en Google Calendar";
        setErrorMsg(msg);
        setStatus("error");
        return null;
      }
    };

    if (!isSignedIn) {
      pendingRef.current = () => { doSave(); };
      signIn();
      return null;
    }
    return doSave();
  }, [isReady, isSignedIn, signIn]);

  const updateEvent = useCallback(async (googleEventId: string, ev: EventoParaCalendar): Promise<boolean> => {
    if (!isReady || !isSignedIn) return false;

    setStatus("loading");
    setErrorMsg(null);
    try {
      await window.gapi.client.calendar.events.update({
        calendarId: "primary",
        eventId:    googleEventId,
        resource:   buildGCalEvent(ev),
      });
      setStatus("success");
      return true;
    } catch (err: any) {
      const msg = err?.result?.error?.message || "Error al actualizar en Google Calendar";
      setErrorMsg(msg);
      setStatus("error");
      return false;
    }
  }, [isReady, isSignedIn]);

  return { isReady, isSignedIn, status, errorMsg, signIn, signOut, saveEvent, updateEvent };
}