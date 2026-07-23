export type DemographicGroup = "race" | "age" | "gender";

export type DemographicItem = {
  label: string;
  value: number;
};

const canonicalDemographicLabels: Record<DemographicGroup, Array<{ key: string; label: string }>> = {
  race: [
    { key: "white", label: "white" },
    { key: "latino_hispanic", label: "latino hispanic" },
    { key: "black", label: "black" },
    { key: "south_asian", label: "south asian" },
    { key: "middle_eastern", label: "middle eastern" },
    { key: "southeast_asian", label: "southeast asian" },
    { key: "east_asian", label: "east asian" },
  ],
  age: [
    { key: "0-2", label: "0-2" },
    { key: "3-9", label: "3-9" },
    { key: "10-19", label: "10-19" },
    { key: "20-29", label: "20-29" },
    { key: "30-39", label: "30-39" },
    { key: "40-49", label: "40-49" },
    { key: "50-59", label: "50-59" },
    { key: "60-69", label: "60-69" },
    { key: "70+", label: "70+" },
  ],
  gender: [
    { key: "male", label: "male" },
    { key: "female", label: "female" },
  ],
};

const ageAliases: Record<string, string> = {
  "70-79": "70+",
  "80-89": "70+",
  "90-99": "70+",
  ">70": "70+",
  "more than 70": "70+",
};

function normalizeGroupKey(group: DemographicGroup, label: string) {
  const trimmed = label.trim().toLowerCase();

  if (group === "age") {
    return ageAliases[trimmed] ?? trimmed;
  }

  return trimmed.replace(/\s+/g, "_");
}

function prettifyLabel(group: DemographicGroup, key: string) {
  if (group === "age") {
    return key;
  }

  return key.replace(/_/g, " ");
}

export function completeDemographicGroup(
  group: DemographicGroup,
  groupValues?: Record<string, number>,
  fallbackItems?: DemographicItem[],
) {
  const knownValues = new Map<string, number>();

  if (groupValues) {
    for (const [label, value] of Object.entries(groupValues)) {
      knownValues.set(normalizeGroupKey(group, label), value);
    }
  }

  if (fallbackItems?.length) {
    for (const item of fallbackItems) {
      const key = normalizeGroupKey(group, item.label);

      if (!knownValues.has(key)) {
        knownValues.set(key, item.value);
      }
    }
  }

  const canonical = canonicalDemographicLabels[group].map(({ key, label }) => ({
    label,
    value: knownValues.get(key) ?? 0,
  }));

  const canonicalKeys = new Set(canonicalDemographicLabels[group].map((item) => item.key));
  const extras = Array.from(knownValues.entries())
    .filter(([key]) => !canonicalKeys.has(key))
    .map(([key, value]) => ({
      label: prettifyLabel(group, key),
      value,
    }));

  return [...canonical, ...extras].sort((first, second) => second.value - first.value);
}