import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  userId: string | null;
  token: string | null;
  setSession: (userId: string, token: string) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      token: null,
      setSession: (userId, token) => set({ userId, token }),
      clear: () => set({ userId: null, token: null }),
    }),
    { name: "ssms-auth", storage: createJSONStorage(() => localStorage) },
  ),
);
