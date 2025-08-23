import AsyncStorage from "@react-native-async-storage/async-storage";
import { useHomeStore } from "./homeStore";
import { usePlayerStore } from "./playerStore";
import { useSearchStore } from "./searchStore";

/**
 * Utility functions for managing app-wide persistence
 */
export const PersistenceManager = {
  /**
   * Clear all persisted store data
   */
  clearAllStores: async () => {
    try {
      const storeKeys = [
        "home-store",
        "player-store",
        "search-store",
        "playlist-store",
        "bottom-sheet-store",
      ];

      await Promise.all(storeKeys.map((key) => AsyncStorage.removeItem(key)));
    } catch (error) {
      console.error("Failed to clear store data:", error);
    }
  },

  /**
   * Get storage usage info
   */
  getStorageInfo: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const storeKeys = keys.filter((key) => key.endsWith("-store"));

      const sizes = await Promise.all(
        storeKeys.map(async (key) => {
          const value = await AsyncStorage.getItem(key);
          return {
            key,
            size: value ? new Blob([value]).size : 0,
            data: value ? JSON.parse(value) : null,
          };
        })
      );

      return {
        totalStores: sizes.length,
        totalSize: sizes.reduce((sum, item) => sum + item.size, 0),
        stores: sizes,
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return null;
    }
  },

  /**
   * Reset specific stores to initial state
   */
  resetStores: {
    home: () => {
      useHomeStore.getState().clearCache();
    },
    player: () => {
      usePlayerStore.getState().clearQueue();
    },
    search: () => {
      useSearchStore.getState().clearResults();
      useSearchStore.getState().clearRecentSearches();
    },
    playlists: () => {
      // Playlist store doesn't have a clear method, so we'll clear via AsyncStorage
      AsyncStorage.removeItem("playlist-store");
    },
  },

  /**
   * Export all store data for backup
   */
  exportData: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const storeKeys = keys.filter((key) => key.endsWith("-store"));

      const data: Record<string, any> = {};
      await Promise.all(
        storeKeys.map(async (key) => {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            data[key] = JSON.parse(value);
          }
        })
      );

      return {
        exportDate: new Date().toISOString(),
        version: "1.0",
        data,
      };
    } catch (error) {
      console.error("Failed to export data:", error);
      return null;
    }
  },

  /**
   * Import store data from backup
   */
  importData: async (backup: any) => {
    try {
      if (!backup.data || typeof backup.data !== "object") {
        throw new Error("Invalid backup format");
      }

      await Promise.all(
        Object.entries(backup.data).map(async ([key, value]) => {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        })
      );

      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  },

  /**
   * Optimize storage by removing old cache entries
   */
  optimizeStorage: async () => {
    try {
      // Clear expired cache entries from home store
      const homeState = useHomeStore.getState();
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      let shouldUpdate = false;
      const newLastUpdated = { ...homeState.lastUpdated };

      Object.entries(homeState.lastUpdated).forEach(([key, timestamp]) => {
        if (timestamp && now - timestamp > oneWeek) {
          newLastUpdated[key as keyof typeof newLastUpdated] = null;
          shouldUpdate = true;
        }
      });

      if (shouldUpdate) {
        // This will trigger a refresh on next load
        useHomeStore.setState({ lastUpdated: newLastUpdated });
      }
    } catch (error) {
      console.error("Failed to optimize storage:", error);
    }
  },
};

/**
 * Hook to monitor storage usage
 */
export const useStorageMonitor = () => {
  const getUsage = async () => {
    return await PersistenceManager.getStorageInfo();
  };

  const clearAll = async () => {
    await PersistenceManager.clearAllStores();
  };

  const optimize = async () => {
    await PersistenceManager.optimizeStorage();
  };

  return {
    getUsage,
    clearAll,
    optimize,
    reset: PersistenceManager.resetStores,
    export: PersistenceManager.exportData,
    import: PersistenceManager.importData,
  };
};
