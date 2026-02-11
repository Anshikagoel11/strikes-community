import { create } from "zustand";

interface AIStore {
    isAIEnabled: boolean;
    toggleAI: () => void;
    setAIEnabled: (enabled: boolean) => void;
}

export const useAIStore = create<AIStore>((set) => ({
    isAIEnabled: false,
    toggleAI: () => set((state) => ({ isAIEnabled: !state.isAIEnabled })),
    setAIEnabled: (enabled: boolean) => set({ isAIEnabled: enabled }),
}));
