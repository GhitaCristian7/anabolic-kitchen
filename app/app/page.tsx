"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Profile, DailyLog, Recipe } from "@/lib/types";
import { Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";

type Totals = { calories: number; protein: number; carbs: number; fat: number };

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<(DailyLog & { recipe: Recipe })[]>([]);
  const [error, setError] = useState<string | null>(null);

  const date = useMemo(() => todayISO(), []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) return;

      const profRes = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (profRes.error) {
        setError(profRes.error.message);
        setLoading(false);
        return;
      }
      if (!profRes.data) {
        setProfile(null);
        setLoading(false);
        return;
      }
      if (!mounted) return;
      setProfile(profRes.data as Profile);

      const logsRes = await supabase
        .from("daily_logs")
        .select("id,user_id,log_date,recipe_id,portions, recipes:recipe_id ( id,title,category,cooking_time_min,calories,protein,carbs,fat,ingredients,steps,image_url )")
        .eq("user_id", user.id)
        .eq("log_date", date)
        .order("created_at", { ascending: false });

      if (logsRes.error) {
        setError(logsRes.error.message);
      } else {
        const mapped = (logsRes.data ?? []).map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          log_date: row.log_date,
          recipe_id: row.recipe_id,
          portions: Number(row.portions),
          recipe: row.recipes,
        }));
        setLogs(mapped);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false
    }
  }, [date]);

  const totals: Totals = useMemo(() => {
    return logs.reduce(
      (acc, l) => {
        acc.calories += l.recipe.calories * l.portions;
        acc.protein += l.recipe.protein * l.portions;
        acc.carbs += l.recipe.carbs * l.portions;
        acc.fat += l.recipe.fat * l.portions;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [logs]);

  if (loading) {
    return <div className="text-text2">Se încarcă...</div>;
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader title="Onboarding" subtitle="Completează datele ca să-ți calculăm țintele zilnice." />
        <CardBody>
          <div className="text-text2 text-sm">
            Înainte să folosești rețetele și tracker-ul, avem nevoie de datele de bază pentru calculatorul caloric.
          </div>
          <div className="mt-4">
            <Link href="/app/onboarding"><Button>Completează profilul</Button></Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  const kcalLeft = Math.max(0, profile.calorie_target - totals.calories);
  const pLeft = Math.max(0, profile.protein_target - totals.protein);
  const cLeft = Math.max(0, profile.carbs_target - totals.carbs);
  const fLeft = Math.max(0, profile.fat_target - totals.fat);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader title="Astăzi" subtitle={`Data: ${date}`} />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl2 border border-white/10 bg-black/20 p-4">
              <div className="text-sm text-text2">Calorii</div>
              <div className="mt-1 text-2xl font-semibold">{Math.round(totals.calories)} / {profile.calorie_target}</div>
              <div className="mt-2 text-sm text-text2">Rămase: <span className="text-white">{kcalLeft}</span> kcal</div>
            </div>

            <div className="rounded-xl2 border border-white/10 bg-black/20 p-4">
              <div className="text-sm text-text2">Macros rămase</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className="border-accent/40">P: {pLeft}g</Badge>
                <Badge className="border-carb/40">C: {cLeft}g</Badge>
                <Badge className="border-fat/40">F: {fLeft}g</Badge>
              </div>
              <div className="mt-3 text-sm text-text2">
                Consumate: P {Math.round(totals.protein)}g, C {Math.round(totals.carbs)}g, F {Math.round(totals.fat)}g
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Link href="/app/recipes"><Button>Adaugă masă</Button></Link>
            <Link href="/app/day"><Button variant="ghost">Vezi ziua</Button></Link>
          </div>

          {error ? <div className="mt-4 text-warn text-sm">{error}</div> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Țintele tale" subtitle="Generat automat" />
        <CardBody>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text2">Calorii</span><span>{profile.calorie_target}</span></div>
            <div className="flex justify-between"><span className="text-text2">Proteine</span><span>{profile.protein_target} g</span></div>
            <div className="flex justify-between"><span className="text-text2">Carbo</span><span>{profile.carbs_target} g</span></div>
            <div className="flex justify-between"><span className="text-text2">Grăsimi</span><span>{profile.fat_target} g</span></div>
          </div>
          <div className="mt-4 text-xs text-text2">
            Setări MVP: 15% deficit la slăbire, proteină 2.0g/kg, grăsimi 0.8g/kg.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
