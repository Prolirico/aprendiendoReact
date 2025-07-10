import React, { useEffect, useState } from "react";
import styles from "./ManejoUniversidades.module.css"; // Asumiendo que tienes estilos
// Importar funciones para interactuar con el backend (aún por definir)

function ManejoUniversidades() {
  const [universities, setUniversities] = useState([]);
  const [newUniversity, setNewUniversity] = useState({
    nombre: "",
    email: "",
    password: "", // Esta será hasheada
    // Otros campos relevantes de la universidad
  });
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // useEffect para cargar las universidades al montar el componente
  useEffect(() => {
    // Lógica para obtener la lista de universidades desde el backend
    // fetchUniversities();
  }, []);

  // Funciones para manejar la lógica de agregar, editar, eliminar, etc.
  const handleAddUniversity = async () => {
    // Lógica para enviar los datos de la nueva universidad al backend
    // Se enviará el nombre, email y la contraseña en texto plano para que el backend la hashee
    // Luego se actualizará la lista de universidades
  };

  const handleEditUniversity = (university) => {
    // Lógica para precargar los datos de la universidad en el formulario de edición
    setEditingUniversity(university);
    setShowPasswordForm(false); // Ocultar el formulario de contraseña al editar otros campos
  };

  const handleUpdateUniversity = async () => {
    // Lógica para enviar los cambios de la universidad al backend
    // Si se cambia la contraseña, se enviará la nueva contraseña en texto plano
    // Luego se actualizará la lista de universidades
  };

  const handleDeleteUniversity = async (id) => {
    // Lógica para eliminar una universidad del backend
    // Luego se actualizará la lista de universidades
  };

  const handleChangePassword = async (id) => {
    // Lógica para cambiar la contraseña de una universidad
    // Se necesitará un formulario separado para esto
  };

  return (
    <div className={styles.universitiesContainer}>
      <h2>Gestión de Universidades</h2>

      {/* Formulario para agregar/editar universidades */}
      {editingUniversity ? (
        <div>
          <h3>Editar Universidad</h3>
          {/* Campos del formulario para editar universidad */}
          <input
            type="text"
            placeholder="Nombre de la Universidad"
            value={editingUniversity.nombre}
            onChange={(e) =>
              setEditingUniversity({
                ...editingUniversity,
                nombre: e.target.value,
              })
            }
          />
          <input
            type="email"
            placeholder="Email"
            value={editingUniversity.email}
            onChange={(e) =>
              setEditingUniversity({
                ...editingUniversity,
                email: e.target.value,
              })
            }
          />
          {/* Botón para mostrar/ocultar el cambio de contraseña */}
          {!showPasswordForm && (
            <button onClick={() => setShowPasswordForm(true)}>
              Cambiar Contraseña
            </button>
          )}
          {showPasswordForm && (
            <div>
              <input
                type="password"
                placeholder="Nueva Contraseña"
                // ... manejador onChange para la nueva contraseña
              />
              <button onClick={handleUpdateUniversity}>Guardar Cambios</button>
              <button onClick={() => setShowPasswordForm(false)}>
                Cancelar
              </button>
            </div>
          )}
          <button onClick={handleUpdateUniversity}>Guardar Cambios</button>
          <button onClick={() => setEditingUniversity(null)}>Cancelar</button>
        </div>
      ) : (
        <div>
          <h3>Agregar Nueva Universidad</h3>
          <input
            type="text"
            placeholder="Nombre de la Universidad"
            value={newUniversity.nombre}
            onChange={(e) =>
              setNewUniversity({ ...newUniversity, nombre: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            value={newUniversity.email}
            onChange={(e) =>
              setNewUniversity({ ...newUniversity, email: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={newUniversity.password}
            onChange={(e) =>
              setNewUniversity({ ...newUniversity, password: e.target.value })
            }
          />
          <button onClick={handleAddUniversity}>Agregar Universidad</button>
        </div>
      )}

      {/* Listado de universidades */}
      <h3>Lista de Universidades</h3>
      <ul>
        {universities.map((uni) => (
          <li key={uni.id}>
            {uni.nombre} - {uni.email}
            <button onClick={() => handleEditUniversity(uni)}>Editar</button>
            <button onClick={() => handleDeleteUniversity(uni.id)}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ManejoUniversidades;
