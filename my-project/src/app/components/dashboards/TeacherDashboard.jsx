import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";

function TeacherDashboard({ userId }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Mock API call to fetch taught courses
    setCourses([
      { id: 1, title: "Intro to Programming", students: 30 },
      { id: 2, title: "Data Science Basics", students: 25 },
    ]);
    // Replace with API call: fetch(`/api/teachers/${userId}/courses`)
  }, [userId]);

  return (
    <div className={styles.section}>
      <h2>My Taught Courses</h2>
      <ul className={styles.courseList}>
        {courses.map((course) => (
          <li key={course.id}>
            {course.title} - Students: {course.students}
            <button>View Students</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TeacherDashboard;
