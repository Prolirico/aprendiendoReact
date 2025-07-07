// src/app/components/controls/MainMenu.tsx
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FC } from "react"; // Importa FC para tipado
import styles from "./MainMenu.module.css";

interface MainMenuProps {
  isAuthenticated: boolean;
}

const MainMenu: FC<MainMenuProps> = ({ isAuthenticated }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={menuRef}>
      <button onClick={() => setOpen(!open)} className={styles.iconButton}>
        ☰
      </button>
      {open && (
        <div className={styles.dropdown}>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <button className={styles.menuItem}>Dashboard</button>
              </Link>
              <Link href="/profile">
                <button className={styles.menuItem}>Perfil</button>
              </Link>
            </>
          ) : (
            <>
              <Link href={"https://ceatycc.fif-uaq.mx/index.html"}>
                <button className={styles.menuItem}>CeatYCC</button>
              </Link>
              <Link href={"https://portal.queretaro.gob.mx/educacion/"}>
                <button className={styles.menuItem}>SEDEQ</button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MainMenu;
