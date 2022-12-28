import { ChatGPTAPIBrowser } from "chatgpt";
import dotenv from "dotenv";
import readline from "readline-sync";
import Context from "./context.js";

dotenv.config();

const run = async () => {
  const chatgpt = new ChatGPTAPIBrowser({
    email: process.env.OPENAI_EMAIL,
    password: process.env.OPENAI_PASSWORD,
    isGoogleLogin: true,
  });
  await chatgpt.initSession();

  const userId = "userId";
  while (1) {
    const context = Context.getContext(userId);
    const prompt = readline.question("You:");
    const res = await chatgpt.sendMessage(prompt, context);
    console.log("ChatGPT:", res.response.split("\n\n"));
    Context.setContext(userId, {
      conversationId: res.conversationId,
      parentMessageId: res.messageId,
    });
  }
};

run();
