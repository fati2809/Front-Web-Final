import { apiFetch } from "./api";

export interface Division {
  id_div: number;
  name_div: string;
  code_div?: string;
  total_profesores?: number;
  total_edificios?: number;
}

export interface DivisionCreate {
  name_div: string;
}

export interface DivisionUpdate {
  name_div: string;
}

export function getDivisionesAll(): Promise<Division[]> {
  return apiFetch("/divisiones-all");
}

export function getDivisiones(): Promise<Division[]> {
  return apiFetch("/divisiones");
}

export function createDivision(data: DivisionCreate) {
  return apiFetch("/divisiones", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateDivision(id: number, data: DivisionUpdate) {
  return apiFetch(`/divisiones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteDivision(id: number) {
  return apiFetch(`/divisiones/${id}`, {
    method: "DELETE",
  });
}
