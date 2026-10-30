import type { TxLocation } from "@/lib/finance/types";

export type PlaceHit = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

type NominatimPlace = {
  place_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
};

function shortPlace(place: NominatimPlace): string {
  const display = place.display_name
    ?.split(",")
    .slice(0, 3)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  return (display || place.name || "").slice(0, 80);
}

function hitFromPlace(place: NominatimPlace): PlaceHit | null {
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  const label = shortPlace(place);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !label) return null;
  return { id: String(place.place_id ?? `${lat},${lng}`), label, lat, lng };
}

async function nominatim(path: string, params: Record<string, string>, signal?: AbortSignal) {
  const url = new URL(path, "https://nominatim.openstreetmap.org/");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("place lookup failed");
  return response.json() as Promise<unknown>;
}

export function locationTitle(location: TxLocation): string {
  return location.label || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const body = (await nominatim("/search", { q, format: "jsonv2", limit: "5" }, signal)) as NominatimPlace[];
  if (!Array.isArray(body)) return [];
  return body.map(hitFromPlace).filter((hit): hit is PlaceHit => hit !== null);
}

export async function reversePlace(lat: number, lng: number, signal?: AbortSignal): Promise<string> {
  const body = (await nominatim(
    "/reverse",
    { lat: String(lat), lon: String(lng), format: "jsonv2" },
    signal,
  )) as NominatimPlace;
  return shortPlace(body);
}

export function readCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("denied")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120_000 },
    );
  });
}
