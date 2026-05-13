/** Forward geocode a place name via Nominatim (respect low-volume / attribution usage). */
export async function geocodePlace(
  query: string,
): Promise<{ lat: number; lon: number } | null> {
  const q = query.trim();
  if (!q) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "NexiaaTrack/1.0 (public tracking map)",
    },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  const first = data[0];
  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}
