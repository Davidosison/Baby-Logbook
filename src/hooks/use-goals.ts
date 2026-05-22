import { useState } from "react";

const GOALS_KEY = "baby-logbook-goals";

export const DEFAULT_GOALS = {
  feedingGoalMin: 8,
  feedingGoalMax: 12,
  sleepGoalHours: 16,
};

export type Goals = typeof DEFAULT_GOALS;

function readGoals(): Goals {
  try {
    const stored = localStorage.getItem(GOALS_KEY);
    return stored ? { ...DEFAULT_GOALS, ...JSON.parse(stored) } : DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
}

export function useGoals() {
  const [goals, setGoalsState] = useState<Goals>(readGoals);

  const setGoal = <K extends keyof Goals>(key: K, value: Goals[K]) => {
    const next = { ...goals, [key]: value };
    localStorage.setItem(GOALS_KEY, JSON.stringify(next));
    setGoalsState(next);
  };

  return { goals, setGoal };
}

/** Read goals synchronously (for use inside React Query queryFn) */
export function getGoals(): Goals {
  return readGoals();
}
