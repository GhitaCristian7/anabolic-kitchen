"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { computeTargets } from "@/lib/nutrition";
import { Card, CardHeader, CardBody, Input, Select, Button } from "@/components/ui";

export default function OnboardingPage() {
  const router = useRouter();

  const [sex, setSex] = useState<"M" | "F">("M");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(74);
  const [activity, setActivity] = useState<"sedentary" | "light" | "moderate" | "active" | "very_active">("moderate");
  const [goal, setGoal] = useState<"slabire" | "masa" | "mentinere">("slabire");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // dacă profilul există, nu refacem onboarding-ul
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      const prof = await supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle();
      if (prof.data) router.replace("/app");
    });
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) return;

    const targets = computeTargets({
      sex,
      age,
      height_cm: height,
      weight_kg: weight,
      activity_level: activity,
      goal,
    });

    const payload = {
      user_id: user.id,
      sex,
      age,
      height_cm: height,
      weight_kg: weight,
      activity_level: activity,
      goal,
      ...targets,
    };

    const { error } = await supabase.from("profiles").upsert(payload);
    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }

    router.replace("/app");
  }

  return (
    <Card>
      <CardHeader title="Onboarding" subtitle="Date pentru calculatorul caloric + macro plan." />
      <CardBody>
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Sex" value={sex} onChange={(e) => setSex(e.target.value as any)}>
            <option value="M">Bărbat</option>
            <option value="F">Femeie</option>
          </Select>

          <Input label="Vârstă" type="number" min={14} max={90} value={age} onChange={(e) => setAge(Number(e.target.value))} />

          <Input label="Înălțime (cm)" type="number" min={120} max={230} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          <Input label="Greutate (kg)" type="number" min={30} max={250} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />

          <Select label="Nivel activitate" value={activity} onChange={(e) => setActivity(e.target.value as any)}>
            <option value="sedentary">Sedentar</option>
            <option value="light">Ușor activ</option>
            <option value="moderate">Moderat activ</option>
            <option value="active">Activ</option>
            <option value="very_active">Foarte activ</option>
          </Select>

          <Select label="Obiectiv" value={goal} onChange={(e) => setGoal(e.target.value as any)}>
            <option value="slabire">Slăbire</option>
            <option value="masa">Masă musculară</option>
            <option value="mentinere">Menținere</option>
          </Select>

          <div className="md:col-span-2 flex items-center gap-2 mt-2">
            <Button type="submit" disabled={busy}>{busy ? "..." : "Salvează"}</Button>
            {msg ? <div className="text-warn text-sm">{msg}</div> : null}
          </div>
        </form>

        <div className="mt-6 text-xs text-text2">
          Setări MVP: slăbire = deficit 15%, masă = surplus 10%, proteină 2.0g/kg, grăsimi 0.8g/kg.
        </div>
      </CardBody>
    </Card>
  );
}
