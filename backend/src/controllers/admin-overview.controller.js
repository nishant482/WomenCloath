import { imageStorageProvider } from "../services/image-storage.js";

export const getAdminOverview = async (req, res) => {
  const [
    products,
    users,
    orders,
    pendingReviews,
    lowStock,
    revenue,
    pendingOrders,
    recentOrders,
    featuredProducts,
  ] = await Promise.all([
    req.models.products.countDocuments({ status: { $nin: ["archived", "deleted"] } }),
    req.models.users.countDocuments({ status: { $ne: "deleted" } }),
    req.models.orders.countDocuments(),
    req.models.reviews.countDocuments({ status: "pending" }),
    req.models.products.countDocuments({
      status: "active",
      stock: { $lte: 5 },
    }),
    req.models.orders
      .aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ])
      .toArray(),
    req.models.orders.countDocuments({
      status: { $in: ["placed", "confirmed", "packed"] },
    }),
    req.models.orders
      .find(
        {},
        {
          projection: {
            number: 1,
            customer: 1,
            status: 1,
            total: 1,
            createdAt: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray(),
    req.models.products
      .find(
        { status: { $nin: ["archived", "deleted"] } },
        {
          projection: {
            _id: 0,
            id: 1,
            name: 1,
            imageUrl: 1,
            category: 1,
            price: 1,
            stock: 1,
          },
        },
      )
      .sort({ id: 1 })
      .limit(4)
      .toArray(),
  ]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const start = new Date(today + 'T00:00:00+05:30');
  start.setUTCDate(start.getUTCDate() - 29);
  const [daily, orderStatuses, categories] = await Promise.all([
    req.models.orders.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, orders: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } } } },
    ]).toArray(),
    req.models.orders.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
    req.models.products.aggregate([
      { $match: { status: { $nin: ['deleted', 'archived'] } } },
      { $group: { _id: '$category', products: { $sum: 1 }, stock: { $sum: '$stock' } } },
      { $sort: { _id: 1 } },
    ]).toArray(),
  ]);
  const dailySales = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(start.getTime() + i * 86400000 + 19800000).toISOString().slice(0, 10);
    const row = daily.find(row => row._id === date);
    return { date, orders: row?.orders || 0, revenue: row?.revenue || 0 };
  });
  res.json({
    dailySales, orderStatuses, categories,
    products,
    users,
    orders,
    pendingReviews,
    lowStock,
    pendingOrders,
    recentOrders,
    featuredProducts,
    revenue: revenue[0]?.total || 0,
    uploadsEnabled: Boolean(imageStorageProvider()),
  });
};
