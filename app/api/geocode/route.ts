import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { noStore } from "@/lib/api";
import { states } from "@/data/geo";
import { clientIp, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

type CacheEntry = { result: ReverseResult; at: number };
type ReverseResult = {
  stateId: string | null;
  districtId: string | null;
  districtName: string | null;
  attribution: string;
};

const cache = new Map<string, CacheEntry>();

function matchDistrict(address: Record<string, string>): ReverseResult {
  const candidates = [
    address.state_district,
    address.county,
    address.city,
    address.town,
    address.village,
    address.suburb,
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  for (const state of states.filter((item) => item.active)) {
    for (const district of state.districts) {
      const names = [district.nameEn.toLowerCase(), district.nameHi];
      if (candidates.some((candidate) => names.some((name) => candidate.includes(name)))) {
        return {
          stateId: state.id,
          districtId: district.id,
          districtName: `${district.nameHi}, ${state.nameHi}`,
          attribution: "OpenStreetMap contributors",
        };
      }
    }
  }
  return { stateId: null, districtId: null, districtName: null, attribution: "OpenStreetMap contributors" };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ ok: false, error: "Invalid coordinates." }, { status: 400 });
  }

  const limit = rateLimit(`geocode:${clientIp(request)}`, 20, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Too many location lookups. Try again later." }, { status: 429 });
  }

  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) {
    return noStore({ ok: true, ...cached.result, cached: true });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const endpoint = new URL("https://nominatim.openstreetmap.org/reverse");
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("lat", String(lat));
    endpoint.searchParams.set("lon", String(lon));
    endpoint.searchParams.set("zoom", "10");
    endpoint.searchParams.set("addressdetails", "1");
    endpoint.searchParams.set("accept-language", "hi,en");

    const response = await fetch(endpoint, {
      headers: {
        "user-agent": "KyaBoltiPublic/1.0 (civic platform; https://kyaboltipublic.in)",
        accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Geocoder HTTP ${response.status}`);
    const data = (await response.json()) as { address?: Record<string, string> };
    const result = matchDistrict(data.address ?? {});
    cache.set(key, { result, at: Date.now() });
    return noStore({ ok: true, ...result, cached: false });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Reverse geocoding is unavailable right now. Please choose your district manually.",
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timer);
  }
}
