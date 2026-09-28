export const usersModel = (db) => db.collection("users");
export const usersIndexes = [[{ email: 1 }, { unique: true }]];
