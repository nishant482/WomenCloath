export const reviewsModel = (db) => db.collection("reviews");
export const reviewsIndexes = [
  [
    { userId: 1, productId: 1 },
    { unique: true, partialFilterExpression: { isDemo: false } },
  ],
];
