"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  completeDemographicGroup,
  type DemographicGroup,
  type DemographicItem,
} from "../../lib/phase-two-demographics";
import styles from "./page.module.css";

type DemographicResults = Record<DemographicGroup, DemographicItem[]>;

type AnalysisStorageShape = {
  response?: {
    data?: Partial<Record<DemographicGroup, Record<string, number>>>;
  };
  results?: Partial<Record<DemographicGroup, DemographicItem[]>>;
};

const phaseTwoAnalysisStorageKey = "skinstric-phase-two-analysis";
const serverAnalysisSnapshot = "__SERVER_ANALYSIS_SNAPSHOT__";

const noopSubscribe = () => {
  return () => {};
};

function formatPercentWhole(value: number) {
  return `${Math.round(value * 100)}%`;
}

function sortScores(groupValues?: Record<string, number>) {
  if (!groupValues) {
    return [];
  }

  return Object.entries(groupValues)
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value);
}

function normalizeResults(raw: AnalysisStorageShape): DemographicResults {
  const stored = raw.results;
  const responseData = raw.response?.data;

  const race = completeDemographicGroup("race", responseData?.race, stored?.race ?? sortScores(responseData?.race));
  const age = completeDemographicGroup("age", responseData?.age, stored?.age ?? sortScores(responseData?.age));
  const gender = completeDemographicGroup(
    "gender",
    responseData?.gender,
    stored?.gender ?? sortScores(responseData?.gender),
  );

  return { race, age, gender };
}

