import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from './encryption'

// Mock Web Crypto API for Node.js environment in tests
import { webcrypto } from 'node:crypto'
if (!global.crypto) {
    // @ts-ignore
    global.crypto = webcrypto
}

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
})
