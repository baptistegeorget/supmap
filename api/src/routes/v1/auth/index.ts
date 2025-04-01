import express from "express";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { googleCallbackSchema, signInSchema } from "../../../lib/zod.js";
import { verify, encrypt, decrypt } from "../../../lib/crypto.js";
import { oauth2Client as googleOAuth2Client } from "../../../lib/google-auth-library.js";
import { User, UserModel } from "../../../models/user.js";
import { auth } from "../../../middlewares/auth.js";

const router = express.Router();

router.post("/signin", async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");

    const { email, password } = signInSchema.parse(req.body);

    const userModel = new UserModel();
    const user = await userModel.getByEmail(encrypt(email));

    if (!user || !user.password || !(await verify(password, user.password))) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "30 days" });

    res.status(200).json({
      message: "Signed in successfully.",
      token
    });
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.get("/google", async (_req, res) => {
  try {
    const url = googleOAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
      ]
    });

    res.redirect(url);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.post("/google/callback", async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");

    const { code } = googleCallbackSchema.parse(req.body);

    const { tokens } = await googleOAuth2Client.getToken(code);

    googleOAuth2Client.setCredentials(tokens);

    const userInfo = await googleOAuth2Client.request<GoogleUserInfoResponse>({ url: "https://www.googleapis.com/oauth2/v3/userinfo" });

    const userModel = new UserModel();
    let user = await userModel.getByEmail(encrypt(userInfo.data.email));

    if (!user) {
      user = await userModel.create({
        email: encrypt(userInfo.data.email),
        name: userInfo.data.name ? encrypt(userInfo.data.name) : encrypt(userInfo.data.email),
        password: null,
        picture: userInfo.data.picture ? encrypt(userInfo.data.picture) : null
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "30 days" });

    res.status(200).json({ 
      message: "Signed in successfully.",
      token 
    });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    authUser.email = decrypt(authUser.email);
    authUser.name = decrypt(authUser.name);
    authUser.password = null;
    authUser.picture = authUser.picture ? decrypt(authUser.picture) : null;

    res.status(200).json(authUser);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

export default router;