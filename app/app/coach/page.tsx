"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, Recipe, DailyLog, Food, FoodLog } from "@/lib/types";
import { Card, CardHeader, CardBody, Button, Select, Input, Badge } from "@/components/ui";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type ClientRow = Pick<Profile, "user_id" | "sex" | "age" | "height_cm" | "weight_kg" | "goal"> & { is_coach?: boolean };

export default function CoachPage() {
  const [meCoach, setMeCoach] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [recipeLogs, setRecipeLogs] = useState<(DailyLog & { recipe: Recipe })[]>([]);
  const [foodLogs, setFoodLogs] = useState<(FoodLog & { food: Food })[]>([]);

  async function loadMe() {
    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) return;

    const me = await supabase.from("profiles").select("is_coach").eq("user_id", user.id).maybeSingle();
    setMeCoach(Boolean(me.data?.is_coach));
  }

  async function loadClients() {
    setErr(null);
    const res = await supabase.from("profiles").select("user_id,sex,age,height_cm,weight_kg,goal,is_coach").order("created_at", { ascending: false });
    if (res.error) {
      setErr(res.error.message);
      return;
    }
    const rows = (res.data ?? []).filter((r: any) => !r.is_coach) as any[];
    setClients(rows);
    if (!clientId && rows.length > 0) setClientId(rows[0].user_id);
  }

  async function loadDay() {
    if (!clientId) return;
    setLoading(true);
    setErr(null);

    const logsRes = await supabase
      .from("daily_logs")
      .select("id,user_id,log_date,recipe_id,portions, recipes:recipe_id ( id,title,category,cooking_time_min,calories,protein,carbs,fat,ingredients,steps,image_url )")
      .eq("user_id", clientId)
      .eq("log_date", date)
      .order("created_at", { ascending: false });

    if (logsRes.error) setErr(logsRes.error.message);

    const mapped = (logsRes.data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      log_date: row.log_date,
      recipe_id: row.recipe_id,
      portions: Number(row.portions),
      recipe: row.recipes,
    }));
    setRecipeLogs(mapped);

    const foodRes = await supabase
      .from("food_logs")
      .select("id,user_id,log_date,meal_type,food_id,grams, foods:food_id ( id,name,source,owner_user_id,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,is_verified )")
      .eq("user_id", clientId)
      .eq("log_date", date)
      .order("created_at", { ascending: false });

    if (foodRes.error) setErr(foodRes.error.message);

    const fMapped = (foodRes.data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      log_date: row.log_date,
      meal_type: row.meal_type,
      food_id: row.food_id,
      grams: Number(row.grams),
      food: row.foods,
    }));
    setFoodLogs(fMapped);

    setLoading(false);
  }

  useEffect(() => {
    loadMe().then(loadClients);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (clientId) loadDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, date]);

  const totals = useMemo(() => {
    const fromRecipes = recipeLogs.reduce(
      (acc, l) => {
        acc.calories += l.recipe.calories * l.portions;
        acc.protein += l.recipe.protein * l.portions;
        acc.carbs += l.recipe.carbs * l.portions;
        acc.fat += l.recipe.fat * l.portions;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const fromFoods = foodLogs.reduce(
      (acc, l) => {
        const mul = l.grams / 100;
        acc.calories += Number(l.food.calories_per_100g) * mul;
        acc.protein += Number(l.food.protein_per_100g) * mul;
        acc.carbs += Number(l.food.carbs_per_100g) * mul;
        acc.fat += Number(l.food.fat_per_100g) * mul;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: fromRecipes.calories + fromFoods.calories,
      protein: fromRecipes.protein + fromFoods.protein,
      carbs: fromRecipes.carbs + fromFoods.carbs,
      fat: fromRecipes.fat + fromFoods.fat,
    };
  }, [recipeLogs, foodLogs]);

  if (!meCoach) {
    return (
      <Card>
        <CardHeader title="Coach" subtitle="Acces restricționat" />
        <CardBody>
          <div className="text-text2">Contul tău nu este setat ca coach. (Setează is_coach=true în profiles pentru user-ul tău.)</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Coach dashboard" subtitle="Vezi rapid ce au mâncat clienții" />
      <CardBody>
        <div className="flex flex-wrap gap-3 items-end">
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={clients.map((c) => ({ value: c.user_id, label: c.user_id }))}
          />
          <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Button onClick={loadDay} disabled={loading}>{loading ? "..." : "Refresh"}</Button>
        </div>

        <div className="mt-4 text-sm text-text2">
          Total: <span className="text-white">{Math.round(totals.calories)} kcal</span> •
          <span className="text-white"> P {Math.round(totals.protein)}g</span> •
          <span className="text-white"> C {Math.round(totals.carbs)}g</span> •
          <span className="text-white"> F {Math.round(totals.fat)}g</span>
        </div>

        {err ? <div className="mt-3 text-warn text-sm">{err}</div> : null}

        <div className="mt-6">
          <div className="text-sm text-text2 mb-2">Alimente</div>
          {foodLogs.length === 0 ? <div className="text-text2">Nimic adăugat.</div> : null}
          <div className="space-y-2">
            {foodLogs.map((it) => {
              const mul = it.grams / 100;
              const kcal = Math.round(Number(it.food.calories_per_100g) * mul);
              return (
                <div key={`f-${it.id}`} className="rounded-xl2 border border-white/10 bg-black/20 p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.food.name}</div>
                    <div className="text-sm text-text2 mt-1">{it.meal_type} • {it.grams}g • {kcal} kcal</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Badge className="border-accent/40">P {Math.round(Number(it.food.protein_per_100g) * mul)}g</Badge>
                      <Badge className="border-carb/40">C {Math.round(Number(it.food.carbs_per_100g) * mul)}g</Badge>
                      <Badge className="border-fat/40">F {Math.round(Number(it.food.fat_per_100g) * mul)}g</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <div className="text-sm text-text2 mb-2">Rețete</div>
          {recipeLogs.length === 0 ? <div className="text-text2">Nimic adăugat.</div> : null}
          <div className="space-y-2">
            {recipeLogs.map((it) => (
              <div key={`r-${it.id}`} className="rounded-xl2 border border-white/10 bg-black/20 p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{it.recipe.title}</div>
                  <div className="text-sm text-text2 mt-1">Porții: {it.portions} • {it.recipe.calories * it.portions} kcal</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <Badge className="border-accent/40">P {it.recipe.protein * it.portions}g</Badge>
                    <Badge className="border-carb/40">C {it.recipe.carbs * it.portions}g</Badge>
                    <Badge className="border-fat/40">F {it.recipe.fat * it.portions}g</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
