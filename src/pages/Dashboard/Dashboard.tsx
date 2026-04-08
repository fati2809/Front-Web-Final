import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";  // ← Agregar aquí
import { getStats, getGrafica, getReporte } from "../../services/dashboard";
import "./Dashboard.css";

interface GraficaData {
  label: string;
  usuarios?: number;
  eventos?: number;
}

function Dashboard() {
  const navigate = useNavigate();
  const [activeView] = useState<"usuarios" | "eventos">("eventos");
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes">("semana");
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [stats, setStats] = useState({ total_usuarios: 0, total_eventos: 0 });
  const [graficaData, setGraficaData] = useState<GraficaData[]>([]);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Ref para capturar el SVG de la gráfica
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    getStats()
      .then((data) => setStats(data))
      .catch(() => console.error("Error cargando estadísticas"));
  }, []);

  useEffect(() => {
    getGrafica(periodo)
      .then((data) => {
        const map: Record<string, GraficaData> = {};
        data.usuarios?.forEach((u: { label: string; usuarios: number }) => {
          map[u.label] = { ...map[u.label], label: u.label, usuarios: u.usuarios };
        });
        data.eventos?.forEach((e: { label: string; eventos: number }) => {
          map[e.label] = { ...map[e.label], label: e.label, eventos: e.eventos };
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

  // ── Gráfica ──────────────────────────────────────────────────────────────
  const activeData = graficaData.map((d) => ({
    label: d.label,
    value: activeView === "usuarios" ? (d.usuarios ?? 0) : (d.eventos ?? 0),
  }));

  const rawMax   = Math.max(...activeData.map((d) => d.value), 1);
  const maxValue = rawMax <= 5 ? rawMax : Math.ceil(rawMax / 5) * 5;
  const yTicks   = Array.from({ length: 5 }, (_, i) => Math.round((maxValue / 4) * (4 - i)));

  const width  = 800;
  const height = 250;
  const padX   = 45;
  const padY   = 20;

  const points = activeData.map((d, i) => ({
    x: activeData.length === 1
      ? width / 2
      : padX + (i / (activeData.length - 1)) * (width - padX * 2),
    y: padY + (1 - d.value / maxValue) * (height - padY * 2),
  }));

  const pathD  = points.length > 0 ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") : "";
  const areaD  = points.length > 0 ? `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z` : "";

  // ── Exportar CSV ─────────────────────────────────────────────────────────
  const exportCSV = async () => {
    setLoadingReporte(true);
    try {
      const data = await getReporte();
      let csv = "=== USUARIOS ===\nNombre,Email,Matricula,Rol\n";
      data.usuarios.forEach((u: { name_user: string; email_user: string; matricula_user: number; rol: string }) => {
        csv += `"${u.name_user}","${u.email_user}","${u.matricula_user}","${u.rol}"\n`;
      });
      csv += "\n=== EVENTOS ===\nNombre,Edificio,Fecha,Profesor,Status\n";
      data.eventos.forEach((e: { name_event: string; name_building?: string; timedate_event: string; nombre_profe?: string; status_event: number }) => {
        csv += `"${e.name_event}","${e.name_building ?? ""}","${e.timedate_event}","${e.nombre_profe ?? ""}","${e.status_event === 1 ? "Activo" : "Inactivo"}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `reporte_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Error al generar reporte"); }
    setLoadingReporte(false);
    setShowExportMenu(false);
  };

  // ── Exportar JSON ─────────────────────────────────────────────────────────
  const exportJSON = async () => {
    setLoadingReporte(true);
    try {
      const data = await getReporte();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `reporte_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Error al generar reporte"); }
    setLoadingReporte(false);
    setShowExportMenu(false);
  };

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  const exportPDF = async () => {
    setLoadingReporte(true);
    setShowExportMenu(false);
    try {
      const data = await getReporte();

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW    = 210;
      const pageH    = 297;
      const margin   = 14;
      const contentW = pageW - margin * 2;
      let y          = 0;

      // ── Paleta de colores ────────────────────────────────────────────────
      const PURPLE  = [100, 60, 180] as [number, number, number];
      const GRAY_BG = [245, 247, 250] as [number, number, number];
      const GRAY_LN = [220, 225, 235] as [number, number, number];
      const WHITE   = [255, 255, 255] as [number, number, number];
      const TEXT_DK = [30,  35,  50]  as [number, number, number];
      const TEXT_MD = [80,  90, 110]  as [number, number, number];
      const GREEN   = [22, 163, 74]   as [number, number, number];
      const RED     = [220, 38, 38]   as [number, number, number];

      // ── Helpers ───────────────────────────────────────────────────────────
      const setFont   = (size: number, style: "normal" | "bold" = "normal", color = TEXT_DK) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", style);
        doc.setTextColor(...color);
      };
      const setFill   = (color: [number, number, number]) => doc.setFillColor(...color);
      const setDraw   = (color: [number, number, number]) => doc.setDrawColor(...color);
      const rect      = (x: number, yy: number, w: number, h: number, style: "F" | "S" | "FD" = "F") =>
        doc.rect(x, yy, w, h, style);
      const checkPage = (needed: number) => {
        if (y + needed > pageH - 10) { doc.addPage(); y = margin; }
      };

      // ── ENCABEZADO ────────────────────────────────────────────────────────
      setFill(PURPLE);
      rect(0, 0, pageW, 28);
      setFont(18, "bold", WHITE);
      doc.text("Reporte General del Sistema", margin, 16);
      setFont(9, "normal", [200, 190, 240]);
      const now = new Date().toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });
      doc.text(`Generado el ${now}`, margin, 23);
      y = 36;

      // ── RESUMEN DE MÉTRICAS ───────────────────────────────────────────────
      setFont(11, "bold", TEXT_DK);
      doc.text("Resumen general", margin, y);
      y += 5;

      const cardW = (contentW - 6) / 2;
      const cards = [
        { label: "Total de usuarios", value: String(stats.total_usuarios), color: PURPLE },
        { label: "Total de eventos",  value: String(stats.total_eventos),  color: GREEN  },
      ];

      cards.forEach((card, i) => {
        const cx = margin + i * (cardW + 6);
        setFill(GRAY_BG); setDraw(GRAY_LN);
        rect(cx, y, cardW, 22, "FD");
        // Barra de color lateral
        setFill(card.color as [number, number, number]);
        rect(cx, y, 3, 22);
        setFont(18, "bold", card.color as [number, number, number]);
        doc.text(card.value, cx + 10, y + 14);
        setFont(8, "normal", TEXT_MD);
        doc.text(card.label, cx + 10, y + 20);
      });
      y += 30;

      // ── GRÁFICA ───────────────────────────────────────────────────────────
      if (activeData.length > 0) {
        setFont(11, "bold", TEXT_DK);
        doc.text(`Gráfica de eventos — período: ${periodo}`, margin, y);
        y += 4;

        const gW  = contentW;
        const gH  = 52;
        const gPX = 12;
        const gPY = 6;
        const gX0 = margin + gPX;
        const gX1 = margin + gW - gPX;
        const gY0 = y + gPY;
        const gY1 = y + gH - gPY;
        const gMx = Math.max(...activeData.map(d => d.value), 1);

        // Fondo
        setFill(GRAY_BG); setDraw(GRAY_LN);
        rect(margin, y, gW, gH, "FD");

        // Grid lines
        doc.setLineWidth(0.2);
        for (let t = 0; t <= 4; t++) {
          const ly = gY0 + (t / 4) * (gY1 - gY0);
          setDraw([210, 215, 225]);
          doc.line(gX0, ly, gX1, ly);
          setFont(5, "normal", TEXT_MD);
          doc.text(String(Math.round(gMx * (1 - t / 4))), margin + 1, ly + 1.5);
        }

        // Calcular puntos
        const pts = activeData.map((d, i) => ({
          x: activeData.length === 1
            ? (gX0 + gX1) / 2
            : gX0 + (i / (activeData.length - 1)) * (gX1 - gX0),
          y: gY0 + (1 - d.value / gMx) * (gY1 - gY0),
        }));

        // Área rellena
        doc.setFillColor(159, 122, 234);
        doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
        const areaPath: number[][] = [];
        pts.forEach(p => areaPath.push([p.x, p.y]));
        areaPath.push([pts[pts.length - 1].x, gY1]);
        areaPath.push([pts[0].x, gY1]);
        (doc as any).lines(
          areaPath.slice(1).map((pt, i) => [pt[0] - areaPath[i][0], pt[1] - areaPath[i][1]]),
          areaPath[0][0], areaPath[0][1], [1, 1], "F", true
        );
        doc.setGState(new (doc as any).GState({ opacity: 1 }));

        // Línea principal
        doc.setLineWidth(1);
        setDraw(PURPLE);
        for (let i = 1; i < pts.length; i++) {
          doc.line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
        }

        // Puntos y etiquetas X
        pts.forEach((p, i) => {
          setFill(WHITE); setDraw(PURPLE);
          doc.setLineWidth(0.8);
          doc.circle(p.x, p.y, 1.2, "FD");
          setFont(5, "normal", TEXT_MD);
          doc.text(activeData[i].label, p.x, gY1 + 4, { align: "center" });
          // Valor encima del punto
          if (activeData[i].value > 0) {
            setFont(5, "bold", PURPLE);
            doc.text(String(activeData[i].value), p.x, p.y - 2, { align: "center" });
          }
        });

        y += gH + 8;
      }

      // ── TABLA EVENTOS ─────────────────────────────────────────────────────
      checkPage(20);
      setFont(11, "bold", TEXT_DK);
      doc.text("Detalle de eventos", margin, y);
      y += 4;

      // Cabecera de tabla
      const colsEv = [
        { header: "Nombre",   w: 55 },
        { header: "Edificio", w: 38 },
        { header: "Fecha",    w: 42 },
        { header: "Profesor", w: 38 },
        { header: "Status",   w: 19 },
      ];
      const rowH = 7;

      const drawTableHeader = (cols: typeof colsEv, yy: number) => {
        let cx = margin;
        setFill(PURPLE);
        rect(margin, yy, contentW, rowH);
        setFont(7, "bold", WHITE);
        cols.forEach(col => {
          doc.text(col.header, cx + 2, yy + 5);
          cx += col.w;
        });
        return yy + rowH;
      };

      const drawTableRow = (cols: typeof colsEv, values: string[], yy: number, shade: boolean) => {
        setFill(shade ? GRAY_BG : WHITE);
        setDraw(GRAY_LN);
        doc.setLineWidth(0.1);
        rect(margin, yy, contentW, rowH, "FD");
        let cx = margin;
        setFont(7, "normal", TEXT_DK);
        cols.forEach((col, i) => {
          const val = String(values[i] ?? "");
          const truncated = doc.splitTextToSize(val, col.w - 3)[0] ?? val;
          if (col.header === "Status") {
            const isActive = val === "Activo";
            setFill(isActive ? GREEN : RED);
            rect(cx + 1.5, yy + 1.8, col.w - 3, 3.5, "F");
            setFont(6, "bold", WHITE);
            doc.text(val, cx + col.w / 2, yy + 4.3, { align: "center" });
            setFont(7, "normal", TEXT_DK);
          } else {
            doc.text(truncated, cx + 2, yy + 5);
          }
          cx += col.w;
        });
        return yy + rowH;
      };

      y = drawTableHeader(colsEv, y);
      (data.eventos as { name_event: string; name_building?: string; timedate_event: string; nombre_profe?: string; status_event: number }[])
        .slice(0, 30)
        .forEach((ev, idx) => {
          checkPage(rowH + 2);
          if (y === margin) y = drawTableHeader(colsEv, y); // nueva página → reencabezar
          const fecha  = ev.timedate_event ? new Date(ev.timedate_event).toLocaleDateString("es-MX") : "—";
          const status = ev.status_event === 1 ? "Activo" : "Inactivo";
          y = drawTableRow(colsEv, [ev.name_event, ev.name_building ?? "—", fecha, ev.nombre_profe ?? "—", status], y, idx % 2 === 0);
        });

      y += 8;

      // ── TABLA USUARIOS ────────────────────────────────────────────────────
      checkPage(20);
      setFont(11, "bold", TEXT_DK);
      doc.text("Detalle de usuarios", margin, y);
      y += 4;

      const colsUs = [
        { header: "Nombre",    w: 60 },
        { header: "Email",     w: 68 },
        { header: "Matrícula", w: 24 },
        { header: "Rol",       w: 30 },
      ];

      y = drawTableHeader(colsUs, y);
      (data.usuarios as { name_user: string; email_user: string; matricula_user: number; rol: string }[])
        .slice(0, 30)
        .forEach((u, idx) => {
          checkPage(rowH + 2);
          if (y === margin) y = drawTableHeader(colsUs, y);
          y = drawTableRow(colsUs, [u.name_user, u.email_user, String(u.matricula_user), u.rol], y, idx % 2 === 0);
        });

      y += 8;

      // ── PIE DE PÁGINA en todas las páginas ───────────────────────────────
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let pg = 1; pg <= totalPages; pg++) {
        doc.setPage(pg);
        setFill(PURPLE);
        rect(0, pageH - 8, pageW, 8);
        setFont(7, "normal", [200, 190, 240]);
        doc.text("Sistema de Gestión de Eventos © 2026", margin, pageH - 3);
        doc.text(`Página ${pg} de ${totalPages}`, pageW - margin, pageH - 3, { align: "right" });
      }

      doc.save(`reporte_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Error al generar el PDF. Intenta nuevamente.");
    }
    setLoadingReporte(false);
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="nav-item active" onClick={() => navigate("/dashboard")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <span className="nav-text">Dashboard</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/usuarios")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="nav-text">Usuarios</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/eventos")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span className="nav-text">Eventos</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/edificios")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 22V12h6v10" /><path d="M3 9h18" />
              </svg>
            </span>
            <span className="nav-text">Edificios</span>
          </button>
          <button className="nav-item" onClick={() => navigate("/divisiones")}>
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" />
                <path d="M3 14h7v7H3z" /><path d="M14 14h7v7h-7z" />
              </svg>
            </span>
            <span className="nav-text">Divisiones</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile" onClick={() => setShowLogoutMenu(!showLogoutMenu)}>
            <div className="user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="user-name">Admin</span>
            <span title={isOnline ? "Online" : "Offline"} style={{
              width: "9px", height: "9px", borderRadius: "50%",
              backgroundColor: isOnline ? "#22c55e" : "#ef4444",
              flexShrink: 0, marginLeft: "auto",
              boxShadow: isOnline ? "0 0 0 2px rgba(34,197,94,0.25)" : "0 0 0 2px rgba(239,68,68,0.25)",
              transition: "background-color 0.3s, box-shadow 0.3s",
            }} />
          </div>
          {showLogoutMenu && (
            <div className="logout-menu">
              <button className="logout-btn" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
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
            <div className="metric-header"><h3 className="metric-title">Total Usuarios</h3></div>
            <div className="metric-content">
              <div className="metric-value">{stats.total_usuarios.toLocaleString()}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-header"><h3 className="metric-title">Total Eventos</h3></div>
            <div className="metric-content">
              <div className="metric-value">{stats.total_eventos.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <div className="chart-tabs">
              <button className="chart-tab active">Eventos</button>
            </div>
            <div className="chart-controls">
              <select
                className="chart-control-btn"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as "dia" | "semana" | "mes")}
                style={{ cursor: "pointer" }}
              >
                <option value="dia">Día</option>
                <option value="semana">Semana</option>
                <option value="mes">Mes</option>
              </select>

              {/* Menú exportar */}
              <div style={{ position: "relative" }}>
                <button
                  className="chart-control-btn"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  title="Descargar reporte"
                >
                  {loadingReporte ? "..." : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" fill="currentColor" />
                      <circle cx="19" cy="12" r="1" fill="currentColor" />
                      <circle cx="5"  cy="12" r="1" fill="currentColor" />
                    </svg>
                  )}
                </button>

                {showExportMenu && (
                  <div style={{
                    position: "absolute", right: 0, top: "110%", zIndex: 100,
                    background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", overflow: "hidden", minWidth: "170px",
                  }}>
                    {/* ── CSV ── */}
                    <button onClick={exportCSV} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      Descargar CSV
                    </button>

                    {/* ── JSON ── */}
                    <button onClick={exportJSON} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", borderTop: "1px solid #f3f4f6", textAlign: "left", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      Descargar JSON
                    </button>

                    {/* ── PDF ── */}
                    <button onClick={exportPDF} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", borderTop: "1px solid #f3f4f6", textAlign: "left", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", color: "#7c3aed", fontWeight: 600 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                      Descargar PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="chart-area">
            {activeData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af", fontSize: "14px" }}>
                No hay datos para este período
              </div>
            ) : (
              <svg ref={chartRef} className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#9f7aea" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#9f7aea" stopOpacity="0"   />
                  </linearGradient>
                </defs>
                {yTicks.map((tick, i) => (
                  <line key={i} x1={padX} y1={padY + (1 - tick / maxValue) * (height - padY * 2)} x2={width - padX} y2={padY + (1 - tick / maxValue) * (height - padY * 2)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "5,5"} />
                ))}
                {yTicks.map((tick, i) => (
                  <text key={i} x={padX - 8} y={padY + (1 - tick / maxValue) * (height - padY * 2) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{tick}</text>
                ))}
                {areaD && <path d={areaD} fill="url(#areaGradient)" />}
                {pathD  && <path d={pathD} fill="none" stroke="#9f7aea" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#9f7aea" strokeWidth="2" />
                ))}
                {points.map((p, i) => (
                  <text key={i} x={p.x} y={height - 2} textAnchor="middle" fontSize="10" fill="#9ca3af">{activeData[i].label}</text>
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