import { create } from 'zustand';

interface LayoutState {
  sidebarOpen: boolean;
  isInitialized: boolean;
  setSidebarOpen: (open: boolean) => void;
  initialize: (isMobile: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  sidebarOpen: false, // Default is overridden instantly upon init
  isInitialized: false,
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  initialize: (isMobile) => {
    // Only run this layout-detection calculation the VERY FIRST time the app loads
    // From this point onward, it remembers exactly what the user selected.
    if (!get().isInitialized) {
      set({ sidebarOpen: !isMobile, isInitialized: true });
    }
  },
}));