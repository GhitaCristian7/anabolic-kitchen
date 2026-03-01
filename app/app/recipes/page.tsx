"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Recipe } from "@/lib/types";
import { Card, CardHeader, CardBody, Input, Select, Badge } from "@/components/ui";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [minProtein, setMinProtein] = useState<number>(0);
  const [maxKcal, setMaxKcal] = useState<number>(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await supabase
        .from("recipes")
        .select("id,title,category,cooking_time_min,calories,protein,carbs,fat,ingredients,steps,image_url")
        .order("id", { ascending: true });

      if (res.error) setErr(res.error.message);
      else setRecipes(res.data as any);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (q && !r.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (minProtein > 0 && r.protein < minProtein) return false;
      if (maxKcal > 0 && r.calories > maxKcal) return false;
      return true;
    });
  }, [recipes, q, category, minProtein, maxKcal]);

  return (
    <Card>
      <CardHeader title="Rețete" subtitle="Selectează o rețetă și adaug-o la ziua de azi." />
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="Căutare" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex: iaurt, pui, orez..." />
          <Select label="Categorie" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Toate</option>
            <option value="mic_dejun">Mic dejun</option>
            <option value="pranz">Prânz</option>
            <option value="cina">Cină</option>
            <option value="gustare">Gustare</option>
          </Select>
          <Input label="Min proteine (g)" type="number" value={minProtein} onChange={(e) => setMinProtein(Number(e.target.value))} />
          <Input label="Max kcal" type="number" value={maxKcal} onChange={(e) => setMaxKcal(Number(e.target.value))} />
        </div>

        {err ? <div className="mt-4 text-warn text-sm">{err}</div> : null}
        {loading ? <div className="mt-4 text-text2">Se încarcă...</div> : null}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <Link key={r.id} href={`/app/recipes/${r.id}`}>
              <div className="rounded-xl2 border border-white/10 bg-black/20 p-4 hover:border-white/20 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{r.title}</div>
                  <Badge>{r.cooking_time_min} min</Badge>
                </div>
                <div className="mt-1 text-sm text-text2">
                  {r.calories} kcal • P {r.protein}g • C {r.carbs}g • F {r.fat}g
                </div>
                <div className="mt-2 text-xs text-text2">
                  {r.category === "mic_dejun" ? "Mic dejun" : r.category === "pranz" ? "Prânz" : r.category === "cina" ? "Cină" : "Gustare"}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!loading && filtered.length === 0 ? <div className="mt-4 text-text2">Nicio rețetă găsită pentru filtrele alese.</div> : null}
      </CardBody>
    </Card>
  );
}
