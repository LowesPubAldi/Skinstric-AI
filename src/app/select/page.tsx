"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import styles from "./page.module.css";

const phaseTwoImageStorageKey = "skinstric-phase-two-image-base64";
const noopSubscribe = () => () => {};

export default function SelectPage() {
  const previewImage = useSyncExternalStore(
    noopSubscribe,
    () => window.localStorage.getItem(phaseTwoImageStorageKey),
    () => null,
  );

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
        <aside className={styles.previewPanel} aria-label="Uploaded photo preview">
          <p className={styles.previewTitle}>Preview</p>
          <div className={styles.previewFrame}>
            {previewImage ? (
              <Image
                className={styles.previewImage}
                src={previewImage}
                alt="Uploaded selfie preview"
                width={140}
                height={140}
                unoptimized
              />
            ) : (
              <p className={styles.previewEmpty}>No photo</p>
            )}
          </div>
          <Link className={styles.previewChangeLink} href="/result">
            CHANGE
          </Link>
        </aside>

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
            <span className={styles.diamondLabel}>SKIN TYPE DETAILS</span>
          </div>
          <div className={`${styles.diamondTile} ${styles.diamondRight} ${styles.diamondDisabled}`}>
            <span className={styles.diamondLabel}>COSMETIC CONCERNS</span>
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