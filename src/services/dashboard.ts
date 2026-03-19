import { apiFetch } from "./api";

export interface Stats {
  total_usuarios: number;
  total_eventos: number;
}

export interface GraficaData {
  usuarios?: Array<{ label: string; usuarios: number }>;
  eventos?: Array<{ label: string; eventos: number }>;
}

export interface Reporte {
  usuarios: Array<any>;
  eventos: Array<any>;
}

export function getStats(): Promise<Stats> {
  return apiFetch("/dashboard/stats");
}

export function getGrafica(
  periodo: "dia" | "semana" | "mes",
): Promise<GraficaData> {
  return apiFetch(`/dashboard/grafica?periodo=${periodo}`);
}

export function getReporte(): Promise<Reporte> {
  return apiFetch("/dashboard/reporte");
}
