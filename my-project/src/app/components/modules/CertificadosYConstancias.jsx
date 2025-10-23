import { useState, useEffect, useCallback } from "react";
import styles from "./CertificadosYConstancias.module.css";
import { useAuth } from "@/hooks/useAuth"; // Importamos el hook de autenticación
import axios from "axios";

// Iconos de FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faCheck,
  faTrash,
  faTimes,
  faFileAlt,
  faSpinner,
  faSignature,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CertificadosYConstancias = () => {
  const { user } = useAuth(); // Obtenemos el usuario del hook

  // Estados del componente
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [signatureToDelete, setSignatureToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // Unifica isUploading y isApplying
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [universidades, setUniversidades] = useState([]);
  const [formData, setFormData] = useState({
    tipo_firma: "",
    id_universidad: "",
  });

  const [activeTab, setActiveTab] = useState("constancia");
  const [certificadoHTML, setCertificadoHTML] = useState("");
  const [constanciaHTML, setConstanciaHTML] = useState("");
  const [selectedUniversidadPreview, setSelectedUniversidadPreview] =
    useState("");

  // Función para mostrar notificaciones
  const showAlert = (type, message) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Cargar las plantillas HTML
  useEffect(() => {
    fetch("/constancia.html")
      .then((res) => res.text())
      .then((text) => setConstanciaHTML(text))
      .catch((err) => console.error("Error cargando constancia.html", err));

    fetch("/certificado.html")
      .then((res) => res.text())
      .then((text) => setCertificadoHTML(text))
      .catch((err) => console.error("Error cargando certificado.html", err));
  }, []);

  // Cargar universidades para los selectores
  useEffect(() => {
    const fetchUniversidades = async () => {
      try {
        console.log("Fetching universidades from: /api/universidades");
        const response = await axios.get("/api/universidades");
        console.log("Universidades response:", response.data);

        // La respuesta puede ser un objeto con universidades o un array directo
        const universidadesData = response.data.universities || response.data;
        setUniversidades(
          Array.isArray(universidadesData) ? universidadesData : [],
        );
        console.log("Universidades cargadas:", universidadesData);
      } catch (error) {
        console.error("Error al cargar universidades:", error);
        console.error("Error details:", error.response?.data || error.message);
        showAlert("error", "No se pudieron cargar las universidades.");
        setUniversidades([]);
      }
    };
    fetchUniversidades();
  }, []);

  // Cargar las firmas desde la API
  const fetchSignatures = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/api/firmas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSignatures(data);
    } catch (error) {
      showAlert("error", "Error al cargar las firmas.");
      console.error("Error al cargar firmas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Solo buscar firmas si el usuario está cargado
      fetchSignatures();
    }
  }, [user, fetchSignatures]);

  // Configurar el formulario basado en el rol del usuario
  useEffect(() => {
    if (user && user.role === "admin_universidad") {
      setFormData((prev) => ({ ...prev, id_universidad: user.id_universidad }));
    }
  }, [user]);

  const handleFileSelection = (file) => {
    if (!file) return;
    if (file.type !== "image/png") {
      showAlert("error", "Error: Solo se permiten archivos PNG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showAlert("error", "Error: El tamaño máximo del archivo es 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) =>
      setFilePreview({
        url: e.target.result,
        name: file.name,
        size: formatBytes(file.size),
      });
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Manejar la subida de una nueva firma
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.tipo_firma ||
      !selectedFile ||
      (formData.tipo_firma !== "sedeq" && !formData.id_universidad)
    ) {
      showAlert("error", "Por favor complete todos los campos requeridos.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("tipo_firma", formData.tipo_firma);
    uploadData.append("firma", selectedFile);
    if (formData.tipo_firma !== "sedeq") {
      uploadData.append("id_universidad", formData.id_universidad);
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/firmas", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      showAlert("success", "Firma subida correctamente.");
      // Resetear formulario
      setFormData((prev) => ({ ...prev, tipo_firma: "" }));
      setSelectedFile(null);
      setFilePreview(null);
      fetchSignatures(); // Recargar la lista de firmas
    } catch (error) {
      showAlert("error", "Error al subir la firma.");
      console.error("Error al subir firma:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar la eliminación de una firma
  const handleDelete = async () => {
    if (!signatureToDelete) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/firmas/${signatureToDelete.id_firma}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showAlert("success", "Firma eliminada correctamente.");
      setShowDeleteModal(false);
      setSignatureToDelete(null);
      fetchSignatures(); // Recargar la lista
    } catch (error) {
      showAlert("error", "Error al eliminar la firma.");
      console.error("Error al eliminar firma:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Función para actualizar la vista previa con datos dinámicos
  const updateIframePreview = useCallback(() => {
    if (!selectedUniversidadPreview) return;

    const iframe = document.querySelector("iframe.previewDocument");
    if (!iframe || !iframe.contentDocument) return;

    const iframeDoc = iframe.contentDocument;
    const universidad = universidades.find(
      (u) => String(u.id_universidad) === String(selectedUniversidadPreview),
    );

    if (!universidad) return;

    // Actualizar logo de universidad
    const logoImgs = iframeDoc.querySelectorAll(
      '[data-field="logoUniversidad"]',
    );
    logoImgs.forEach((img) => {
      if (universidad.logo_url) {
        img.src = `${SERVER_URL}${universidad.logo_url}`;
      }
    });

    // Actualizar nombre de universidad
    const nombreUnivElements = iframeDoc.querySelectorAll(
      '[data-field="nombreUniversidad"]',
    );
    nombreUnivElements.forEach((el) => {
      el.textContent = universidad.nombre;
    });

    // Obtener firmas de la universidad seleccionada
    const firmaSedeq = signatures.find((s) => s.tipo_firma === "sedeq");
    const firmaUniversidad = signatures.find(
      (s) =>
        s.tipo_firma === "universidad" &&
        String(s.id_universidad) === String(selectedUniversidadPreview),
    );
    const firmaCoordinador = signatures.find(
      (s) =>
        s.tipo_firma === "coordinador" &&
        String(s.id_universidad) === String(selectedUniversidadPreview),
    );

    // Actualizar firma SEDEQ
    if (firmaSedeq && firmaSedeq.imagen_url) {
      const firmaSedeqImgs = iframeDoc.querySelectorAll('[data-firma="sedeq"]');
      firmaSedeqImgs.forEach((img) => {
        img.src = firmaSedeq.imagen_url;
        img.style.display = "block";
      });
    }

    // Actualizar firma Universidad
    if (firmaUniversidad && firmaUniversidad.imagen_url) {
      const firmaUnivImgs = iframeDoc.querySelectorAll(
        '[data-firma="universidad"]',
      );
      firmaUnivImgs.forEach((img) => {
        img.src = firmaUniversidad.imagen_url;
        img.style.display = "block";
      });
    }

    // Actualizar firma Coordinador
    if (firmaCoordinador && firmaCoordinador.imagen_url) {
      const firmaCoordImgs = iframeDoc.querySelectorAll(
        '[data-firma="coordinador"]',
      );
      firmaCoordImgs.forEach((img) => {
        img.src = firmaCoordinador.imagen_url;
        img.style.display = "block";
      });
    }
  }, [selectedUniversidadPreview, universidades, signatures]);

  // Ejecutar actualización cuando cambie la selección o se carguen datos
  useEffect(() => {
    const timer = setTimeout(() => {
      updateIframePreview();
    }, 500); // Esperar a que el iframe cargue completamente

    return () => clearTimeout(timer);
  }, [updateIframePreview]);

  // Renderizado del componente
  if (!user) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando datos de usuario...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Gestión de Firmas Digitales</h1>
          {/* Debug info - remover después */}
          <small style={{ fontSize: "12px", opacity: 0.8 }}>
            Universidades cargadas: {universidades.length}
          </small>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          {/* Tarjeta de Carga de Firmas */}
          <div className={`${styles.contentCard} ${styles.uploadCard}`}>
            <div className={styles.cardHeader}>
              <span>Cargar Nueva Firma</span>
              <span className={styles.badge}>
                {user.role === "admin_sedeq" ? "SEDEQ" : "UNIVERSIDAD"}
              </span>
            </div>
            <div className={styles.cardBody}>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Tipo de Firma</label>
                  <select
                    name="tipo_firma"
                    value={formData.tipo_firma}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Seleccionar tipo...</option>
                    {user.role === "admin_sedeq" && (
                      <option value="sedeq">SEDEQ</option>
                    )}
                    <option value="universidad">Universidad</option>
                    <option value="coordinador">Coordinador</option>
                  </select>
                </div>

                {formData.tipo_firma !== "sedeq" && (
                  <div className={styles.formGroup}>
                    <label>
                      Universidad{" "}
                      {universidades.length === 0 && "(Cargando...)"}
                    </label>
                    <select
                      name="id_universidad"
                      value={formData.id_universidad}
                      onChange={handleFormChange}
                      disabled={user.role === "admin_universidad"}
                      required
                    >
                      <option value="">
                        {universidades.length === 0
                          ? "Cargando universidades..."
                          : "Seleccionar universidad..."}
                      </option>
                      {universidades.map((u) => (
                        <option key={u.id_universidad} value={u.id_universidad}>
                          {u.nombre || `Universidad ${u.id_universidad}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Archivo de Firma (PNG)</label>
                  <div
                    className={styles.dropzone}
                    onClick={() => document.getElementById("fileInput").click()}
                  >
                    <FontAwesomeIcon icon={faUpload} size="2x" />
                    <p>Arrastra o haz clic para seleccionar</p>
                    <p className={styles.dropzoneHint}>
                      PNG con transparencia, máx 2MB
                    </p>
                  </div>
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/png"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileSelection(e.target.files[0])}
                  />
                  {filePreview && (
                    <div className={styles.filePreview}>
                      <img src={filePreview.url} alt="Preview" />
                      <div className={styles.fileInfo}>
                        <p>{filePreview.name}</p>
                        <small>{filePreview.size}</small>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFilePreview(null);
                          setSelectedFile(null);
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={styles.addButton}
                  disabled={isProcessing}
                >
                  <FontAwesomeIcon
                    icon={isProcessing ? faSpinner : faUpload}
                    spin={isProcessing}
                  />
                  {isProcessing ? "Subiendo..." : "Subir Firma"}
                </button>
              </form>
            </div>
          </div>

          {/* Galería de Firmas */}
          <div className={`${styles.contentCard} ${styles.galleryCard}`}>
            <div className={styles.cardHeader}>
              <span>Galería de Firmas</span>
            </div>
            <div className={styles.cardBody}>
              {isLoading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Cargando firmas...</p>
                </div>
              ) : signatures.length === 0 ? (
                <div className={styles.emptyState}>
                  <FontAwesomeIcon icon={faSignature} size="3x" />
                  <h3>No hay firmas</h3>
                  <p>Las firmas que subas aparecerán aquí.</p>
                </div>
              ) : (
                <div className={styles.signatureGallery}>
                  {signatures.map((sig) => (
                    <div key={sig.id_firma} className={styles.signatureItem}>
                      <span
                        className={`${styles.statusBadge} ${styles[`status${sig.tipo_firma.charAt(0).toUpperCase() + sig.tipo_firma.slice(1)}`]}`}
                      >
                        {sig.tipo_firma}
                      </span>
                      <img
                        src={sig.imagen_url}
                        alt={`Firma ${sig.tipo_firma}`}
                        className={styles.signatureImg}
                      />
                      <div className={styles.signatureInfo}>
                        <p>
                          <strong>{sig.nombre_universidad || "SEDEQ"}</strong>
                        </p>
                        <p className={styles.signatureDate}>
                          Subida:{" "}
                          {new Date(sig.fecha_subida).toLocaleDateString(
                            "es-MX",
                          )}
                        </p>
                      </div>
                      <div className={styles.signatureActions}>
                        <button
                          className={styles.deleteButton}
                          onClick={() => {
                            setSignatureToDelete(sig);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vista Previa */}
          <div className={`${styles.contentCard} ${styles.previewCard}`}>
            <div className={styles.cardHeader}>
              <span>Vista Previa de Documentos</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label>Seleccionar Universidad para Vista Previa</label>
                <select
                  value={selectedUniversidadPreview}
                  onChange={(e) =>
                    setSelectedUniversidadPreview(e.target.value)
                  }
                >
                  <option value="">Seleccionar universidad...</option>
                  {universidades.map((u) => (
                    <option key={u.id_universidad} value={u.id_universidad}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.tabs}>
                <button
                  className={activeTab === "constancia" ? styles.tabActive : ""}
                  onClick={() => setActiveTab("constancia")}
                >
                  Constancia
                </button>
                <button
                  className={
                    activeTab === "certificado" ? styles.tabActive : ""
                  }
                  onClick={() => setActiveTab("certificado")}
                >
                  Certificado
                </button>
              </div>
              <div className={styles.tabContent}>
                <iframe
                  src={
                    activeTab === "constancia"
                      ? "/constancia.html"
                      : "/certificado.html"
                  }
                  className={styles.previewDocument}
                  title={
                    activeTab === "constancia" ? "Constancia" : "Certificado"
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Eliminación */}
      {showDeleteModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className={styles.deleteModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteModalContent}>
              <div className={styles.deleteIcon}>
                <FontAwesomeIcon icon={faTrash} />
              </div>
              <h3>Confirmar eliminación</h3>
              <p>
                ¿Estás seguro de que deseas eliminar esta firma? Esta acción no
                se puede deshacer.
              </p>
            </div>
            <div className={styles.deleteActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmDeleteButton}
                onClick={handleDelete}
                disabled={isProcessing}
              >
                {isProcessing ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación Toast */}
      {toast.show && (
        <div className={styles.toast}>
          <div className={`${styles.toastContent} ${styles[toast.type]}`}>
            <p>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificadosYConstancias;
