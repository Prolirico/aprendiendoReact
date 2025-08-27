import React, { useState, useEffect } from "react";
import styles from "./Inscripciones.module.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faBook, faClipboardList, faChartBar, faSyncAlt, faDownload, faCheck, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';

function Inscripciones() {
  const [activeTab, setActiveTab] = useState('credenciales');
  const [selectedFilter, setSelectedFilter] = useState({
    credencial: 'todas',
    curso: 'todos',
    estado: 'todos'
  });
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setLoading(false);
      setApplications([]);
    }, 2000);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilter(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleShowDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleApprove = () => {
    // Lógica para aprobar solicitud
    console.log('Aprobando solicitud:', selectedApplication);
    setShowModal(false);
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    // Lógica para rechazar solicitud
    console.log('Rechazando solicitud:', selectedApplication, 'Motivo:', rejectReason);
    setShowRejectModal(false);
    setShowModal(false);
    setRejectReason('');
  };

  const exportToCSV = () => {
    // Lógica para exportar a CSV
    console.log('Exportando datos a CSV');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'credenciales':
        return (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2>Credenciales</h2>
              <p>Administre las credenciales y cursos que ofrece la institución</p>
            </div>
            <div className={styles.contentArea}>
              {loading ? (
                <div className={styles.loading}>Cargando...</div>
              ) : (
                <div className={styles.emptyState}>No hay credenciales disponibles</div>
              )}
            </div>
          </div>
        );

      case 'cursos':
        return (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2>Cursos sin Credencial</h2>
              <p>Lista de cursos que no están asociados a ninguna credencial</p>
            </div>
            <div className={styles.contentArea}>
              {loading ? (
                <div className={styles.loading}>Cargando...</div>
              ) : (
                <div className={styles.emptyState}>No hay cursos sin credencial</div>
              )}
            </div>
          </div>
        );

      case 'inscripciones':
        return (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2>Panel de Inscripciones</h2>
              <p>Gestione las solicitudes de inscripción de los alumnos</p>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                <label>Filtrar por Credencial</label>
                <select 
                  value={selectedFilter.credencial}
                  onChange={(e) => handleFilterChange('credencial', e.target.value)}
                >
                  <option value="todas">Todas las Credenciales</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Filtrar por Curso</label>
                <select 
                  value={selectedFilter.curso}
                  onChange={(e) => handleFilterChange('curso', e.target.value)}
                >
                  <option value="todos">Todos los Cursos</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Filtrar por Estado</label>
                <select 
                  value={selectedFilter.estado}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="solicitada">Solicitada</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                  <option value="completada">Completada</option>
                  <option value="abandonada">Abandonada</option>
                </select>
              </div>
            </div>

            {/* Applications Table */}
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h3>Solicitudes de Inscripción</h3>
                <button className={styles.updateButton}>
                  <i className="fas fa-sync-alt"></i> Actualizar
                </button>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Curso</th>
                      <th>Fecha de Solicitud</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className={styles.loading}>Cargando...</td>
                      </tr>
                    ) : applications.length === 0 ? (
                      <tr>
                        <td colSpan="5" className={styles.emptyState}>
                          <div className={styles.emptyStateContent}>
                            <h4>No hay solicitudes de inscripción</h4>
                            <p>No se encontraron solicitudes con los filtros seleccionados</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      applications.map(app => (
                        <tr key={app.id}>
                          <td>{app.student}</td>
                          <td>{app.course}</td>
                          <td>{app.date}</td>
                          <td><span className={`${styles.status} ${styles[app.status]}`}>{app.status}</span></td>
                          <td>
                            <button 
                              className={styles.actionButton}
                              onClick={() => handleShowDetails(app)}
                            >
                              Ver Detalles
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'analisis':
        return (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2>Análisis de Inscripciones</h2>
              <p>Visualice métricas y estadísticas sobre las inscripciones</p>
            </div>

            <div className={styles.analyticsActions}>
              <button className={styles.exportButton} onClick={exportToCSV}>
                <i className="fas fa-download"></i> Exportar a CSV
              </button>
            </div>

            {/* Metrics Cards */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <h4>Total de Solicitudes</h4>
                </div>
                <div className={styles.metricValue}>
                  <span className={styles.bigNumber}>0</span>
                  <span className={styles.metricLabel}>Solicitudes Procesadas</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <h4>Tasa de Aprobación</h4>
                </div>
                <div className={styles.metricValue}>
                  <span className={styles.bigNumber}>0%</span>
                  <span className={styles.metricLabel}>Solicitudes Aprobadas</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <h4>Pendientes</h4>
                </div>
                <div className={styles.metricValue}>
                  <span className={styles.bigNumber}>0</span>
                  <span className={styles.metricLabel}>Solicitudes por Procesar</span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h4>Solicitudes por Tiempo</h4>
                <div className={styles.chartContent}>
                  {loading ? (
                    <div className={styles.loading}>Cargando...</div>
                  ) : (
                    <div className={styles.emptyChart}>No hay datos para mostrar</div>
                  )}
                </div>
              </div>

              <div className={styles.chartCard}>
                <h4>Estado de Solicitudes</h4>
                <div className={styles.chartContent}>
                  {loading ? (
                    <div className={styles.loading}>Cargando...</div>
                  ) : (
                    <div className={styles.emptyChart}>No hay datos para mostrar</div>
                  )}
                </div>
              </div>

              <div className={styles.chartCard}>
                <h4>Cursos Más Solicitados</h4>
                <div className={styles.chartContent}>
                  {loading ? (
                    <div className={styles.loading}>Cargando...</div>
                  ) : (
                    <div className={styles.emptyChart}>No hay datos para mostrar</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Inscripciones</h1>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.layout}>
          {/* Sidebar Navigation */}
          <nav className={styles.sidebar}>
            <button 
              className={`${styles.sidebarButton} ${activeTab === 'credenciales' ? styles.active : ''}`}
              onClick={() => handleTabChange('credenciales')}
              title="Credenciales"
            >
              <FontAwesomeIcon icon={faGraduationCap} />
              <span className={styles.sidebarLabel}>Credenciales</span>
            </button>
            
            <button 
              className={`${styles.sidebarButton} ${activeTab === 'cursos' ? styles.active : ''}`}
              onClick={() => handleTabChange('cursos')}
              title="Cursos sin Credencial"
            >
              <FontAwesomeIcon icon={faBook} />
              <span className={styles.sidebarLabel}>Cursos sin Credencial</span>
            </button>
            
            <button 
              className={`${styles.sidebarButton} ${activeTab === 'inscripciones' ? styles.active : ''}`}
              onClick={() => handleTabChange('inscripciones')}
              title="Panel de Inscripciones"
            >
              <FontAwesomeIcon icon={faClipboardList} />
              <span className={styles.sidebarLabel}>Panel de Inscripciones</span>
            </button>
            
            <button 
              className={`${styles.sidebarButton} ${activeTab === 'analisis' ? styles.active : ''}`}
              onClick={() => handleTabChange('analisis')}
              title="Análisis"
            >
              <FontAwesomeIcon icon={faChartBar} />
              <span className={styles.sidebarLabel}>Análisis</span>
            </button>
          </nav>

          {/* Content Area */}
          <div className={styles.content}>
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Modal de Detalles */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Detalles de la Solicitud</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.detailsGrid}>
                <div className={styles.detailSection}>
                  <h4>Información del Alumno</h4>
                  <p>Nombre: --</p>
                  <p>Email: --</p>
                  <p>Teléfono: --</p>
                </div>
                
                <div className={styles.detailSection}>
                  <h4>Información del Curso</h4>
                  <p>Curso: --</p>
                  <p>Credencial: --</p>
                  <p>Instructor: --</p>
                </div>

                <div className={styles.detailSection}>
                  <h4>Estado de la Solicitud</h4>
                  <p>Fecha de Solicitud: --</p>
                  <p>Estado Actual: --</p>
                  <p>Aprobado por: --</p>
                </div>

                <div className={styles.detailSection}>
                  <h4>Motivo de Rechazo</h4>
                  <p>--</p>
                </div>
              </div>

              <div className={styles.modalActions}>
                <h4>Actualizar Estado</h4>
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.approveButton}
                    onClick={handleApprove}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Aprobar
                  </button>
                  <button 
                    className={styles.rejectButton}
                    onClick={handleReject}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Rechazar
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.closeModalButton}
                onClick={() => setShowModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Rechazo */}
      {showRejectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Motivo del rechazo</h3>
            </div>
            
            <div className={styles.modalContent}>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Por favor, proporcione un motivo para el rechazo."
                className={styles.textarea}
              />
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.confirmButton}
                onClick={confirmReject}
              >
                Confirmar rechazo
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inscripciones;