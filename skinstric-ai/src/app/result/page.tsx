"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
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

type DemographicGroup = "race" | "age" | "gender";

type PhaseTwoApiResponse = {
  success?: boolean;
  message?: string;
  data?: Partial<Record<DemographicGroup, Record<string, number>>>;
};

const noopSubscribe = () => () => {};

export default function ResultPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const storedPreviewImage = useSyncExternalStore(
    noopSubscribe,
    () => window.localStorage.getItem(phaseTwoImageStorageKey),
    () => null,
  );
  const [localPreviewImage, setLocalPreviewImage] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "converting" | "error">("idle");
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [isCameraPromptOpen, setIsCameraPromptOpen] = useState(false);
  const previewImage = localPreviewImage ?? storedPreviewImage;
  const isSubmitting = previewStatus === "converting";

  function sortDemographicGroup(values: Record<string, number>) {
    return Object.entries(values)
      .map(([label, value]) => ({ label, value }))
      .sort((first, second) => second.value - first.value);
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
        race: data.race ? sortDemographicGroup(data.race) : [],
        age: data.age ? sortDemographicGroup(data.age) : [],
        gender: data.gender ? sortDemographicGroup(data.gender) : [],
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
      setAnalysisNotice("skinstric-514uqepz7-shalimar-cards-projects.vercel.app says Image anaylzed succesfully!");
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1100);
      });
      router.push("/select");
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

        {isCameraPromptOpen && (
          <div className={styles.permissionPromptOverlay} role="presentation">
            <section className={styles.permissionPrompt} role="dialog" aria-modal="true" aria-label="Camera permission prompt">
              <p className={styles.permissionPromptTitle}>ALLOW A.I. TO ACCESS YOUR CAMERA</p>
              <div className={styles.permissionPromptActions}>
                <button
                  type="button"
                  className={`${styles.permissionPromptButton} ${styles.permissionPromptButtonDeny}`}
                  onClick={() => {
                    setIsCameraPromptOpen(false);
                  }}
                >
                  DENY
                </button>
                <button
                  type="button"
                  className={`${styles.permissionPromptButton} ${styles.permissionPromptButtonAllow}`}
                  onClick={() => {
                    setIsCameraPromptOpen(false);
                    router.push("/camera/capture");
                  }}
                >
                  ALLOW
                </button>
              </div>
            </section>
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
              <button
                type="button"
                className={`${styles.permissionCard} ${styles.permissionCardLeft}`}
                disabled={isSubmitting}
                onClick={() => {
                  setIsCameraPromptOpen(true);
                }}
              >
                <span className={styles.permissionIcon} aria-hidden="true">
                  <Image className={styles.permissionArt} src={cameraIconSrc} alt="" width={146} height={146} />
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
              <button
                type="button"
                className={`${styles.permissionCard} ${styles.permissionCardRight}`}
                disabled={isSubmitting}
                onClick={() => {
                  galleryInputRef.current?.click();
                }}
              >
                <span className={styles.permissionIcon} aria-hidden="true">
                  <Image className={styles.permissionArt} src={galleryIconSrc} alt="" width={146} height={146} />
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

        <Link className={styles.backLink} href="/testing">
          <span className={styles.backDiamond} aria-hidden="true" />
          <span className={styles.backLabel}>Back</span>
        </Link>
      </main>
    </div>
  );
}