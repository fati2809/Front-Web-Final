import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getUsuarios,
  createProfesor,
  updateUsuario,
  deleteUsuario,
  getDivisiones,
  getEdificiosList,
} from "../../services/usuarios";
import { register } from "../../services/auth";
import "./Usuarios.css";

interface Usuario {
  id_user: string;
  name_user: string;
  email_user: string;
  matricula_user: number | null;
  id_rol: number;
  rol: string;
  division?: string;
  planta?: string;
  edificio?: string;
}

interface ModalData {
  name_user: string;
  email_user: string;
  matricula_user: string;
  id_rol: number;
}

interface Division {
  id_div: number;
  name_div: string;
}

interface Edificio {
  id_building: number;
  name_building: string;
}

function Usuarios() {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [usuariosData, setUsuariosData] = useState<Usuario[]>([]);
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<
    ModalData & {
      pass_user: string;
      id_division: string;
      planta_profe: string;
      id_building: string;
    }
  >({
    name_user: "",
    email_user: "",
    pass_user: "",
    matricula_user: "",
    id_rol: 2,
    id_division: "",
    planta_profe: "",
    id_building: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<ModalData & { id_user: string }>({
    id_user: "",
    name_user: "",
    email_user: "",
    matricula_user: "",
    id_rol: 2,
  });

  const [modalError, setModalError] = useState("");

  const fetchUsuarios = () => {
    getUsuarios()
      .then((data) => {
        setUsuariosData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchDivisiones = () => {
    getDivisiones()
      .then((data) => setDivisiones(data))
      .catch((err) => console.error(err));
  };

  const fetchEdificios = () => {
    getEdificiosList()
      .then((data) => setEdificios(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchUsuarios();
    fetchDivisiones();
    fetchEdificios();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowLogoutMenu(false);
    navigate("/", { replace: true });
  };

  const filteredUsuarios = usuariosData.filter(
    (u) =>
      u.name_user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email_user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(u.matricula_user ?? "").includes(searchTerm),
  );

  const handleAddSubmit = async () => {
    setModalError("");
    try {
      if (addForm.id_rol === 3) {
        await createProfesor({
          name_user: addForm.name_user,
          email_user: addForm.email_user,
          pass_user: addForm.pass_user,
          matricula_user: parseInt(addForm.matricula_user),
          id_rol: 3,
          id_division: addForm.id_division
            ? parseInt(addForm.id_division)
            : undefined,
          planta_profe: addForm.planta_profe || undefined,
          id_building: addForm.id_building
            ? parseInt(addForm.id_building)
            : undefined,
        });
      } else {
        await register({
          name_user: addForm.name_user,
          email_user: addForm.email_user,
          pass_user: addForm.pass_user,
          matricula_user: parseInt(addForm.matricula_user),
          id_rol: addForm.id_rol,
        });
      }
      setShowAddModal(false);
      setAddForm({
        name_user: "",
        email_user: "",
        pass_user: "",
        matricula_user: "",
        id_rol: 2,
        id_division: "",
        planta_profe: "",
        id_building: "",
      });
      fetchUsuarios();
    } catch (error) {
      if (error instanceof Error) {
        setModalError(error.message);
      } else {
        setModalError("No se pudo conectar con el servidor");
      }
    }
  };

  const openEditModal = (usuario: Usuario) => {
    setModalError("");
    setEditForm({
      id_user: usuario.id_user,
      name_user: usuario.name_user,
      email_user: usuario.email_user,
      matricula_user: String(usuario.matricula_user ?? ""),
      id_rol: usuario.id_rol,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setModalError("");
    try {
      await updateUsuario(editForm.id_user, {
        name_user: editForm.name_user,
        email_user: editForm.email_user,
        matricula_user: parseInt(editForm.matricula_user),
        id_rol: editForm.id_rol,
      });
      setShowEditModal(false);
      fetchUsuarios();
    } catch (error) {
      if (error instanceof Error) {
        setModalError(error.message);
      } else {
        setModalError("No se pudo conectar con el servidor");
      }
    }
  };

  const handleDelete = async (id_user: number, name_user: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar a "${name_user}"?`)) return;
    try {
      await deleteUsuario(id_user);
      fetchUsuarios();
    } catch {
      alert("Error al eliminar el usuario");
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
    width: "520px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxHeight: "90vh",
    overflowY: "auto",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: "-8px",
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
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

          <button
            className="nav-item active"
            onClick={() => navigate("/usuarios")}
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
          <span className="top-nav-text active">Usuarios</span>
        </div>

        <div className="content-card">
          <div className="content-header">
            <div className="header-left">
              <h2 className="content-title">Usuarios</h2>
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
                  placeholder="Buscar por nombre, email o matrícula"
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
                Cargando usuarios...
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Matrícula</th>
                    <th>Rol</th>
                    <th>División</th>
                    <th>Planta</th>
                    <th>Edificio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id_user}>
                      <td className="cell-name">{usuario.name_user}</td>
                      <td className="cell-email">{usuario.email_user}</td>
                      <td>{usuario.matricula_user ?? "—"}</td>
                      <td>{usuario.rol}</td>
                      <td>
                        {usuario.id_rol === 3 ? (usuario.division ?? "—") : "—"}
                      </td>
                      <td>
                        {usuario.id_rol === 3 ? (usuario.planta ?? "—") : "—"}
                      </td>
                      <td>
                        {usuario.id_rol === 3 ? (usuario.edificio ?? "—") : "—"}
                      </td>
                      <td className="cell-actions">
                        <button
                          className="action-btn"
                          title="Editar"
                          onClick={() => openEditModal(usuario)}
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
                          onClick={() =>
                            handleDelete(usuario.id_user, usuario.name_user)
                          }
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
            <h3 style={{ margin: 0, fontSize: "18px" }}>Agregar Usuario</h3>

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

            <span style={labelStyle}>Nombre completo</span>
            <input
              style={inputStyle}
              placeholder="Nombre completo"
              value={addForm.name_user}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, name_user: e.target.value }))
              }
            />

            <span style={labelStyle}>Email</span>
            <input
              style={inputStyle}
              placeholder="Email"
              type="email"
              value={addForm.email_user}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, email_user: e.target.value }))
              }
            />

            <span style={labelStyle}>Contraseña</span>
            <input
              style={inputStyle}
              placeholder="Contraseña"
              type="password"
              value={addForm.pass_user}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, pass_user: e.target.value }))
              }
            />

            <span style={labelStyle}>Matrícula</span>
            <input
              style={inputStyle}
              placeholder="Matrícula"
              type="number"
              value={addForm.matricula_user}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, matricula_user: e.target.value }))
              }
            />

            <span style={labelStyle}>Rol</span>
            <select
              style={selectStyle}
              value={addForm.id_rol}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, id_rol: parseInt(e.target.value) }))
              }
            >
              <option value={1}>Administrador</option>
              <option value={2}>Usuario</option>
              <option value={3}>Profesor</option>
            </select>

            {addForm.id_rol === 3 && (
              <>
                <div style={dividerStyle}>Datos del Profesor</div>

                <span style={labelStyle}>División</span>
                <select
                  style={selectStyle}
                  value={addForm.id_division}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, id_division: e.target.value }))
                  }
                >
                  <option value="">Seleccionar división</option>
                  {divisiones.map((d) => (
                    <option key={d.id_div} value={d.id_div}>
                      {d.name_div}
                    </option>
                  ))}
                </select>

                <span style={labelStyle}>Planta</span>
                <input
                  style={inputStyle}
                  placeholder="Ej: Planta Baja"
                  value={addForm.planta_profe}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, planta_profe: e.target.value }))
                  }
                />

                <span style={labelStyle}>Edificio</span>
                <select
                  style={selectStyle}
                  value={addForm.id_building}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, id_building: e.target.value }))
                  }
                >
                  <option value="">Seleccionar edificio</option>
                  {edificios.map((ed) => (
                    <option key={ed.id_building} value={ed.id_building}>
                      {ed.name_building}
                    </option>
                  ))}
                </select>
              </>
            )}

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
            <h3 style={{ margin: 0, fontSize: "18px" }}>Editar Usuario</h3>

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

            <input
              style={inputStyle}
              placeholder="Nombre completo"
              value={editForm.name_user}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, name_user: e.target.value }))
              }
            />
            <input
              style={inputStyle}
              placeholder="Email"
              type="email"
              value={editForm.email_user}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, email_user: e.target.value }))
              }
            />
            <input
              style={inputStyle}
              placeholder="Matrícula"
              type="number"
              value={editForm.matricula_user}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, matricula_user: e.target.value }))
              }
            />
            <select
              style={selectStyle}
              value={editForm.id_rol}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, id_rol: parseInt(e.target.value) }))
              }
            >
              <option value={1}>Administrador</option>
              <option value={2}>Usuario</option>
              <option value={3}>Profesor</option>
            </select>

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

export default Usuarios;
