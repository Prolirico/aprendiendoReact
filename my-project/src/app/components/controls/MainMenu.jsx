import React, { useState, useRef, useEffect } from "react";
import Link from "next/link"; // Importa Link de Next.js
import styles from "./MainMenu.module.css";

function MainMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
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
          <Link href="/option1">
            <button className={styles.menuItem}>Opción 1</button>
          </Link>
          <Link href="/option2">
            <button className={styles.menuItem}>Opción 2</button>
          </Link>
          <Link href="/option3">
            <button className={styles.menuItem}>Opción 3</button>
          </Link>
          <Link href="/option4">
            <button className={styles.menuItem}>Opción 4</button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default MainMenu;
