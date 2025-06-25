import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";

function SEDEQDashboard({ userId }) {
  const [data, setData] = useState({
    students: [],
    teachers: [],
    courses: [],
    universities: [],
  });

  useEffect(() => {
    // Mock API call to fetch all data
    console.log("Fetching SEDEQ data for userId:", userId); // Depuración
    setData({
      students: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
      teachers: [
        { id: 1, name: "Dr. Smith" },
        { id: 2, name: "Prof. Jones" },
      ],
      courses: [
        { id: 1, title: "Intro to Programming" },
        { id: 2, title: "Data Science Basics" },
      ],
      universities: [{ id: 1, name: "Uni QRO" }],
    });
    console.log("SEDEQ data updated:", data); // Depuración
    // TODO: Replace with actual API call: fetch(`/api/sedeq/${userId}/overview`)
  }, [userId]);

  return (
    <div className={styles.section}>
      <h2>SEDEQ Overview</h2>
      <div>
        <h3>Students</h3>
        <p>Total: {data.students.length}</p>
      </div>
      <div>
        <h3>Teachers</h3>
        <p>Total: {data.teachers.length}</p>
      </div>
      <div>
        <h3>Courses</h3>
        <p>Total: {data.courses.length}</p>
      </div>
      <div>
        <h3>Universities</h3>
        <p>Total: {data.universities.length}</p>
      </div>
    </div>
  );
}

export default SEDEQDashboard;
