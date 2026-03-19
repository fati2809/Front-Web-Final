import { apiFetch } from "./api";

// ============================================================
// INTERFACES
// ============================================================

export interface Aula {
  id_aula: number;
  nombre_aula: string;
  codigo_aula?: string;
  id_building: number;
  planta?: string;
  capacidad: number;
  tipo_aula?: string;
  equipamiento?: Record<string, unknown>;
  disponible: boolean;
  created_at?: string;
  name_building?: string;
  code_building?: string;
}

export interface AulaCreate {
  nombre_aula: string;
  codigo_aula?: string;
  id_building: number;
  planta?: string;
  capacidad: number;
  tipo_aula?: string;
  equipamiento?: Record<string, unknown>;
  disponible?: boolean;
}

export interface AulaUpdate {
  nombre_aula?: string;
  codigo_aula?: string;
  id_building?: number;
  planta?: string;
  capacidad?: number;
  tipo_aula?: string;
  equipamiento?: Record<string, unknown>;
  disponible?: boolean;
}

export interface EventoAula {
  id_event: number;
  name_event: string;
  timedate_event: string;
  timedate_end?: string;
  status_event: number;
  capacidad_esperada: number;
  prioridad: number;
  profesor?: {
    nombre_profe: string;
  };
  usuarios?: {
    name_user: string;
    email_user: string;
  };
}

// ============================================================
// FUNCIONES API
// ============================================================

/**
 * Obtener todas las aulas
 */
export function getAulas(): Promise<Aula[]> {
  return apiFetch("/aulas");
}

/**
 * Obtener una aula específica
 */
export function getAula(id: number): Promise<Aula> {
  return apiFetch(`/aulas/${id}`);
}

/**
 * Obtener todas las aulas de un edificio
 * Útil para mostrar en el modal de edificios
 */
export function getAulasByEdificio(id_building: number): Promise<Aula[]> {
  return apiFetch(`/aulas/edificio/${id_building}`);
}

/**
 * Buscar aulas disponibles con filtros
 */
export function buscarAulasDisponibles(params?: {
  id_building?: number;
  planta?: string;
  capacidad_minima?: number;
  tipo_aula?: string;
  solo_disponibles?: boolean;
}): Promise<Aula[]> {
  const queryParams = new URLSearchParams();

  if (params?.id_building)
    queryParams.append("id_building", params.id_building.toString());
  if (params?.planta) queryParams.append("planta", params.planta);
  if (params?.capacidad_minima)
    queryParams.append("capacidad_minima", params.capacidad_minima.toString());
  if (params?.tipo_aula) queryParams.append("tipo_aula", params.tipo_aula);
  if (params?.solo_disponibles !== undefined)
    queryParams.append("solo_disponibles", params.solo_disponibles.toString());

  const query = queryParams.toString();
  return apiFetch(`/aulas/disponibles/buscar${query ? `?${query}` : ""}`);
}

/**
 * Crear una nueva aula
 */
export function createAula(data: AulaCreate) {
  return apiFetch("/aulas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Actualizar una aula existente
 */
export function updateAula(id: number, data: AulaUpdate) {
  return apiFetch(`/aulas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Alternar disponibilidad de un aula
 */
export function toggleDisponibilidadAula(id: number) {
  return apiFetch(`/aulas/${id}/toggle-disponibilidad`, {
    method: "PATCH",
  });
}

/**
 * Eliminar un aula
 */
export function deleteAula(id: number) {
  return apiFetch(`/aulas/${id}`, {
    method: "DELETE",
  });
}

/**
 * Obtener eventos de un aula
 */
export function getEventosAula(id: number): Promise<EventoAula[]> {
  return apiFetch(`/aulas/${id}/eventos`);
}
