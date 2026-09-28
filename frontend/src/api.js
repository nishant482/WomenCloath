export async function api(
  path,
  { method = "GET", body, headers = {}, ...options } = {},
) {
  let response;
  try {
    response = await fetch("/api" + path, {
    ...options,
    method,
    credentials: "same-origin",
    headers: {
      "X-Requested-With": "RajoStore",
      ...(typeof location !== 'undefined' && location.pathname.startsWith('/admin') ? { 'X-Session-Scope': 'admin' } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error("Cannot connect to the store. Check your connection and try again.");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw Object.assign(new Error(
      response.status >= 500
        ? "The store server is temporarily unavailable. Please try again shortly."
        : "The store API did not return valid data. Please open the app using its store URL and try again.",
    ), { status: response.status });
  }
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || "Unable to complete this request."),
      { status: response.status },
    );
  return data;
}
export function productImage(p) {
  return p.imageUrl || "/images/placeholder.svg";
}
