import Link from "next/link";
import styles from "./page.module.css";

const diamondLargeSrc = "/result-assets/ResDiamond-large.png";
const diamondMediumSrc = "/result-assets/ResDiamond-medium.png";
const diamondSmallSrc = "/result-assets/ResDiamond-small.png";
const cameraIconSrc = "/result-assets/camera-icon.png";
const galleryIconSrc = "/result-assets/gallery-icon.png";

export default function ResultPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCluster}>
          <Link className={styles.brand} href="/">
            SKINSTRIC
          </Link>
          <p className={styles.sectionTag}>INTRO</p>
        </div>

        <a className={styles.codeButton} href="#">
          ENTER CODE
        </a>
      </header>

      <main className={styles.main}>
        <p className={styles.kicker}>TO START ANALYSIS</p>
        <div className={styles.previewFrame}>
          <p className={styles.previewLabel}>Preview</p>
        </div>

        <section className={styles.hero} aria-label="Result preview">
          <div className={styles.heroContent}>
            <div className={styles.permissionColumn}>
              <div className={styles.permissionBackdrop} aria-hidden="true">
                <img className={`${styles.diamond} ${styles.diamondLarge}`} src={diamondLargeSrc} alt="" />
                <img className={`${styles.diamond} ${styles.diamondMedium}`} src={diamondMediumSrc} alt="" />
                <img className={`${styles.diamond} ${styles.diamondSmall}`} src={diamondSmallSrc} alt="" />
              </div>
              <div className={`${styles.permissionCard} ${styles.permissionCardLeft}`}>
                <span className={styles.permissionIcon} aria-hidden="true">
                  <img className={styles.permissionArt} src={cameraIconSrc} alt="" />
                </span>
                <div className={styles.permissionCopy}>
                  <p className={styles.permissionText}>
                    <span className={styles.permissionTextLead}>ALLOW A.I.</span>
                    <span>TO SCAN YOUR FACE</span>
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.permissionColumn}>
              <div className={styles.permissionBackdrop} aria-hidden="true">
                <img className={`${styles.diamond} ${styles.diamondLarge}`} src={diamondLargeSrc} alt="" />
                <img className={`${styles.diamond} ${styles.diamondMedium}`} src={diamondMediumSrc} alt="" />
                <img className={`${styles.diamond} ${styles.diamondSmall}`} src={diamondSmallSrc} alt="" />
              </div>
              <div className={`${styles.permissionCard} ${styles.permissionCardRight}`}>
                <span className={styles.permissionIcon} aria-hidden="true">
                  <img className={styles.permissionArt} src={galleryIconSrc} alt="" />
                </span>
                <div className={styles.permissionCopy}>
                  <p className={styles.permissionText}>
                    <span className={styles.permissionTextLead}>ALLOW A.I.</span>
                    <span>ACCESS GALLERY</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Link className={styles.backLink} href="/take-test">
          <span className={styles.backDiamond} aria-hidden="true" />
          <span className={styles.backLabel}>Back</span>
        </Link>
      </main>
    </div>
  );
}