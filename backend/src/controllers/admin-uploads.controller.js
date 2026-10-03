import { fail, rateLimit, objectId } from "../services/auth.service.js";
import { z } from 'zod';
import { imageStorageProvider, storeImage } from "../services/image-storage.js";

export const postAdminUploads = async (req, res) => {
  if (!imageStorageProvider())
    throw fail(
      503,
      "Image uploads are not configured. You can use an image URL instead.",
    );
  await rateLimit(req.db, "uploads:" + req.user._id, 30, 3600);
  const b = req.body;
  if (!Buffer.isBuffer(b) || b.length < 12 || b.length > 3 * 1024 * 1024)
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
  const blob = await storeImage(b, { ext, mime });
  await req.models.media.insertOne({
    url: blob.url,
    pathname: blob.pathname,
    provider: blob.provider,
    label: String(req.headers['x-file-name'] || 'Uploaded image').slice(0, 150),
    bytes: b.length,
    uploadedBy: req.user._id,
    createdAt: new Date(),
  });
  res.status(201).json({ url: blob.url });
};

export const getMedia = async (req, res) => res.json({ items: await req.models.media.find({}).sort({ createdAt: -1 }).limit(2000).toArray() });
export const patchMedia = async (req, res) => {
  const data = z.object({ label: z.string().trim().min(1).max(150) }).parse(req.body);
  const result = await req.models.media.updateOne({ _id: objectId(req.params.id) }, { $set: { ...data, updatedAt: new Date() } });
  if (!result.matchedCount) throw fail(404, 'Image not found.');
  res.json({ ok: true });
};
