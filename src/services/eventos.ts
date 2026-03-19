import { apiFetch } from "./api";

export interface Evento {
  id_event: number;
  name_event: string;
  id_building: number;
  timedate_event: string;
  status_event: number;
  id_profe: number;
  id_user: string;
}

export interface EventoCreate {
  name_event: string;
  id_building?: number;
  timedate_event?: string;
  id_profe?: number;
  id_user?: string;
}

export interface EventoUpdate {
  name_event?: string;
  id_building?: number;
  timedate_event?: string;
  id_profe?: number;
  id_user?: string;
}

export interface Profesor {
  id_profe: number;
  nombre_profe: string;
}

export function getEventos(): Promise<any[]> {
  return apiFetch("/eventos");
}

export function createEvento(data: EventoCreate) {
  return apiFetch("/eventos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEvento(id: number, data: EventoUpdate) {
  return apiFetch(`/eventos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteEvento(id: number) {
  return apiFetch(`/eventos/${id}`, {
    method: "DELETE",
  });
}

export function toggleStatusEvento(id: number) {
  return apiFetch(`/eventos/${id}/toggle-status`, {
    method: "PATCH",
  });
}

export function getProfesores(): Promise<Profesor[]> {
  return apiFetch("/profesores");
}
