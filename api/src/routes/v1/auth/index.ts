import { Router } from "express";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { googleCallbackSchema, signInSchema } from "../../../lib/zod.js";
import { verify, encrypt, decrypt } from "../../../lib/crypto.js";
import { User, UserModel } from "../../../models/user.js";
import { auth } from "../../../middlewares/auth.js";
import { OAuth2Client } from "google-auth-library";

if (!process.env.JWT_SECRET) throw new Error("Missing environment variable: JWT_SECRET");
if (!process.env.GOOGLE_CLIENT_ID) throw new Error("Missing environment variable: GOOGLE_CLIENT_ID");
if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("Missing environment variable: GOOGLE_CLIENT_SECRET");
if (!process.env.GOOGLE_REDIRECT_URI_WEB) throw new Error("Missing environment variable: GOOGLE_REDIRECT_URI_WEB");
if (!process.env.GOOGLE_REDIRECT_URI_MOBILE) throw new Error("Missing environment variable: GOOGLE_REDIRECT_URI_MOBILE");

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI_WEB = process.env.GOOGLE_REDIRECT_URI_WEB;
const GOOGLE_REDIRECT_URI_MOBILE = process.env.GOOGLE_REDIRECT_URI_MOBILE;

const router = Router();

router.post("/auth/signin", async (req, res) => {
  try {
    const {
      email,
      password
    } = signInSchema.parse(req.body);

    const userModel = new UserModel();

    const user = await userModel.getByEmail(encrypt(email));

    if (!user || !user.password || !(await verify(password, user.password))) {
      res.status(401).json(
        {
          message: "Invalid email or password."
        }
      );

      return;
    }

    const token = jwt.sign(
      {
        id: user.id
      },
      JWT_SECRET,
      {
        expiresIn: "30 days"
      }
    );

    res.status(200).json(
      {
        message: "Signed in successfully.",
        token
      }
    );

    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(", ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.get("/auth/google", async (req, res) => {
  try {
    const oAuth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      req.headers["user-agent"]?.includes("Mobile") ? GOOGLE_REDIRECT_URI_MOBILE : GOOGLE_REDIRECT_URI_WEB
    );

    const url = oAuth2Client.generateAuthUrl(
      {
        access_type: "offline",
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email"
        ]
      }
    );

    res.status(200).json(
      {
        message: "Redirecting to Google.",
        url
      }
    );

    return;
  } catch (error) {
    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.post("/auth/google/callback", async (req, res) => {
  try {
    const oAuth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      req.headers["user-agent"]?.includes("Mobile") ? GOOGLE_REDIRECT_URI_MOBILE : GOOGLE_REDIRECT_URI_WEB
    );

    const {
      code
    } = googleCallbackSchema.parse(req.body);

    const {
      tokens
    } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);

    const response = await oAuth2Client.request<UserInfo>(
      {
        url: "https://www.googleapis.com/oauth2/v3/userinfo"
      }
    );

    const userModel = new UserModel();

    let user = await userModel.getByEmail(encrypt(response.data.email));

    if (!user) {
      user = await userModel.create(
        {
          email: encrypt(response.data.email),
          name: response.data.name ? encrypt(response.data.name) : encrypt(response.data.email),
          password: null,
          picture: response.data.picture ? encrypt(response.data.picture) : null
        }
      );
    }

    const token = jwt.sign(
      {
        id: user.id
      },
      JWT_SECRET,
      {
        expiresIn: "30 days"
      }
    );

    res.status(200).json(
      {
        message: "Signed in successfully.",
        token
      }
    );

    return;
  } catch (error) {
    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.get("/auth/me", auth, async (_req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    authUser.email = decrypt(authUser.email);
    authUser.name = decrypt(authUser.name);
    authUser.password = null;
    authUser.picture = authUser.picture ? decrypt(authUser.picture) : null;

    res.status(200).json(authUser);

    return;
  } catch (error) {
    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

export default router;