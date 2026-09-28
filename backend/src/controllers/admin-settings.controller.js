import { settingsSchema } from "../models/settings.model.js";
import { defaultSettings } from "../models/settings.model.js";

export const getAdminSettings = async (req, res) =>
  res.json({
    ...defaultSettings,
    ...(await req.models.settings.findOne({ _id: "store" })),
  });

export const putAdminSettings = async (req, res) => {
  const data = settingsSchema.parse(req.body);
  await req.models.settings.updateOne(
    { _id: "store" },
    { $set: data },
    { upsert: true },
  );
  res.json(data);
};
