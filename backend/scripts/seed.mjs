import { connect, createIndexes } from "../src/config/database.js";
import { products } from "../../frontend/src/products.js";
import { defaultSettings } from "../src/models/settings.model.js";
const { db, client } = await connect();
try {
  await createIndexes(db);
  for (const p of products)
    await db.collection("products").updateOne(
      { id: p.id },
      {
        $setOnInsert: {
          ...p,
          sku: "RAJO-" + String(p.id).padStart(4, "0"),
          imageUrl: `/images/${p.image}.jpg`,
          description: "",
          sizes:
            p.category === "Kurta sets" ? ["S", "M", "L", "XL", "XXL"] : [],
          stock: 0,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  const highest = await db
    .collection("products")
    .find()
    .sort({ id: -1 })
    .limit(1)
    .next();
  await db
    .collection("counters")
    .updateOne(
      { _id: "products" },
      { $max: { value: highest?.id || 0 } },
      { upsert: true },
    );
  await db.collection("settings").updateOne(
    { _id: "store" },
    {
      $setOnInsert: {
        ...defaultSettings,
        contactEmail: process.env.EMAIL_USER || "",
      },
    },
    { upsert: true },
  );
  const photos = [
    "7.40.11 AM (1)",
    "7.40.12 AM",
    "7.40.14 AM (1)",
    "7.40.11 AM",
    "7.40.12 AM (2)",
    "7.40.14 AM",
    "7.40.12 AM (1)",
    "7.40.13 AM",
    "7.40.13 AM (1)",
  ];
  for (const [i, file] of photos.entries())
    await db.collection("content").updateOne(
      { slug: "rajo-family-" + (i + 1) },
      {
        $setOnInsert: {
          kind: "family",
          slug: "rajo-family-" + (i + 1),
          title: [
            "Together at RAJO",
            "Dressed for beautiful moments",
            "A little RAJO to take home",
            "From our shop, with love",
            "A moment at our exhibition",
            "Smiles worth remembering",
            "Little moments, lovely connections",
            "Part of the RAJO story",
            "Taking a little tradition home",
          ][i],
          body: "",
          alt: "Customers and the RAJO Threads community",
          imageUrl:
            "/customer/" +
            encodeURIComponent(
              "WhatsApp Image 2026-09-24 at " + file + ".jpeg",
            ),
          link: "",
          status: "published",
          sortOrder: i,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  console.log(
    "Catalog, family gallery and indexes initialized. Existing records preserved. Set actual stock in admin before taking orders.",
  );
} finally {
  await client.close();
}
