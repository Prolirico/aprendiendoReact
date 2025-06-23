"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Home.module.css";
import SplitText from "../../components/controls/SplitText";
import UserMenu from "../../components/controls/UserMenu";
import MainMenu from "../../components/controls/MainMenu";
import StudentDashboard from "../../components/dashboards/StudentDashboard";
import TeacherDashboard from "../../components/dashboards/TeacherDashboard";
import UniversityDashboard from "../../components/dashboards/UniversityDashboard";
import SEDEQDashboard from "../../components/dashboards/SEDEQDashboard";
import LogoSEDEQ from "../../../../public/assets/Secretaria-de-educacion-Queretaro.png";

const handleAnimationComplete = () => {
  console.log("All letters have animated!");
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    console.log("Stored user:", storedUser);
    setUser(storedUser);
    // Mitigar hydration mismatch
    document.body.removeAttribute("cz-shortcut-listen");
  }, []);

  const renderContent = () => {
    if (!user) {
      return (
        <main className={styles.contenidoHome}>
          <div className="welcome-card text-center p-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              Bienvenido
            </h2>
            <p className="text-gray-600 mb-4">
              Ingresa a tu cuenta para desbloquear todas las oportunidades que
              tenemos para ti.
            </p>
            <Link href="/screens/login" className="text-blue-600 underline">
              Iniciar sesión
            </Link>
          </div>
        </main>
      );
    }

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
      {renderContent()}
      <footer className={styles.contenidoFooter}>
        <div>Footer</div>
      </footer>
    </div>
  );
}
