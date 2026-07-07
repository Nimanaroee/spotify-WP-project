import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'
import { installMockIndexedDb, resetMockIndexedDb } from './test/mockIndexedDb'

installMockIndexedDb()

beforeEach(() => {
  resetMockIndexedDb()
})
