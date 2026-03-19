import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getDivisionesAll,
  createDivision,
  updateDivision,
  deleteDivision,
} from "../../services/divisiones";
import "../Usuarios/Usuarios.css";

interface Division {
  id_div: number;
  name_div: string;
  total_profesores?: number;
  total_edificios?: number;
}

function Divisiones() {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [divisionesData, setDivisionesData] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name_div: "" });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id_div: 0, name_div: "" });

  const [modalError, setModalError] = useState("");

  const fetchDivisiones = () => {
    getDivisionesAll()
      .then((data) => {
        setDivisionesData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDivisiones();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowLogoutMenu(false);
    navigate("/", { replace: true });
  };

  const filteredDivisiones = divisionesData.filter((d) =>
    d.name_div.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddSubmit = async () => {
    setModalError("");
    if (!addForm.name_div.trim()) {
      setModalError("El nombre es obligatorio");
      return;
    }
    try {
      await createDivision({ name_div: addForm.name_div });
      setShowAddModal(false);
      setAddForm({ name_div: "" });
      fetchDivisiones();
    } catch (error) {
      if (error instanceof Error) {
        setModalError(error.message);
      } else {
        setModalError("No se pudo conectar con el servidor");
      }
    }
  };

  const openEditModal = (d: Division) => {
    setModalError("");
    setEditForm({ id_div: d.id_div, name_div: d.name_div });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setModalError("");
    if (!editForm.name_div.trim()) {
      setModalError("El nombre es obligatorio");
      return;
    }
    try {
      await updateDivision(editForm.id_div, { name_div: editForm.name_div });
      setShowEditModal(false);
      fetchDivisiones();
    } catch (error) {
      if (error instanceof Error) {
        setModalError(error.message);
      } else {
        setModalError("No se pudo conectar con el servidor");
      }
    }
  };

  const handleDelete = async (id_div: number, name: string) => {
    if (!window.confirm(`¿Eliminar la división "${name}"?`)) return;
    try {
      await deleteDivision(id_div);
      fetchDivisiones();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("No se pudo conectar con el servidor");
      }
    }
  };

  const modalStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "12px",
    padding: "32px",
    width: "420px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: "-8px",
  };

  return (
    <div className="usuarios-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate("/dashboard")}>
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

          <button
            className="nav-item active"
            onClick={() => navigate("/divisiones")}
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
          <span className="top-nav-text active">Divisiones</span>
        </div>

        <div className="content-card">
          <div className="content-header">
            <div className="header-left">
              <h2 className="content-title">Divisiones</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setModalError("");
                  setShowAddModal(true);
                }}
              >
                Agregar
              </button>
            </div>
            <div className="header-right">
              <div className="search-box">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <p style={{ padding: "20px", textAlign: "center" }}>
                Cargando divisiones...
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Profesores</th>
                    <th>Edificios</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDivisiones.map((d) => (
                    <tr key={d.id_div}>
                      <td className="cell-name">{d.name_div}</td>
                      <td>{d.total_profesores}</td>
                      <td>{d.total_edificios}</td>
                      <td className="cell-actions">
                        <button
                          className="action-btn"
                          title="Editar"
                          onClick={() => openEditModal(d)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="action-btn"
                          title="Eliminar"
                          style={{ color: "#dc2626" }}
                          onClick={() => handleDelete(d.id_div, d.name_div)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="content-footer">
            <p className="footer-text">© 2026</p>
          </div>
        </div>
      </main>

      {/* MODAL AGREGAR */}
      {showAddModal && (
        <div style={modalStyle} onClick={() => setShowAddModal(false)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Agregar División</h3>
            {modalError && (
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              >
                {modalError}
              </div>
            )}
            <span style={labelStyle}>Nombre</span>
            <input
              style={inputStyle}
              placeholder="Nombre de la división"
              value={addForm.name_div}
              onChange={(e) => setAddForm({ name_div: e.target.value })}
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn-filter"
                onClick={() => setShowAddModal(false)}
              >
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleAddSubmit}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showEditModal && (
        <div style={modalStyle} onClick={() => setShowEditModal(false)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Editar División</h3>
            {modalError && (
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              >
                {modalError}
              </div>
            )}
            <span style={labelStyle}>Nombre</span>
            <input
              style={inputStyle}
              placeholder="Nombre de la división"
              value={editForm.name_div}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, name_div: e.target.value }))
              }
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn-filter"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleEditSubmit}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Divisiones;
