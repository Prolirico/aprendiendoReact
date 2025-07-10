import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import ManejoUniversidades from "../modules/ManejoUniversidades";

function SEDEQDashboard({ userId }) {
  const [data, setData] = useState({
    students: [],
    teachers: [],
    courses: [],
    universities: [],
  });

  useEffect(() => {}, [userId]);

  return (
    <div className={styles.section}>
      <h1>Dashboard SEDEQ</h1>
      <section>
        <ManejoUniversidades />
      </section>
    </div>
  );
}

export default SEDEQDashboard;
