import { createHash, createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";

if (!process.env.CRYPTO_KEY) {
  throw new Error("CRYPTO_KEY is not set");
}

if (process.env.CRYPTO_KEY.length !== 32) {
  throw new Error("CRYPTO_KEY must be 32 characters long");
}

const KEY = Buffer.from(process.env.CRYPTO_KEY);

function generateDeterministicIV(data: string): Buffer {
  return createHash("sha256").update(data).digest().subarray(0, 16);
}

export function encrypt(data: string) {
  const iv = generateDeterministicIV(data);
  const cipher = createCipheriv("aes-256-cbc", KEY, iv);
  let encrypted = cipher.update(data, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + "." + encrypted;
}

export function decrypt(encryptedData: string) {
  const [ivHex, encryptedText] = encryptedData.split(".");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", KEY, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}

export function hash(data: string, saltLength: number = 16): Promise<string> {
  const salt = randomBytes(saltLength).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(data, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + "." + derivedKey.toString("hex"));
    });
  });
}

export function verify(data: string, dataHash: string): Promise<boolean> {
  const [salt, key] = dataHash.split(".");
  return new Promise((resolve, reject) => {
    scrypt(data, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}