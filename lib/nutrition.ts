export type Sex = "M" | "F";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "slabire" | "masa" | "mentinere";

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function mifflinStJeorBMR(params: {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
}): number {
  const { sex, age, height_cm, weight_kg } = params;
  // BMR = 10W + 6.25H - 5A + s (s=+5 male, -161 female)
  const s = sex === "M" ? 5 : -161;
  return 10 * weight_kg + 6.25 * height_cm - 5 * age + s;
}

export function computeTargets(params: {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
}): { calorie_target: number; protein_target: number; fat_target: number; carbs_target: number } {
  const { sex, age, height_cm, weight_kg, activity_level, goal } = params;

  const bmr = mifflinStJeorBMR({ sex, age, height_cm, weight_kg });
  const tdee = bmr * ACTIVITY_FACTORS[activity_level];

  // Defaults (confirmate)
  const deficit = 0.15; // 15%
  const surplus = 0.10; // 10% (nu e folosit acum, dar rămâne pentru extindere)

  let calories = tdee;
  if (goal === "slabire") calories = tdee * (1 - deficit);
  if (goal === "masa") calories = tdee * (1 + surplus);
  if (goal === "mentinere") calories = tdee;

  // Macros
  const protein_g = 2.0 * weight_kg; // 2.0 g/kg
  const fat_g = 0.8 * weight_kg;     // 0.8 g/kg
  const protein_kcal = protein_g * 4;
  const fat_kcal = fat_g * 9;
  const remaining_kcal = Math.max(0, calories - protein_kcal - fat_kcal);
  const carbs_g = remaining_kcal / 4;

  return {
    calorie_target: Math.round(calories),
    protein_target: Math.round(protein_g),
    fat_target: Math.round(fat_g),
    carbs_target: Math.round(carbs_g),
  };
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
