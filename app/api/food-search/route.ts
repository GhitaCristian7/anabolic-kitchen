import { NextResponse } from "next/server";

function num(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pickName(p: any): string {
  return (
    p.product_name_ro ||
    p.product_name ||
    p.generic_name_ro ||
    p.generic_name ||
    p.abbreviated_product_name ||
    "Produs fără nume"
  );
}

function hasUsefulNutrients(p: any): boolean {
  const n = p?.nutriments || {};
  const kcal = num(n["energy-kcal_100g"] ?? n["energy-kcal"]) || (num(n["energy_100g"]) / 4.184);
  const p100 = num(n["proteins_100g"]);
  const c100 = num(n["carbohydrates_100g"]);
  const f100 = num(n["fat_100g"]);
  // minim: kcal + cel puțin 1 macronutrient
  return kcal > 0 && (p100 > 0 || c100 > 0 || f100 > 0);
}

function toHit(p: any) {
  const n = p?.nutriments || {};
  const kcal = num(n["energy-kcal_100g"] ?? n["energy-kcal"]) || (num(n["energy_100g"]) / 4.184);
  return {
    id: String(p.id || p._id || p.code || ""),
    name: pickName(p),
    brand: p.brands || null,
    kcal100: Math.round(kcal),
    p100: Math.round(num(n["proteins_100g"]) * 10) / 10,
    c100: Math.round(num(n["carbohydrates_100g"]) * 10) / 10,
    f100: Math.round(num(n["fat_100g"]) * 10) / 10,
    // scor simplu ca să sortăm “ce e complet” în față
    _score:
      (kcal > 0 ? 1 : 0) +
      (num(n["proteins_100g"]) > 0 ? 1 : 0) +
      (num(n["carbohydrates_100g"]) > 0 ? 1 : 0) +
      (num(n["fat_100g"]) > 0 ? 1 : 0),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) return NextResponse.json({ items: [] });

  // OFF: limităm payload-ul și cerem mai multe rezultate.
  // “search_simple=1” e mai rapid.
  const url =
    "https://world.openfoodfacts.org/cgi/search.pl" +
    `?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process` +
    `&page_size=30` +
    `&json=1` +
    `&fields=code,product_name,product_name_ro,generic_name,generic_name_ro,abbreviated_product_name,brands,nutriments`;

  // timeout ca să nu aștepți 10s când OFF e lent
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ items: [] }, { status: 200 });

    const data = await res.json();
    const products = Array.isArray(data?.products) ? data.products : [];

    // 1) map
    let items = products
      .map(toHit)
      .filter((x: any) => x.id && x.name && (x.kcal100 > 0 || x.p100 > 0 || x.c100 > 0 || x.f100 > 0));

    // 2) filtrare “mai corect”: păstrează doar ce are nutrienți utili
    items = items.filter((x: any) => x.kcal100 > 0 && (x.p100 > 0 || x.c100 > 0 || x.f100 > 0));

    // 3) sortare: cele mai complete în față
    items.sort((a: any, b: any) => (b._score || 0) - (a._score || 0));

    // 4) dedupe (același nume apare de 5 ori)
    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const it of items) {
      const key = `${it.name}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(it);
      if (deduped.length >= 20) break; // arată max 20, dar bune
    }

    // scoatem _score din răspuns
    const out = deduped.map(({ _score, ...rest }) => rest);

    return NextResponse.json({ items: out });
  } catch {
    return NextResponse.json({ items: [] });
  } finally {
    clearTimeout(t);
  }
}