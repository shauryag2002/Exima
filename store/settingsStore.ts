import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  // Theme
  theme: "light" | "dark" | "system";

  // Audio settings
  audioQuality: "low" | "medium" | "high";
  downloadOverWifiOnly: boolean;

  // Player settings
  repeatMode: "off" | "track" | "queue";
  shuffleEnabled: boolean;

  // Download settings
  autoDownloadOnPlay: boolean;
  smartCacheThreshold: number; // Number of plays before auto-download
  downloadLocation: "internal" | "external";

  // Actions
  setTheme: (theme: "light" | "dark" | "system") => void;
  setAudioQuality: (quality: "low" | "medium" | "high") => void;
  setDownloadOverWifiOnly: (enabled: boolean) => void;
  setRepeatMode: (mode: "off" | "track" | "queue") => void;
  setShuffleEnabled: (enabled: boolean) => void;
  setAutoDownloadOnPlay: (enabled: boolean) => void;
  setSmartCacheThreshold: (threshold: number) => void;
  setDownloadLocation: (location: "internal" | "external") => void;
  resetSettings: () => void;
}

const defaultSettings = {
  theme: "dark" as const,
  audioQuality: "high" as const,
  downloadOverWifiOnly: true,
  repeatMode: "off" as const,
  shuffleEnabled: false,
  autoDownloadOnPlay: false,
  smartCacheThreshold: 3,
  downloadLocation: "internal" as const,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => set({ theme }),
      setAudioQuality: (quality) => set({ audioQuality: quality }),
      setDownloadOverWifiOnly: (enabled) =>
        set({ downloadOverWifiOnly: enabled }),
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      setShuffleEnabled: (enabled) => set({ shuffleEnabled: enabled }),
      setAutoDownloadOnPlay: (enabled) => set({ autoDownloadOnPlay: enabled }),
      setSmartCacheThreshold: (threshold) =>
        set({ smartCacheThreshold: threshold }),
      setDownloadLocation: (location) => set({ downloadLocation: location }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
