import { usersModel, usersIndexes } from "./users.model.js";
import { sessionsModel, sessionsIndexes } from "./sessions.model.js";
import { challengesModel, challengesIndexes } from "./challenges.model.js";
import { rateLimitsModel, rateLimitsIndexes } from "./rateLimits.model.js";
import { productsModel, productsIndexes } from "./products.model.js";
import { ordersModel, ordersIndexes } from "./orders.model.js";
import { reviewsModel, reviewsIndexes } from "./reviews.model.js";
import { contentModel, contentIndexes } from "./content.model.js";
import { couponsModel, couponsIndexes } from "./coupons.model.js";
import { countersModel, countersIndexes } from "./counters.model.js";
import { enquiriesModel, enquiriesIndexes } from "./enquiries.model.js";
import { mediaModel, mediaIndexes } from "./media.model.js";
import { settingsModel, settingsIndexes } from "./settings.model.js";
export const createModels = (db) => ({
  users: usersModel(db),
  sessions: sessionsModel(db),
  challenges: challengesModel(db),
  rateLimits: rateLimitsModel(db),
  products: productsModel(db),
  orders: ordersModel(db),
  reviews: reviewsModel(db),
  content: contentModel(db),
  coupons: couponsModel(db),
  counters: countersModel(db),
  enquiries: enquiriesModel(db),
  media: mediaModel(db),
  settings: settingsModel(db),
});
export async function createModelIndexes(db) {
  await Promise.all([
    ...usersIndexes.map(([keys, options]) =>
      usersModel(db).createIndex(keys, options),
    ),
    ...sessionsIndexes.map(([keys, options]) =>
      sessionsModel(db).createIndex(keys, options),
    ),
    ...challengesIndexes.map(([keys, options]) =>
      challengesModel(db).createIndex(keys, options),
    ),
    ...rateLimitsIndexes.map(([keys, options]) =>
      rateLimitsModel(db).createIndex(keys, options),
    ),
    ...productsIndexes.map(([keys, options]) =>
      productsModel(db).createIndex(keys, options),
    ),
    ...ordersIndexes.map(([keys, options]) =>
      ordersModel(db).createIndex(keys, options),
    ),
    ...reviewsIndexes.map(([keys, options]) =>
      reviewsModel(db).createIndex(keys, options),
    ),
    ...contentIndexes.map(([keys, options]) =>
      contentModel(db).createIndex(keys, options),
    ),
    ...couponsIndexes.map(([keys, options]) =>
      couponsModel(db).createIndex(keys, options),
    ),
    ...countersIndexes.map(([keys, options]) =>
      countersModel(db).createIndex(keys, options),
    ),
    ...enquiriesIndexes.map(([keys, options]) =>
      enquiriesModel(db).createIndex(keys, options),
    ),
    ...mediaIndexes.map(([keys, options]) =>
      mediaModel(db).createIndex(keys, options),
    ),
    ...settingsIndexes.map(([keys, options]) =>
      settingsModel(db).createIndex(keys, options),
    ),
  ]);
}
