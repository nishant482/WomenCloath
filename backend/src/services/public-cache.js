// Only shared, public catalogue responses may use this cache.
// Browser responses revalidate; Vercel can serve a short-lived edge copy.
export function publicCache(res) {
  res.set("Cache-Control", "public, max-age=0, must-revalidate");
  res.set(
    "Vercel-CDN-Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=60",
  );
}
