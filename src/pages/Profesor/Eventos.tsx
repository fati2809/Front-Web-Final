import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../../services/auth";
import { getEventosProfesor } from "../../services/profesor";
import { useGoogleCalendar } from "../Eventos/useGoogleCalendar"; // 👈 IMPORT

/* 🔵 ICONO GOOGLE */
function GoogleCalIcon({ size = 16, color = "#1a73e8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" />
      <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" />
      <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <text x="12" y="19" textAnchor="middle" fontSize="8" fill={color}>G</text>
    </svg>
  );
}

function ProfesorEventos() {
  const navigate = useNavigate();
  const { user } = getSession();
  const gcal = useGoogleCalendar(); // 👈 HOOK

  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      const data = await getEventosProfesor();
      setEventos(data);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  /* 🔵 GUARDAR EN GOOGLE CALENDAR */
  const handleSaveToCalendar = async (ev: any) => {
    if (!gcal.isSignedIn) return;

    const googleId = await gcal.saveEvent({
      name_event: ev.name_event,
      timedate_event: ev.timedate_event,
      timedate_end_event: null,
      name_building: ev.name_building,
      planta_event: null,
      capacidad_event: 0,
    });

    if (googleId) {
      alert(`"${ev.name_event}" agregado a Google Calendar`);
    } else {
      alert("Error al guardar en Google Calendar");
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="nav-item active">
            <span className="nav-text">Mis Eventos</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div
            className="user-profile"
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
          >
            <div className="user-avatar">👨‍🏫</div>
            <span className="user-name">
              {user?.name_user ?? "Profesor"}
            </span>
          </div>

          {showLogoutMenu && (
            <div className="logout-menu">
              <button className="logout-btn" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <div className="top-nav">
          <span className="top-nav-text inactive">Profesor</span>
          <span className="top-nav-separator">/</span>
          <span className="top-nav-text active">Eventos</span>
        </div>

        <div className="content-card">
          <div className="content-header">
            <h2 className="content-title">Mis eventos asignados</h2>

            {/* 🔵 BOTÓN CONECTAR GOOGLE */}
            {!gcal.isSignedIn ? (
              <button onClick={gcal.signIn} className="btn-primary">
                Conectar Google Calendar
              </button>
            ) : (
              <button onClick={gcal.signOut} className="btn-filter">
                Desconectar Calendar
              </button>
            )}
          </div>

          <div className="table-container">
            {loading ? (
              <p style={{ padding: "20px" }}>Cargando eventos...</p>
            ) : eventos.length === 0 ? (
              <p style={{ padding: "20px" }}>
                No tienes eventos asignados
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Edificio</th>
                    <th>Aula</th>
                    <th>Fecha</th>
                    <th>Status</th>
                    <th>Calendar</th> {/* 👈 NUEVA COLUMNA */}
                  </tr>
                </thead>

                <tbody>
                  {eventos.map((e) => (
                    <tr key={e.id_event}>
                      <td className="cell-name">{e.name_event}</td>
                      <td>{e.name_building ?? "—"}</td>
                      <td>{e.nombre_aula ?? "—"}</td>

                      <td>
                        {e.timedate_event
                          ? new Date(e.timedate_event).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            e.status_event === 1
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {e.status_event === 1 ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* 🔵 BOTÓN GOOGLE AL FINAL */}
                      <td>
                        {gcal.isSignedIn ? (
                          <button
                            className="action-btn"
                            onClick={() => handleSaveToCalendar(e)}
                            title="Agregar a Google Calendar"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <GoogleCalIcon />
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                            No conectado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="content-footer">
            <p className="footer-text">
              {eventos.length} evento(s)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfesorEventos;
