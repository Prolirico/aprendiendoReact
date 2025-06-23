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

  return (
    <div className={styles.container} ref={menuRef}>
      <button onClick={() => setOpen(!open)} className={styles.iconButton}>
        {user ? `👤 ${user.email.charAt(0).toUpperCase()}` : "👤"}
      </button>
      {open && (
        <div className={styles.dropdown}>
          {user ? (
            <>
              <div className={styles.userInfo}>
                <span>{user.email}</span>
                <span className={styles.role}>
                  {user.role.charAt(0).toUpperCase() +
                    user.role.slice(1).toLowerCase()}
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
                    console.log("Navigating to /screens/login"); // Depuración
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
                    console.log("Navigating to /screens/signup"); // Depuración
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
