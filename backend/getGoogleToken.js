const { google } = require("googleapis");
const readline = require("readline");

const CLIENT_ID =  "paste google client id here";
const CLIENT_SECRET = "paste google client secret here";
const REDIRECT_URI = "http://localhost:3000";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
    prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
});

console.log("Authorize this app:", authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter code: ", async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  console.log("REFRESH TOKEN:", tokens.refresh_token);
  rl.close();
});