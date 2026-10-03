const MAX_BYTES = 3 * 1024 * 1024;
const keyPattern = /^rajo\/[a-f0-9-]{36}\.(jpg|png|webp)$/;
const reply = (message, status) => new Response(message, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

export default {
  async fetch(request, env) {
    const key = new URL(request.url).pathname.slice(1);
    if (!keyPattern.test(key)) return reply("Not found", 404);
    if (request.method === "PUT") {
      if (!env.UPLOAD_TOKEN || request.headers.get("Authorization") !== `Bearer ${env.UPLOAD_TOKEN}`)
        return reply("Unauthorized", 401);
      if (Number(request.headers.get("Content-Length")) > MAX_BYTES) return reply("Too large", 413);
      const reader = request.body?.getReader();
      if (!reader) return reply("Image required", 400);
      const chunks = [];
      let length = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > MAX_BYTES) { await reader.cancel(); return reply("Too large", 413); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      if (length < 12) return reply("Invalid image", 400);
      const prefix = new TextDecoder().decode(bytes.slice(0, 12));
      const mime = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "image/jpeg" :
        [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b) ? "image/png" :
        prefix.startsWith("RIFF") && prefix.slice(8) === "WEBP" ? "image/webp" : null;
      const expected = key.endsWith(".jpg") ? "image/jpeg" : key.endsWith(".png") ? "image/png" : "image/webp";
      if (!mime || mime !== expected) return reply("Invalid image", 400);
      await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: mime, cacheControl: "public, max-age=31536000, immutable" } });
      return reply("Stored", 201);
    }
    if (!["GET", "HEAD"].includes(request.method)) return reply("Method not allowed", 405);
    const object = request.method === "HEAD" ? await env.IMAGES.head(key) : await env.IMAGES.get(key);
    if (!object) return reply("Not found", 404);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Length", String(object.size));
    if (request.headers.get("If-None-Match") === object.httpEtag) return new Response(null, { status: 304, headers });
    return new Response(request.method === "HEAD" ? null : object.body, { headers });
  },
};
