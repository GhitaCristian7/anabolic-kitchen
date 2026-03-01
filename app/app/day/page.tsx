"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { DailyLog, Recipe } from "@/lib/types";
import { Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DayPage() {
  const date = useMemo(() => todayISO(), []);
  const [items, setItems] = useState<(DailyLog & { recipe: Recipe })[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) return;

    const logsRes = await supabase
      .from("daily_logs")
      .select("id,user_id,log_date,recipe_id,portions, recipes:recipe_id ( id,title,category,cooking_time_min,calories,protein,carbs,fat,ingredients,steps,image_url )")
      .eq("user_id", user.id)
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
    setItems(mapped);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function removeLog(id: number) {
    const { error } = await supabase.from("daily_logs").delete().eq("id", id);
    if (error) {
      setErr(error.message);
      return;
    }
    await load();
  }

  const totals = useMemo(() => {
    return items.reduce(
      (acc, l) => {
        acc.calories += l.recipe.calories * l.portions;
        acc.protein += l.recipe.protein * l.portions;
        acc.carbs += l.recipe.carbs * l.portions;
        acc.fat += l.recipe.fat * l.portions;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [items]);

  return (
    <Card>
      <CardHeader title="Ziua curentă" subtitle={`Data: ${date}`} />
      <CardBody>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-text2">
            Total: <span className="text-white">{Math.round(totals.calories)} kcal</span> •
            <span className="text-white"> P {Math.round(totals.protein)}g</span> •
            <span className="text-white"> C {Math.round(totals.carbs)}g</span> •
            <span className="text-white"> F {Math.round(totals.fat)}g</span>
          </div>
          <Link href="/app/recipes"><Button>Adaugă masă</Button></Link>
        </div>

        {err ? <div className="mt-3 text-warn text-sm">{err}</div> : null}

        <div className="mt-4 space-y-3">
          {loading ? <div className="text-text2">Se încarcă...</div> : null}
          {!loading && items.length === 0 ? <div className="text-text2">Nicio masă adăugată azi.</div> : null}

          {items.map((it) => (
            <div key={it.id} className="rounded-xl2 border border-white/10 bg-black/20 p-4 flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{it.recipe.title}</div>
                <div className="text-sm text-text2 mt-1">
                  Porții: {it.portions} • {it.recipe.calories * it.portions} kcal
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge className="border-accent/40">P {it.recipe.protein * it.portions}g</Badge>
                  <Badge className="border-carb/40">C {it.recipe.carbs * it.portions}g</Badge>
                  <Badge className="border-fat/40">F {it.recipe.fat * it.portions}g</Badge>
                </div>
              </div>
              <Button variant="ghost" onClick={() => removeLog(it.id)}>Șterge</Button>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
