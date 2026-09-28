import { connect } from "../src/config/database.js";
import { mailTransport } from "../src/services/email.service.js";
for (const [name, check] of [
  [
    "MongoDB",
    async () => {
      const { db, client } = await connect();
      await db.command({ ping: 1 });
      await client.close();
    },
  ],
  [
    "SMTP",
    async () => {
      const transport = mailTransport();
      await transport.verify();
      transport.close();
    },
  ],
]) {
  try {
    await check();
    console.log(name + ": connected");
  } catch (error) {
    console.log(name + ": unavailable (" + (error.code || error.name) + ")");
    process.exitCode = 1;
  }
}
