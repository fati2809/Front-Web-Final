import { apiFetch } from "./api";
import { supabase } from "../config/supabase";

export interface LoginCredentials {
  email_user: string;
  pass_user: string;
}

export interface RegisterData {
  name_user: string;
  email_user: string;
  pass_user: string;
  matricula_user: number;
  id_rol: number;
}

export interface User {
  id_user: string;
  name_user: string;
  email_user: string;
  matricula_user: number;
  id_rol: number;
  rol: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  session?: Session;
}

export function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return apiFetch("/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function register(data: RegisterData) {
  return apiFetch("/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logout() {
  return apiFetch("/logout", {
    method: "POST",
  });
}

export function resetPassword(email: string) {
  return apiFetch("/reset-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Guardar sesión en localStorage
export function saveSession(user: User, session?: Session) {
  localStorage.setItem("user", JSON.stringify(user));
  if (session) {
    localStorage.setItem("session", JSON.stringify(session));
  }
}

// Obtener sesión de localStorage
export function getSession(): { user: User | null; session: Session | null } {
  const userStr = localStorage.getItem("user");
  const sessionStr = localStorage.getItem("session");

  return {
    user: userStr ? JSON.parse(userStr) : null,
    session: sessionStr ? JSON.parse(sessionStr) : null,
  };
}

// Limpiar sesión
export function clearSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("session");
  localStorage.removeItem("token"); // Para compatibilidad
}

// ===== OAuth con Google =====

/**
 * Inicia sesión con Google usando OAuth
 * Redirige a Google para autenticación
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Obtiene la sesión actual de Supabase Auth
 * Se usa después del callback de OAuth
 */
export async function getSupabaseSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return session;
}

/**
 * Sincroniza el usuario de OAuth con la tabla usuarios del backend
 * Se llama después de autenticarse con Google
 */
export async function syncOAuthUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("No se pudo obtener el usuario de Supabase");
  }

  // Llamar al backend para sincronizar/crear usuario en tabla usuarios
  return apiFetch("/auth/oauth/sync", {
    method: "POST",
    body: JSON.stringify({
      id_user: user.id,
      email_user: user.email,
      name_user: user.user_metadata?.full_name || user.email?.split("@")[0],
      provider: user.app_metadata?.provider,
    }),
  });
}
