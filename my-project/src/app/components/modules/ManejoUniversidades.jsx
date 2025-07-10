import React, { useEffect, useState } from "react";
import styles from "./ManejoUniversidades.module.css";

function ManejoUniversidades() {
  // State variables
  const [universities, setUniversities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUniversityId, setEditingUniversityId] = useState(null);
  const [universityToDelete, setUniversityToDelete] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    claveUniversidad: "",
    ubicacion: "",
    direccion: "",
    telefono: "",
    emailContacto: "",
    logo: null,
    email: "",
    password: "",
  });

  const itemsPerPage = 5;

  // Initialize component
  useEffect(() => {
    loadUniversities();
  }, []);

  // Load universities from localStorage
  const loadUniversities = () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const storedUniversities = localStorage.getItem("universities");
      const loadedUniversities = storedUniversities
        ? JSON.parse(storedUniversities)
        : [];
      setUniversities(loadedUniversities);
      setIsLoading(false);
    }, 800);
  };

  // Get filtered universities based on search
  const getFilteredUniversities = () => {
    if (!searchTerm.trim()) return universities;

    const search = searchTerm.toLowerCase();
    return universities.filter(
      (uni) =>
        uni.nombre.toLowerCase().includes(search) ||
        uni.claveUniversidad.toLowerCase().includes(search) ||
        uni.ubicacion.toLowerCase().includes(search),
    );
  };

  // Get paginated universities
  const getPaginatedUniversities = () => {
    const filteredUniversities = getFilteredUniversities();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredUniversities.slice(start, end);
  };

  // Calculate pagination info
  const getPaginationInfo = () => {
    const filteredUniversities = getFilteredUniversities();
    const totalItems = filteredUniversities.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, totalItems);

    return { totalItems, totalPages, start, end };
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFileBase64(null);
      return;
    }

    // Validate file type
    if (!file.type.match("image.*")) {
      showToast(
        "error",
        "Error de archivo",
        "Por favor selecciona una imagen válida.",
      );
      e.target.value = "";
      return;
    }

    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      showToast(
        "error",
        "Error de archivo",
        "El archivo excede el tamaño máximo de 25MB.",
      );
      e.target.value = "";
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) return;

    if (editingUniversityId) {
      updateUniversity();
    } else {
      addUniversity();
    }
  };

  // Validate form data
  const validateForm = () => {
    // Check required fields
    const requiredFields = [
      "nombre",
      "claveUniversidad",
      "ubicacion",
      "direccion",
      "telefono",
      "emailContacto",
      "email",
    ];
    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        showToast(
          "error",
          "Error de validación",
          `El campo ${getFieldName(field)} es obligatorio.`,
        );
        return false;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailContacto)) {
      showToast(
        "error",
        "Error de validación",
        "El formato del correo electrónico es incorrecto.",
      );
      return false;
    }

    // Check if clave universidad is unique
    const existingWithSameKey = universities.find(
      (uni) =>
        uni.claveUniversidad === formData.claveUniversidad &&
        uni.id !== editingUniversityId,
    );
    if (existingWithSameKey) {
      showToast(
        "error",
        "Error de validación",
        "La clave de universidad ya existe en el sistema.",
      );
      return false;
    }

    // Check if email is unique
    const existingWithSameEmail = universities.find(
      (uni) =>
        uni.emailContacto === formData.emailContacto &&
        uni.id !== editingUniversityId,
    );
    if (existingWithSameEmail) {
      showToast(
        "error",
        "Error de validación",
        "El correo electrónico ya existe en el sistema.",
      );
      return false;
    }

    // Validate admin email format
    if (!emailRegex.test(formData.email)) {
      showToast(
        "error",
        "Error de validación",
        "El formato del Correo Electrónico del Administrador es incorrecto.",
      );
      return false;
    }

    // Password is required for new universities
    if (!editingUniversityId && !formData.password.trim()) {
      showToast(
        "error",
        "Error de validación",
        "El campo Contraseña es obligatorio para nuevas universidades.",
      );
      return false;
    }

    // Check if admin email is unique
    const existingWithSameAdminEmail = universities.find(
      (uni) => uni.email === formData.email && uni.id !== editingUniversityId,
    );
    if (existingWithSameAdminEmail) {
      showToast(
        "error",
        "Error de validación",
        "El correo del administrador ya está en uso.",
      );
      return false;
    }

    return true;
  };

  // Get field display name
  const getFieldName = (key) => {
    const fieldNames = {
      nombre: "Nombre",
      claveUniversidad: "Clave Universidad",
      ubicacion: "Ubicación",
      direccion: "Dirección",
      telefono: "Teléfono",
      emailContacto: "Email Contacto",
      email: "Correo Electrónico del Administrador",
    };
    return fieldNames[key] || key;
  };

  // Add new university
  const addUniversity = () => {
    const now = new Date().toISOString();
    const newUniversity = {
      id: generateId(),
      ...formData,
      logo: fileBase64,
      fechaRegistro: now,
      fechaActualizacion: now,
    };

    const updatedUniversities = [...universities, newUniversity];
    setUniversities(updatedUniversities);
    localStorage.setItem("universities", JSON.stringify(updatedUniversities));

    closeModal();
    showToast(
      "success",
      "Universidad agregada",
      "La universidad ha sido agregada correctamente.",
    );
  };

  // Update existing university
  const updateUniversity = () => {
    const updatedUniversities = universities.map((uni) => {
      if (uni.id === editingUniversityId) {
        // Separate password to handle it conditionally
        const { password, ...restOfForm } = formData;
        const updatedUniversity = {
          ...uni,
          ...restOfForm,
          logo: fileBase64,
          fechaActualizacion: new Date().toISOString(),
        };

        // Only update password if a new one is provided
        if (password) {
          updatedUniversity.password = password;
        }

        return updatedUniversity;
      }
      return uni;
    });

    setUniversities(updatedUniversities);
    localStorage.setItem("universities", JSON.stringify(updatedUniversities));

    closeModal();
    showToast(
      "success",
      "Universidad actualizada",
      "La información ha sido actualizada correctamente.",
    );
  };

  // Delete university
  const deleteUniversity = (id) => {
    const updatedUniversities = universities.filter((uni) => uni.id !== id);
    setUniversities(updatedUniversities);
    localStorage.setItem("universities", JSON.stringify(updatedUniversities));

    closeDeleteModal();
    showToast(
      "success",
      "Universidad eliminada",
      "La universidad ha sido eliminada correctamente.",
    );
  };

  // Open add modal
  const openAddModal = () => {
    setEditingUniversityId(null);
    setFormData({
      nombre: "",
      claveUniversidad: "",
      ubicacion: "",
      direccion: "",
      telefono: "",
      emailContacto: "",
      logo: null,
      email: "",
      password: "",
    });
    setFileBase64(null);
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (university) => {
    setEditingUniversityId(university.id);
    setFormData({
      nombre: university.nombre,
      claveUniversidad: university.claveUniversidad,
      ubicacion: university.ubicacion,
      direccion: university.direccion,
      telefono: university.telefono,
      emailContacto: university.emailContacto,
      logo: university.logo,
      email: university.email || "",
      password: "", // Always clear password on edit for security
    });
    setFileBase64(university.logo);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingUniversityId(null);
    setFileBase64(null);
  };

  // Open delete modal
  const openDeleteModal = (university) => {
    setUniversityToDelete(university);
    setShowDeleteModal(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUniversityToDelete(null);
  };

  // Show toast notification
  const showToast = (type, title, message) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => {
      setToast({ show: false, type: "", title: "", message: "" });
    }, 5000);
  };

  // Generate unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Get page numbers for pagination
  const getPageNumbers = () => {
    const { totalPages } = getPaginationInfo();
    const pages = [];

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4 && startPage > 1) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const { totalItems, totalPages, start, end } = getPaginationInfo();
  const paginatedUniversities = getPaginatedUniversities();

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Gestión de Universidades</h1>
          <div className={styles.userInfo}>
            <span className={styles.userName}>SEDEQ Admin</span>
            <button className={styles.userButton}>
              <i className="fas fa-user-circle"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <button className={styles.addButton} onClick={openAddModal}>
            <i className="fas fa-plus"></i> Agregar Universidad
          </button>

          <div className={styles.searchContainer}>
            <input
              type="search"
              placeholder="Buscar universidad..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
            <i className="fas fa-search"></i>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Cargando universidades...</p>
          </div>
        ) : paginatedUniversities.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-university"></i>
            <h3>No hay universidades registradas</h3>
            <p>Comienza agregando una nueva universidad al sistema</p>
            <button className={styles.emptyStateButton} onClick={openAddModal}>
              <i className="fas fa-plus"></i> Agregar Universidad
            </button>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className={styles.mobileView}>
              {paginatedUniversities.map((university) => (
                <div key={university.id} className={styles.universityCard}>
                  <div className={styles.cardContent}>
                    <div className={styles.logoContainer}>
                      <img
                        src={
                          university.logo ||
                          "https://cdn.pixabay.com/photo/2018/05/08/21/29/university-3384014_1280.png"
                        }
                        alt={university.nombre}
                        className={styles.logo}
                      />
                    </div>
                    <h3 className={styles.universityName}>
                      {university.nombre}
                    </h3>
                    <div className={styles.universityInfo}>
                      <i className="fas fa-key"></i>{" "}
                      {university.claveUniversidad}
                    </div>
                    <div className={styles.universityInfo}>
                      <i className="fas fa-map-marker-alt"></i>{" "}
                      {university.ubicacion}
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openEditModal(university)}
                      >
                        <i className="fas fa-edit"></i> Editar
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => openDeleteModal(university)}
                      >
                        <i className="fas fa-trash-alt"></i> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className={styles.desktopView}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>Nombre</th>
                    <th>Clave</th>
                    <th>Ubicación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUniversities.map((university) => (
                    <tr key={university.id}>
                      <td>
                        <img
                          src={
                            university.logo ||
                            "https://cdn.pixabay.com/photo/2018/05/08/21/29/university-3384014_1280.png"
                          }
                          alt={university.nombre}
                          className={styles.tableLogo}
                        />
                      </td>
                      <td className={styles.universityName}>
                        {university.nombre}
                      </td>
                      <td>{university.claveUniversidad}</td>
                      <td>{university.ubicacion}</td>
                      <td className={styles.tableActions}>
                        <button
                          className={styles.editButton}
                          onClick={() => openEditModal(university)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => openDeleteModal(university)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Mostrando {start}-{end} de {totalItems} universidades
              </div>
              <div className={styles.paginationControls}>
                <button
                  className={styles.pageButton}
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    className={`${styles.pageButton} ${currentPage === page ? styles.activePageButton : ""}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className={styles.pageButton}
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {editingUniversityId
                  ? "Editar Universidad"
                  : "Agregar Universidad"}
              </h3>
              <button className={styles.closeButton} onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    maxLength="150"
                    required
                  />
                  <span className={styles.fieldHelp}>
                    Máximo 150 caracteres
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="claveUniversidad">Clave Universidad *</label>
                  <input
                    type="text"
                    id="claveUniversidad"
                    name="claveUniversidad"
                    value={formData.claveUniversidad}
                    onChange={handleInputChange}
                    maxLength="20"
                    required
                  />
                  <span className={styles.fieldHelp}>Máximo 20 caracteres</span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ubicacion">Ubicación *</label>
                  <input
                    type="text"
                    id="ubicacion"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleInputChange}
                    maxLength="100"
                    required
                  />
                  <span className={styles.fieldHelp}>
                    Máximo 100 caracteres
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="direccion">Dirección *</label>
                  <textarea
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    rows="3"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="telefono">Teléfono *</label>
                  <input
                    type="text"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    maxLength="20"
                    required
                  />
                  <span className={styles.fieldHelp}>Máximo 20 caracteres</span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="emailContacto">Email Contacto *</label>
                  <input
                    type="email"
                    id="emailContacto"
                    name="emailContacto"
                    value={formData.emailContacto}
                    onChange={handleInputChange}
                    maxLength="100"
                    required
                  />
                  <span className={styles.fieldHelp}>
                    Máximo 100 caracteres
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">
                    Correo Electrónico Administrador *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    maxLength="100"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password">Contraseña</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Dejar en blanco para no cambiar"
                  />
                  <span className={styles.fieldHelp}>
                    Solo se requiere si se desea establecer o cambiar.
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="logoFile">Logo</label>
                  <input
                    type="file"
                    id="logoFile"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                  <span className={styles.fieldHelp}>
                    Máximo 25 MB. Formatos: JPG, PNG, GIF
                  </span>

                  {fileBase64 && (
                    <div className={styles.logoPreview}>
                      <img src={fileBase64} alt="Logo preview" />
                      <button
                        type="button"
                        className={styles.removeImageButton}
                        onClick={() => setFileBase64(null)}
                      >
                        <i className="fas fa-trash-alt"></i> Eliminar imagen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && universityToDelete && (
        <div className={styles.modalBackdrop} onClick={closeDeleteModal}>
          <div
            className={styles.deleteModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteModalContent}>
              <div className={styles.deleteIcon}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3>Confirmar eliminación</h3>
              <p>
                ¿Estás seguro de que deseas eliminar la universidad{" "}
                <strong>{universityToDelete.nombre}</strong>? Esta acción no se
                puede deshacer.
              </p>
              <div className={styles.deleteActions}>
                <button
                  className={styles.cancelButton}
                  onClick={closeDeleteModal}
                >
                  Cancelar
                </button>
                <button
                  className={styles.confirmDeleteButton}
                  onClick={() => deleteUniversity(universityToDelete.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={styles.toast}>
          <div className={`${styles.toastContent} ${styles[toast.type]}`}>
            <i
              className={`fas ${
                toast.type === "success"
                  ? "fa-check-circle"
                  : toast.type === "error"
                    ? "fa-exclamation-circle"
                    : "fa-info-circle"
              }`}
            ></i>
            <div>
              <h4>{toast.title}</h4>
              <p>{toast.message}</p>
            </div>
            <button
              onClick={() =>
                setToast({ show: false, type: "", title: "", message: "" })
              }
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManejoUniversidades;
