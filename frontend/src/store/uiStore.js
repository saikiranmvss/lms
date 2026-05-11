import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUiStore = create(
  persist(
    (set) => ({
      darkMode: false,
      sidebarOpen: true,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'lms-ui', partialize: (s) => ({ darkMode: s.darkMode }) }
  )
);

export default useUiStore;
