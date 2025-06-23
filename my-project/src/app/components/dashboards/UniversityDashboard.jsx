import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";

function UniversityDashboard({ userId }) {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Mock API call to fetch teachers and courses
    setTeachers([
      { id: 1, name: "Dr. Smith" },
      { id: 2, name: "Prof. Jones" },
    ]);
    setCourses([
      { id: 1, title: "Intro to Programming" },
      { id: 2, title: "Data Science Basics" },
    ]);
    // Replace with API calls: fetch(`/api/universities/${userId}/teachers`), fetch(`/api/universities/${userId}/courses`)
  }, [userId]);

  return (
    <div className={styles.section}>
      <h2>Manage Teachers and Courses</h2>
      <div>
        <h3>Teachers</h3>
        <ul>
          {teachers.map((teacher) => (
            <li key={teacher.id}>
              {teacher.name} <button>Edit</button>
            </li>
          ))}
        </ul>
        <button>Add Teacher</button>
      </div>
      <div>
        <h3>Courses</h3>
        <ul>
          {courses.map((course) => (
            <li key={course.id}>
              {course.title} <button>Edit</button>
            </li>
          ))}
        </ul>
        <button>Add Course</button>
      </div>
    </div>
  );
}

export default UniversityDashboard;
