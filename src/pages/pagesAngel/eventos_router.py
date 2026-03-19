from fastapi import APIRouter, HTTPException
from database import get_db_connection
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class EventoCreate(BaseModel):
    name_event: str
    id_building: Optional[int] = None
    planta_event: Optional[str] = "baja"
    timedate_event: Optional[datetime] = None
    timedate_end_event: Optional[datetime] = None
    id_profe: Optional[int] = None
    id_user: Optional[int] = None
    capacidad_event: Optional[int] = 0
    prioridad_event: Optional[int] = 1

class EventoUpdate(BaseModel):
    name_event: Optional[str] = None
    id_building: Optional[int] = None
    planta_event: Optional[str] = None
    timedate_event: Optional[datetime] = None
    timedate_end_event: Optional[datetime] = None
    id_profe: Optional[int] = None
    id_user: Optional[int] = None
    capacidad_event: Optional[int] = None
    prioridad_event: Optional[int] = None


def get_capacidad_planta(cursor, id_building: int, planta: str) -> int:
    """Devuelve la capacidad de la planta indicada para el edificio dado."""
    col = "capacidad_planta_baja" if planta == "baja" else "capacidad_planta_alta"
    cursor.execute(f"SELECT {col} AS cap FROM edificios WHERE id_building = %s", (id_building,))
    row = cursor.fetchone()
    return row["cap"] if row else 0


def check_conflict(cursor, id_building: int, timedate, exclude_event_id: int = None) -> bool:
    if exclude_event_id:
        cursor.execute("""
            SELECT id_event FROM eventos
            WHERE id_building = %s AND timedate_event = %s
              AND status_event = 1 AND id_event != %s LIMIT 1
        """, (id_building, timedate, exclude_event_id))
    else:
        cursor.execute("""
            SELECT id_event FROM eventos
            WHERE id_building = %s AND timedate_event = %s
              AND status_event = 1 LIMIT 1
        """, (id_building, timedate))
    return cursor.fetchone() is not None


def find_available_building(cursor, exclude_building_id: int, capacidad_requerida: int, timedate, planta: str = "baja"):
    """
    Busca edificio alternativo con capacidad suficiente en la planta específica
    (baja o alta), no en la suma de ambas.
    """
    col_cap = "capacidad_planta_baja" if planta == "baja" else "capacidad_planta_alta"
    cursor.execute(f"""
        SELECT e.id_building, e.name_building,
               e.{col_cap} AS capacidad_planta
        FROM edificios e
        WHERE e.id_building != %s
          AND e.{col_cap} >= %s
          AND e.id_building NOT IN (
              SELECT ev.id_building FROM eventos ev
              WHERE ev.timedate_event = %s AND ev.status_event = 1
          )
        ORDER BY e.{col_cap} ASC LIMIT 1
    """, (exclude_building_id, capacidad_requerida, timedate))
    return cursor.fetchone()


