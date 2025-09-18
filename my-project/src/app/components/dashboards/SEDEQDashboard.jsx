import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import ManejoUniversidades from "../modules/ManejoUniversidades";
import CarrerasUniversidades from "../modules/CarrerasUniversidades";
import GestionMaestros from "../modules/GestionMaestros";
import GestionCursos from "../modules/GestionCursos";
import CategoriasCursos from "../modules/CategoriasCursos";
import CredencialesCursos from "../modules/CredencialesCursos";
import Inscripciones from "../modules/Inscripciones";
import Dominios from "../modules/Dominios";
import Convocatorias from "../modules/Convocatorias";
import CalificacionCurso from "../modules/CalificacionCurso";

function SEDEQDashboard({ userId }) {
  const [data, setData] = useState({
    students: [],
    teachers: [],
    courses: [],
    universities: [],
  });

  useEffect(() => {}, [userId]);

  return (
    <div className={styles.todo}>
      <div className={styles.modulos}>
        <h1>Gestion de Universidades</h1>
        <section>
          <ManejoUniversidades userId={userId} canEdit={true} />
        </section>
      </div>
      <div className={styles.modulos}>
        <h1>Gestion de Carreras</h1>
        <section>
          <CarrerasUniversidades userId={userId} canEdit={true} />
        </section>
      </div>
      <div className={styles.modulos}>
        <h1>Gestion de Maestros</h1>
        <section>
          <GestionMaestros userId={userId} canEdit={true} />
        </section>
      </div>
      <div className={styles.modulos}>
        <h1>Areas de Concimiento</h1>
        <section>
          <CategoriasCursos />
        </section>
      </div>
      <div className={styles.modulos}>
        <h1>Gestion de Cursos</h1>
        <section>
          <GestionCursos userId={userId} canEdit={true} />
        </section>
      </div>
      <div className={styles.modulos}>
        <h1>Credenciales</h1>
        <section>
          <CredencialesCursos
            userId={userId}
            canEdit={true}
            dashboardType="sedeq"
          />
        </section>
      </div>
      <div className={styles.modulos}>
        <h1>Inscripciones</h1>
        <section>
          <Inscripciones userId={userId} canEdit={true} dashboardType="sedeq" />
        </section>
      </div>
      <div className={styles.modulos}>
        <h1>Convocatorias</h1>
        <section>
          <Convocatorias />
        </section>
      </div>
      <div className={styles.modulos}>
        <h1>Gestión de Dominios</h1>
        <section>
          <Dominios />
        </section>
      </div>
      <div className={styles.modulos}>
        <h1>Gestión de Calificaciones de Cursos</h1>
        <section>
          <CalificacionCurso rol="sedeq" />
        </section>
      </div>      
    </div>
  );
}

export default SEDEQDashboard;