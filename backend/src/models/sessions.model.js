export const sessionsModel = (db) => db.collection("sessions");
export const sessionsIndexes = [
  [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
  [{ userId: 1 }, {}],
];
