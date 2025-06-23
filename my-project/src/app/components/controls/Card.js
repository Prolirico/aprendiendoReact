import React from "react";
import styles from "./Card.module.css";
import LOGOCEATYCCUno from "../../../../public/assets/LOGOCEATYCCUno.png";

const Card = ({
  title = " ",
  description = " ",
  subtitle = " ",
  bottomText = " ",
  logoConfig = {
    type: "ceatycc",
    customSvg: null,
    width: 200,
    height: 200,
  },
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.backgroundBlur}></div>
      <div className={styles.border} />
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          {logoConfig.customSvg ? (
            <div
              className={styles.customLogo}
              style={{ width: logoConfig.width, height: logoConfig.height }}
            >
              {logoConfig.customSvg}
            </div>
          ) : logoConfig.type === "ceatycc" ? (
            <img
              src={logoBlancoCeatYCC}
              alt="CEATyCC Logo"
              className={styles.ceatyccLogo}
              style={{
                width: logoConfig.width,
                height: logoConfig.height,
                objectFit: "contain",
              }}
            />
          ) : logoConfig.type === "image" ? (
            <img
              src={logoConfig.imageSrc}
              alt={logoConfig.alt || "Logo"}
              className={styles.customLogo}
              style={{
                width: logoConfig.width,
                height: logoConfig.height,
                objectFit: "contain",
              }}
            />
          ) : logoConfig.type === "none" ? null : (
            <div className={styles.defaultLogo}>
              <div className={styles.placeholderLogo}></div>
            </div>
          )}
        </div>
        <div className={styles.textContent}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
      <span className={styles.bottomText}>Explora nuestros cursos</span>
    </div>
  );
};

export default Card;
