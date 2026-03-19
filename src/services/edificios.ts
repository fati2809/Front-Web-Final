import { apiFetch } from "./api";

export interface Edificio {
  id_building: number;
  name_building: string;
  code_building?: string;
  imagen_url?: string;
  lat_building: number;
  lon_building: number;
  id_div?: number;
  name_div?: string;
}

export interface EdificioCreate {
  name_building: string;
  code_building?: string;
  imagen_url?: string;
  lat_building: number;
  lon_building: number;
  id_div?: number;
}

export interface EdificioUpdate {
  name_building?: string;
  code_building?: string;
  imagen_url?: string;
  lat_building?: number;
  lon_building?: number;
  id_div?: number;
}

export function getEdificios(): Promise<Edificio[]> {
  return apiFetch("/edificios");
}

export function createEdificio(data: EdificioCreate) {
  return apiFetch("/edificios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEdificio(id: number, data: EdificioUpdate) {
  return apiFetch(`/edificios/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteEdificio(id: number) {
  return apiFetch(`/edificios/${id}`, {
    method: "DELETE",
  });
}
