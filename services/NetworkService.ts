import NetInfo from "@react-native-community/netinfo";

export interface NetworkState {
  isConnected: boolean;
  isWifiConnected: boolean;
  connectionType: string;
}

class NetworkService {
  private static instance: NetworkService;
  private listeners: Set<(state: NetworkState) => void> = new Set();
  private currentState: NetworkState = {
    isConnected: false,
    isWifiConnected: false,
    connectionType: "none",
  };

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  private constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Get initial network state
      const netInfo = await NetInfo.fetch();
      this.updateState(netInfo);

      // Subscribe to network changes
      NetInfo.addEventListener((netInfo) => {
        this.updateState(netInfo);
      });
    } catch (error) {
      console.error("Failed to initialize NetworkService:", error);
    }
  }

  private updateState(netInfo: any): void {
    const newState: NetworkState = {
      isConnected: netInfo.isConnected === true,
      isWifiConnected: netInfo.type === "wifi" && netInfo.isConnected === true,
      connectionType: netInfo.type || "none",
    };

    const hasChanged =
      newState.isConnected !== this.currentState.isConnected ||
      newState.isWifiConnected !== this.currentState.isWifiConnected ||
      newState.connectionType !== this.currentState.connectionType;

    if (hasChanged) {
      this.currentState = newState;

      // Notify all listeners
      this.listeners.forEach((listener) => {
        try {
          listener(newState);
        } catch (error) {
          console.error("Error in network listener:", error);
        }
      });
    }
  }

  // Get current network state
  getNetworkState(): NetworkState {
    return { ...this.currentState };
  }

  // Check if device is online
  isOnline(): boolean {
    return this.currentState.isConnected;
  }

  // Check if device is offline
  isOffline(): boolean {
    return !this.currentState.isConnected;
  }

  // Check if WiFi is available
  isWifiAvailable(): boolean {
    return this.currentState.isWifiConnected;
  }

  // Add network state listener
  addListener(listener: (state: NetworkState) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Remove all listeners
  removeAllListeners(): void {
    this.listeners.clear();
  }

  // Refresh network state
  async refresh(): Promise<NetworkState> {
    try {
      const netInfo = await NetInfo.fetch();
      this.updateState(netInfo);
      return this.getNetworkState();
    } catch (error) {
      console.error("Failed to refresh network state:", error);
      return this.getNetworkState();
    }
  }
}

export default NetworkService.getInstance();
