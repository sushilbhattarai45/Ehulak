import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const ALGORITHM = "aes-256-gcm";

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_SECRET)
  .digest();

export function encrypt(text) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    iv
  );

  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(payload) {
  const [ivHex, authTagHex, encryptedHex] =
    payload.split(":");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(
    Buffer.from(authTagHex, "hex")
  );

  let decrypted = decipher.update(
    encryptedHex,
    "hex",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return decrypted;
}
