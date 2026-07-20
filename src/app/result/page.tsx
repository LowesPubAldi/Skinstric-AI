"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const diamondLargeSrc = "/result-assets/ResDiamond-large.png";
const diamondMediumSrc = "/result-assets/ResDiamond-medium.png";
const diamondSmallSrc = "/result-assets/ResDiamond-small.png";
const cameraIconSrc = "/result-assets/camera-icon.png";
const galleryIconSrc = "/result-assets/gallery-icon.png";
const phaseTwoImageStorageKey = "skinstric-phase-two-image-base64";
const phaseTwoImageSourceStorageKey = "skinstric-phase-two-image-source";

export default function ResultPage() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "converting" | "ready" | "error">("idle");

  useEffect(() => {
    const savedImage = window.localStorage.getItem(phaseTwoImageStorageKey);
    if (!savedImage) {
      return;
    }

    setPreviewImage(savedImage);
    setPreviewStatus("ready");
  }, []);

  function convertFileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("Invalid file data"));
      };
      reader.onerror = () => reject(new Error("File conversion failed"));
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelection(fileList: FileList | null, source: "camera" | "gallery") {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    setPreviewStatus("converting");

    try {
      const base64Image = await convertFileToBase64(file);
      window.localStorage.setItem(phaseTwoImageStorageKey, base64Image);
      window.localStorage.setItem(phaseTwoImageSourceStorageKey, source);
      setPreviewImage(base64Image);
      setPreviewStatus("ready");
    } catch {
      setPreviewStatus("error");
    }
  }

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
          {!previewImage && previewStatus !== "converting" && previewStatus !== "error" && (
            <p className={styles.previewLabel}>Preview</p>
          )}
          {previewStatus === "converting" && <p className={styles.previewLabel}>Preparing image...</p>}
          {previewStatus === "error" && <p className={styles.previewLabel}>Upload failed</p>}
          {previewImage && (
            <img className={styles.previewImage} src={previewImage} alt="Selected for analysis" />
          )}
        </div>

        <section className={styles.hero} aria-label="Result preview">
          <div className={styles.heroContent}>
            <div className={styles.permissionColumn}>
              <div className={styles.permissionBackdrop} aria-hidden="true">
                <img className={`${styles.diamond} ${styles.diamondLarge}`} src={diamondLargeSrc} alt="" />
                <img className={`${styles.diamond} ${styles.diamondMedium}`} src={diamondMediumSrc} alt="" />
                <img className={`${styles.diamond} ${styles.diamondSmall}`} src={diamondSmallSrc} alt="" />
              </div>
              <button
                type="button"
                className={`${styles.permissionCard} ${styles.permissionCardLeft}`}
                onClick={() => cameraInputRef.current?.click()}
              >
                <span className={styles.permissionIcon} aria-hidden="true">
                  <img className={styles.permissionArt} src={cameraIconSrc} alt="" />
                </span>
                <div className={styles.permissionCopy}>
                  <p className={styles.permissionText}>
                    <span className={styles.permissionTextLead}>ALLOW A.I.</span>
                    <span>TO SCAN YOUR FACE</span>
                  </p>
                </div>
              </button>
            </div>

            <div className={styles.permissionColumn}>
              <div className={styles.permissionBackdrop} aria-hidden="true">
                <img className={`${styles.diamond} ${styles.diamondLarge}`} src={diamondLargeSrc} alt="" />
                <img className={`${styles.diamond} ${styles.diamondMedium}`} src={diamondMediumSrc} alt="" />
                <img className={`${styles.diamond} ${styles.diamondSmall}`} src={diamondSmallSrc} alt="" />
              </div>
              <button
                type="button"
                className={`${styles.permissionCard} ${styles.permissionCardRight}`}
                onClick={() => galleryInputRef.current?.click()}
              >
                <span className={styles.permissionIcon} aria-hidden="true">
                  <img className={styles.permissionArt} src={galleryIconSrc} alt="" />
                </span>
                <div className={styles.permissionCopy}>
                  <p className={styles.permissionText}>
                    <span className={styles.permissionTextLead}>ALLOW A.I.</span>
                    <span>ACCESS GALLERY</span>
                  </p>
                </div>
              </button>
            </div>
          </div>

          <input
            ref={cameraInputRef}
            className={styles.hiddenFileInput}
            type="file"
            accept="image/*"
            capture="user"
            onChange={(event) => {
              void handleFileSelection(event.target.files, "camera");
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={galleryInputRef}
            className={styles.hiddenFileInput}
            type="file"
            accept="image/*"
            onChange={(event) => {
              void handleFileSelection(event.target.files, "gallery");
              event.currentTarget.value = "";
            }}
          />
        </section>

        <Link className={styles.backLink} href="/take-test">
          <span className={styles.backDiamond} aria-hidden="true" />
          <span className={styles.backLabel}>Back</span>
        </Link>
      </main>
    </div>
  );
}