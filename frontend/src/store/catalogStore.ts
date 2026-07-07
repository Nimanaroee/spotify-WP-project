import { create } from 'zustand'

interface CatalogState {
  version: number
  bumpCatalogVersion: () => void
}

export const useCatalogStore = create<CatalogState>((set) => ({
  version: 0,
  bumpCatalogVersion: () => set((state) => ({ version: state.version + 1 })),
}))
