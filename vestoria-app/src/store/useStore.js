import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  userData: null,
  impersonatingId: null,
  setUser: (user) => set({ user }),
  setUserData: (userData) => set({ userData }),
  setImpersonatingId: (id) => set({ impersonatingId: id }),
  
  // UI State
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  // App Config
  plans: [],
  setPlans: (plans) => set({ plans }),
}));
