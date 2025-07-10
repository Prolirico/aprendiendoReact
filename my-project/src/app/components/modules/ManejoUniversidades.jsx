import React, { useState, useEffect, useCallback } from "react";
import styles from "./ManejoUniversidades.module.css";

// Define the base URL of your backend API
const API_URL = "http://localhost:5000/api/universidades";
const SERVER_URL = "http://localhost:5000";

// Initial state for the form, including all fields from the database
const initialUniversityState = {
  id_universidad: null,
  nombre: "",
  clave_universidad: "",
  direccion: "",
  telefono: "",
  email_contacto: "",
  ubicacion: "",
  logo_url: "",
  email_admin: "",
  password: "",
};

function ManejoUniversidades() {
  // Data and loading state
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUniversities, setTotalUniversities] = useState(0);

  // Search and debounce state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUniversity, setCurrentUniversity] = useState(
    initialUniversityState,
  );
  const [deleteAdminCheckbox, setDeleteAdminCheckbox] = useState(false);

  // Logo file state for form handling
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page on new search
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch universities from the backend API
  const fetchUniversities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}?page=${page}&limit=10&searchTerm=${debouncedSearchTerm}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error ||
            `Failed to fetch data: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      setUniversities(data.universities);
      setTotalPages(data.totalPages);
      setTotalUniversities(data.total);
    } catch (err) {
      setError(err.message);
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleOpenModal = (university = null) => {
    if (university) {
      setCurrentUniversity({ ...university, password: "" });
      setLogoPreview(
        university.logo_url ? `${SERVER_URL}${university.logo_url}` : "",
      );
    } else {
      setCurrentUniversity(initialUniversityState);
      setLogoPreview("");
    }
    setLogoFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleOpenDeleteModal = (university) => {
    setCurrentUniversity(university);
    setDeleteAdminCheckbox(false);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => setIsDeleteModalOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUniversity((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    if (currentUniversity.id_universidad) {
      setCurrentUniversity((prev) => ({ ...prev, logo_url: "" }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const isEditing = !!currentUniversity.id_universidad;

    Object.keys(currentUniversity).forEach((key) => {
      if (
        key !== "id_universidad" &&
        key !== "logo_url" &&
        key !== "password"
      ) {
        formData.append(key, currentUniversity[key] || "");
      }
    });

    if (currentUniversity.password) {
      formData.append("password", currentUniversity.password);
    }
    if (logoFile) {
      formData.append("logo", logoFile);
    }

    const url = isEditing
      ? `${API_URL}/${currentUniversity.id_universidad}`
      : API_URL;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, { method, body: formData });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "An unknown error occurred.");
      showToast(
        `University ${isEditing ? "updated" : "created"} successfully!`,
        "success",
      );
      handleCloseModal();
      fetchUniversities();
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentUniversity || !currentUniversity.id_universidad) return;
    const url = `${API_URL}/${currentUniversity.id_universidad}?deleteAdminUser=${deleteAdminCheckbox}`;

    try {
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete.");
      }
      showToast("University deleted successfully!", "success");
      handleCloseDeleteModal();
      if (universities.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchUniversities();
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Cargando Universidades...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.emptyState}>
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Un error ha ocurrido</h3>
          <p>{error}</p>
          <button
            onClick={() => fetchUniversities()}
            className={styles.emptyStateButton}
          >
            Intenta Otra Vez
          </button>
        </div>
      );
    }
    if (universities.length === 0) {
      return (
        <div className={styles.emptyState}>
          <i className="fas fa-university"></i>
          <h3>No se encontraron universidades</h3>
          <p>Comienza agregando una nueva universidad.</p>
          <button
            onClick={() => handleOpenModal()}
            className={styles.emptyStateButton}
          >
            <i className="fas fa-plus"></i> Agregar Universidades
          </button>
        </div>
      );
    }
    return (
      <>
        <div className={styles.mobileView}>
          {universities.map((uni) => (
            <div key={uni.id_universidad} className={styles.universityCard}>
              <div className={styles.cardContent}>
                <div className={styles.logoContainer}>
                  <img
                    src={
                      uni.logo_url
                        ? `${SERVER_URL}${uni.logo_url}`
                        : "/placeholder-logo.png"
                    }
                    alt={`${uni.nombre} Logo`}
                    className={styles.logo}
                  />
                </div>
                <h3 className={styles.universityName}>{uni.nombre}</h3>
                <p className={styles.universityInfo}>
                  <i className="fas fa-id-card"></i> {uni.clave_universidad}
                </p>
              </div>
              <div className={styles.cardActions}>
                <button
                  onClick={() => handleOpenModal(uni)}
                  className={styles.editButton}
                >
                  <i className="fas fa-edit"></i> Editar
                </button>
                <button
                  onClick={() => handleOpenDeleteModal(uni)}
                  className={styles.deleteButton}
                >
                  <i className="fas fa-trash"></i> Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.desktopView}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Logo</th>
                <th>Nombre</th>
                <th>Clave de Universidad</th>
                <th>Email del Administrador</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {universities.map((uni) => (
                <tr key={uni.id_universidad}>
                  <td>
                    <img
                      src={
                        uni.logo_url
                          ? `${SERVER_URL}${uni.logo_url}`
                          : "/placeholder-logo.png"
                      }
                      alt={`${uni.nombre} Logo`}
                      className={styles.tableLogo}
                    />
                  </td>
                  <td>{uni.nombre}</td>
                  <td>{uni.clave_universidad}</td>
                  <td>{uni.email_admin || "N/A"}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        onClick={() => handleOpenModal(uni)}
                        className={styles.editButton}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(uni)}
                        className={styles.deleteButton}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Manejo de Universidades</h1>
          <div className={styles.userInfo}>
            <span className={styles.userName}>SEDEQ</span>
            <button className={styles.userButton}>
              <i className="fas fa-user"></i>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <button
            onClick={() => handleOpenModal()}
            className={styles.addButton}
          >
            <i className="fas fa-plus"></i> Agregar Universidades
          </button>
          <div className={styles.searchContainer}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by name..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {renderContent()}
        {universities.length > 0 && totalPages > 1 && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Showing{" "}
              <strong>
                {(page - 1) * 10 + 1}-{Math.min(page * 10, totalUniversities)}
              </strong>{" "}
              of <strong>{totalUniversities}</strong>
            </div>
            <div className={styles.paginationControls}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className={styles.pageButton}
              >
                Antes
              </button>
              <span className={styles.pageButton} style={{ cursor: "default" }}>
                Pagina {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className={styles.pageButton}
              >
                Despues
              </button>
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {currentUniversity.id_universidad
                  ? "Edit University"
                  : "Add New University"}
              </h3>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                {/* Section 1: Core University Info */}
                <div
                  className={styles.formGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label htmlFor="nombre">Nombre de la Universidad</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={currentUniversity.nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="clave_universidad">
                    Clave de la Universidad
                  </label>
                  <input
                    type="text"
                    id="clave_universidad"
                    name="clave_universidad"
                    value={currentUniversity.clave_universidad}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="telefono">Numero de contacto</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={currentUniversity.telefono || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div
                  className={styles.formGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label htmlFor="email_contacto">Correo de contacto</label>
                  <input
                    type="email"
                    id="email_contacto"
                    name="email_contacto"
                    value={currentUniversity.email_contacto || ""}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Section 2: Location Info */}
                <div
                  className={styles.formGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label htmlFor="direccion">Direccion</label>
                  <textarea
                    id="direccion"
                    name="direccion"
                    rows="3"
                    value={currentUniversity.direccion || ""}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                <div
                  className={styles.formGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label htmlFor="ubicacion">Google Maps URL</label>
                  <input
                    type="url"
                    id="ubicacion"
                    name="ubicacion"
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    value={currentUniversity.ubicacion || ""}
                    onChange={handleInputChange}
                  />
                  <span className={styles.fieldHelp}>
                    {
                      "Find place in Google Maps > Share > Embed a map > Copy SRC url."
                    }
                  </span>
                </div>

                {/* Section 3: Logo */}
                <div
                  className={styles.formGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label htmlFor="logo">Logo</label>
                  <input
                    type="file"
                    id="logo"
                    name="logo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                  {logoPreview && (
                    <div className={styles.logoPreview}>
                      <img src={logoPreview} alt="Logo Preview" />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className={styles.removeImageButton}
                      >
                        <i className="fas fa-times"></i> Borrar Imagen
                      </button>
                    </div>
                  )}
                </div>

                {/* Section 4: Administrator Account */}
                <div
                  className={styles.formGroup}
                  style={{
                    gridColumn: "1 / -1",
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: "1rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <label htmlFor="email_admin">
                    Email del Administrator (para login)
                  </label>
                  <input
                    type="email"
                    id="email_admin"
                    name="email_admin"
                    value={currentUniversity.email_admin || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div
                  className={styles.formGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <label htmlFor="password">Contraseña</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={currentUniversity.password || ""}
                    onChange={handleInputChange}
                    placeholder={
                      currentUniversity.id_universidad
                        ? "Leave blank to keep current password"
                        : ""
                    }
                    required={!currentUniversity.id_universidad}
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  <i className="fas fa-save"></i> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className={styles.modalBackdrop} onClick={handleCloseDeleteModal}>
          <div
            className={styles.deleteModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteModalContent}>
              <div className={styles.deleteIcon}>
                <i className="fas fa-trash-alt"></i>
              </div>
              <h3>Confirmar Eliminación</h3>
              <p>
                Estas seguro de eliminar{" "}
                <strong>{currentUniversity.nombre}</strong>. Esta acción no se
                puede deshacer.
              </p>
              {currentUniversity.email_admin && (
                <div className={styles.deleteCheckboxContainer}>
                  <input
                    type="checkbox"
                    id="deleteAdmin"
                    checked={deleteAdminCheckbox}
                    onChange={(e) => setDeleteAdminCheckbox(e.target.checked)}
                  />
                  <label htmlFor="deleteAdmin">
                    Desea eliminar el usuario administrador asociado (
                    <strong>{currentUniversity.email_admin}</strong>)?
                  </label>
                </div>
              )}
            </div>
            <div className={styles.deleteActions}>
              <button
                onClick={handleCloseDeleteModal}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className={styles.confirmDeleteButton}
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={styles.toast}>
          <div
            className={`${styles.toastContent} ${styles[toast.type] || styles.success}`}
          >
            <i
              className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}
            ></i>
            <p>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManejoUniversidades;
