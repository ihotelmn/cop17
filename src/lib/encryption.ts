import "server-only";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "12345678901234567890123456789012"; // 32 bytes
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // AES block size

// Helper to convert string to buffer (using Web Crypto API in Node/Next Edge)
async function getKey() {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(ENCRYPTION_KEY),
        "AES-GCM",
        false,
        ["encrypt", "decrypt"]
    );
    return keyMaterial;
}

export async function encrypt(text: string): Promise<string> {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes recommended for GCM
    const encodedText = new TextEncoder().encode(text);

    const encryptedContent = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encodedText
    );

    // Combine IV and encrypted data, encode as Base64
    const encryptedArray = new Uint8Array(encryptedContent);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    return Buffer.from(combined).toString("base64");
}

export async function decrypt(encryptedText: string): Promise<string> {
    const key = await getKey();
    const combined = new Uint8Array(Buffer.from(encryptedText, "base64"));

    // Extract IV
    const iv = combined.slice(0, 12);
    // Extract encrypted content
    const data = combined.slice(12);

    const decryptedContent = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data
    );

    return new TextDecoder().decode(decryptedContent);
}
