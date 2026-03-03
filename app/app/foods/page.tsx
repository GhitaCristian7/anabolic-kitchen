"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Food, MealType } from "@/lib/types";
import { Card, CardHeader, CardBody, Button, Input, Select, Badge } from "@/components/ui";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type OffHit = {
  id: string;
  name: string;
  kcal100: number;
  p100: number;
  c100: number;
  f100: number;
};

export default function FoodsPage() {
  const date = useMemo(() => todayISO(), []);
  const [meal, setMeal] = useState<MealType>("pranz");
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<OffHit[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [grams, setGrams] = useState(200);

  // custom food
  const [cName, setCName] = useState("");
  const [cK, setCK] = useState(0);
  const [cP, setCP] = useState(0);
  const [cC, setCC] = useState(0);
  const [cF, setCF] = useState(0);
  const [savingCustom, setSavingCustom] = useState(false);

  async function doSearch() {
    const query = q.trim();
    if (!query) return;
    setErr(null);
    setSearching(true);
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Eroare la căutare (${res.status})`);
      const data = (await res.json()) as { items: OffHit[] };
      setHits(data.items);
      if (data.items.length === 0) setErr("Niciun rezultat relevant. Poți crea aliment custom mai jos.");
    } catch (e: any) {
      setErr(e?.message ?? "Eroare la căutare.");
    } finally {
      setSearching(false);
    }
  }

  async function addFromOff(hit: OffHit) {
    setErr(null);
    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) return;

    // 1) upsert minimal în foods (cache în DB ca verified=false dar usable ca global dacă vrem)
    const insertFood = await supabase
      .from("foods")
      .insert({
        name: hit.name,
        source: "off",
        external_id: hit.id,
        owner_user_id: user.id,
        calories_per_100g: hit.kcal100,
        protein_per_100g: hit.p100,
        carbs_per_100g: hit.c100,
        fat_per_100g: hit.f100,
        is_verified: false,
      })
      .select("id")
      .single();

    if (insertFood.error) {
      setErr(insertFood.error.message);
      return;
    }

    const foodId = insertFood.data.id;

    const insLog = await supabase.from("food_logs").insert({
      user_id: user.id,
      log_date: date,
      meal_type: meal,
      food_id: foodId,
      grams: Number(grams),
    });

    if (insLog.error) setErr(insLog.error.message);
    else setErr("Adăugat în ziua curentă ✅");
  }

  function kcalCheck(k: number, p: number, c: number, f: number): { ok: boolean; est: number } {
    const est = p * 4 + c * 4 + f * 9;
    // toleranță: ±20%
    const ok = k === 0 ? false : Math.abs(est - k) / k <= 0.2;
    return { ok, est };
  }

  async function addCustom() {
    setErr(null);
    const name = cName.trim();
    if (!name) return setErr("Completează numele alimentului.");
    const check = kcalCheck(cK, cP, cC, cF);
    if (!check.ok) {
      return setErr(`Valorile par inconsistente (estimare kcal ≈ ${Math.round(check.est)}). Verifică eticheta.`);
    }

    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) return;

    setSavingCustom(true);
    try {
      const insFood = await supabase
        .from("foods")
        .insert({
          name,
          source: "custom",
          owner_user_id: user.id,
          calories_per_100g: Number(cK),
          protein_per_100g: Number(cP),
          carbs_per_100g: Number(cC),
          fat_per_100g: Number(cF),
          is_verified: false,
        })
        .select("id")
        .single();

      if (insFood.error) throw insFood.error;

      const insLog = await supabase.from("food_logs").insert({
        user_id: user.id,
        log_date: date,
        meal_type: meal,
        food_id: insFood.data.id,
        grams: Number(grams),
      });

      if (insLog.error) throw insLog.error;

      setErr("Aliment custom adăugat în ziua curentă ✅");
      setCName("");
      setCK(0);
      setCP(0);
      setCC(0);
      setCF(0);
    } catch (e: any) {
      setErr(e?.message ?? "Eroare la salvare.");
    } finally {
      setSavingCustom(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Alimente" subtitle={`Adaugă alimente în ziua curentă (${date})`} />
      <CardBody>
        <div className="flex flex-wrap gap-3 items-end">
          <Select
            label="Masă"
            value={meal}
            onChange={(e) => setMeal(e.target.value as MealType)}
            options={[
              { value: "mic_dejun", label: "Mic dejun" },
              { value: "pranz", label: "Prânz" },
              { value: "cina", label: "Cină" },
              { value: "gustare", label: "Gustare" },
            ]}
          />
          <Input label="Grame" type="number" value={grams} onChange={(e) => setGrams(Number(e.target.value))} />
        </div>

        <div className="mt-6">
          <div className="text-sm text-text2 mb-2">Căutare (Open Food Facts)</div>
          <div className="flex gap-2">
            <Input placeholder="ex: iaurt grecesc, banană, orez" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button onClick={doSearch} disabled={searching}>{searching ? "..." : "Caută"}</Button>
          </div>

          <div className="mt-4 space-y-2">
            {hits.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface2 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{h.name}</div>
                  <div className="text-xs text-text2">
                    /100g: {Math.round(h.kcal100)} kcal • P {Math.round(h.p100)} • C {Math.round(h.c100)} • F {Math.round(h.f100)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{meal}</Badge>
                  <Button onClick={() => addFromOff(h)}>Adaugă</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="text-sm text-text2 mb-2">Nu găsești? Creează aliment custom (per 100g)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Nume" value={cName} onChange={(e) => setCName(e.target.value)} />
            <div />
            <Input label="Kcal / 100g" type="number" value={cK} onChange={(e) => setCK(Number(e.target.value))} />
            <Input label="Proteine / 100g" type="number" value={cP} onChange={(e) => setCP(Number(e.target.value))} />
            <Input label="Carbo / 100g" type="number" value={cC} onChange={(e) => setCC(Number(e.target.value))} />
            <Input label="Grăsimi / 100g" type="number" value={cF} onChange={(e) => setCF(Number(e.target.value))} />
          </div>
          <div className="mt-3">
            <Button onClick={addCustom} disabled={savingCustom}>{savingCustom ? "..." : "Adaugă aliment custom"}</Button>
          </div>
        </div>

        {err ? <div className="mt-4 text-sm text-warn">{err}</div> : null}
      </CardBody>
    </Card>
  );
}
