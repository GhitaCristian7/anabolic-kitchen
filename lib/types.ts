export type Profile = {
  user_id: string;
  sex: "M" | "F";
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "slabire" | "masa" | "mentinere";
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
};

export type Recipe = {
  id: number;
  title: string;
  category: "mic_dejun" | "pranz" | "cina" | "gustare";
  cooking_time_min: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Array<{ name: string; grams?: number; unit?: string; note?: string }>;
  steps: string[];
  image_url?: string | null;
};

export type DailyLog = {
  id: number;
  user_id: string;
  log_date: string;
  recipe_id: number;
  portions: number;
};
