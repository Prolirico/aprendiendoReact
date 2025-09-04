import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import CursosYCredencialesAlumno from "../modules/CursoYCredencialesAlumno";
import CardConvocatoriaBienvenido from "../controls/CardConvocatoriaBienvenido";

function StudentDashboard({ userId }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Mock API call to fetch enrolled courses
    setCourses([
      { id: 1, title: "Intro to Programming", progress: 50 },
      { id: 2, title: "Data Science Basics", progress: 20 },
    ]);
    // Replace with API call: fetch(`/api/students/${userId}/courses`)
  }, [userId]);

  return (
    <div className={styles.todo}>
      <div className={styles.modulos}>
        <CardConvocatoriaBienvenido></CardConvocatoriaBienvenido>
        <h1>Tomar Cursos y Credenciales</h1>
        <section>
          <CursosYCredencialesAlumno userId={userId} canEdit={true} />
        </section>
      </div>
    </div>
  );
}

export default StudentDashboard;
