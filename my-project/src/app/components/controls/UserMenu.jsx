// app/components/controls/UserMenu.jsx
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./UserMenu.module.css";

function UserMenu({ user, onLogout }) {
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

  const handleLogout = () => {
    onLogout();
    setOpen(false);
  };

  // Mostrar solo el ícono si no hay usuario, o la inicial del username si está autenticado
  const displayName =
    user && user.username ? user.username.charAt(0).toUpperCase() : "👤";

  return (
    <div className={styles.container} ref={menuRef}>
      <button onClick={() => setOpen(!open)} className={styles.iconButton}>
        {displayName}
      </button>
      {open && (
        <div className={styles.dropdown}>
          {user && user.username ? (
            <>
              <div className={styles.userInfo}>
                <span>{user.username}</span>
                <span className={styles.role}>
                  {user.role
                    ? user.role.charAt(0).toUpperCase() +
                      user.role.slice(1).toLowerCase()
                    : "Usuario"}
                </span>
              </div>
              <button className={styles.menuItem} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/screens/login">
                <button
                  className={styles.menuItem}
                  onClick={() => {
                    console.log("Navigating to /screens/login");
                    setOpen(false);
                  }}
                >
                  Login
                </button>
              </Link>
              <Link href="/screens/signup">
                <button
                  className={styles.menuItem}
                  onClick={() => {
                    console.log("Navigating to /screens/signup");
                    setOpen(false);
                  }}
                >
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default UserMenu;
