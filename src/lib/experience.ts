export type ExperienceUnit = "months" | "years";

export interface ExperienceInput {
  value: number;
  unit: ExperienceUnit;
}

export function normalizeExperienceMonths(
  value: unknown,
  unit: ExperienceUnit,
) {
  const amount = Math.max(Math.floor(Number(value) || 0), 0);

  return unit === "years" ? amount * 12 : amount;
}

export function experienceYearsFromMonths(months: number) {
  return Math.max(Math.ceil(Math.max(months, 0) / 12), 0);
}

export function experienceInputFromMonths(months: number): ExperienceInput {
  const normalizedMonths = Math.max(Math.floor(Number(months) || 0), 0);

  if (normalizedMonths > 0 && normalizedMonths % 12 === 0) {
    return {
      value: normalizedMonths / 12,
      unit: "years",
    };
  }

  if (normalizedMonths >= 12) {
    return {
      value: Math.round(normalizedMonths / 12),
      unit: "years",
    };
  }

  return {
    value: normalizedMonths,
    unit: "months",
  };
}

export function workerExperienceMonths(worker: {
  experience_months?: number | null;
  years_of_experience: number;
}) {
  const storedMonths = Number(worker.experience_months);

  if (Number.isFinite(storedMonths) && storedMonths > 0) {
    return Math.max(Math.floor(storedMonths), 0);
  }

  return Math.max(Math.floor(Number(worker.years_of_experience) || 0), 0) * 12;
}

export function minimumExperienceMonths(role: {
  min_experience: number;
  min_experience_months?: number | null;
}) {
  const storedMonths = Number(role.min_experience_months);

  if (Number.isFinite(storedMonths) && storedMonths > 0) {
    return Math.max(Math.floor(storedMonths), 0);
  }

  return Math.max(Math.floor(Number(role.min_experience) || 0), 0) * 12;
}

export function formatExperienceMonths(months: number) {
  const normalizedMonths = Math.max(Math.floor(Number(months) || 0), 0);

  if (normalizedMonths === 0) {
    return "No experience listed";
  }

  if (normalizedMonths < 12) {
    return `${normalizedMonths} month${normalizedMonths === 1 ? "" : "s"} experience`;
  }

  if (normalizedMonths % 12 === 0) {
    const years = normalizedMonths / 12;

    return `${years} year${years === 1 ? "" : "s"} experience`;
  }

  const years = Math.floor(normalizedMonths / 12);
  const monthsRemainder = normalizedMonths % 12;
  const yearLabel = `${years} year${years === 1 ? "" : "s"}`;
  const monthLabel = `${monthsRemainder} month${monthsRemainder === 1 ? "" : "s"}`;

  return `${yearLabel} ${monthLabel} experience`;
}

export function formatMinimumExperience(role: {
  min_experience: number;
  min_experience_months?: number | null;
}) {
  const label = formatExperienceMonths(minimumExperienceMonths(role));

  return label === "No experience listed" ? "Any experience" : `${label} minimum`;
}
