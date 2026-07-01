import { expect as viExpect } from 'vitest'
globalThis.expect = viExpect

;(async () => {
	try {
		await import('@testing-library/jest-dom')
	} catch (e) {
		// jest-dom optional in this environment
	}
})()
