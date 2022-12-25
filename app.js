import dotenv from "dotenv";
import Instagram from "./instagram.js";

dotenv.config();

const run = async () => {
  const ig = new Instagram();
  const me = await ig.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);

  const loop = setInterval(async () => {
    await ig.approveAll();
    const inbox = await ig.getInbox();
    for (const thread of inbox) {
      const messages = await ig.getNotSeenMessages(thread, me.pk);
      for (const msg of messages) {
        console.log(`${thread.users[0].username} says: ${msg.text}`);
        await thread.markItemSeen(msg.item_id);
        await thread.broadcastText(msg.text);
      }
    }
  }, 5000);

  console.log("Running...");
};

run();
