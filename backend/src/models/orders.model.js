export const ordersModel = (db) => db.collection("orders");
export const ordersIndexes = [
  [{ userId: 1, idempotencyKey: 1 }, { unique: true }],
  [{ number: 1 }, { unique: true }],
  [{ createdAt: -1 }, {}],
];
