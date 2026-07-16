require('dotenv').config(); // if you want to use .env

const { google } = require("googleapis");
const readline = require("readline");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000"; // match your service file

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

console.log("CLIENT_ID loaded:", !!CLIENT_ID); // sanity check

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
});

console.log("Authorize this app:", authUrl);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Enter code: ", async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  console.log("REFRESH TOKEN:", tokens.refresh_token);
  rl.close();
});