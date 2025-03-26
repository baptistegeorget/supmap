import { OAuth2Client } from "google-auth-library";

if (!process.env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is not set");
if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("GOOGLE_CLIENT_SECRET is not set");
if (!process.env.GOOGLE_REDIRECT_URI) throw new Error("GOOGLE_REDIRECT_URI is not set");

export const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID, 
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);