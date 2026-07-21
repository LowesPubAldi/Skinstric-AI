"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const phaseOneEndpoint = "https://us-central1-frontend-simplified.cloudfunctions.net/skinstricPhaseOne";
const nameStorageKey = "skinstric-phase-one-name";
const locationStorageKey = "skinstric-phase-one-location";
const endpointStorageKey = "skinstric-phase-one-endpoint";
const responseStorageKey = "skinstric-phase-one-response";
const requestTimeoutMs = 12000;

export default function TakeTestPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [step, setStep] = useState<"name" | "city" | "processing" | "success">("name");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    window.localStorage.setItem(nameStorageKey, name);
  }, [name]);

  useEffect(() => {
    window.localStorage.setItem(locationStorageKey, city);
  }, [city]);

  useEffect(() => {
    window.localStorage.setItem(endpointStorageKey, phaseOneEndpoint);
  }, []);

  function isValidEntry(value: string) {
    const trimmedValue = value.trim();
    return /^[A-Za-z][A-Za-z\s'-]*$/.test(trimmedValue) && !/\d/.test(trimmedValue);
  }

  async function submitPhaseOne(nameValue: string, locationValue: string) {
    setErrorMessage("");
    setStep("processing");
    window.localStorage.removeItem(responseStorageKey);
    const startedAt = window.performance.now();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, requestTimeoutMs);

    try {
      const response = await fetch(phaseOneEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({ name: nameValue, location: locationValue }),
      });

      if (!response.ok) {
        throw new Error("Phase 1 submission failed");
      }

      const responseBody = await response.json().catch(() => null);
      window.localStorage.setItem(
        responseStorageKey,
        JSON.stringify({
          endpoint: phaseOneEndpoint,
          request: {
            name: nameValue,
            location: locationValue,
          },
          response: responseBody,
          submittedAt: new Date().toISOString(),
        }),
      );
      const minimumDuration = 1200;
      const elapsed = window.performance.now() - startedAt;

      if (elapsed < minimumDuration) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, minimumDuration - elapsed);
        });
      }

      setStep("success");
    } catch (error) {
      setStep("city");
      if (error instanceof DOMException && error.name === "AbortError") {
        setErrorMessage("Request timed out. Please try again.");
        return;
      }

      setErrorMessage("Submission failed. Please try again.");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function focusInput() {
    if (step === "processing" || step === "success") {
      return;
    }

    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (step === "name" && name.trim()) {
      if (!isValidEntry(name)) {
        setErrorMessage("Enter a valid name using letters only.");
        return;
      }

      setErrorMessage("");
      setStep("city");
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return;
    }

    if (step === "city" && city.trim()) {
      if (!isValidEntry(city)) {
        setErrorMessage("Enter a valid location using letters only.");
        return;
      }

      inputRef.current?.blur();
      void submitPhaseOne(name.trim(), city.trim());
    }
  }

  const showProcessing = step === "processing";
  const showSuccess = step === "success";
  const titleDisplay = step === "name" ? name || "Introduce Yourself" : city || "Your City Name";
  const promptLabel = step === "name" ? "CLICK TO TYPE" : step === "city" ? "ENTER YOUR CITY" : "";
  const hasTypedValue = (step === "name" ? name : city).trim().length > 0;

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

        <section className={styles.hero} aria-label="Introduce yourself">
          <div className={`${styles.square} ${styles.squareOuter}`} aria-hidden="true" />
          <div className={`${styles.square} ${styles.squareMiddle}`} aria-hidden="true" />
          <div className={`${styles.square} ${styles.squareInner}`} aria-hidden="true" />

          <div className={styles.heroContent} onClick={focusInput}>
            <p className={styles.prompt}>{promptLabel || "\u00A0"}</p>
            <p className={styles.errorMessage} aria-live="polite">
              {errorMessage || "\u00A0"}
            </p>
            {!showProcessing && !showSuccess && (
              <div className={`${styles.titleDisplay} ${hasTypedValue ? styles.titleDisplayActive : ""}`}>
                {titleDisplay}
              </div>
            )}
            {!showProcessing && !showSuccess && (
              <input
                ref={inputRef}
                className={styles.titleInput}
                type="text"
                value={step === "name" ? name : city}
                onChange={(event) => {
                  if (errorMessage) {
                    setErrorMessage("");
                  }

                  if (step === "name") {
                    setName(event.target.value);
                    return;
                  }

                  setCity(event.target.value);
                }}
                onKeyDown={handleKeyDown}
                aria-label={step === "name" ? "Introduce yourself" : "Enter your city"}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="words"
                maxLength={28}
              />
            )}
            {showProcessing && (
              <div className={styles.processingState} aria-live="polite">
                <div className={styles.processingTitle}>Processing Submission</div>
                <div className={styles.processingSubtitle}>This may take a few seconds</div>
                <div className={styles.processingSkeleton} aria-hidden="true">
                  <span className={styles.processingSkeletonLine} />
                  <span className={styles.processingSkeletonLine} />
                  <span className={`${styles.processingSkeletonLine} ${styles.processingSkeletonLineShort}`} />
                </div>
                <div className={styles.processingDots} aria-hidden="true">
                  <span className={styles.processingDot} style={{ animationDelay: "0ms" }} />
                  <span className={styles.processingDot} style={{ animationDelay: "120ms" }} />
                  <span className={styles.processingDot} style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
            {!showSuccess && <div className={styles.titleUnderline} aria-hidden="true" />}
            {showSuccess && (
              <div className={styles.successCopy}>
                <p className={styles.successTitle}>Thank you!</p>
                <p className={styles.successDescription}>Proceed for the next step</p>
              </div>
            )}
          </div>
        </section>

        <Link className={styles.backLink} href="/">
          <span className={styles.backDiamond}>
            <span className={styles.backTriangle} aria-hidden="true" />
          </span>
          <span className={styles.backLabel}>Back</span>
        </Link>

        {showSuccess && (
          <Link className={styles.proceedLink} href="/result">
            <span className={styles.proceedLabel}>Proceed</span>
            <span className={styles.proceedDiamond} aria-hidden="true">
              <span className={styles.proceedTriangle} />
            </span>
          </Link>
        )}
      </main>
    </div>
  );
}