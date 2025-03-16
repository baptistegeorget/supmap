import express from "express";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { signInSchema } from "../../../lib/zod.js";
import { verify, encrypt } from "../../../lib/crypto.js";
import { oauth2Client as googleOAuth2Client } from "../../../lib/google-auth-library.js";
import { User } from "../../../models/user.js";
import { Role } from "../../../models/role.js";
import { Account } from "../../../models/account.js";
import { UserRole } from "../../../models/user-role.js";

const router = express.Router();

router.post("/signin", async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");

    const { email, password } = signInSchema.parse(req.body);

    const user = await User.findByEmail(encrypt(email));

    if (!user || !user.password || !(await verify(password, user.password))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "30 days" });

    res.status(200).json({ token });
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
    console.error(error);
    return;
  }
});

router.get("/google", async (_req, res) => {
  try {
    const authorizeUrl = googleOAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
      ]
    });

    res.redirect(authorizeUrl);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.error(error);
    return;
  }
});

router.get("/google/callback", async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
    if (!process.env.DEFAULT_ROLE) throw new Error("DEFAULT_ROLE is not set");

    const code = req.query.code;

    if (!code) {
      res.status(400).json({ error: "Code is required" });
      return;
    }

    if (typeof code !== "string") {
      res.status(400).json({ error: "Invalid code" });
      return;
    }

    const { tokens } = await googleOAuth2Client.getToken(code);

    if (!tokens.access_token) {
      res.status(400).json({ error: "Access token is required" });
      return;
    }

    googleOAuth2Client.setCredentials(tokens);

    const userInfo = await googleOAuth2Client.request<GoogleUserInfoResponse>({
      url: "https://www.googleapis.com/oauth2/v3/userinfo"
    });

    if (!userInfo.data.email || !userInfo.data.name || !userInfo.data.picture || !userInfo.data.sub) {
      res.status(400).json({ error: "Invalid user info" });
      return;
    }

    let user = await User.findByEmail(encrypt(userInfo.data.email));

    if (!user) {
      user = await User.create(
        encrypt(userInfo.data.email),
        encrypt(userInfo.data.name),
        undefined,
        encrypt(userInfo.data.picture)
      );

      let role = await Role.findByName(process.env.DEFAULT_ROLE);

      if (!role) {
        role = await Role.create(process.env.DEFAULT_ROLE);
      }

      await UserRole.create(user.id, role.id);
    }

    const accounts = await Account.findByUserId(user.id);

    if (!accounts.find(account => account.provider === "google")) {
      if (!tokens.refresh_token) {
        res.status(400).json({ error: "Refresh token is required" });
        return;
      }

      if (!tokens.expiry_date) {
        res.status(400).json({ error: "Expiry date is required" });
        return;
      }

      if (!tokens.scope) {
        res.status(400).json({ error: "Scope is required" });
        return;
      }

      await Account.create(
        user.id,
        "google",
        encrypt(userInfo.data.sub),
        encrypt(tokens.access_token),
        encrypt(tokens.refresh_token),
        new Date(tokens.expiry_date),
        tokens.scope
      );
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "30 days" });

    res.status(200).json({ token });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.error(error);
    return;
  }
});

export default router;