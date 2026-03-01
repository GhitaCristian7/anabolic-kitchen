"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Recipe } from "@/lib/types";
import { Card, CardHeader, CardBody, Button, Badge, Input } from "@/components/ui";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [portions, setPortions] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  const date = useMemo(() => todayISO(), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await supabase
        .from("recipes")
        .select("id,title,category,cooking_time_min,calories,protein,carbs,fat,ingredients,steps,image_url")
        .eq("id", id)
        .maybeSingle();

      if (res.error) setMsg(res.error.message);
      setRecipe(res.data as any);
      setLoading(false);
    })();
  }, [id]);

  async function addToToday() {
    setMsg(null);
    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase.from("daily_logs").insert({
      user_id: user.id,
      log_date: date,
      recipe_id: id,
      portions,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/app/day");
  }

  if (loading) return <div className="text-text2">Se încarcă...</div>;
  if (!recipe) return <div className="text-warn">Rețeta nu a fost găsită.</div>;

  const kcal = Math.round(recipe.calories * portions);
  const p = Math.round(recipe.protein * portions);
  const c = Math.round(recipe.carbs * portions);
  const f = Math.round(recipe.fat * portions);

  return (
    <Card>
      <CardHeader title={recipe.title} subtitle={`${recipe.cooking_time_min} min • ${recipe.calories} kcal / porție`} />
      <CardBody>
        <div className="flex flex-wrap gap-2">
          <Badge className="border-accent/40">P {recipe.protein}g</Badge>
          <Badge className="border-carb/40">C {recipe.carbs}g</Badge>
          <Badge className="border-fat/40">F {recipe.fat}g</Badge>
          <Badge>{recipe.category === "mic_dejun" ? "Mic dejun" : recipe.category === "pranz" ? "Prânz" : recipe.category === "cina" ? "Cină" : "Gustare"}</Badge>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl2 border border-white/10 bg-black/20 p-4">
            <div className="font-medium">Ingrediente</div>
            <ul className="mt-2 space-y-1 text-sm text-text2">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>
                  • {ing.name}{ing.grams ? ` (${ing.grams} g)` : ing.unit ? ` (${ing.unit})` : ""}{ing.note ? ` – ${ing.note}` : ""}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl2 border border-white/10 bg-black/20 p-4">
            <div className="font-medium">Pași</div>
            <ol className="mt-2 space-y-2 text-sm text-text2 list-decimal list-inside">
              {recipe.steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 flex-wrap">
          <div className="max-w-xs">
            <Input label="Porții" type="number" min={0.25} step={0.25} value={portions} onChange={(e) => setPortions(Number(e.target.value))} />
            <div className="mt-2 text-sm text-text2">
              Pentru {portions} porții: <span className="text-white">{kcal} kcal</span> • P {p}g • C {c}g • F {f}g
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/app/recipes"><Button variant="ghost">Înapoi</Button></Link>
            <Button onClick={addToToday}>Adaugă azi</Button>
          </div>
        </div>

        {msg ? <div className="mt-4 text-warn text-sm">{msg}</div> : null}
      </CardBody>
    </Card>
  );
}
