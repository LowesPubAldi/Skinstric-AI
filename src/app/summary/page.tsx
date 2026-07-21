"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import styles from "./page.module.css";

type DemographicGroup = "race" | "age" | "gender";

type DemographicItem = {
  label: string;
  value: number;
};

type DemographicResults = Record<DemographicGroup, DemographicItem[]>;

type AnalysisStorageShape = {
  response?: {
    data?: Partial<Record<DemographicGroup, Record<string, number>>>;
  };
  results?: Partial<Record<DemographicGroup, DemographicItem[]>>;
};

const phaseTwoAnalysisStorageKey = "skinstric-phase-two-analysis";

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

  const race = stored?.race?.length
    ? [...stored.race].sort((first, second) => second.value - first.value)
    : sortScores(responseData?.race);
  const age = stored?.age?.length
    ? [...stored.age].sort((first, second) => second.value - first.value)
    : sortScores(responseData?.age);
  const gender = stored?.gender?.length
    ? [...stored.gender].sort((first, second) => second.value - first.value)
    : sortScores(responseData?.gender);

  return { race, age, gender };
}

export default function SummaryPage() {
  const [results, setResults] = useState<DemographicResults | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "empty">("loading");
  const [activeGroup, setActiveGroup] = useState<DemographicGroup>("race");
  const [actualSelections, setActualSelections] = useState<Record<DemographicGroup, string>>({
    race: "Not set",
    age: "Not set",
    gender: "Not set",
  });

  useEffect(() => {
    const rawAnalysis = window.localStorage.getItem(phaseTwoAnalysisStorageKey);
    if (!rawAnalysis) {
      setLoadStatus("empty");
      return;
    }

    try {
      const parsed = JSON.parse(rawAnalysis) as AnalysisStorageShape;
      const normalized = normalizeResults(parsed);
      const hasAnyResults = normalized.race.length || normalized.age.length || normalized.gender.length;

      if (!hasAnyResults) {
        setLoadStatus("empty");
        return;
      }

      setResults(normalized);
      setActualSelections({
        race: normalized.race[0]?.label ?? "Not set",
        age: normalized.age[0]?.label ?? "Not set",
        gender: normalized.gender[0]?.label ?? "Not set",
      });
      setActiveGroup("race");
      setLoadStatus("ready");
    } catch {
      setLoadStatus("empty");
    }
  }, []);

  function handleSelection(group: DemographicGroup, label: string) {
    setActualSelections((previous) => ({
      ...previous,
      [group]: label,
    }));
  }

  const activeGroupTitle = activeGroup === "gender" ? "SEX" : activeGroup.toUpperCase();
  const activeScores = results ? results[activeGroup] : [];
  const activeSelectionLabel = actualSelections[activeGroup];
  const activeSelectionValue =
    activeScores.find((item) => item.label === activeSelectionLabel)?.value ?? activeScores[0]?.value ?? 0;
  const donutStyle = {
    "--score-angle": `${activeSelectionValue * 360}deg`,
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
                  <div className={styles.donutInner}>{formatPercentWhole(activeSelectionValue)}</div>
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

            <nav className={styles.mobileFooter} aria-label="Summary actions">
              <Link className={styles.mobileFooterDiamond} href="/select">
                <span className={styles.mobileFooterLabel}>BACK</span>
              </Link>
              <Link className={styles.mobileFooterDiamond} href="/">
                <span className={styles.mobileFooterLabel}>HOME</span>
              </Link>
            </nav>
          </>
        )}

      </main>
    </div>
  );
}
