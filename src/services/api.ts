import { supabase } from "../config/supabase";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Error en la API" }));

      throw new Error(error.detail || "Error en la API");
    }

    return response.json();
  } catch (error: any) {
    if (error instanceof TypeError) {
      console.log("📴 Sin conexión, request manejada por Service Worker");
      throw error;
    }
    throw error;
  }
}

export { API_URL };