@router.get("/eventos")
async def get_eventos():
    db = get_db_connection()
    if not db:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT ev.id_event, ev.name_event, ev.id_building, ev.timedate_event,
               ev.timedate_end_event,
               ev.status_event, ev.id_profe, ev.id_user,
               ev.capacidad_event, ev.prioridad_event,
               COALESCE(ev.planta_event, 'baja') AS planta_event,
               ed.name_building,
               COALESCE(ed.capacidad_planta_baja, 0) AS capacidad_planta_baja,
               COALESCE(ed.capacidad_planta_alta, 0) AS capacidad_planta_alta
        FROM eventos ev
        LEFT JOIN edificios ed ON ev.id_building = ed.id_building
        ORDER BY ev.id_event ASC
    """)
    eventos = cursor.fetchall()
    cursor.close()
    db.close()
    for e in eventos:
        if e["timedate_event"]:
            e["timedate_event"] = str(e["timedate_event"])
        if e["timedate_end_event"]:
            e["timedate_end_event"] = str(e["timedate_end_event"])
    return eventos


@router.post("/eventos")
async def create_evento(data: EventoCreate):
    db = get_db_connection()
    if not db:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = db.cursor(dictionary=True)
    planta = data.planta_event or "baja"

    # ── Validar capacidad vs planta ────────────────────────────────────────────
    if data.id_building and data.capacidad_event:
        cap_planta = get_capacidad_planta(cursor, data.id_building, planta)
        if data.capacidad_event > cap_planta:
            cursor.close(); db.close()
            raise HTTPException(status_code=422, detail=(
                f"La capacidad requerida ({data.capacidad_event} personas) supera el límite "
                f"de la planta {planta} ({cap_planta} personas)."
            ))

    # ── Validar que la fecha de fin sea posterior al inicio ────────────────────
    if data.timedate_event and data.timedate_end_event:
        if data.timedate_end_event <= data.timedate_event:
            cursor.close(); db.close()
            raise HTTPException(status_code=422, detail=(
                "La fecha/hora de fin debe ser posterior a la de inicio."
            ))

    assigned_building = data.id_building
    warning_msg = None

    if data.id_building and data.timedate_event:
        if check_conflict(cursor, data.id_building, data.timedate_event):
            alternativo = find_available_building(
                cursor, data.id_building, data.capacidad_event or 0, data.timedate_event, planta
            )
            if not alternativo:
                cursor.close(); db.close()
                raise HTTPException(status_code=409, detail=(
                    f"El edificio seleccionado ya tiene un evento en ese horario "
                    f"y no hay alternativo con capacidad para {data.capacidad_event or 0} personas "
                    f"en planta {planta}."
                ))
            assigned_building = alternativo["id_building"]
            warning_msg = (
                f"El edificio solicitado ya estaba ocupado. "
                f"Asignado automáticamente a: {alternativo['name_building']} "
                f"(capacidad planta {planta}: {alternativo['capacidad_planta']} personas)."
            )

    cursor.execute("""
        INSERT INTO eventos
            (name_event, id_building, planta_event, timedate_event, timedate_end_event,
             status_event, id_profe, id_user, capacidad_event, prioridad_event)
        VALUES (%s, %s, %s, %s, %s, 1, %s, %s, %s, %s)
    """, (
        data.name_event, assigned_building, planta,
        data.timedate_event, data.timedate_end_event,
        data.id_profe, data.id_user,
        data.capacidad_event or 0, data.prioridad_event or 1
    ))
    db.commit()
    new_id = cursor.lastrowid
    cursor.close(); db.close()

    response = {"success": True, "id_event": new_id, "id_building_asignado": assigned_building}
    if warning_msg:
        response["warning"] = warning_msg
    return response


@router.put("/eventos/{id_event}")
async def update_evento(id_event: int, data: EventoUpdate):
    db = get_db_connection()
    if not db:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT id_building, timedate_event, timedate_end_event, capacidad_event, planta_event FROM eventos WHERE id_event = %s",
        (id_event,)
    )
    evento_actual = cursor.fetchone()
    if not evento_actual:
        cursor.close(); db.close()
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    target_building = data.id_building       if data.id_building       is not None else evento_actual["id_building"]
    target_time     = data.timedate_event     if data.timedate_event     is not None else evento_actual["timedate_event"]
    target_end      = data.timedate_end_event if data.timedate_end_event is not None else evento_actual["timedate_end_event"]
    target_cap      = data.capacidad_event    if data.capacidad_event    is not None else evento_actual["capacidad_event"]
    target_planta   = data.planta_event       if data.planta_event       is not None else evento_actual["planta_event"] or "baja"

    # ── Validar capacidad vs planta ────────────────────────────────────────────
    if target_building and target_cap:
        cap_planta = get_capacidad_planta(cursor, target_building, target_planta)
        if target_cap > cap_planta:
            cursor.close(); db.close()
            raise HTTPException(status_code=422, detail=(
                f"La capacidad requerida ({target_cap} personas) supera el límite "
                f"de la planta {target_planta} ({cap_planta} personas)."
            ))

    # ── Validar que la fecha de fin sea posterior al inicio ────────────────────
    if target_time and target_end:
        if target_end <= target_time:
            cursor.close(); db.close()
            raise HTTPException(status_code=422, detail=(
                "La fecha/hora de fin debe ser posterior a la de inicio."
            ))

    assigned_building = target_building
    warning_msg = None

    if target_building and target_time:
        if check_conflict(cursor, target_building, target_time, exclude_event_id=id_event):
            alternativo = find_available_building(
                cursor, target_building, target_cap or 0, target_time, target_planta
            )
            if not alternativo:
                cursor.close(); db.close()
                raise HTTPException(status_code=409, detail=(
                    f"El edificio seleccionado ya tiene un evento en ese horario "
                    f"y no hay alternativo con capacidad para {target_cap or 0} personas "
                    f"en planta {target_planta}."
                ))
            assigned_building = alternativo["id_building"]
            warning_msg = (
                f"El edificio solicitado ya estaba ocupado. "
                f"Reasignado automáticamente a: {alternativo['name_building']} "
                f"(capacidad planta {target_planta}: {alternativo['capacidad_planta']} personas)."
            )

    fields = ["id_building = %s"]
    values = [assigned_building]
    if data.name_event is not None:
        fields.append("name_event = %s"); values.append(data.name_event)
    if data.planta_event is not None:
        fields.append("planta_event = %s"); values.append(data.planta_event)
    if data.timedate_event is not None:
        fields.append("timedate_event = %s"); values.append(data.timedate_event)
    if data.timedate_end_event is not None:
        fields.append("timedate_end_event = %s"); values.append(data.timedate_end_event)
    if data.id_profe is not None:
        fields.append("id_profe = %s"); values.append(data.id_profe)
    if data.id_user is not None:
        fields.append("id_user = %s"); values.append(data.id_user)
    if data.capacidad_event is not None:
        fields.append("capacidad_event = %s"); values.append(data.capacidad_event)
    if data.prioridad_event is not None:
        fields.append("prioridad_event = %s"); values.append(data.prioridad_event)

    values.append(id_event)
    cursor.execute(f"UPDATE eventos SET {', '.join(fields)} WHERE id_event = %s", values)
    db.commit()
    cursor.close(); db.close()

    response = {"success": True, "id_building_asignado": assigned_building}
    if warning_msg:
        response["warning"] = warning_msg
    return response


@router.patch("/eventos/{id_event}/toggle-status")
async def toggle_status_evento(id_event: int):
    db = get_db_connection()
    if not db:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT status_event FROM eventos WHERE id_event = %s", (id_event,))
    evento = cursor.fetchone()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    nuevo_status = 0 if evento["status_event"] == 1 else 1
    cursor.execute("UPDATE eventos SET status_event = %s WHERE id_event = %s", (nuevo_status, id_event))
    db.commit()
    cursor.close(); db.close()
    return {"success": True, "nuevo_status": nuevo_status}


@router.delete("/eventos/{id_event}")
async def delete_evento(id_event: int):
    db = get_db_connection()
    if not db:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = db.cursor()
    cursor.execute("DELETE FROM eventos WHERE id_event = %s", (id_event,))
    db.commit()
    cursor.close(); db.close()
    return {"success": True}


@router.get("/profesores")
async def get_profesores():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id_profe, nombre_profe FROM profesor ORDER BY id_profe ASC")
    data = cursor.fetchall()
    cursor.close(); db.close()
    return data