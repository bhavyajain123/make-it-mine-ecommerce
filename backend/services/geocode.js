const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Nominatim requires an identifying User-Agent. Put a real contact in GEOCODER_USER_AGENT.
const USER_AGENT =
  process.env.GEOCODER_USER_AGENT || "MakeItMine-Store/1.0 (hello@makeitmine.com)";

const clean = (value) => (typeof value === "string" ? value.trim() : "");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function search(params) {
  const url = new URL(NOMINATIM_URL);
  url.search = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
    countrycodes: "in",
    ...params,
  }).toString();

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return null;

  const results = await response.json();
  const hit = Array.isArray(results) ? results[0] : null;
  if (!hit) return null;

  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng, state: clean(hit.address && hit.address.state) };
}

function stateMatches(expected, actual) {
  const a = clean(expected).toLowerCase();
  const b = clean(actual).toLowerCase();
  if (!a || !b) return true;
  return a.includes(b) || b.includes(a);
}

// Returns { lat, lng, precision } or null. precision is "address", "city" or "pincode".
async function geocodeAddress(address) {
  const state = clean(address.state);
  const city = clean(address.city);
  const pin = clean(address.postalCode);

  const attempts = [];

  const full = [address.addressLine, address.landmark, city, state, pin, "India"]
    .map(clean)
    .filter(Boolean)
    .join(", ");
  if (full) attempts.push({ precision: "address", params: { q: full } });

  if (city) {
    attempts.push({
      precision: "city",
      params: { q: [city, state, "India"].filter(Boolean).join(", ") },
    });
  }

  if (/^\d{6}$/.test(pin)) {
    attempts.push({
      precision: "pincode",
      params: { postalcode: pin, country: "India" },
    });
  }

  for (let i = 0; i < attempts.length; i++) {
    // Nominatim allows at most one request per second.
    if (i > 0) await sleep(1100);

    try {
      const hit = await search(attempts[i].params);
      if (hit && stateMatches(state, hit.state)) {
        return { lat: hit.lat, lng: hit.lng, precision: attempts[i].precision };
      }
    } catch (error) {
      console.error("Geocode attempt failed:", error.message);
    }
  }

  return null;
}

module.exports = { geocodeAddress };