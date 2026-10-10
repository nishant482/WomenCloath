import { isOwner, adminModules } from "../services/admin-access.service.js";
import { z } from "zod";
import { config } from "../config/env.js";
import { email, password, phone } from "../validators/schemas.js";

import { fail, objectId, publicUser } from "../services/auth.service.js";

export const getAdminProfile = async (req,res)=>res.json({user:publicUser(req.user)});
export const patchAdminProfile = async (req,res)=>{
 const data=z.object({name:z.string().trim().min(2).max(100),phone:z.union([phone,z.literal('')])}).strict().parse(req.body);
 try{
  const user=await req.models.users.findOneAndUpdate({_id:req.user._id},{$set:{...data,updatedAt:new Date(),...(data.phone?{loginPhone:data.phone}:{})},...(!data.phone?{$unset:{loginPhone:''}}:{})},{returnDocument:'after'});
  res.json({user:publicUser(user)});
 }catch(e){if(e.code===11000)throw fail(409,'This mobile number is already used by another account.');throw e;}
};

export const getAdminUsers = async (req, res) => {
  const role = req.query.role === 'admin' ? 'admin' : 'customer';
  if(role === 'admin' && !isOwner(req.user)) throw fail(403,'Only the owner can view administrator access.');
  res.json({
    items: await req.models.users
      .aggregate([
        { $match: { role, status: { $ne: 'deleted' } } },
        { $sort: { createdAt: -1 } }, { $limit: 500 },
        { $addFields: { cartCount: { $sum: '$cart.qty' }, wishlistCount: { $size: { $ifNull: ['$wishlist', []] } } } },
        { $project: { password: 0, cart: 0, wishlist: 0 } },
      ])
      .toArray(),
  });
};

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
