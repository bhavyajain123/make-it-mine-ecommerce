const dispatchDefault = require("../config/dispatch");

const HILLY = [
  "himachal pradesh", "uttarakhand", "jammu and kashmir", "ladakh", "sikkim",
  "arunachal pradesh", "assam", "meghalaya", "manipur", "mizoram", "nagaland",
  "tripura", "andaman and nicobar islands", "lakshadweep",
];

// State ka andaza wala kendra, jab exact location na ho
const STATE_CENTER = {
  "delhi": [28.61, 77.21], "haryana": [29.06, 76.09], "punjab": [31.15, 75.34],
  "himachal pradesh": [31.1, 77.17], "uttarakhand": [30.07, 79.02],
  "jammu and kashmir": [33.78, 76.58], "ladakh": [34.15, 77.58],
  "uttar pradesh": [26.85, 80.91], "rajasthan": [27.02, 74.22],
  "gujarat": [22.26, 71.19], "maharashtra": [19.75, 75.71],
  "madhya pradesh": [22.97, 78.66], "chhattisgarh": [21.28, 81.87],
  "bihar": [25.1, 85.31], "jharkhand": [23.61, 85.28], "west bengal": [22.99, 87.85],
  "odisha": [20.95, 85.1], "assam": [26.2, 92.94], "meghalaya": [25.47, 91.37],
  "manipur": [24.66, 93.91], "mizoram": [23.16, 92.94], "nagaland": [26.16, 94.56],
  "tripura": [23.94, 91.99], "arunachal pradesh": [28.22, 94.73], "sikkim": [27.53, 88.51],
  "telangana": [18.11, 79.02], "andhra pradesh": [15.91, 79.74],
  "karnataka": [15.32, 75.71], "goa": [15.3, 74.12], "kerala": [10.85, 76.27],
  "tamil nadu": [11.13, 78.66], "chandigarh": [30.73, 76.78],
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function transitDays(km) {
  if (km <= 300) return [2, 3];
  if (km <= 800) return [3, 5];
  if (km <= 1500) return [4, 6];
  return [6, 9];
}

// { location: {lat,lng}, state, from: {lat,lng}, baseDate }
function estimateDelivery({ location, state, from, baseDate } = {}) {
  const origin = from || dispatchDefault;
  const key = String(state || "").trim().toLowerCase();

  let target = null;
  if (location && Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    target = [location.lat, location.lng];
  } else if (STATE_CENTER[key]) {
    target = STATE_CENTER[key];
  }

  const km = target ? haversineKm(origin.lat, origin.lng, target[0], target[1]) : 1000;
  let [min, max] = transitDays(km);

  min += 1; max += 1; // 1 din packing aur dispatch
  if (HILLY.includes(key)) { min += 1; max += 2; }

  const start = baseDate ? new Date(baseDate) : new Date();
  const addDays = (n) => new Date(start.getTime() + n * 24 * 60 * 60 * 1000);

  return { minDate: addDays(min), maxDate: addDays(max), minDays: min, maxDays: max, km: Math.round(km) };
}

module.exports = { estimateDelivery };