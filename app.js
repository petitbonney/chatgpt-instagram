import dotenv from "dotenv";
import InstagramAPI from "./instagram.js";

dotenv.config();

const instagram = new InstagramAPI();

const echo = (clientId, text) => {
  instagram.sendMessage(clientId, text);
};

instagram.onMessage(echo);

instagram.run();
