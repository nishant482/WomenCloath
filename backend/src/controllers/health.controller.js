export const getHealth = async (req, res) => {
  await req.db.command({ ping: 1 });
  res.json({ ok: true });
};
