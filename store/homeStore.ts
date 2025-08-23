import {
  SaavnAlbum,
  SaavnSong,
  getLatestReleases,
  getRecentlyPlayedAlbums,
  getRecentlyPlayedSongs,
  getRecommendations,
  getTopCharts,
  getTrending,
  loadStore,
} from "@/services/SongApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HomeState {
  // Data
  recentlyPlayedSongs: SaavnSong[];
  recentlyPlayedAlbums: SaavnAlbum[];
  recommendations: SaavnSong[];
  topCharts: { songs: SaavnSong[]; albums: SaavnAlbum[] };
  trending: { songs: SaavnSong[]; albums: SaavnAlbum[] };
  latestReleases: { songs: SaavnSong[]; albums: SaavnAlbum[] };

  // Cache metadata
  lastUpdated: {
    recommendations: number | null;
    topCharts: number | null;
    trending: number | null;
    latestReleases: number | null;
  };

  // Loading states
  isLoadingRecentlyPlayed: boolean;
  isLoadingRecommendations: boolean;
  isLoadingTopCharts: boolean;
  isLoadingTrending: boolean;
  isLoadingLatestReleases: boolean;

  // Actions
  loadRecentlyPlayed: () => Promise<void>;
  loadRecommendations: (forceRefresh?: boolean) => Promise<void>;
  loadTopCharts: (forceRefresh?: boolean) => Promise<void>;
  loadTrending: (forceRefresh?: boolean) => Promise<void>;
  loadLatestReleases: (forceRefresh?: boolean) => Promise<void>;
  loadAllData: (forceRefresh?: boolean) => Promise<void>;
  refreshAll: () => Promise<void>;
  clearCache: () => void;
  isDataStale: (key: keyof HomeState["lastUpdated"]) => boolean;
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set, get) => {
      // Cache duration: 30 minutes for most data, 5 minutes for recommendations
      const CACHE_DURATION = {
        recommendations: 5 * 60 * 1000, // 5 minutes
        topCharts: 30 * 60 * 1000, // 30 minutes
        trending: 30 * 60 * 1000, // 30 minutes
        latestReleases: 30 * 60 * 1000, // 30 minutes
      };

      const isDataStale = (key: keyof HomeState["lastUpdated"]): boolean => {
        const lastUpdated = get().lastUpdated[key];
        if (!lastUpdated) return true;
        return Date.now() - lastUpdated > CACHE_DURATION[key];
      };

      return {
        // Initial state
        recentlyPlayedSongs: [],
        recentlyPlayedAlbums: [],
        recommendations: [],
        topCharts: { songs: [], albums: [] },
        trending: { songs: [], albums: [] },
        latestReleases: { songs: [], albums: [] },

        lastUpdated: {
          recommendations: null,
          topCharts: null,
          trending: null,
          latestReleases: null,
        },

        isLoadingRecentlyPlayed: false,
        isLoadingRecommendations: false,
        isLoadingTopCharts: false,
        isLoadingTrending: false,
        isLoadingLatestReleases: false,

        isDataStale,

        loadRecentlyPlayed: async () => {
          set({ isLoadingRecentlyPlayed: true });
          try {
            // Ensure the store is loaded before accessing recently played data
            await loadStore();
            const songs = getRecentlyPlayedSongs();
            const albums = getRecentlyPlayedAlbums();
            set({
              recentlyPlayedSongs: songs,
              recentlyPlayedAlbums: albums,
              isLoadingRecentlyPlayed: false,
            });
          } catch (error) {
            console.error("Failed to load recently played:", error);
            set({ isLoadingRecentlyPlayed: false });
          }
        },

        loadRecommendations: async (forceRefresh = false) => {
          const state = get();
          if (
            !forceRefresh &&
            !state.isDataStale("recommendations") &&
            state.recommendations.length > 0
          ) {
            return;
          }

          set({ isLoadingRecommendations: true });
          try {
            const recommendations = await getRecommendations();
            set({
              recommendations,
              isLoadingRecommendations: false,
              lastUpdated: {
                ...state.lastUpdated,
                recommendations: Date.now(),
              },
            });
          } catch (error) {
            console.error("Failed to load recommendations:", error);
            set({ isLoadingRecommendations: false });
          }
        },

        loadTopCharts: async (forceRefresh = false) => {
          const state = get();
          if (
            !forceRefresh &&
            !state.isDataStale("topCharts") &&
            (state.topCharts.songs.length > 0 ||
              state.topCharts.albums.length > 0)
          ) {
            return;
          }

          set({ isLoadingTopCharts: true });
          try {
            const topCharts = await getTopCharts();
            set({
              topCharts,
              isLoadingTopCharts: false,
              lastUpdated: { ...state.lastUpdated, topCharts: Date.now() },
            });
          } catch (error) {
            console.error("Failed to load top charts:", error);
            set({ isLoadingTopCharts: false });
          }
        },

        loadTrending: async (forceRefresh = false) => {
          const state = get();
          if (
            !forceRefresh &&
            !state.isDataStale("trending") &&
            (state.trending.songs.length > 0 ||
              state.trending.albums.length > 0)
          ) {
            return;
          }

          set({ isLoadingTrending: true });
          try {
            const trending = await getTrending();
            set({
              trending,
              isLoadingTrending: false,
              lastUpdated: { ...state.lastUpdated, trending: Date.now() },
            });
          } catch (error) {
            console.error("Failed to load trending:", error);
            set({ isLoadingTrending: false });
          }
        },

        loadLatestReleases: async (forceRefresh = false) => {
          const state = get();
          if (
            !forceRefresh &&
            !state.isDataStale("latestReleases") &&
            (state.latestReleases.songs.length > 0 ||
              state.latestReleases.albums.length > 0)
          ) {
            return;
          }

          set({ isLoadingLatestReleases: true });
          try {
            const latestReleases = await getLatestReleases();
            set({
              latestReleases,
              isLoadingLatestReleases: false,
              lastUpdated: { ...state.lastUpdated, latestReleases: Date.now() },
            });
          } catch (error) {
            console.error("Failed to load latest releases:", error);
            set({ isLoadingLatestReleases: false });
          }
        },

        loadAllData: async (forceRefresh = false) => {
          const actions = get();
          await actions.loadRecentlyPlayed();
          await Promise.allSettled([
            actions.loadRecommendations(forceRefresh),
            actions.loadTopCharts(forceRefresh),
            actions.loadTrending(forceRefresh),
            actions.loadLatestReleases(forceRefresh),
          ]);
        },

        refreshAll: async () => {
          await get().loadAllData(true);
        },

        clearCache: () => {
          set({
            recentlyPlayedSongs: [],
            recentlyPlayedAlbums: [],
            recommendations: [],
            topCharts: { songs: [], albums: [] },
            trending: { songs: [], albums: [] },
            latestReleases: { songs: [], albums: [] },
            lastUpdated: {
              recommendations: null,
              topCharts: null,
              trending: null,
              latestReleases: null,
            },
          });
        },
      };
    },
    {
      name: "home-store",
      storage: {
        getItem: async (name: string) => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error("Failed to load persisted home store:", error);
            return null;
          }
        },
        setItem: async (name: string, value: any) => {
          try {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error("Failed to persist home store:", error);
          }
        },
        removeItem: async (name: string) => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (error) {
            console.error("Failed to remove persisted home store:", error);
          }
        },
      },
      partialize: (state) => ({
        // Persist data and cache metadata, but not loading states
        recentlyPlayedSongs: state.recentlyPlayedSongs,
        recentlyPlayedAlbums: state.recentlyPlayedAlbums,
        recommendations: state.recommendations,
        topCharts: state.topCharts,
        trending: state.trending,
        latestReleases: state.latestReleases,
        lastUpdated: state.lastUpdated,
      }),
      version: 1, // Add versioning for future migrations
      migrate: (persistedState: any, version: number) => {
        // Handle migrations between versions
        if (version === 0) {
          // Migration from version 0 to 1: add lastUpdated if missing
          return {
            ...persistedState,
            lastUpdated: {
              recommendations: null,
              topCharts: null,
              trending: null,
              latestReleases: null,
            },
          };
        }
        return persistedState;
      },
    }
  )
);
