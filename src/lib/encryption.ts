import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { requireEnv } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function normalizeEncryptionKey(rawValue: string) {
    const trimmed = rawValue.trim();

    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        return Buffer.from(trimmed, "hex");
    }

    if (trimmed.length === 32) {
        return Buffer.from(trimmed, "utf8");
    }

    const normalizedBase64 = trimmed.replace(/-/g, "+").replace(/_/g, "/");

    if (/^[A-Za-z0-9+/=]+$/.test(normalizedBase64)) {
        const base64Buffer = Buffer.from(normalizedBase64, "base64");

        if (base64Buffer.length === 32) {
            return base64Buffer;
        }
    }

    return null;
}

function getKeyBuffer() {
    const encryptionKey = requireEnv("ENCRYPTION_KEY");
    const normalizedKey = normalizeEncryptionKey(encryptionKey);

    if (!normalizedKey || normalizedKey.length !== 32) {
        throw new Error(
            "ENCRYPTION_KEY environment variable is invalid. Use a 32-character string, 64-character hex key, or base64 value for 32 bytes."
        );
    }

    return normalizedKey;
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
    if (!key) return encryptedText;

    try {
        const combined = Buffer.from(encryptedText, "base64");
        if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) return encryptedText;

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
    } catch (e) {
        console.error("Decryption failed:", e);
        return encryptedText;
    }
}
