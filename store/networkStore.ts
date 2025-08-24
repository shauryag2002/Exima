import NetworkService, { NetworkState } from "@/services/NetworkService";
import { create } from "zustand";

interface NetworkStore {
  isOnline: boolean;
  isWifiConnected: boolean;
  connectionType: string;
  showOfflineMessage: boolean;

  // Actions
  updateNetworkState: (state: NetworkState) => void;
  setShowOfflineMessage: (show: boolean) => void;
  initializeNetworkListener: () => () => void; // Returns cleanup function
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  isOnline: true, // Default to online
  isWifiConnected: false,
  connectionType: "unknown",
  showOfflineMessage: false,

  updateNetworkState: (networkState: NetworkState) => {
    const currentState = get();
    const wasOnline = currentState.isOnline;
    const isNowOnline = networkState.isConnected;

    set({
      isOnline: isNowOnline,
      isWifiConnected: networkState.isWifiConnected,
      connectionType: networkState.connectionType,
    });

    // Show offline message when going from online to offline
    if (wasOnline && !isNowOnline) {
      set({ showOfflineMessage: true });
    }

    // Hide offline message when coming back online
    if (!wasOnline && isNowOnline) {
      set({ showOfflineMessage: false });
    }
  },

  setShowOfflineMessage: (show: boolean) => {
    set({ showOfflineMessage: show });
  },

  initializeNetworkListener: () => {
    // Get initial state
    const initialState = NetworkService.getNetworkState();
    get().updateNetworkState(initialState);

    // Listen for network changes
    const unsubscribe = NetworkService.addListener((networkState) => {
      get().updateNetworkState(networkState);
    });

    return unsubscribe;
  },
}));
