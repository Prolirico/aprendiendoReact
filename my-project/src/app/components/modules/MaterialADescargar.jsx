"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faFilePdf, faLink, faPlus } from "@fortawesome/free-solid-svg-icons";
import styles from "./MaterialADescargar.module.css";

const API_BASE_URL = "http://localhost:5000";

const getSiteName = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
};

const MaterialADescargar = ({ curso, onClose, showToast, showConfirmModal }) => {
  const [materiales, setMateriales] = useState([]);
  const [materialExistente, setMaterialExistente] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const notify = (message, type = "info") => {
    if (showToast) {
      showToast(message, type);
    } else {
      console[type === "error" ? "error" : "log"](message);
    }
  };

  const confirmAction = async (title, message, onConfirm, type = "warning") => {
    if (showConfirmModal) {
      showConfirmModal(title, message, onConfirm, type);
    } else if (window.confirm(message)) {
      await onConfirm();
    }
  };

  const loadMaterialExistente = async () => {
    if (!curso?.id_curso) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/material/curso/${curso.id_curso}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar el material existente");
      }

      const data = await response.json();
      setMaterialExistente(data.material?.material_descarga || []);
    } catch (error) {
      console.error("Error al cargar material existente:", error);
      notify("No se pudo cargar el material existente", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterialExistente();
    setMateriales([]);
  }, [curso?.id_curso]);

  const handleAddMaterial = () => {
    setMateriales((prev) => [
      ...prev,
      {
        nombre: "",
        tipo: "pdf",
        descripcion: "",
        archivo: null,
        link: "",
      },
    ]);
  };

  const handleMaterialChange = (index, field, value) => {
    setMateriales((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveMaterial = (index) => {
    setMateriales((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (event, index) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleMaterialChange(index, "archivo", file);
  };

  const eliminarMaterialExistente = (idMaterial) => {
    confirmAction(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar este material? Esta acción no se puede deshacer.",
      async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${API_BASE_URL}/api/material/${idMaterial}`,
            {
              method: "DELETE",
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            },
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Error al eliminar el material");
          }

          notify("Material eliminado exitosamente", "success");
          loadMaterialExistente();
        } catch (error) {
          notify(error.message || "Error al eliminar el material", "error");
        }
      },
      "warning",
    );
  };

  const materialesNuevosValidos = useMemo(
    () =>
      materiales.filter((material) => {
        if (!material.nombre.trim()) return false;
        if (material.tipo === "pdf") {
          return Boolean(material.archivo);
        }
        if (material.tipo === "link") {
          return Boolean(material.link && material.link.trim());
        }
        return false;
      }),
    [materiales],
  );

  const handleSave = async () => {
    if (!curso?.id_curso) {
      notify("No se encontró el curso seleccionado", "error");
      return;
    }

    if (materiales.length === 0) {
      notify("No hay nuevos materiales para guardar", "warning");
      return;
    }

    if (materialesNuevosValidos.length === 0) {
      notify(
        "Verifica que cada material tenga nombre y archivo o enlace válido",
        "warning",
      );
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      for (const material of materialesNuevosValidos) {
        const formDataMaterial = new FormData();
        formDataMaterial.append("id_curso", curso.id_curso);
        formDataMaterial.append("categoria_material", "material_descarga");
        formDataMaterial.append("nombre_archivo", material.nombre.trim());
        formDataMaterial.append("descripcion", material.descripcion || "");

        if (material.tipo === "pdf") {
          formDataMaterial.append("archivo", material.archivo);
          formDataMaterial.append("es_enlace", "false");
        } else {
          formDataMaterial.append("es_enlace", "true");
          formDataMaterial.append("url_enlace", material.link.trim());
        }

        const responseMaterial = await fetch(`${API_BASE_URL}/api/material`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formDataMaterial,
        });

        if (!responseMaterial.ok) {
          const errorData = await responseMaterial.json().catch(() => ({}));
          throw new Error(
            errorData.error || `No se pudo subir el material "${material.nombre}"`,
          );
        }
      }

      notify("Material guardado correctamente", "success");
      setMateriales([]);
      loadMaterialExistente();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al guardar materiales:", error);
      notify(error.message || "Error al guardar materiales", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            📚 Material a Descargar - {curso?.nombre_curso || "Curso"}
          </h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            type="button"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.tabDescription}>
            Gestiona los recursos que los estudiantes podrán descargar.
          </p>

          {loading ? (
            <div className={styles.loadingState}>
              <p>Cargando material existente...</p>
            </div>
          ) : (
            materialExistente.length > 0 && (
              <div className={styles.existingMaterial}>
                <h3>Material existente</h3>
                {materialExistente.map((item) => (
                  <div key={item.id_material} className={styles.materialCard}>
                    <div className={styles.materialInfo}>
                      <span className={styles.materialName}>
                        <FontAwesomeIcon
                          icon={item.es_enlace ? faLink : faFilePdf}
                          className={
                            item.es_enlace ? styles.linkIcon : styles.pdfIcon
                          }
                        />
                        {item.nombre_archivo}
                      </span>
                      {item.descripcion && (
                        <p className={styles.materialDesc}>{item.descripcion}</p>
                      )}
                      {item.es_enlace && item.url_enlace && (
                        <p className={styles.materialLink}>
                          <a
                            href={item.url_enlace}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkPreview}
                          >
                            {getSiteName(item.url_enlace)}
                          </a>
                        </p>
                      )}
                      <small className={styles.materialDate}>
                        Subido: {new Date(item.fecha_subida).toLocaleDateString()}
                      </small>
                    </div>
                    <div className={styles.materialActions}>
                      {item.es_enlace && item.url_enlace && (
                        <a
                          href={item.url_enlace}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.viewButton}
                          title="Ver enlace"
                        >
                          👁️
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => eliminarMaterialExistente(item.id_material)}
                        className={styles.deleteButton}
                        title="Eliminar material"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {materiales.map((material, index) => (
            <div key={index} className={styles.materialItem}>
              <div className={styles.materialHeader}>
                <input
                  type="text"
                  placeholder="Nombre del material"
                  value={material.nombre}
                  onChange={(e) =>
                    handleMaterialChange(index, "nombre", e.target.value)
                  }
                  className={styles.input}
                />
                <select
                  value={material.tipo}
                  onChange={(e) =>
                    handleMaterialChange(index, "tipo", e.target.value)
                  }
                  className={styles.select}
                >
                  <option value="pdf">📄 PDF</option>
                  <option value="link">🔗 Enlace</option>
                </select>
                <button
                  onClick={() => handleRemoveMaterial(index)}
                  className={styles.deleteButton}
                  title="Eliminar material"
                  type="button"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>

              <div className={styles.materialContent}>
                <div className={styles.formGroup}>
                  <label>Descripción:</label>
                  <textarea
                    value={material.descripcion}
                    onChange={(e) =>
                      handleMaterialChange(index, "descripcion", e.target.value)
                    }
                    className={styles.textarea}
                    rows={2}
                    placeholder="Describe brevemente este material..."
                  />
                </div>

                {material.tipo === "pdf" ? (
                  <div className={styles.formGroup}>
                    <label>Archivo PDF:</label>
                    <div className={styles.fileUploadArea}>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, index)}
                        className={styles.fileInput}
                        id={`material-${index}`}
                      />
                      <label
                        htmlFor={`material-${index}`}
                        className={styles.fileLabel}
                      >
                        📎 {material.archivo ? material.archivo.name : "Seleccionar archivo PDF"}
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label>URL del enlace:</label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/recurso"
                      value={material.link}
                      onChange={(e) =>
                        handleMaterialChange(index, "link", e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={handleAddMaterial}
            className={styles.addButton}
            type="button"
          >
            <FontAwesomeIcon icon={faPlus} /> Añadir Material
          </button>
        </div>

        <div className={styles.modalActions}>
          <button
            onClick={onClose}
            className={styles.buttonSecondary}
            type="button"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={styles.buttonPrimary}
            type="button"
            disabled={saving || materialesNuevosValidos.length === 0}
          >
            {saving ? "Guardando..." : "Guardar Material"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialADescargar;
