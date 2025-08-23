import {
  SaavnAlbum,
  SaavnArtist,
  SaavnPlaylist,
  SaavnService,
  SaavnSong,
} from "@/services/SongApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SearchTabType = "songs" | "albums" | "playlists" | "artists";

interface SearchResults {
  songs: SaavnSong[];
  albums: SaavnAlbum[];
  playlists: SaavnPlaylist[];
  artists: SaavnArtist[];
}

interface SearchLoadingState {
  songs: boolean;
  albums: boolean;
  playlists: boolean;
  artists: boolean;
}

interface HasMoreState {
  songs: boolean;
  albums: boolean;
  playlists: boolean;
  artists: boolean;
}

interface PageState {
  songs: number;
  albums: number;
  playlists: number;
  artists: number;
}

interface SearchState {
  // Search state
  query: string;
  results: SearchResults;
  isLoading: SearchLoadingState;
  isLoadingMore: SearchLoadingState;
  hasMore: HasMoreState;
  currentPage: PageState;
  error: string | null;
  activeTab: SearchTabType;

  // Search history
  recentSearches: string[];

  // Actions
  setQuery: (query: string) => void;
  setActiveTab: (tab: SearchTabType) => void;
  searchAll: (query: string, reset?: boolean) => Promise<void>;
  searchSongs: (query: string, reset?: boolean) => Promise<void>;
  searchAlbums: (query: string, reset?: boolean) => Promise<void>;
  searchPlaylists: (query: string, reset?: boolean) => Promise<void>;
  searchArtists: (query: string, reset?: boolean) => Promise<void>;
  loadMore: (tab: SearchTabType) => Promise<void>;
  clearResults: () => void;
  addToRecentSearches: (query: string) => void;
  clearRecentSearches: () => void;
  removeFromRecentSearches: (query: string) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: "",
      results: {
        songs: [],
        albums: [],
        playlists: [],
        artists: [],
      },
      isLoading: {
        songs: false,
        albums: false,
        playlists: false,
        artists: false,
      },
      isLoadingMore: {
        songs: false,
        albums: false,
        playlists: false,
        artists: false,
      },
      hasMore: {
        songs: false,
        albums: false,
        playlists: false,
        artists: false,
      },
      currentPage: {
        songs: 0,
        albums: 0,
        playlists: 0,
        artists: 0,
      },
      error: null,
      activeTab: "songs",
      recentSearches: [],

