export const usersModel = (db) => db.collection("users");
export const usersIndexes = [[{ email: 1 }, { unique: true }], [{ loginPhone: 1 }, { unique: true, sparse: true }]];
