import { NextResponse } from "next/server";

function num(x: any): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

// Open Food Facts: căutare simplă (fără cheie)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ items: [] });

  const url =
    "https://world.openfoodfacts.org/cgi/search.pl" +
    `?search_terms=${encodeURIComponent(q)}` +
    "&search_simple=1&action=process&json=1&page_size=12";

  const r = await fetch(url, {
    // cache scurt (Vercel)
    next: { revalidate: 60 },
    headers: { "User-Agent": "AnabolicKitchen/1.0 (contact: fitnessupgrade.ro)" },
  });

  if (!r.ok) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const j: any = await r.json();
  const products: any[] = Array.isArray(j?.products) ? j.products : [];

  const items = products
    .map((p) => {
      const nutr = p?.nutriments ?? {};
      const name =
        p?.product_name ||
        p?.generic_name ||
        p?.abbreviated_product_name ||
        p?.brands ||
        "Produs";
      const id = String(p?._id ?? p?.code ?? name);

      // OFF poate avea kcal ca 'energy-kcal_100g' sau energy-kcal
      const kcal100 = num(nutr["energy-kcal_100g"] ?? nutr["energy-kcal"]);
      const p100 = num(nutr["proteins_100g"]);
      const c100 = num(nutr["carbohydrates_100g"]);
      const f100 = num(nutr["fat_100g"]);

      // filtrăm rezultate fără macro
      if (kcal100 <= 0 && (p100 <= 0 && c100 <= 0 && f100 <= 0)) return null;

      return {
        id,
        name: String(name).trim(),
        kcal100,
        p100,
        c100,
        f100,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ items });
}
