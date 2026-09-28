import { email } from "../validators/schemas.js";
import { rateLimit } from "../services/auth.service.js";
export const authLimit = async (req, res, next) => {
  try {
    const ip = req.socket.remoteAddress || "unknown";
    await rateLimit(req.db, "auth-ip:" + ip, 80, 900);
    if (req.body?.email)
      await rateLimit(
        req.db,
        "auth-email:" + String(req.body.email).toLowerCase(),
        20,
        900,
      );
    next();
  } catch (e) {
    next(e);
  }
};
