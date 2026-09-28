import { connect } from '../src/config/database.js';
import { config } from '../src/config/env.js';
import { passwordHash } from '../src/services/auth.service.js';
import { readFile, writeFile } from 'node:fs/promises';

const email = process.env.ADMIN_SETUP_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_SETUP_PASSWORD;
if (!email || !password) throw new Error('Set ADMIN_SETUP_EMAIL and ADMIN_SETUP_PASSWORD before running this script.');
const { db, client } = await connect();
try {
  const target = await db.collection('users').findOne({ email });
  const current = target || await db.collection('users').findOne({ email: config.adminEmail, role: 'admin' });
  const result = await db.collection('users').findOneAndUpdate(
    current ? { _id: current._id } : { email },
    { $set: { email, password: await passwordHash(password), role: 'admin', emailVerified: true, status: 'active', updatedAt: new Date() },
      $setOnInsert: { name: 'Rang Admin', cart: [], wishlist: [], addresses: [], createdAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  );
  await db.collection('sessions').deleteMany({ userId: result._id });
  const file = new URL('../.env.local', import.meta.url);
  let content = await readFile(file, 'utf8').catch(e => { if (e.code === 'ENOENT') return ''; throw e; });
  content = /^ADMIN_EMAIL=.*$/m.test(content) ? content.replace(/^ADMIN_EMAIL=.*$/m, `ADMIN_EMAIL=${email}`) : `${content}\nADMIN_EMAIL=${email}\n`;
  await writeFile(file, content);
  console.log('Admin credentials updated; existing sessions revoked.');
} finally { await client.close(); }
