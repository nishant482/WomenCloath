export async function cartResponse(req) {
  const user = await req.models.users.findOne({ _id: req.user._id });
  return { items: user.cart || [], wishlist: user.wishlist || [] };
}
