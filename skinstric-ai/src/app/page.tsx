import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page} id="top">
      <header className={styles.header}>
        <div className={styles.headerCluster}>
          <a className={styles.brand} href="#top">
            SKINSTRIC
          </a>
          <p className={styles.sectionTag}>INTRO</p>
        </div>
        <a className={styles.codeButton} href="#experience">
          ENTER CODE
        </a>
      </header>

      <main className={styles.main}>
        <div className={styles.lineTopLeft} aria-hidden="true" />
        <div className={styles.lineBottomLeft} aria-hidden="true" />
        <div className={styles.lineTopRight} aria-hidden="true" />
        <div className={styles.lineBottomRight} aria-hidden="true" />

        <a className={`${styles.sideAction} ${styles.sideActionLeft}`} href="#">
          <span className={`${styles.actionDiamond} ${styles.actionDiamondLeft}`}>
            <span className={styles.actionTriangle} aria-hidden="true" />
          </span>
          <span>DISCOVER A.I.</span>
        </a>

        <section className={styles.hero}>
          <h1 className={styles.title}>
            <span className={styles.titleLead}>Sophisticated</span>
            <span className={styles.titleAccent}>skincare</span>
          </h1>
          <div className={styles.tabletPanel}>
            <p className={styles.tabletDescription}>
              Skinstric developed an A.I. that creates a highly-personalized
              routine tailored to what your skin needs.
            </p>
            <Link className={styles.tabletExperience} href="/testing">
              <span>ENTER EXPERIENCE</span>
              <span className={styles.experienceDiamond}>
                <span className={styles.actionTriangle} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </section>

        <Link className={`${styles.sideAction} ${styles.sideActionRight}`} href="/testing">
          <span>TAKE TEST</span>
          <span className={styles.actionDiamond}>
            <span className={`${styles.actionTriangle} ${styles.actionTriangleRight}`} aria-hidden="true" />
          </span>
        </Link>

        <p className={styles.supportingCopy}>
          SKINSTRIC DEVELOPED AN A.I. THAT CREATES A HIGHLY-PERSONALIZED
          ROUTINE TAILORED TO WHAT YOUR SKIN NEEDS.
        </p>
      </main>
    </div>
  );
}
