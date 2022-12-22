import express from "express";
import parser from "body-parser";
import crypto from "crypto";
import fetch from "node-fetch";

// Verify that the callback came from Facebook.
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    console.warn(`Couldn't find "x-hub-signature" in headers.`);
  } else {
    var elements = signature.split("=");
    var signatureHash = elements[1];
    var expectedHash = crypto
      .createHmac("sha1", process.env.APP_SECRET)
      .update(buf)
      .digest("hex");
    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

export default class InstagramAPI {
  client;
  port;
  callback;

  constructor(port = 3000) {
    this.port = port;
    this.callback = null;
    this.client = express();
    this.init();
  }

  init() {
    // Parse application/x-www-form-urlencoded
    this.client.use(
      parser.urlencoded({
        extended: true,
      })
    );

    // Parse application/json. Verify that callback came from Facebook
    this.client.use(parser.json({ verify: verifyRequestSignature }));

    // Add support for GET requests to our webhook
    this.client.get("/webhook", (req, res) => {
      // Parse the query params
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      // Check if a token and mode is in the query string of the request
      if (mode && token) {
        // Check the mode and token sent is correct
        if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
          // Respond with the challenge token from the request
          console.log("WEBHOOK_VERIFIED");
          res.status(200).send(challenge);
        } else {
          // Respond with '403 Forbidden' if verify tokens do not match
          res.sendStatus(403);
        }
      }
    });

    // Create the endpoint for your webhook
    this.client.post("/webhook", (req, res) => {
      let body = req.body;
      console.log("EVENT_RECEIVED");
      console.log(JSON.stringify(body), null, 2);

      // Check if this is an event from a page subscription
      if (body.object === "instagram") {
        const content = body.entry[0].messaging[0];
        const clientId = content.sender.id;
        const text = content.message.text;
        if (this.callback && clientId !== "17841457346413818") {
          this.callback(clientId, text);
        }
        // Returns a '200 OK' response to all requests
        res.status(200).send("EVENT_RECEIVED");
      } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
      }
    });
  }

  run() {
    this.client.listen(process.env.PORT, () => {
      console.log(`The app is listening on port ${this.port}`);
    });
  }

  onMessage(callback) {
    this.callback = callback;
  }

  async sendMessage(clientId, text) {
    const url = `${process.env.FB_API_URL}/${process.env.FB_API_VERSION}/${process.env.PAGE_ID}/messages`;
    const data = {
      recipient: { id: clientId },
      message: { text: text },
      access_token: process.env.PAGE_ACCESS_TOKEN,
    };
    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (res.status !== 200) {
          console.log(res);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
