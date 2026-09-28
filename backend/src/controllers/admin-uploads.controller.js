import { randomUUID } from "node:crypto";
import { fail, rateLimit } from "../services/auth.service.js";

export const postAdminUploads = async (req, res) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    throw fail(
      503,
      "Image uploads need a Vercel Blob token. You can use an image URL instead.",
    );
  await rateLimit(req.db, "uploads:" + req.user._id, 30, 3600);
  const b = req.body;
  if (!Buffer.isBuffer(b) || b.length < 12)
    throw fail(400, "Choose a JPEG, PNG or WebP image under 3 MB.");
  let ext, mime;
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) {
    ext = "jpg";
    mime = "image/jpeg";
  } else if (
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    ext = "png";
    mime = "image/png";
  } else if (
    b.subarray(0, 4).toString() === "RIFF" &&
    b.subarray(8, 12).toString() === "WEBP"
  ) {
    ext = "webp";
    mime = "image/webp";
  } else
    throw fail(
      400,
      "Invalid image format. SVG and other formats are not accepted.",
    );
  const { put } = await import("@vercel/blob");
  const blob = await put(`rajo/${randomUUID()}.${ext}`, b, {
    access: "public",
    contentType: mime,
    addRandomSuffix: true,
  });
  await req.models.media.insertOne({
    url: blob.url,
    pathname: blob.pathname,
    uploadedBy: req.user._id,
    createdAt: new Date(),
  });
  res.status(201).json({ url: blob.url });
};
