"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import bracketLeft from "../../../public/bracket-left.png";
import bracketRight from "../../../public/bracket-right.png";
import styles from "./page.module.css";

const phaseTwoImageStorageKey = "skinstric-phase-two-image-base64";
const noopSubscribe = () => () => {};

export default function SelectPage() {
  const router = useRouter();
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
          <Image src={bracketLeft} alt="left-bracket" width={8} height={16} />
          <p className={styles.sectionTag}>INTRO</p>
          <Image src={bracketRight} alt="right-bracket" width={8} height={16} />
        </div>

        <button className={styles.codeButton} type="button">
          ENTER CODE
        </button>
      </header>

      <main className={styles.main}>
        {previewImage && (
          <aside className={styles.previewPanel} aria-label="Uploaded photo preview">
            <p className={styles.previewTitle}>Preview</p>
            <div className={styles.previewFrame}>
              <Image
                className={styles.previewImage}
                src={previewImage}
                alt="Uploaded selfie preview"
                width={140}
                height={140}
                unoptimized
              />
            </div>
            <Link className={styles.previewChangeLink} href="/result">
              CHANGE
            </Link>
          </aside>
        )}

        <div className={styles.copyBlock}>
          <h2 className={styles.title}>A.I. ANALYSIS</h2>
          <p className={styles.subtitle}>A.I. has estimated the following.</p>
          <p className={styles.subtitle}>Fix estimated information if needed.</p>
        </div>

        <section className={styles.diamondStage} aria-label="A.I. analysis stage">
          <button
            type="button"
            className={`${styles.diamondTile} ${styles.diamondTop} ${styles.diamondLink}`}
            onClick={() => router.push("/summary")}
          >
            <span className={styles.diamondLabel}>DEMOGRAPHICS</span>
          </button>
          <button type="button" disabled className={`${styles.diamondTile} ${styles.diamondLeft} ${styles.diamondDisabled}`}>
            <span className={styles.diamondLabel}>SKIN TYPE DETAILS</span>
          </button>
          <button type="button" disabled className={`${styles.diamondTile} ${styles.diamondRight} ${styles.diamondDisabled}`}>
            <span className={styles.diamondLabel}>COSMETIC CONCERNS</span>
          </button>
          <button type="button" disabled className={`${styles.diamondTile} ${styles.diamondBottom} ${styles.diamondDisabled}`}>
            <span className={styles.diamondLabel}>WEATHER</span>
          </button>
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