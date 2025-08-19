import { SaavnService, SaavnSong } from "@/services/SongApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SearchState {
  // Search state
  query: string;
  results: SaavnSong[];
  isLoading: boolean;
  error: string | null;

  // Search history
  recentSearches: string[];

  // Actions
  setQuery: (query: string) => void;
  searchSongs: (query: string) => Promise<void>;
  clearResults: () => void;
  addToRecentSearches: (query: string) => void;
  clearRecentSearches: () => void;
  removeFromRecentSearches: (query: string) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: "",
      results: [],
      isLoading: false,
      error: null,
      recentSearches: [],

      setQuery: (query) => set({ query }),

      searchSongs: async (query: string) => {
        if (!query.trim()) return;

        set({ isLoading: true, error: null, query: query.trim() });

        try {
          const results = await SaavnService.searchSongs(query.trim());
          set({ results });
          get().addToRecentSearches(query.trim());
        } catch (error: any) {
          set({ error: error.message || "Search failed" });
        } finally {
          set({ isLoading: false });
        }
      },

      clearResults: () => set({ results: [], query: "", error: null }),

      addToRecentSearches: (query) => {
        const current = get().recentSearches;
        const filtered = current.filter(
          (q) => q.toLowerCase() !== query.toLowerCase()
        );
        const updated = [query, ...filtered].slice(0, 10); // Keep last 10 searches
        set({ recentSearches: updated });
      },

      removeFromRecentSearches: (query) => {
        const current = get().recentSearches;
        const filtered = current.filter((q) => q !== query);
        set({ recentSearches: filtered });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "search-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    }
  )
);
