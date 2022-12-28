import { ChatGPTAPIBrowser } from "chatgpt";
import dotenv from "dotenv";
import Context from "./context.js";
import Instagram from "./instagram.js";

dotenv.config();

const run = async () => {
  const chatgpt = new ChatGPTAPIBrowser({
    email: process.env.OPENAI_EMAIL,
    password: process.env.OPENAI_PASSWORD,
    isGoogleLogin: true,
  });
  await chatgpt.initSession();

  const ig = new Instagram();
  const me = await ig.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);

  const loop = async () => {
    await ig.approveAll();
    const inbox = await ig.getInbox();
    for (const thread of inbox) {
      const threadId = thread.threadId;
      const messages = await ig.getNotSeenMessages(thread, me.pk);
      for (const msg of messages) {
        const context = Context.getContext(threadId);
        await thread.markItemSeen(msg.item_id);
        const result = await chatgpt.sendMessage(msg.text, context);
        for (const response of result.response.split("\n\n")) {
          await thread.broadcastText(response);
        }
        Context.setContext(threadId, {
          conversationId: result.conversationId,
          parentMessageId: result.messageId,
        });
      }
    }
  };

  setInterval(loop, 5000);

  console.log("Running...");
};

run();
