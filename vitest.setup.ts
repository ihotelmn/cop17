import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock server-only to allow tests to run in JSDOM (which has window defined)
vi.mock('server-only', () => {
    return {}
})
