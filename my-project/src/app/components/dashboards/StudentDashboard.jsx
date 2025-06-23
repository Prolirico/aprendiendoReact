import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";

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
    <div className={styles.section}>
      <h2>My Enrolled Courses</h2>
      <ul className={styles.courseList}>
        {courses.map((course) => (
          <li key={course.id}>
            {course.title} - Progress: {course.progress}%
            <button>Continue Course</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StudentDashboard;