function easeInOutCubic(progress: number) {
  return progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export default function SummaryPage() {
  const [activeGroup, setActiveGroup] = useState<DemographicGroup>("race");
  const [animatedSelectionValue, setAnimatedSelectionValue] = useState(0);
  const [selectionOverrides, setSelectionOverrides] = useState<Partial<Record<DemographicGroup, string>>>({});
  const [isFooterDockedAfterHero, setIsFooterDockedAfterHero] = useState(false);
  const animatedValueRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const footerDockSentinelRef = useRef<HTMLDivElement | null>(null);

  const analysisSnapshot = useSyncExternalStore(
    noopSubscribe,
    () => window.localStorage.getItem(phaseTwoAnalysisStorageKey),
    () => serverAnalysisSnapshot,
  );

  const { loadStatus, results } = useMemo(() => {
    if (analysisSnapshot === serverAnalysisSnapshot) {
      return {
        loadStatus: "loading" as const,
        results: null as DemographicResults | null,
      };
    }

    if (!analysisSnapshot) {
      return {
        loadStatus: "empty" as const,
        results: null as DemographicResults | null,
      };
    }

    try {
      const parsed = JSON.parse(analysisSnapshot) as AnalysisStorageShape;
      const normalized = normalizeResults(parsed);
      const hasAnyResults = normalized.race.length || normalized.age.length || normalized.gender.length;

      if (!hasAnyResults) {
        return {
          loadStatus: "empty" as const,
          results: null as DemographicResults | null,
        };
      }

      return {
        loadStatus: "ready" as const,
        results: normalized,
      };
    } catch {
      return {
        loadStatus: "empty" as const,
        results: null as DemographicResults | null,
      };
    }
  }, [analysisSnapshot]);

  function handleSelection(group: DemographicGroup, label: string) {
    setSelectionOverrides((previous) => ({
      ...previous,
      [group]: label,
    }));
  }

  const actualSelections: Record<DemographicGroup, string> = {
    race: selectionOverrides.race ?? results?.race[0]?.label ?? "Not set",
    age: selectionOverrides.age ?? results?.age[0]?.label ?? "Not set",
    gender: selectionOverrides.gender ?? results?.gender[0]?.label ?? "Not set",
  };

  const activeGroupTitle = activeGroup === "gender" ? "SEX" : activeGroup.toUpperCase();
  const activeScores = results ? results[activeGroup] : [];
  const activeSelectionLabel = actualSelections[activeGroup];
  const activeSelectionValue =
    activeScores.find((item) => item.label === activeSelectionLabel)?.value ?? activeScores[0]?.value ?? 0;

  useEffect(() => {
    if (loadStatus !== "ready") {
      return;
    }

    const from = animatedValueRef.current;
    const to = activeSelectionValue;

    if (Math.abs(to - from) < 0.0001) {
      return;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const durationMs = 300;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeInOutCubic(progress);
      const nextValue = from + (to - from) * eased;

      animatedValueRef.current = nextValue;
      setAnimatedSelectionValue(nextValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      animatedValueRef.current = to;
      setAnimatedSelectionValue(to);
      animationFrameRef.current = null;
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [activeSelectionValue, loadStatus]);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 640px)").matches) {
      setIsFooterDockedAfterHero(false);
      return;
    }

    const sentinel = footerDockSentinelRef.current;
    let frame: number | null = null;
    let sentinelVisible = false;

    const computeScrollDocked = () => {
      const doc = document.documentElement;
      const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      return progress >= 0.72;
    };

    const syncDockedState = () => {
      const scrollDocked = computeScrollDocked();
      setIsFooterDockedAfterHero(sentinelVisible || scrollDocked);
    };

    const onScrollOrResize = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        syncDockedState();
        frame = null;
      });
    };

    let observer: IntersectionObserver | null = null;
    if (sentinel) {
      observer = new IntersectionObserver(
        (entries) => {
          sentinelVisible = entries[0]?.isIntersecting ?? false;
          syncDockedState();
        },
        {
          root: null,
          threshold: 0,
        },
      );

      observer.observe(sentinel);
    }

    syncDockedState();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);

      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  const donutStyle = {
    "--score-angle": `${animatedSelectionValue * 360}deg`,
  } as CSSProperties;

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
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>A.I. ANALYSIS</p>
          <p className={styles.title}>DEMOGRAPHICS</p>
          <p className={styles.subtitle}>PREDICTED RACE &amp; AGE</p>
        </div>

        {loadStatus === "loading" && <p className={styles.infoMessage}>Loading saved analysis...</p>}

        {loadStatus === "empty" && (
          <div className={styles.emptyState}>
            <p>No demographic analysis is available yet.</p>
            <Link href="/result" className={styles.inlineLink}>
              Go back to upload an image
            </Link>
          </div>
        )}

        {loadStatus === "ready" && results && (
          <>
            <section className={styles.summaryStage} aria-label="Demographics summary">
              <aside className={styles.leftStack}>
                <button
                  type="button"
                  className={`${styles.leftTile} ${activeGroup === "race" ? styles.leftTileActive : ""}`}
                  onClick={() => {
                    setActiveGroup("race");
                  }}
                >
                  <span className={styles.leftValue}>{actualSelections.race}</span>
                  <span className={styles.leftLabel}>RACE</span>
                </button>

                <button
                  type="button"
                  className={`${styles.leftTile} ${activeGroup === "age" ? styles.leftTileActive : ""}`}
                  onClick={() => {
                    setActiveGroup("age");
                  }}
                >
                  <span className={styles.leftValue}>{actualSelections.age}</span>
                  <span className={styles.leftLabel}>AGE</span>
                </button>

                <button
                  type="button"
                  className={`${styles.leftTile} ${activeGroup === "gender" ? styles.leftTileActive : ""}`}
                  onClick={() => {
                    setActiveGroup("gender");
                  }}
                >
                  <span className={styles.leftValue}>{actualSelections.gender}</span>
                  <span className={styles.leftLabel}>SEX</span>
                </button>
              </aside>

              <article className={styles.centerPanel}>
                <p className={styles.focusLabel}>{activeSelectionLabel}</p>
                <div className={styles.donut} style={donutStyle} aria-hidden="true">
                  <div className={styles.donutInner}>{formatPercentWhole(animatedSelectionValue)}</div>
                </div>
              </article>

              <article className={styles.rightTable}>
                <div className={styles.tableHead}>
                  <p>{activeGroupTitle}</p>
                  <p>A.I. CONFIDENCE</p>
                </div>
                <div className={styles.tableBody}>
                  {activeScores.map((item) => {
                    const isSelected = actualSelections[activeGroup] === item.label;

                    return (
                      <button
                        key={`${activeGroup}-${item.label}`}
                        type="button"
                        className={`${styles.tableRow} ${isSelected ? styles.tableRowActive : ""}`}
                        onClick={() => {
                          handleSelection(activeGroup, item.label);
                        }}
                      >
                        <span className={styles.rowLabelWrap}>
                          <span className={styles.rowDiamond} aria-hidden="true" />
                          <span className={styles.rowLabel}>{item.label}</span>
                        </span>
                        <strong className={styles.rowValue}>{formatPercentWhole(item.value)}</strong>
                      </button>
                    );
                  })}
                </div>
              </article>
            </section>

            <div ref={footerDockSentinelRef} className={styles.footerDockSentinel} aria-hidden="true" />

            <footer
              className={`${styles.summaryFooter} ${isFooterDockedAfterHero ? styles.summaryFooterDocked : ""}`}
            >
              <nav className={styles.summaryFooterNav} aria-label="Summary actions">
                <Link className={styles.summaryFooterAction} href="/select">
                  <span className={styles.summaryFooterActionLabel}>Back</span>
                </Link>
                <Link className={styles.summaryFooterAction} href="/testing">
                  <span className={styles.summaryFooterActionLabel}>Save</span>
                </Link>
                <Link className={styles.summaryFooterAction} href="/camera/capture">
                  <span className={styles.summaryFooterActionLabel}>Selfie</span>
                </Link>
              </nav>
            </footer>
          </>
        )}

      </main>
    </div>
  );
}
