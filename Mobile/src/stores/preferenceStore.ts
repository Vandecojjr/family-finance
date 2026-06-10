import { create } from 'zustand';

interface PreferenceState {
  showBalances: boolean;
  toggleBalances: () => void;
}

export const usePreferenceStore = create<PreferenceState>((set) => ({
  showBalances: true,
  toggleBalances: () => set((state) => ({ showBalances: !state.showBalances })),
}));
