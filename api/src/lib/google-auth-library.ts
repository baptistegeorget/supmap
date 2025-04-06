import { OAuth2Client } from "google-auth-library";

if (!process.env.GOOGLE_CLIENT_ID) throw new Error("Missing environment variable: GOOGLE_CLIENT_ID");
if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("Missing environment variable: GOOGLE_CLIENT_SECRET");
if (!process.env.GOOGLE_REDIRECT_URI) throw new Error("Missing environment variable: GOOGLE_REDIRECT_URI");

export const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export interface UserInfo {
  sub: string,
  name?: string,
  given_name?: string,
  family_name?: string,
  picture?: string,
  email: string,
  email_verified: boolean
}