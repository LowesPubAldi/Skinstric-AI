"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./page.module.css";

const phaseTwoImageStorageKey = "skinstric-phase-two-image-base64";
const phaseTwoImageSourceStorageKey = "skinstric-phase-two-image-source";
const phaseTwoAnalysisStorageKey = "skinstric-phase-two-analysis";

export default function SelectPage() {
  useEffect(() => {
    window.localStorage.getItem(phaseTwoImageStorageKey);
    window.localStorage.getItem(phaseTwoImageSourceStorageKey);
    window.localStorage.getItem(phaseTwoAnalysisStorageKey);
  }, []);

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
        <div className={styles.copyBlock}>
          <p className={styles.title}>A.I. ANALYSIS</p>
          <p className={styles.subtitle}>A.I. HAS ESTIMATED THE FOLLOWING.</p>
          <p className={styles.subtitle}>FIX ESTIMATED INFORMATION IF NEEDED.</p>
        </div>

        <section className={styles.diamondStage} aria-label="A.I. analysis stage">
          <Link className={`${styles.diamondTile} ${styles.diamondTop} ${styles.diamondLink}`} href="/summary">
            <span className={styles.diamondLabel}>DEMOGRAPHICS</span>
          </Link>
          <div className={`${styles.diamondTile} ${styles.diamondLeft} ${styles.diamondDisabled}`}>
            <span className={styles.diamondLabel}>COSMETIC CONCERNS</span>
          </div>
          <div className={`${styles.diamondTile} ${styles.diamondRight} ${styles.diamondDisabled}`}>
            <span className={styles.diamondLabel}>SKIN TYPE DETAILS</span>
          </div>
          <div className={`${styles.diamondTile} ${styles.diamondBottom} ${styles.diamondDisabled}`}>
            <span className={styles.diamondLabel}>WEATHER</span>
          </div>
        </section>

        <Link className={styles.backLink} href="/result">
          <span className={styles.backDiamond} aria-hidden="true" />
          <span className={styles.backLabel}>BACK</span>
        </Link>

        <Link className={styles.summaryLink} href="/summary">
          <span className={styles.summaryLabel}>GET SUMMARY</span>
          <span className={styles.summaryDiamond} aria-hidden="true" />
        </Link>
      </main>
    </div>
  );
}