import { ZodError } from "zod";
export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof ZodError)
    return res.status(400).json({
      error: error.issues
        .map((i) => `${i.path.join(".") || "Request"}: ${i.message}`)
        .join("; "),
    });
  if (error.code === 11000)
    return res.status(409).json({
      error:
        "This record already exists. Check the email, SKU, slug, code or existing review.",
    });
  if (error.type === "entity.too.large")
    return res
      .status(413)
      .json({ error: "The upload or request is too large." });
  if (error.type === "entity.parse.failed")
    return res.status(400).json({ error: "Invalid JSON." });
  const status = error.status || 500;
  if (status >= 500)
    console.error("API failure:", error.name || "Error", error.code || status);
  res.status(status).json({
    error: error.status
      ? error.message
      : "Something went wrong. Please try again.",
  });
};
