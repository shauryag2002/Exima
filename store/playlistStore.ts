import { SaavnSong } from "@/services/SongApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  image?: string;
  songs: SaavnSong[];
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistState {
  // Playlists
  playlists: Playlist[];

  // Actions
  createPlaylist: (name: string, description?: string) => Promise<string>;
  deletePlaylist: (id: string) => void;
  updatePlaylist: (
    id: string,
    updates: Partial<Omit<Playlist, "id" | "createdAt">>
  ) => void;
  addSongToPlaylist: (playlistId: string, song: SaavnSong) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  getPlaylist: (id: string) => Playlist | undefined;

  // Utility
  isSongInPlaylist: (playlistId: string, songId: string) => boolean;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],

      createPlaylist: async (name: string, description?: string) => {
        const id = Date.now().toString();
        const newPlaylist: Playlist = {
          id,
          name,
          description,
          songs: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          playlists: [...state.playlists, newPlaylist],
        }));

        return id;
      },

      deletePlaylist: (id: string) => {
        set((state) => ({
          playlists: state.playlists.filter((playlist) => playlist.id !== id),
        }));
      },

      updatePlaylist: (
        id: string,
        updates: Partial<Omit<Playlist, "id" | "createdAt">>
      ) => {
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id
              ? { ...playlist, ...updates, updatedAt: new Date() }
              : playlist
          ),
        }));
      },

      addSongToPlaylist: (playlistId: string, song: SaavnSong) => {
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  songs: playlist.songs.some((s) => s.id === song.id)
                    ? playlist.songs // Don't add duplicates
                    : [...playlist.songs, song],
                  updatedAt: new Date(),
                }
              : playlist
          ),
        }));
      },

      removeSongFromPlaylist: (playlistId: string, songId: string) => {
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  songs: playlist.songs.filter((song) => song.id !== songId),
                  updatedAt: new Date(),
                }
              : playlist
          ),
        }));
      },

      getPlaylist: (id: string) => {
        return get().playlists.find((playlist) => playlist.id === id);
      },

      isSongInPlaylist: (playlistId: string, songId: string) => {
        const playlist = get().getPlaylist(playlistId);
        return playlist?.songs.some((song) => song.id === songId) || false;
      },
    }),
    {
      name: "playlist-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
