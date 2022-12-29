import { ChatGPTAPIBrowser, ChatGPTAPI } from "chatgpt";
import dotenv from "dotenv";
import Context from "./context.js";
import Instagram from "./instagram.js";

dotenv.config();

const run = async () => {
  const chatgpt = new ChatGPTAPIBrowser({
    email: process.env.OPENAI_EMAIL,
    password: process.env.OPENAI_PASSWORD,
    isGoogleLogin: true,
    executablePath: process.env.CHROME_PATH,
  });
  await chatgpt.initSession();

  const ig = new Instagram();
  const me = await ig.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);

  const loop = async () => {
    await ig.approveAll();
    const inbox = await ig.getInbox();
    for (const thread of inbox) {
      // Extract info from thread
      const threadId = thread.threadId;
      const users = {};
      for (const u of thread.users) {
        users[u.pk] = u.username;
      }
      // Extract not seen messages by me
      const messages = await ig.getNotSeenMessages(thread, me.pk);
      for (const msg of messages) {
        // Get thread context
        const context = Context.getContext(threadId);
        // Get username from key
        const username = users[msg.user_id];
        console.log(`${username}: "${msg.text}"`);
        // Mark as seen
        await thread.markItemSeen(msg.item_id);
        // Send message to ChatGPT
        const result = await chatgpt.sendMessage(msg.text, context);
        for (const response of result.response.split("\n\n")) {
          // Broadcast ChatGPT response to thread
          await thread.broadcastText(response);
        }
        console.log(`ChatGPT replied to ${username}.`);
        // Update context
        Context.setContext(threadId, {
          conversationId: result.conversationId,
          parentMessageId: result.messageId,
        });
      }
    }
    setTimeout(loop, 5000);
  };

  // setInterval(loop, 5000);
  loop();

  console.log("Running...");
};

run();
