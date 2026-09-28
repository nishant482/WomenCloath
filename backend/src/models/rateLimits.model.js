export const rateLimitsModel = (db) => db.collection("rateLimits");
export const rateLimitsIndexes = [
  [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
];
