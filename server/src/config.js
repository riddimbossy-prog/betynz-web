export const SERVICE_NAME = "Betynz Prediction API";
export const SERVICE_VERSION = "6.2.0";
export const ENGINE_VERSION = "betynz-transition-v6.2.0";
export const PUBLIC_ENGINE_VERSIONS = [ENGINE_VERSION];

export function getApiFootballKey() {
  return (
    process.env.API_FOOTBALL_KEY ||
    process.env.FOOTBALL_API_KEY ||
    process.env.API_STATS_KEY ||
    ""
  ).trim();
}

export const FINISHED_PROFILE_STATUSES = new Set(["FT"]);
export const PREDICTABLE_STATUSES = new Set(["NS", "TBD"]);

export const DEFAULT_ALLOWED_ORIGINS = [
  "https://betynz.com",
  "https://www.betynz.com",
  "https://riddimbossy-prog.github.io",
  "http://localhost:4173",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];
