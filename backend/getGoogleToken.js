const { google } = require("googleapis");
const readline = require("readline");

const CLIENT_ID =  "53663245902-e4ftk9glhlmiqtjp1l9do527usbs49l2.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
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