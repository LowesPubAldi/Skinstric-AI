"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { completeDemographicGroup, type DemographicGroup } from "@/lib/phase-two-demographics";
import styles from "./page.module.css";

const diamondLargeSrc = "/result-assets/ResDiamond-large.png";
const diamondMediumSrc = "/result-assets/ResDiamond-medium.png";
const diamondSmallSrc = "/result-assets/ResDiamond-small.png";
const cameraIconSrc = "/result-assets/camera-icon.png";
const galleryIconSrc = "/result-assets/gallery-icon.png";
const phaseTwoImageStorageKey = "skinstric-phase-two-image-base64";
const phaseTwoImageSourceStorageKey = "skinstric-phase-two-image-source";
const phaseTwoAnalysisStorageKey = "skinstric-phase-two-analysis";
const phaseTwoEndpoint = "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo";

type PhaseTwoApiResponse = {
  success?: boolean;
  message?: string;
  data?: Partial<Record<DemographicGroup, Record<string, number>>>;
};

const noopSubscribe = () => () => {};

export default function ResultPage() {
  const router = useRouter();
  const storedPreviewImage = useSyncExternalStore(
    noopSubscribe,
    () => window.localStorage.getItem(phaseTwoImageStorageKey),
    () => null,
  );
  const [localPreviewImage, setLocalPreviewImage] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "converting" | "error">("idle");
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const previewImage = localPreviewImage ?? storedPreviewImage;
  const cameraCardIconSrc = cameraIconSrc;
  const galleryCardIconSrc = galleryIconSrc;
  const isSubmitting = previewStatus === "converting";

  function goToSelectPage() {
    router.push("/select");

    window.setTimeout(() => {
      if (window.location.pathname === "/result") {
        window.location.assign("/select");
      }
    }, 250);
  }

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

  async function submitPhaseTwo(imageDataUrl: string, source: "camera" | "gallery") {
    const base64Payload = imageDataUrl.includes(",") ? imageDataUrl.split(",")[1] : imageDataUrl;
    setPreviewStatus("converting");

    try {
      const response = await fetch(phaseTwoEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Payload }),
      });

      if (!response.ok) {
        throw new Error("Phase 2 submission failed");
      }

      const body = (await response.json()) as PhaseTwoApiResponse;
      const data = body.data ?? {};
      const results = {
        race: completeDemographicGroup("race", data.race),
        age: completeDemographicGroup("age", data.age),
        gender: completeDemographicGroup("gender", data.gender),
      };

      window.localStorage.setItem(
        phaseTwoAnalysisStorageKey,
        JSON.stringify({
          endpoint: phaseTwoEndpoint,
          source,
          response: body,
          results,
          message: body.message ?? "AI analysis complete",
          submittedAt: new Date().toISOString(),
        }),
      );

      window.localStorage.setItem("skinstric-phase-two-analysis-ready", "true");
      setAnalysisNotice("Image analyzed successfully.");
    } catch {
      window.localStorage.removeItem(phaseTwoAnalysisStorageKey);
      setAnalysisNotice(null);
      setPreviewStatus("error");
    }
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
      setLocalPreviewImage(base64Image);
      setPreviewStatus("idle");
      void submitPhaseTwo(base64Image, source);
      goToSelectPage();
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
        {analysisNotice && (
          <div className={styles.analysisNotice} role="status" aria-live="polite">
            {analysisNotice}
          </div>
        )}

        <p className={styles.kicker}>TO START ANALYSIS</p>
        <div className={styles.previewFrame}>
          {!previewImage && previewStatus !== "converting" && previewStatus !== "error" && (
            <p className={styles.previewLabel}>Preview</p>
          )}
          {previewStatus === "converting" && <div className={styles.previewSkeleton} aria-hidden="true" />}
          {previewStatus === "error" && <p className={styles.previewLabel}>Upload failed</p>}
          {previewImage && (
            <Image
              className={styles.previewImage}
              src={previewImage}
              alt="Selected for analysis"
              width={140}
              height={140}
              unoptimized
            />
          )}
        </div>

        <section className={styles.hero} aria-label="Result preview">
          {isSubmitting && (
            <div className={styles.heroSkeleton} aria-hidden="true">
              <span className={styles.heroSkeletonLine} />
              <span className={styles.heroSkeletonLine} />
              <span className={`${styles.heroSkeletonLine} ${styles.heroSkeletonLineShort}`} />
            </div>
          )}
          <div className={styles.heroContent}>
            <div className={styles.permissionColumn}>
              <div className={styles.permissionBackdrop} aria-hidden="true">
                <Image
                  className={`${styles.diamond} ${styles.diamondLarge}`}
                  src={diamondLargeSrc}
                  alt=""
                  width={700}
                  height={700}
                  priority
                />
                <Image
                  className={`${styles.diamond} ${styles.diamondMedium}`}
                  src={diamondMediumSrc}
                  alt=""
                  width={700}
                  height={700}
                  loading="eager"
                />
                <Image
                  className={`${styles.diamond} ${styles.diamondSmall}`}
                  src={diamondSmallSrc}
                  alt=""
                  width={700}
                  height={700}
                  loading="eager"
                />
              </div>
              <Link
                href="/camera/capture"
                className={`${styles.permissionCard} ${styles.permissionCardLeft}`}
                aria-disabled={isSubmitting}
                onClick={(event) => {
                  if (isSubmitting) {
                    event.preventDefault();
                  }
                }}
              >
                <span className={styles.permissionIcon} aria-hidden="true">
                  <Image className={styles.permissionArt} src={cameraCardIconSrc} alt="" width={146} height={146} unoptimized />
                </span>
                <div className={styles.permissionCopy}>
                  <p className={styles.permissionText}>
                    <span className={styles.permissionTextLead}>ALLOW A.I.</span>
                    <span>TO SCAN YOUR FACE</span>
                  </p>
                </div>
              </Link>
            </div>

            <div className={styles.permissionColumn}>
              <div className={styles.permissionBackdrop} aria-hidden="true">
                <Image
                  className={`${styles.diamond} ${styles.diamondLarge}`}
                  src={diamondLargeSrc}
                  alt=""
                  width={700}
                  height={700}
                  priority
                />
                <Image
                  className={`${styles.diamond} ${styles.diamondMedium}`}
                  src={diamondMediumSrc}
                  alt=""
                  width={700}
                  height={700}
                  loading="eager"
                />
                <Image
                  className={`${styles.diamond} ${styles.diamondSmall}`}
                  src={diamondSmallSrc}
                  alt=""
                  width={700}
                  height={700}
                  loading="eager"
                />
              </div>
              <label
                htmlFor="result-gallery-input"
                className={`${styles.permissionCard} ${styles.permissionCardRight}`}
                aria-disabled={isSubmitting}
                onClick={(event) => {
                  if (isSubmitting) {
                    event.preventDefault();
                  }
                }}
              >
                <span className={styles.permissionIcon} aria-hidden="true">
                  <Image className={styles.permissionArt} src={galleryCardIconSrc} alt="" width={146} height={146} unoptimized />
                </span>
                <div className={styles.permissionCopy}>
                  <p className={styles.permissionText}>
                    <span className={styles.permissionTextLead}>ALLOW A.I.</span>
                    <span>ACCESS GALLERY</span>
                  </p>
                </div>
              </label>
            </div>
          </div>

          <input
            id="result-gallery-input"
            className={styles.hiddenFileInput}
            type="file"
            accept="image/*"
            onChange={(event) => {
              void handleFileSelection(event.target.files, "gallery");
              event.currentTarget.value = "";
            }}
          />
        </section>

        <Link className={styles.backLink} href="/testing">
          <span className={styles.backDiamond} aria-hidden="true" />
          <span className={styles.backLabel}>Back</span>
        </Link>

        {previewImage && (
          <Link className={styles.continueLink} href="/select">
            <span className={styles.continueLabel}>Continue</span>
            <span className={styles.continueDiamond} aria-hidden="true" />
          </Link>
        )}
      </main>
    </div>
  );
}