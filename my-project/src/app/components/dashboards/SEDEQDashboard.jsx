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
    <div className={styles.modulos}>
      <h1>Dashboard SEDEQ1</h1>
      <section>
        <ManejoUniversidades userId={userId} canEdit={true} />
      </section>
      <section>
        <GestionMaestros userId={userId} canEdit={true} />
      </section>
    </div>
  );
}

export default SEDEQDashboard;
