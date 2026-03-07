import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from './encryption'

process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'

describe('Encryption Utility', () => {
    it('should encrypt and decrypt data correctly', async () => {
        const originalText = "Sensitive Passport Data: E12345678"

        const encrypted = await encrypt(originalText)
        expect(encrypted).not.toBe(originalText)
        expect(encrypted.length).toBeGreaterThan(0)

        const decrypted = await decrypt(encrypted)
        expect(decrypted).toBe(originalText)
    })

    it('should produce different ciphertexts for the same plaintext (due to random IV)', async () => {
        const text = "Same Data"
        const encrypted1 = await encrypt(text)
        const encrypted2 = await encrypt(text)

        expect(encrypted1).not.toBe(encrypted2)

        const decrypted1 = await decrypt(encrypted1)
        const decrypted2 = await decrypt(encrypted2)

        expect(decrypted1).toBe(text)
        expect(decrypted2).toBe(text)
    })

    it('should accept a 64-character hex encryption key', async () => {
        process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

        const originalText = "Hex key payload"
        const encrypted = await encrypt(originalText)
        const decrypted = await decrypt(encrypted)

        expect(decrypted).toBe(originalText)
    })

    it('should accept a quoted base64 encryption key', async () => {
        process.env.ENCRYPTION_KEY = '"MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="'

        const originalText = "Base64 key payload"
        const encrypted = await encrypt(originalText)
        const decrypted = await decrypt(encrypted)

        expect(decrypted).toBe(originalText)
    })
})
