import { isOwner, adminModules } from "../services/admin-access.service.js";
import { z } from "zod";
import { config } from "../config/env.js";
import { email, password } from "../validators/schemas.js";

import { fail, objectId } from "../services/auth.service.js";

export const getAdminUsers = async (req, res) =>
  res.json({
    items: await req.models.users
      .aggregate([
        { $match: { status: { $ne: 'deleted' } } },
        { $sort: { createdAt: -1 } }, { $limit: 500 },
        { $addFields: { cartCount: { $sum: '$cart.qty' }, wishlistCount: { $size: { $ifNull: ['$wishlist', []] } } } },
        { $project: { password: 0, cart: 0, wishlist: 0 } },
      ])
      .toArray(),
  });

export const getAdminUserShopping = async (req, res) => {
  const user = await req.models.users.findOne({ _id: objectId(req.params.id), status: { $ne: 'deleted' } });
  if (!user) throw fail(404, 'User not found.');
  const cart = user.cart || [], wishlist = user.wishlist || [];
  const ids = [...new Set([...cart.map(p => p.productId), ...wishlist])];
  const products = await req.models.products.find({ id: { $in: ids } }, { projection: { id: 1, name: 1, imageUrl: 1, price: 1, status: 1, stock: 1 } }).toArray();
  const map = new Map(products.map(p => [p.id, p]));
  const item = id => map.get(id) || { id, name: 'Unavailable product', price: 0, status: 'unavailable' };
  res.json({
    cart: cart.map(line => ({ ...item(line.productId), productId: line.productId, qty: line.qty, size: line.size || '', lineTotal: (item(line.productId).price || 0) * line.qty })),
    wishlist: wishlist.map(id => item(id)),
  });
};

export const patchAdminUsersById = async (req, res) => {
  const input = z
    .object({
      role: z.enum(["customer", "admin"]),
      status: z.enum(["active", "blocked"]),
      adminPermissions: z.array(z.enum(adminModules)).optional(),
    })
    .parse(req.body);
  const _id = objectId(req.params.id);
  const target = await req.models.users.findOne({ _id, status: { $ne: "deleted" } });
  if (!target) throw fail(404, "User not found.");
  if (
    String(_id) === String(req.user._id) ||
    isOwner(target)
  )
    throw fail(400, "The owner account cannot be changed here.");
  if (!isOwner(req.user) && (target.role === "admin" || input.role !== target.role || input.adminPermissions !== undefined)) throw fail(403, "Only the owner can manage administrator access.");
  if (input.role === "admin" && target.role !== "admin" && !input.adminPermissions) input.adminPermissions = [];
  await req.models.users.updateOne(
    { _id },
    { $set: { ...input, updatedAt: new Date() } },
  );
  await req.models.sessions.deleteMany({ userId: _id });
  res.json({ ok: true });
};

export const deleteAdminUsersById = async (req, res) => {
  const _id = objectId(req.params.id);
  const target = await req.models.users.findOne({ _id, status: { $ne: "deleted" } });
  if (!target) throw fail(404, "User not found.");
  if (String(_id) === String(req.user._id) || isOwner(target))
    throw fail(400, "Your account and the owner account cannot be deleted.");
  if (!isOwner(req.user) && target.role === "admin") throw fail(403, "Only the owner can delete an administrator.");
  await req.models.users.updateOne({ _id }, { $set: { status: "deleted", deletedAt: new Date(), updatedAt: new Date() } });
  await req.models.sessions.deleteMany({ userId: _id });
  res.json({ ok: true });
};
