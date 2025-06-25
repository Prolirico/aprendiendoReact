"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Home.module.css";
import SplitText from "../../components/controls/SplitText";
import UserMenu from "../../components/controls/UserMenu";
import MainMenu from "../../components/controls/MainMenu";
import Card from "../../components/controls/Card";
import LogoSEDEQ from "../../../../public/assets/Secretaria-de-educacion-Queretaro.png";
import StudentDashboard from "../../components/dashboards/StudentDashboard";
import TeacherDashboard from "../../components/dashboards/TeacherDashboard";
import UniversityDashboard from "../../components/dashboards/UniversityDashboard";
import SEDEQDashboard from "../../components/dashboards/SEDEQDashboard";

const handleAnimationComplete = () => {
  console.log("All letters have animated!");
};

export default function HomeLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    console.log("Stored user:", storedUser);
    if (storedUser) {
      // Mapear roles del backend a los esperados
      const roleMap = {
        alumno: "ALUMNO",
        maestro: "MAESTRO",
        admin_universidad: "UNIVERSIDAD",
        admin_sedeq: "SEDEQ",
      };
      storedUser.role = roleMap[storedUser.role] || storedUser.role;
      setUser(storedUser);
    }
    document.body.removeAttribute("cz-shortcut-listen");
  }, []);

  const renderContent = () => {
    if (!user) {
      return (
        <main className={styles.contenidoHome}>
          <Card
            title="Bienvenido"
            description="Ingresa a tu cuenta para desbloquear todas las oportunidades que tenemos para ti."
            bottomText="Explora nuestros cursos"
            logoConfig={{ type: "none" }}
          />
        </main>
      );
    }

    console.log("Rendering dashboard for role:", user.role); // Depuración
    switch (user.role) {
      case "ALUMNO":
        return <StudentDashboard userId={user.id} />;
      case "MAESTRO":
        return <TeacherDashboard userId={user.id} />;
      case "UNIVERSIDAD":
        return <UniversityDashboard userId={user.id} />;
      case "SEDEQ":
        return <SEDEQDashboard userId={user.id} />;
      default:
        return (
          <p className="text-center text-red-600">Rol de usuario no válido.</p>
        );
    }
  };

  return (
    <div className={styles.fondoHome}>
      {/*HEADER*/}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src={LogoSEDEQ.src} alt="Logo SEDEQ" className={styles.logo} />
        </div>
        <div className={styles.headerCenter}>
          <SplitText
            text="Aprendizaje y Desarrollo Profesional"
            className="text-2xl text-black"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={handleAnimationComplete}
          />
        </div>
        <div className={styles.headerRight}>
          <MainMenu isAuthenticated={!!user} />
          <UserMenu
            user={user}
            onLogout={() => {
              localStorage.removeItem("user");
              setUser(null);
            }}
          />
        </div>
      </header>

      {/*CONTENIDO*/}
      <div className={styles.contenidoHome}>{renderContent()}</div>

      <footer className={styles.contenidoFooter}>
        <h2>Footer</h2>
      </footer>
    </div>
  );
}
