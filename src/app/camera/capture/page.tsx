"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

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

  function sortDemographicGroup(values: Record<string, number>) {
    return Object.entries(values)
      .map(([label, value]) => ({ label, value }))
      .sort((first, second) => second.value - first.value);
  }

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

  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(window.innerWidth);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    void startCamera();

    return () => {
      window.removeEventListener("resize", updateViewport);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!blurSupportedOnViewport && isBlurEnabled) {
      setIsBlurEnabled(false);
    }
  }, [blurSupportedOnViewport, isBlurEnabled]);

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
      context.filter = "blur(8px)";
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
        race: data.race ? sortDemographicGroup(data.race) : [],
        age: data.age ? sortDemographicGroup(data.age) : [],
        gender: data.gender ? sortDemographicGroup(data.gender) : [],
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
            {isBlurEnabled ? "BG BLUR ON" : "BG BLUR"}
          </button>
          <a className={styles.codeButton} href="#">
            ENTER CODE
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.captureStage} aria-label="Camera capture">
          <div className={styles.captureFrame}>
            {capturedImage ? (
              <img
                className={styles.captureImage}
                src={capturedImage}
                alt="Captured preview"
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
              className={styles.captureButtonSecondary}
              onClick={() => {
                setCapturedImage(null);
              }}
              disabled={!capturedImage}
            >
              RETAKE
            </button>
            <button
              type="button"
              className={styles.captureButtonPrimary}
              onClick={() => {
                captureFrame();
              }}
              disabled={cameraStatus !== "ready" || Boolean(capturedImage)}
            >
              CAPTURE
            </button>
            <button
              type="button"
              className={styles.captureButtonPrimary}
              onClick={() => {
                void handleUsePhoto();
              }}
              disabled={!capturedImage || submitStatus === "submitting"}
            >
              {submitStatus === "submitting" ? "ANALYZING..." : "USE PHOTO"}
            </button>
          </div>

          {submitStatus === "error" && <p className={styles.submitError}>ANALYSIS FAILED. PLEASE RETRY.</p>}

          {cameraStatus === "error" && (
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => {
                void startCamera();
              }}
            >
              RETRY CAMERA
            </button>
          )}
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