      setQuery: (query) => set({ query }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      searchAll: async (query: string, reset = true) => {
        if (!query.trim()) return;

        const trimmedQuery = query.trim();

        if (reset) {
          set({
            isLoading: {
              songs: true,
              albums: true,
              playlists: true,
              artists: true,
            },
            error: null,
            query: trimmedQuery,
            currentPage: { songs: 0, albums: 0, playlists: 0, artists: 0 },
          });
        }

        try {
          const page = reset
            ? 0
            : Math.max(
                get().currentPage.songs,
                get().currentPage.albums,
                get().currentPage.playlists,
                get().currentPage.artists
              );

          const result = await SaavnService.searchAll(trimmedQuery, page);

          if (reset) {
            set({
              results: {
                songs: result.songs,
                albums: result.albums,
                playlists: result.playlists,
                artists: result.artists,
              },
              hasMore: result.hasMore,
            });
          } else {
            const currentResults = get().results;
            // Filter out duplicates by ID
            const newSongs = result.songs.filter(
              (song) =>
                !currentResults.songs.some(
                  (existing) => existing.id === song.id
                )
            );
            const newAlbums = result.albums.filter(
              (album) =>
                !currentResults.albums.some(
                  (existing) => existing.id === album.id
                )
            );
            const newPlaylists = result.playlists.filter(
              (playlist) =>
                !currentResults.playlists.some(
                  (existing) => existing.id === playlist.id
                )
            );
            const newArtists = result.artists.filter(
              (artist) =>
                !currentResults.artists.some(
                  (existing) => existing.id === artist.id
                )
            );
            set({
              results: {
                songs: [...currentResults.songs, ...newSongs],
                albums: [...currentResults.albums, ...newAlbums],
                playlists: [...currentResults.playlists, ...newPlaylists],
                artists: [...currentResults.artists, ...newArtists],
              },
              hasMore: result.hasMore,
            });
          }

          get().addToRecentSearches(trimmedQuery);
        } catch (error: any) {
          set({ error: error.message || "Search failed" });
        } finally {
          set({
            isLoading: {
              songs: false,
              albums: false,
              playlists: false,
              artists: false,
            },
            isLoadingMore: {
              songs: false,
              albums: false,
              playlists: false,
              artists: false,
            },
          });
        }
      },

      searchSongs: async (query: string, reset = true) => {
        if (!query.trim()) return;

        const trimmedQuery = query.trim();
        const currentPage = reset ? 0 : get().currentPage.songs + 1;

        if (reset) {
          set({
            isLoading: { ...get().isLoading, songs: true },
            error: null,
            query: trimmedQuery,
            currentPage: { ...get().currentPage, songs: 0 },
          });
        } else {
          set({
            isLoadingMore: { ...get().isLoadingMore, songs: true },
          });
        }

        try {
          const result = await SaavnService.searchSongs(
            trimmedQuery,
            currentPage
          );

          if (reset) {
            set({
              results: { ...get().results, songs: result.songs },
              hasMore: { ...get().hasMore, songs: result.hasMore },
              currentPage: { ...get().currentPage, songs: 0 },
            });
          } else {
            const currentResults = get().results;
            // Filter out duplicates by ID
            const newSongs = result.songs.filter(
              (song) =>
                !currentResults.songs.some(
                  (existing) => existing.id === song.id
                )
            );
            set({
              results: {
                ...get().results,
                songs: [...currentResults.songs, ...newSongs],
              },
              hasMore: { ...get().hasMore, songs: result.hasMore },
              currentPage: { ...get().currentPage, songs: currentPage },
            });
          }

          get().addToRecentSearches(trimmedQuery);
        } catch (error: any) {
          set({ error: error.message || "Search failed" });
        } finally {
          set({
            isLoading: { ...get().isLoading, songs: false },
            isLoadingMore: { ...get().isLoadingMore, songs: false },
          });
        }
      },

      searchAlbums: async (query: string, reset = true) => {
        if (!query.trim()) return;

        const trimmedQuery = query.trim();
        const currentPage = reset ? 0 : get().currentPage.albums + 1;

        if (reset) {
          set({
            isLoading: { ...get().isLoading, albums: true },
            error: null,
            query: trimmedQuery,
            currentPage: { ...get().currentPage, albums: 0 },
          });
        } else {
          set({
            isLoadingMore: { ...get().isLoadingMore, albums: true },
          });
        }

        try {
          const result = await SaavnService.searchAlbums(
            trimmedQuery,
            currentPage
          );

          if (reset) {
            set({
              results: { ...get().results, albums: result.albums },
              hasMore: { ...get().hasMore, albums: result.hasMore },
              currentPage: { ...get().currentPage, albums: 0 },
            });
          } else {
            const currentResults = get().results;
            // Filter out duplicates by ID
            const newAlbums = result.albums.filter(
              (album) =>
                !currentResults.albums.some(
                  (existing) => existing.id === album.id
                )
            );
            set({
              results: {
                ...get().results,
                albums: [...currentResults.albums, ...newAlbums],
              },
              hasMore: { ...get().hasMore, albums: result.hasMore },
              currentPage: { ...get().currentPage, albums: currentPage },
            });
          }

          get().addToRecentSearches(trimmedQuery);
        } catch (error: any) {
          set({ error: error.message || "Search failed" });
        } finally {
          set({
            isLoading: { ...get().isLoading, albums: false },
            isLoadingMore: { ...get().isLoadingMore, albums: false },
          });
        }
      },

      searchPlaylists: async (query: string, reset = true) => {
        if (!query.trim()) return;

        const trimmedQuery = query.trim();
        const currentPage = reset ? 0 : get().currentPage.playlists + 1;

        if (reset) {
          set({
            isLoading: { ...get().isLoading, playlists: true },
            error: null,
            query: trimmedQuery,
            currentPage: { ...get().currentPage, playlists: 0 },
          });
        } else {
          set({
            isLoadingMore: { ...get().isLoadingMore, playlists: true },
          });
        }

        try {
          const result = await SaavnService.searchPlaylists(
            trimmedQuery,
            currentPage
          );

          if (reset) {
            set({
              results: { ...get().results, playlists: result.playlists },
              hasMore: { ...get().hasMore, playlists: result.hasMore },
              currentPage: { ...get().currentPage, playlists: 0 },
            });
          } else {
            const currentResults = get().results;
            // Filter out duplicates by ID
            const newPlaylists = result.playlists.filter(
              (playlist) =>
                !currentResults.playlists.some(
                  (existing) => existing.id === playlist.id
                )
            );
            set({
              results: {
                ...get().results,
                playlists: [...currentResults.playlists, ...newPlaylists],
              },
              hasMore: { ...get().hasMore, playlists: result.hasMore },
              currentPage: { ...get().currentPage, playlists: currentPage },
            });
          }

          get().addToRecentSearches(trimmedQuery);
        } catch (error: any) {
          set({ error: error.message || "Search failed" });
        } finally {
          set({
            isLoading: { ...get().isLoading, playlists: false },
            isLoadingMore: { ...get().isLoadingMore, playlists: false },
          });
        }
      },

      searchArtists: async (query: string, reset = true) => {
        if (!query.trim()) return;

        const trimmedQuery = query.trim();
        const currentPage = reset ? 0 : get().currentPage.artists + 1;

        if (reset) {
          set({
            isLoading: { ...get().isLoading, artists: true },
            error: null,
            query: trimmedQuery,
            currentPage: { ...get().currentPage, artists: 0 },
          });
        } else {
          set({
            isLoadingMore: { ...get().isLoadingMore, artists: true },
          });
        }

        try {
          const result = await SaavnService.searchArtists(
            trimmedQuery,
            currentPage
          );

          if (reset) {
            set({
              results: { ...get().results, artists: result.artists },
              hasMore: { ...get().hasMore, artists: result.hasMore },
              currentPage: { ...get().currentPage, artists: 0 },
            });
          } else {
            const currentResults = get().results;
            // Filter out duplicates by ID
            const newArtists = result.artists.filter(
              (artist) =>
                !currentResults.artists.some(
                  (existing) => existing.id === artist.id
                )
            );
            set({
              results: {
                ...get().results,
                artists: [...currentResults.artists, ...newArtists],
              },
              hasMore: { ...get().hasMore, artists: result.hasMore },
              currentPage: { ...get().currentPage, artists: currentPage },
            });
          }

          get().addToRecentSearches(trimmedQuery);
        } catch (error: any) {
          set({ error: error.message || "Search failed" });
        } finally {
          set({
            isLoading: { ...get().isLoading, artists: false },
            isLoadingMore: { ...get().isLoadingMore, artists: false },
          });
        }
      },

      loadMore: async (tab: SearchTabType) => {
        const state = get();
        const hasMoreForTab = state.hasMore[tab];
        const isLoading = state.isLoading[tab] || state.isLoadingMore[tab];

        if (!hasMoreForTab || isLoading || !state.query.trim()) return;

        switch (tab) {
          case "songs":
            await state.searchSongs(state.query, false);
            break;
          case "albums":
            await state.searchAlbums(state.query, false);
            break;
          case "playlists":
            await state.searchPlaylists(state.query, false);
            break;
          case "artists":
            await state.searchArtists(state.query, false);
            break;
        }
      },

      clearResults: () =>
        set({
          results: { songs: [], albums: [], playlists: [], artists: [] },
          query: "",
          error: null,
          hasMore: {
            songs: false,
            albums: false,
            playlists: false,
            artists: false,
          },
          currentPage: { songs: 0, albums: 0, playlists: 0, artists: 0 },
        }),

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
