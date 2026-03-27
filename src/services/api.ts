import { supabase } from "../config/supabase";

const API_URL = "https://maposting-backend.onrender.com";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    // Obtener token de Supabase automáticamente
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    // 🔥 Solo manejar errores HTTP (no de red)
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Error en la API" }));

      throw new Error(error.detail || "Error en la API");
    }

    return response.json();
  } catch (error: any) {
    // 🔥 CLAVE: detectar error de red (offline)
    if (error instanceof TypeError) {
      console.log("📴 Sin conexión, request manejada por Service Worker");

      // 👉 IMPORTANTE: relanzar el error para que Workbox lo capture
      throw error;
    }

    // Otros errores (backend)
    throw error;
  }
}

export { API_URL };