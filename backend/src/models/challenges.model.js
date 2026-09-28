export const challengesModel = (db) => db.collection("challenges");
export const challengesIndexes = [
  [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
];
