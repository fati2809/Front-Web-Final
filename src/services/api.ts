import { supabase } from "../config/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    // Obtener token de Supabase automáticamente
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Error en la API" }));
      throw new Error(error.detail || "Error en la API");
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("No se pudo conectar con el servidor");
  }
}

export { API_URL };
