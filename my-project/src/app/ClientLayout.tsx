// app/ClientLayout.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SplitText from "./components/controls/SplitText";
import UserMenu from "./components/controls/UserMenu";
import MainMenu from "./components/controls/MainMenu";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import TeacherDashboard from "./components/dashboards/TeacherDashboard";
import UniversityDashboard from "./components/dashboards/UniversityDashboard";
import SEDEQDashboard from "./components/dashboards/SEDEQDashboard";
import LogoSEDEQ from "../assets/Secretaria-de-educacion-Queretaro.png";

const handleAnimationComplete = () => {
  console.log("All letters have animated!");
};

export default function ClientLayout({ children }) {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    console.log("Stored user:", storedUser); // Depuración
    setUser(storedUser);
    document.body.removeAttribute("cz-shortcut-listen"); // Eliminar atributo problemático
  }, []);

  const publicRoutes = [
    "/screens/login",
    "/screens/signup",
    "/screens/recuperarPassword",
  ];

  const renderContent = () => {
    console.log("Current pathname:", pathname); // Depuración
    if (publicRoutes.includes(pathname)) {
      console.log("Rendering children for public route:", pathname); // Depuración
      return children;
    }

    if (!user) {
      return (
        <main className="main">
          <div className="welcome-card">
            <h2>Bienvenido</h2>
            <p>
              Ingresa a tu cuenta para desbloquear todas las oportunidades que
              tenemos para ti.
            </p>
            <Link href="/login">Iniciar sesión</Link>
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
        return <p>Rol de usuario no válido.</p>;
    }
  };

  return (
    <>
      <nav className="flex items-center justify-between w-full h-[9vh] bg-white text-black px-4">
        <div className="flex-shrink-0 w-[20%]">
          <img
            src={LogoSEDEQ.src}
            alt="Logo SEDEQ"
            className="w-full h-auto max-h-[9vh] object-contain"
          />
        </div>
        <div className="flex-grow text-center w-[60%]">
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
        <div className="flex-shrink-0 w-[20%] flex justify-end space-x-4">
          <MainMenu isAuthenticated={!!user} />
          <UserMenu
            user={user}
            onLogout={() => {
              localStorage.removeItem("user");
              setUser(null);
            }}
          />
        </div>
      </nav>
      {renderContent()}
      <footer>
        <div>Footer</div>
      </footer>
    </>
  );
}
