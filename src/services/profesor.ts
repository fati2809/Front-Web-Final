import { supabase } from "../config/supabase";
import { getSession } from "./auth";

export const getEventosProfesor = async () => {
  const { user } = getSession();

  if (!user) throw new Error("No hay sesión");

  // 🔹 1. Obtener el profesor del usuario
  const { data: profe, error: errorProfe } = await supabase
    .from("profesor")
    .select("id_profe")
    .eq("id_user", user.id_user)
    .maybeSingle(); // 👈 evita error si no existe

  if (errorProfe) {
    console.error("Error obteniendo profesor:", errorProfe);
    throw errorProfe;
  }

  if (!profe) {
    throw new Error("Este usuario no tiene perfil de profesor");
  }

  // 🔹 2. Obtener eventos del profesor (FORZANDO RELACIONES)
  const { data, error } = await supabase
    .from("eventos")
    .select(`
      id_event,
      name_event,
      timedate_event,
      status_event,
      edificios!eventos_id_building_fkey ( name_building ),
      aulas!eventos_id_aula_fkey ( nombre_aula )
    `)
    .eq("id_profe", profe.id_profe);

  if (error) {
    console.error("Error en eventos profesor:", error);
    throw error;
  }

  // 🔹 3. Formatear datos (seguro contra null)
  return (data || []).map((e: any) => ({
    id_event: e.id_event,
    name_event: e.name_event,
    timedate_event: e.timedate_event,
    status_event: e.status_event,
    name_building: e.edificios?.name_building || "Sin edificio",
    nombre_aula: e.aulas?.nombre_aula || "Sin aula",
  }));
};
