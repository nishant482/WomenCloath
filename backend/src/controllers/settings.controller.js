import { defaultSettings } from "../models/settings.model.js";

export const getSettings = async (req, res) =>
  res.json({
    ...defaultSettings,
    ...(await req.models.settings.findOne({ _id: "store" })),
  });
