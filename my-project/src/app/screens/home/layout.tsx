// app/screens/home/layout.tsx
"use client";
import { useState, useEffect } from "react";
import styles from "./Home.module.css";
import SplitText from "../../components/controls/SplitText";
import UserMenu from "../../components/controls/UserMenu";
import MainMenu from "../../components/controls/MainMenu";
import BlurText from "../../components/controls/BlurText";
import DecryptedText from "../../components/controls/DecryptedText";
import Card from "../../components/controls/Card";
import LogoSEDEQ from "../../../../public/assets/Secretaria-de-educacion-Queretaro.png";
import StudentDashboard from "../../components/dashboards/StudentDashboard";
import TeacherDashboard from "../../components/dashboards/TeacherDashboard";
import UniversityDashboard from "../../components/dashboards/UniversityDashboard";
import SEDEQDashboard from "../../components/dashboards/SEDEQDashboard";
import Image from "next/image";

const handleAnimationComplete = () => {
  console.log("All letters have animated!");
};

// Define the possible keys for our roleMap
type RoleMapKeys = "alumno" | "maestro" | "admin_universidad" | "admin_sedeq";

// Define the mapped user role type
type MappedUserRole = "ALUMNO" | "MAESTRO" | "UNIVERSIDAD" | "SEDEQ" | string;

// Define a type for the user object that will be stored in component state
interface UserState {
  id: string | number;
  role: MappedUserRole;
  username: string;
}

// Define a type for the raw data from localStorage.
// This can be more lenient if localStorage might contain extra properties.
interface RawStoredUserData {
  id: string | number;
  role: "alumno" | "maestro" | "admin_universidad" | "admin_sedeq" | string; // This is the raw role from storage
  name?: string; // Optional properties that might exist
  email?: string;
  // Add other specific properties you expect instead of using 'any'
  // If you need to allow completely unknown properties, use 'unknown' instead of 'any'
  [key: string]: unknown; // Allow any other properties that might be in localStorage
}

export default function HomeLayout() {
  const [user, setUser] = useState<UserState | null>(null);

  useEffect(() => {
    const storedUserString = localStorage.getItem("user");
    if (storedUserString) {
      try {
        // Parse the raw data first
        const rawStoredUser: RawStoredUserData = JSON.parse(storedUserString);
        console.log("Stored user:", rawStoredUser);

        // Check if essential properties exist and the role is valid for mapping
        if (rawStoredUser && rawStoredUser.role) {
          const roleMap: Record<RoleMapKeys, string> = {
            alumno: "ALUMNO",
            maestro: "MAESTRO",
            admin_universidad: "UNIVERSIDAD",
            admin_sedeq: "SEDEQ",
          };

          const mappedRole = roleMap[rawStoredUser.role as RoleMapKeys];
          const usernameString =
            typeof rawStoredUser.username === "string"
              ? rawStoredUser.username
              : "Usuario Desconocido";

          // Construct the UserState object, mapping the role
          const userToSet: UserState = {
            id: rawStoredUser.id,
            role: mappedRole || rawStoredUser.role,
            username: usernameString,
          };

          setUser(userToSet);
        } else {
          // Handle cases where storedUser exists but is malformed (e.g., missing role)
          console.error("Malformed user data in localStorage.");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("user");
      }
    }
    document.body.removeAttribute("cz-shortcut-listen");
  }, []);

  const renderContent = () => {
    if (!user) {
      return (
        <main className={styles.contenidoIntro}>
          <Card
            title="Bienvenido"
            description="Ingresa a tu cuenta para desbloquear todas las oportunidades que tenemos para ti."
            bottomText="Explora nuestros cursos"
            logoConfig={{
              type: "none",
              customSvg: null,
              width: 0,
              height: 0,
            }}
          />
        </main>
      );
    }

    console.log("Rendering dashboard for role:", user.role);
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
          <div className={styles.logoContainer}>
            <Image
              src={LogoSEDEQ}
              alt="Logo SEDEQ"
              fill
              className={styles.logo}
              style={{
                objectFit: "cover",
                zIndex: 10,
                height: "100%",
              }}
            />
          </div>
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

      {/*CONTENIDO*/}
      <div className={styles.contenidoHomeAprendizaje}>
        <BlurText
          text="Programas de aprendizaje"
          delay={320}
          animateBy="words"
          direction="top"
          onAnimationComplete={handleAnimationComplete}
          className="text-6xl mb-12"
          animationFrom={{ filter: "blur(10px)", opacity: 0, y: -50 }}
          animationTo={[
            { filter: "blur(5px)", opacity: 0.5, y: 5 },
            { filter: "blur(0px)", opacity: 1, y: 0 },
          ]}
        />
        <div className={styles.contenidoText}>
          <DecryptedText
            text="Un programa de aprendizaje es un sitio al que un grupo de estudiantes
            invitados tiene acceso a un catálogo de cursos que los ayuda a
            desarrollar las habilidades pertinentes para desempeñarse en sus
            trabajos actuales y alcanzar futuras metas en sus carreras
            profesionales. Debe invitarse a los estudiantes a unirse a un Programa
            de aprendizaje y un estudiante puede unirse a múltiples Programas de
            aprendizaje. Cada programa de aprendizaje cuenta con un catálogo
            específico de cursos a los que solo pueden acceder los estudiantes
            invitados a unirse a dicho programa. Los administradores de programas
            pueden editar el catálogo de recomendaciones de cursos y agregar
            colecciones específicas de cursos. Asimismo, pueden invitar, eliminar
            y ver informes de los estudiantes de dicho programa de aprendizaje."
            animateOn="view"
            revealDirection="center"
          />
        </div>
      </div>

      {/*FOOTER */}
      <footer className={styles.contenidoFooter}>
        <div className={styles.contenidoFooter1}>
          <div>
            <h1>
              SEDEQ | Secretaría de Educación del Estado de Querétaro. /*
              Redirigir a https://portal.queretaro.gob.mx/educacion/*/
            </h1>
            <h2>
              CEATyCC | Comisión de Educación en Alta Tecnología y Cloud
              Computing /*Redirigir a https://ceatycc.fif-uaq.mx/index.html */
            </h2>
          </div>
        </div>
        <div className={styles.contenidoFooter2}>
          <div>
            <h4>
              Todos los logos y marcas registradas en este sitio son propiedad
              de sus respectivos propietarios. La información aquí dispuesta
              puede ser modificada con previo aviso a los participantes del
              evento. Este programa es público, ajeno a cualquier partido
              político. Queda prohibido el uso para fines distintos a los
              establecidos en el programa.
            </h4>
            <p>© Copyright TheEvent. All Rights Reserved</p>
            <p>Comisión de Educación en Alta Tecnología y Cloud Computing </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
