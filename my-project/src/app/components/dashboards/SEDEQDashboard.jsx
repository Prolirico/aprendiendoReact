import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import ManejoUniversidades from "../modules/ManejoUniversidades";
import GestionMaestros from "../modules/GestionMaestros";

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
        <h1>Gestion de Maestros</h1>
        <section>
          <GestionMaestros userId={userId} canEdit={true} />
        </section>
      </div>
    </div>
  );
}

export default SEDEQDashboard;
