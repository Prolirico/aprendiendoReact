import { useState, useEffect } from 'react';
import styles from './CertificadosYConstancias.module.css';
// 1. Importamos FontAwesome para coherencia de iconos
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUpload,
  faCheck,
  faTrash,
  faTimes,
  faFileAlt,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

const CertificadosYConstancias = () => {
  const [userData] = useState({
    id: 1,
    name: 'Administrador SEDEQ',
    role: 'sedeq',
    universidadId: null,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [signatureToDelete, setSignatureToDelete] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const [filters, setFilters] = useState({
    universidad: 'all',
    tipo: 'all',
  });

  const [formData, setFormData] = useState({
    tipo: '',
    universidad: '',
  });

  const [activeTab, setActiveTab] = useState('certificado');
  
  // 2. Reemplazamos el sistema de 'alerts' por el de 'toast' de Dominios
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const universidades = [
    { id: '1', name: 'Universidad Autónoma de Querétaro' },
    { id: '2', name: 'Instituto Tecnológico de Querétaro' },
    { id: '3', name: 'Universidad Politécnica de Querétaro' },
  ];

  const mockSignatures = [
    {
      id: 1,
      tipo: 'rector',
      url: 'https://cdn.pixabay.com/photo/2017/03/07/11/16/signature-2123763_960_720.png',
      universidadId: 1,
      universidadNombre: 'Universidad Autónoma de Querétaro',
      fechaCreacion: '2025-03-15T10:30:00',
    },
    {
      id: 2,
      tipo: 'director',
      url: 'https://cdn.pixabay.com/photo/2017/01/13/01/22/signature-1976296_960_720.png',
      universidadId: 1,
      universidadNombre: 'Universidad Autónoma de Querétaro',
      fechaCreacion: '2025-03-10T14:20:00',
    },
  ];

  useEffect(() => {
    fetchSignatures();
  }, [filters]);

  // 3. Reemplazamos la función de 'alerts' por la de 'toast'
  const showAlert = (type, message) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const fetchSignatures = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let filtered = [...mockSignatures];

    if (userData.role === 'universidad') {
      filtered = filtered.filter(
        (s) => s.universidadId === userData.universidadId
      );
    }

    if (filters.universidad !== 'all') {
      filtered = filtered.filter(
        (s) => s.universidadId === parseInt(filters.universidad)
      );
    }

    if (filters.tipo !== 'all') {
      filtered = filtered.filter((s) => s.tipo === filters.tipo);
    }

    setSignatures(filtered);
    setIsLoading(false);
  };

  // --- El resto de tus funciones de lógica se mantienen idénticas ---
  const handleFileSelection = (file) => {
    if (!file) return;

    if (file.type !== 'image/png') {
      showAlert('error', 'Error: Solo se permiten archivos PNG.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showAlert('error', 'Error: El tamaño máximo permitido es 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview({
        url: e.target.result,
        name: file.name,
        size: formatBytes(file.size),
      });
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tipo || !formData.universidad || !selectedFile) {
      showAlert('error', 'Por favor complete todos los campos y seleccione un archivo.');
      return;
    }

    setIsUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setFormData({ tipo: '', universidad: '' });
    setSelectedFile(null);
    setFilePreview(null);
    setIsUploading(false);

    showAlert('success', 'Firma subida correctamente.');
    fetchSignatures();
  };

  const handleDelete = async () => {
    setIsUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSignatures((prev) => prev.filter((s) => s.id !== signatureToDelete));
    setShowDeleteModal(false);
    setSignatureToDelete(null);
    setIsUploading(false);

    showAlert('success', 'Firma eliminada correctamente.');
  };

  const applySignatures = async () => {
    if (!selectedSignature) return;

    setIsApplying(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsApplying(false);

    showAlert('success', 'Firma aplicada correctamente a los documentos.');
  };

  const getTipoBadgeClass = (tipo) => {
    // El CSS se encargará de estilizar estas clases
    if (tipo === 'rector') return styles.statusRector;
    if (tipo === 'director') return styles.statusDirector;
    return styles.statusCoordinador;
  };

  const certificadoHTML = `...`; // (Contenido HTML omitido por brevedad)
  const constanciaHTML = `...`; // (Contenido HTML omitido por brevedad)
  // --- Fin de tus funciones de lógica ---

  return (
    // 4. Contenedor principal de Dominios
    <div className={styles.container}>
      
      {/* 5. Header de Dominios (azul con letras blancas) */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Gestión de Firmas Digitales</h1>
        </div>
      </header>

      {/* 6. Envoltura de contenido principal de Dominios */}
      <main className={styles.main}>
        
        {/* 7. Tu div de 'grid' que mantendrá el layout 2+1 */}
        <div className={styles.grid}>
          
          {/* Tarjeta 1: Carga Firmas (Clase genérica + específica) */}
          <div className={`${styles.contentCard} ${styles.uploadCard}`}>
            <div className={styles.cardHeader}>
              <span>Cargar Firmas</span>
              <span className={styles.badge}>
                {userData.role === 'sedeq' ? 'SEDEQ' : 'UNIVERSIDAD'}
              </span>
            </div>
            <div className={styles.cardBody}>
              {/* Tu formulario (solo se cambian clases de botones) */}
              <div onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  {/* ... (inputs sin cambios) ... */}
                  <label>Tipo de Firma</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value })
                    }
                    required
                  >
                    <option value="">Seleccionar tipo...</option>
                    <option value="rector">Rector</option>
                    <option value="director">Director</option>
                    <option value="coordinador">Coordinador</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Universidad</label>
                  <select
                    value={formData.universidad}
                    onChange={(e) =>
                      setFormData({ ...formData, universidad: e.target.value })
                    }
                    disabled={userData.role === 'universidad'}
                    required
                  >
                    <option value="">Seleccionar universidad...</option>
                    {universidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Archivo de Firma (PNG con transparencia)</label>
                  <div
                    className={styles.dropzone}
                    onClick={() => document.getElementById('fileInput').click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add(styles.active);
                    }}
                    onDragLeave={(e) =>
                      e.currentTarget.classList.remove(styles.active)
                    }
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove(styles.active);
                      if (e.dataTransfer.files.length) {
                        handleFileSelection(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faUpload} size="2x" />
                    <p>Arrastra y suelta o haz clic para seleccionar</p>
                    <p className={styles.dropzoneHint}>
                      PNG con transparencia, máximo 2MB
                    </p>
                  </div>
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/png"
                    style={{ display: 'none' }}
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
                
                {/* 8. Botón adaptado a Dominios (azul) */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={styles.addButton} 
                  disabled={isUploading}
                >
                  <FontAwesomeIcon icon={faUpload} />{' '}
                  {isUploading ? 'Subiendo...' : 'Subir Firma'}
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Galería Firmas (Clase genérica + específica) */}
          <div className={`${styles.contentCard} ${styles.galleryCard}`}>
            <div className={styles.cardHeader}>
              <span>Galería de Firmas</span>
              <div className={styles.filters}>
                {/* ... (selects de filtros sin cambios) ... */}
                <select
                  value={filters.universidad}
                  onChange={(e) =>
                    setFilters({ ...filters, universidad: e.target.value })
                  }
                  disabled={userData.role === 'universidad'}
                >
                  <option value="all">Todas las universidades</option>
                  {universidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.tipo}
                  onChange={(e) =>
                    setFilters({ ...filters, tipo: e.target.value })
                  }
                >
                  <option value="all">Todos los tipos</option>
                  <option value="rector">Rector</option>
                  <option value="director">Director</option>
                  <option value="coordinador">Coordinador</option>
                </select>
              </div>
            </div>
            <div className={styles.cardBody}>
              {isLoading ? (
                // 9. Spinner estilo Dominios
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Cargando firmas...</p>
                </div>
              ) : signatures.length === 0 ? (
                // 10. Empty state estilo Dominios
                <div className={styles.emptyState}>
                  <FontAwesomeIcon icon={faFileAlt} size="3x" />
                  <h3>No hay firmas</h3>
                  <p>Las firmas que subas aparecerán aquí.</p>
                </div>
              ) : (
                <div className={styles.signatureGallery}>
                  {signatures.map((sig) => (
                    <div
                      key={sig.id}
                      className={`${styles.signatureItem} ${
                        selectedSignature === sig.id
                          ? styles.selectedSignature
                          : ''
                      }`}
                    >
                      <span
                        className={`${styles.statusBadge} ${getTipoBadgeClass(
                          sig.tipo
                        )}`}
                      >
                        {sig.tipo}
                      </span>
                      <img
                        src={sig.url}
                        alt={`Firma ${sig.tipo}`}
                        className={styles.signatureImg}
                      />
                      <div className={styles.signatureInfo}>
                        <p>
                          <strong>{sig.universidadNombre}</strong>
                        </p>
                        <p className={styles.signatureDate}>
                          Subida:{' '}
                          {new Date(sig.fechaCreacion).toLocaleDateString(
                            'es-MX',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </p>
                      </div>
                      <div className={styles.signatureActions}>
                        {/* 11. Botones adaptados a Dominios (verde y rojo) */}
                        <button
                          className={styles.editButton} 
                          onClick={() =>
                            setSelectedSignature(
                              selectedSignature === sig.id ? null : sig.id
                            )
                          }
                        >
                          <FontAwesomeIcon icon={faCheck} /> Seleccionar
                        </button>
                        <button
                          className={styles.deleteButton} 
                          onClick={() => {
                            setSignatureToDelete(sig.id);
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

          {/* Tarjeta 3: Vista Previa (Clase genérica + específica) */}
          <div className={`${styles.contentCard} ${styles.previewCard}`}>
            <div className={styles.cardHeader}>
              <span>Vista Previa de Documentos</span>
              {/* 12. Botón adaptado a Dominios (azul) */}
              <button
                className={styles.saveButton} 
                disabled={!selectedSignature || isApplying}
                onClick={applySignatures}
              >
                <FontAwesomeIcon icon={faCheck} />{' '}
                {isApplying ? 'Aplicando...' : 'Aplicar Firmas'}
              </button>
            </div>
            <div className={styles.cardBody}>
              {/* Tu lógica de tabs se mantiene idéntica */}
              <div className={styles.tabs}>
                <button
                  className={activeTab === 'certificado' ? styles.tabActive : ''}
                  onClick={() => setActiveTab('certificado')}
                >
                  Certificado
                </button>
                <button
                  className={activeTab === 'constancia' ? styles.tabActive : ''}
                  onClick={() => setActiveTab('constancia')}
                >
                  Constancia
                </button>
              </div>
              <div className={styles.tabContent}>
                {activeTab === 'certificado' ? (
                  <iframe
                    srcDoc={certificadoHTML}
                    className={styles.previewDocument}
                    title="Certificado"
                  />
                ) : (
                  <iframe
                    srcDoc={constanciaHTML}
                    className={styles.previewDocument}
                    title="Constancia"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 13. Modal de Eliminación (estructura de Dominios) */}
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
                disabled={isUploading}
              >
                {isUploading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. Toast Notification (estructura de Dominios) */}
      {toast.show && (
        <div className={styles.toast}>
          <div className={`${styles.toastContent} ${styles[toast.type]}`}>
            <p>{toast.message}</p>
          </div>
        </div>
      )}

      {/* 15. Tu footer (será estilizado por el CSS) */}
      <footer className={styles.footer}>
        <p>Sistema de Gestión de Firmas Digitales © 2025 - SEDEQ</p>
      </footer>
    </div>
  );
};

export default CertificadosYConstancias;