"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { completeDemographicGroup, type DemographicGroup } from "@/lib/phase-two-demographics";
import styles from "./page.module.css";

const phaseTwoImageStorageKey = "skinstric-phase-two-image-base64";
const phaseTwoImageSourceStorageKey = "skinstric-phase-two-image-source";
const phaseTwoAnalysisStorageKey = "skinstric-phase-two-analysis";
const phaseTwoEndpoint = "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseTwo";

type PhaseTwoApiResponse = {
  success?: boolean;
  message?: string;
  data?: Partial<Record<DemographicGroup, Record<string, number>>>;
};

type CameraStatus = "requesting" | "ready" | "error";

function getFocusEllipse(viewportWidth: number) {
  if (viewportWidth === 768) {
    return {
      radiusXRatio: 0.16,
      radiusYRatio: 0.34,
      centerYRatio: 0.45,
    };
  }

  return {
    radiusXRatio: 0.18,
    radiusYRatio: 0.29,
    centerYRatio: 0.5,
  };
}

export default function CameraCapturePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("requesting");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isBlurEnabled, setIsBlurEnabled] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "error">("idle");

  const blurSupportedOnViewport = viewportWidth > 430;
  const blurActive = isBlurEnabled && blurSupportedOnViewport;

  async function startCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    setCameraStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraStatus("ready");
    } catch {
      setCameraStatus("error");
    }
  }

  async function handleRetryCamera() {
    window.localStorage.removeItem(phaseTwoImageStorageKey);
    window.localStorage.removeItem(phaseTwoImageSourceStorageKey);
    window.localStorage.removeItem(phaseTwoAnalysisStorageKey);
    window.localStorage.removeItem("skinstric-phase-two-analysis-ready");
    setCapturedImage(null);
    setSubmitStatus("idle");
    await startCamera();
  }

  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(window.innerWidth);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    const startCameraTimer = window.setTimeout(() => {
      void startCamera();
    }, 0);

    return () => {
      window.clearTimeout(startCameraTimer);
      window.removeEventListener("resize", updateViewport);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []);

  function captureFrame() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = canvas.width;
    sourceCanvas.height = canvas.height;
    const sourceContext = sourceCanvas.getContext("2d");

    if (!sourceContext) {
      return;
    }

    sourceContext.save();
    sourceContext.translate(sourceCanvas.width, 0);
    sourceContext.scale(-1, 1);
    sourceContext.drawImage(video, 0, 0, sourceCanvas.width, sourceCanvas.height);
    sourceContext.restore();

    if (blurActive) {
      context.filter = "blur(6.5px)";
      context.drawImage(sourceCanvas, 0, 0);
      context.filter = "none";

      const { radiusXRatio, radiusYRatio, centerYRatio } = getFocusEllipse(window.innerWidth);
      const centerX = canvas.width / 2;
      const centerY = canvas.height * centerYRatio;
      const radiusX = canvas.width * radiusXRatio;
      const radiusY = canvas.height * radiusYRatio;

      context.save();
      context.beginPath();
      context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      context.clip();
      context.drawImage(sourceCanvas, 0, 0);
      context.restore();
    } else {
      context.filter = "none";
      context.drawImage(sourceCanvas, 0, 0);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
  }

  async function handleUsePhoto() {
    if (!capturedImage) {
      return;
    }

    window.localStorage.setItem(phaseTwoImageStorageKey, capturedImage);
    window.localStorage.setItem(phaseTwoImageSourceStorageKey, "camera");

    const base64Payload = capturedImage.includes(",") ? capturedImage.split(",")[1] : capturedImage;
    setSubmitStatus("submitting");

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
          source: "camera",
          response: body,
          results,
          message: body.message ?? "AI analysis complete",
          submittedAt: new Date().toISOString(),
        }),
      );

      window.localStorage.setItem("skinstric-phase-two-analysis-ready", "true");
      setSubmitStatus("idle");
      router.push("/select");
    } catch {
      window.localStorage.removeItem(phaseTwoAnalysisStorageKey);
      setSubmitStatus("error");
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

        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.blurToggle} ${isBlurEnabled ? styles.blurToggleActive : ""}`}
            disabled={!blurSupportedOnViewport}
            onClick={() => {
              setIsBlurEnabled((previous) => !previous);
            }}
          >
            {blurActive ? "BG BLUR ON" : "BG BLUR"}
          </button>
          <a className={styles.codeButton} href="#">
            ENTER CODE
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.captureStage} aria-label="Camera capture">
          <div className={styles.captureFrame}>
            <div className={styles.captureGuidance}>
              <p className={styles.captureGuidanceTitle}>TO GET BETTER RESULTS MAKE SURE TO HAVE</p>
              <ul className={styles.captureGuidanceList}>
                <li>NEUTRAL EXPRESSION</li>
                <li>FRONTAL POSE</li>
                <li>ADEQUATE LIGHTING</li>
              </ul>
            </div>
            {capturedImage ? (
              <Image
                className={styles.captureImage}
                src={capturedImage}
                alt="Captured preview"
                width={1280}
                height={720}
                unoptimized
              />
            ) : (
              <video
                ref={videoRef}
                className={styles.captureVideo}
                autoPlay
                playsInline
                muted
              />
            )}

            {blurActive && !capturedImage && <div className={styles.captureBlurMask} aria-hidden="true" />}

            {cameraStatus === "requesting" && !capturedImage && (
              <p className={styles.captureOverlayMessage}>ALLOW CAMERA ACCESS TO START</p>
            )}
            {cameraStatus === "error" && !capturedImage && (
              <p className={styles.captureOverlayMessage}>CAMERA ACCESS DENIED OR UNAVAILABLE</p>
            )}
          </div>

          <div className={styles.captureControls}>
            <button
              type="button"
              className={styles.captureButtonPrimary}
              title="Retry camera"
              aria-label="Retry camera"
              onClick={() => {
                void handleRetryCamera();
              }}
              disabled={!capturedImage}
            >
              <svg className={styles.controlIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.captureButtonPrimary}
              title={capturedImage ? undefined : cameraStatus === "ready" ? "Capture photo" : "Enable camera"}
              aria-label={capturedImage ? undefined : cameraStatus === "ready" ? "Capture photo" : "Enable camera"}
              onClick={() => {
                if (cameraStatus === "ready" && !capturedImage) {
                  captureFrame();
                } else if (cameraStatus !== "ready") {
                  void startCamera();
                }
              }}
              disabled={Boolean(capturedImage) || submitStatus === "submitting"}
            >
              <svg className={styles.controlIcon} viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="13" r="3.5" stroke="currentColor" fill="none" />
                <path d="M9 2h6v2H9V2zm10 4h2v2h-2V6zm0 0V4h2c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h2v2H4v12h16V6h-2z" stroke="currentColor" fill="none" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.captureButtonPrimary}
              title={submitStatus === "submitting" ? "Analyzing..." : "Use photo"}
              aria-label={submitStatus === "submitting" ? "Analyzing..." : "Use photo"}
              onClick={() => {
                void handleUsePhoto();
              }}
              disabled={!capturedImage || submitStatus === "submitting"}
            >
              {submitStatus === "submitting" ? (
                <svg className={`${styles.controlIcon} ${styles.spinningIcon}`} viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9.5" stroke="currentColor" fill="none" strokeWidth="2" strokeDasharray="15 30" />
                </svg>
              ) : (
                <svg className={styles.controlIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>

          {submitStatus === "error" && <p className={styles.submitError}>ANALYSIS FAILED. PLEASE RETRY.</p>}
        </section>

        <canvas ref={canvasRef} className={styles.hiddenCanvas} />

        <Link className={styles.backLink} href="/result">
          <span className={styles.backDiamond} aria-hidden="true" />
          <span className={styles.backLabel}>BACK</span>
        </Link>
      </main>
    </div>
  );
}
