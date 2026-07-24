export type CityInput = { city: string };

export function normalizeCities(cities: CityInput[]): CityInput[] {
  const seen = new Set<string>();
  const result: CityInput[] = [];
  for (const c of cities) {
    const city = c.city.trim();
    if (!city) continue;
    const key = city.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ city: city.slice(0, 64) });
  }
  return result;
}

export function assertCitiesForDomain(
  domain: "stock" | "reading" | "life",
  cities: CityInput[] | undefined
): { ok: true; cities: CityInput[] } | { ok: false; message: string } {
  if (domain !== "life") {
    return { ok: true, cities: [] };
  }
  return { ok: true, cities: normalizeCities(cities ?? []) };
}
