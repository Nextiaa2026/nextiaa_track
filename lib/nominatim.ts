/** Types and parsing for Nominatim (OpenStreetMap) search results */

export type NominatimAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  county?: string;
  state?: string;
  state_district?: string;
  region?: string;
  postcode?: string;
  country?: string;
};

export type NominatimItem = {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

export type AddressResult = {
  /** Street line (house + road) */
  address: string;
  /** Primary locality name (city, town, village, etc.) */
  city: string;
  state: string;
  zipCode: string;
  country: string;
  displayName: string;
  latitude: number;
  longitude: number;
  /** Suburb, neighbourhood, hamlet, etc. */
  locality: string;
  county: string;
};

function uniqueJoin(parts: (string | undefined)[]): string {
  return Array.from(
    new Set(parts.filter((p): p is string => Boolean(p && p.trim()))),
  ).join(", ");
}

export function parseNominatimItem(item: NominatimItem): AddressResult {
  const addr = item.address ?? {};
  const roadLine = [addr.house_number, addr.road].filter(Boolean).join(" ").trim();
  const displayNameParts = item.display_name.split(",").map((s) => s.trim());
  const firstPart = displayNameParts[0] || "";
  const secondPart = displayNameParts[1] || "";
  
  const address =
    roadLine ||
    (firstPart.length < 10 && secondPart ? `${firstPart}, ${secondPart}` : firstPart) ||
    item.display_name;

  const cityRaw =
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.village ||
    addr.county ||
    "";
  const city = cityRaw.trim().length >= 2 ? cityRaw.trim() : "Unknown";

  const locality = uniqueJoin([
    addr.suburb,
    addr.neighbourhood,
    addr.hamlet,
    addr.quarter,
  ]);

  const stateRaw =
    addr.state || addr.state_district || addr.region || "";
  const state = stateRaw.trim().length >= 2 ? stateRaw.trim() : "NA";

  const rawPostcode = (addr.postcode || "").trim();
  /** Many regions omit postcode in OSM; schema needs min 3 — user can edit in the form. */
  const zipCode = rawPostcode.length >= 3 ? rawPostcode : "000";

  const rawCountry = (addr.country || "").trim();
  const country = rawCountry.length >= 2 ? rawCountry : "NA";

  const county = addr.county || "";

  const latitude = Number.parseFloat(item.lat);
  const longitude = Number.parseFloat(item.lon);

  return {
    address,
    city,
    state,
    zipCode,
    country,
    displayName: item.display_name,
    latitude: Number.isFinite(latitude) ? latitude : NaN,
    longitude: Number.isFinite(longitude) ? longitude : NaN,
    locality,
    county,
  };
}
