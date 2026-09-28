import { MongoClient } from "mongodb";
import { config } from "../config/env.js";
let connection;
export async function connect() {
  if (!config.mongoUri)
    throw Object.assign(new Error("Database is not configured."), {
      status: 503,
    });
  if (!connection)
    connection = (async () => {
      const client = new MongoClient(config.mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      });
      await client.connect();
      return { client, db: client.db(config.database) };
    })().catch((error) => {
      connection = undefined;
      throw error;
    });
  return connection;
}
export { createModelIndexes as createIndexes } from "../models/index.js";
