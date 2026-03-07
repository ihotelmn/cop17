import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { requireEnv } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKeyBuffer() {
    const encryptionKey = requireEnv("ENCRYPTION_KEY");
    if (!encryptionKey || encryptionKey.length !== 32) {
        throw new Error(
            "ENCRYPTION_KEY environment variable is required and must be exactly 32 characters. " +
            "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex').slice(0,32))\""
        );
    }

    return Buffer.from(encryptionKey, "utf8");
}

export async function encrypt(text: string): Promise<string> {
    const key = getKeyBuffer();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export async function decrypt(encryptedText: string): Promise<string> {
    const key = getKeyBuffer();
    const combined = Buffer.from(encryptedText, "base64");
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const data = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(data),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}
