import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getStats, getGrafica, getReporte } from "../../services/dashboard";
import "./Dashboard.css";

interface GraficaData {
  label: string;
  usuarios?: number;
  eventos?: number;
}

function Dashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"usuarios" | "eventos">(
    "usuarios",
  );
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes">("semana");
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [stats, setStats] = useState({ total_usuarios: 0, total_eventos: 0 });
  const [graficaData, setGraficaData] = useState<GraficaData[]>([]);
  const [loadingReporte, setLoadingReporte] = useState(false);

  useEffect(() => {
    getStats()
      .then((data) => setStats(data))
      .catch(() => console.error("Error cargando estadísticas"));
  }, []);

  useEffect(() => {
    getGrafica(periodo)
      .then((data) => {
        // Merge usuarios y eventos por label
        const map: Record<string, GraficaData> = {};
        data.usuarios?.forEach((u: { label: string; usuarios: number }) => {
          map[u.label] = {
            ...map[u.label],
            label: u.label,
            usuarios: u.usuarios,
          };
        });
        data.eventos?.forEach((e: { label: string; eventos: number }) => {
          map[e.label] = {
            ...map[e.label],
            label: e.label,
            eventos: e.eventos,
          };
        });
        setGraficaData(Object.values(map));
      })
      .catch(() => console.error("Error cargando gráfica"));
  }, [periodo]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowLogoutMenu(false);
    navigate("/", { replace: true });
  };

  const exportCSV = async () => {
    setLoadingReporte(true);
    try {
      const data = await getReporte();

      // CSV Usuarios
      let csv = "=== USUARIOS ===\n";
      csv += "Nombre,Email,Matricula,Rol\n";
      data.usuarios.forEach(
        (u: {
          name_user: string;
          email_user: string;
          matricula_user: number;
          rol: string;
        }) => {
          csv += `"${u.name_user}","${u.email_user}","${u.matricula_user}","${u.rol}"\n`;
        },
      );

      csv += "\n=== EVENTOS ===\n";
      csv += "Nombre,Edificio,Fecha,Profesor,Status\n";
      data.eventos.forEach(
        (e: {
          name_event: string;
          name_building?: string;
          timedate_event: string;
          nombre_profe?: string;
          status_event: number;
        }) => {
          const status = e.status_event === 1 ? "Activo" : "Inactivo";
          csv += `"${e.name_event}","${e.name_building ?? ""}","${e.timedate_event}","${e.nombre_profe ?? ""}","${status}"\n`;
        },
      );

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al generar reporte");
    }
    setLoadingReporte(false);
    setShowExportMenu(false);
  };

  const exportJSON = async () => {
    setLoadingReporte(true);
    try {
      const data = await getReporte();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al generar reporte");
    }
    setLoadingReporte(false);
    setShowExportMenu(false);
  };

  // Calcular datos de la gráfica activa
  const activeData = graficaData.map((d) => ({
    label: d.label,
    value: activeView === "usuarios" ? (d.usuarios ?? 0) : (d.eventos ?? 0),
  }));

  const maxValue = Math.max(...activeData.map((d) => d.value), 1);

  // Generar puntos del SVG
  const width = 800;
  const height = 250;
  const padX = 40;
  const padY = 20;

  const points = activeData.map((d, i) => ({
    x:
      activeData.length === 1
        ? width / 2
        : padX + (i / (activeData.length - 1)) * (width - padX * 2),
    y: padY + (1 - d.value / maxValue) * (height - padY * 2),
  }));

  const pathD =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")
      : "";

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`
      : "";

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button
            className="nav-item active"
            onClick={() => navigate("/dashboard")}
          >
            <span className="nav-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <span className="nav-text">Dashboard</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/usuarios")}>
            <span className="nav-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="nav-text">Usuarios</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/eventos")}>
            <span className="nav-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span className="nav-text">Eventos</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/edificios")}>
            <span className="nav-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 22V12h6v10" />
                <path d="M3 9h18" />
              </svg>
            </span>
            <span className="nav-text">Edificios</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/divisiones")}>
            <span className="nav-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 3h7v7H3z" />
                <path d="M14 3h7v7h-7z" />
                <path d="M3 14h7v7H3z" />
                <path d="M14 14h7v7h-7z" />
              </svg>
            </span>
            <span className="nav-text">Divisiones</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div
            className="user-profile"
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
          >
            <div className="user-avatar">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="user-name">Admin</span>
          </div>
          {showLogoutMenu && (
            <div className="logout-menu">
              <button className="logout-btn" onClick={handleLogout}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <div className="top-nav">
          <span className="top-nav-text inactive">Dashboards</span>
          <span className="top-nav-separator">/</span>
          <span className="top-nav-text active">Reportes</span>
        </div>

        {/* Metrics */}
        <div className="metrics-container">
          <div className="metric-card">
            <div className="metric-header">
              <h3 className="metric-title">Total Usuarios</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value">
                {stats.total_usuarios.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <h3 className="metric-title">Total Eventos</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value">
                {stats.total_eventos.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <div className="chart-tabs">
              <button
                className={`chart-tab ${activeView === "usuarios" ? "active" : ""}`}
                onClick={() => setActiveView("usuarios")}
              >
                Usuarios
              </button>
              <button
                className={`chart-tab ${activeView === "eventos" ? "active" : ""}`}
                onClick={() => setActiveView("eventos")}
              >
                Eventos
              </button>
            </div>

            <div className="chart-controls">
              {/* Selector de periodo */}
              <select
                className="chart-control-btn"
                value={periodo}
                onChange={(e) =>
                  setPeriodo(e.target.value as "dia" | "semana" | "mes")
                }
                style={{ cursor: "pointer" }}
              >
                <option value="dia">Día</option>
                <option value="semana">Semana</option>
                <option value="mes">Mes</option>
              </select>

              {/* Botón exportar */}
              <div style={{ position: "relative" }}>
                <button
                  className="chart-control-btn"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  title="Descargar reporte"
                >
                  {loadingReporte ? (
                    "..."
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="1" fill="currentColor" />
                      <circle cx="19" cy="12" r="1" fill="currentColor" />
                      <circle cx="5" cy="12" r="1" fill="currentColor" />
                    </svg>
                  )}
                </button>

                {showExportMenu && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "110%",
                      zIndex: 100,
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      overflow: "hidden",
                      minWidth: "160px",
                    }}
                  >
                    <button
                      onClick={exportCSV}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Descargar CSV
                    </button>
                    <button
                      onClick={exportJSON}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        background: "none",
                        border: "none",
                        borderTop: "1px solid #f3f4f6",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Descargar JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="chart-area">
            {activeData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px",
                  color: "#9ca3af",
                  fontSize: "14px",
                }}
              >
                No hay datos para este período
              </div>
            ) : (
              <svg
                className="chart-svg"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9f7aea" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#9f7aea" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                  <line
                    key={i}
                    x1={padX}
                    y1={padY + t * (height - padY * 2)}
                    x2={width - padX}
                    y2={padY + t * (height - padY * 2)}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={t === 0 ? "0" : "5,5"}
                  />
                ))}

                {/* Y axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                  <text
                    key={i}
                    x={padX - 8}
                    y={padY + (1 - t) * (height - padY * 2) + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#9ca3af"
                  >
                    {Math.round(maxValue * t)}
                  </text>
                ))}

                {/* Area fill */}
                {areaD && <path d={areaD} fill="url(#areaGradient)" />}

                {/* Line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#9f7aea"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Points */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#fff"
                    stroke="#9f7aea"
                    strokeWidth="2"
                  />
                ))}

                {/* X axis labels */}
                {points.map((p, i) => (
                  <text
                    key={i}
                    x={p.x}
                    y={height - 2}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#9ca3af"
                  >
                    {activeData[i].label}
                  </text>
                ))}
              </svg>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
