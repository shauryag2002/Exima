import {
  SaavnSong,
  getBestAvailableUrl,
  incrementPlayAndMaybeCache,
} from "@/services/SongApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TrackPlayer, { State, Track } from "react-native-track-player";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  // Current track info
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;

  // Queue management
  queue: Track[];
  currentIndex: number;

  // Player controls
  play: () => Promise<void>;
  pause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;

  // Queue management
  addToQueue: (song: SaavnSong) => Promise<void>;
  playNow: (song: SaavnSong) => Promise<void>;
  clearQueue: () => Promise<void>;
  shufflePlay: (songs: SaavnSong[]) => Promise<void>;
  playInOrder: (songs: SaavnSong[]) => Promise<void>;

  // State updaters
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  updateFromTrackPlayer: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0,
      queue: [],
      currentIndex: 0,

      play: async () => {
        try {
          await TrackPlayer.play();
          set({ isPlaying: true });
        } catch (e) {
          console.warn("Failed to play:", e);
        }
      },

      pause: async () => {
        try {
          await TrackPlayer.pause();
          set({ isPlaying: false });
        } catch (e) {
          console.warn("Failed to pause:", e);
        }
      },

      skipToNext: async () => {
        try {
          await TrackPlayer.skipToNext();
          get().updateFromTrackPlayer();
        } catch (e) {
          console.warn("Failed to skip to next:", e);
        }
      },

      skipToPrevious: async () => {
        try {
          await TrackPlayer.skipToPrevious();
          get().updateFromTrackPlayer();
        } catch (e) {
          console.warn("Failed to skip to previous:", e);
        }
      },

      seekTo: async (position: number) => {
        try {
          await TrackPlayer.seekTo(position);
          set({ position });
        } catch (e) {
          console.warn("Failed to seek:", e);
        }
      },

      addToQueue: async (song: SaavnSong) => {
        try {
          const bestUrl = getBestAvailableUrl(song);
          if (!bestUrl) return;

          const track: Track = {
            id: song.id,
            url: bestUrl,
            title: song.name,
            artist: song.primaryArtists,
            artwork: song.image,
            album: song.album,
            duration: song.duration,
          };

          await TrackPlayer.add(track);
          const newQueue = await TrackPlayer.getQueue();
          set({ queue: newQueue });
        } catch (e) {
          console.warn("Failed to add to queue:", e);
        }
      },

      playNow: async (song: SaavnSong) => {
        try {
          const bestUrl = getBestAvailableUrl(song);
          if (!bestUrl) return;

          const track: Track = {
            id: song.id,
            url: bestUrl,
            title: song.name,
            artist: song.primaryArtists,
            artwork: song.image,
            album: song.album,
            duration: song.duration,
          };

          await TrackPlayer.reset();
          await TrackPlayer.add(track);
          await TrackPlayer.play();

          set({
            currentTrack: track,
            isPlaying: true,
            queue: [track],
            currentIndex: 0,
          });

          // Track play count
          await incrementPlayAndMaybeCache(song);
        } catch (e) {
          console.warn("Failed to play now:", e);
        }
      },

      clearQueue: async () => {
        try {
          await TrackPlayer.reset();
          set({
            queue: [],
            currentIndex: 0,
            currentTrack: null,
            isPlaying: false,
          });
        } catch (e) {
          console.warn("Failed to clear queue:", e);
        }
      },

      shufflePlay: async (songs: SaavnSong[]) => {
        try {
          if (songs.length === 0) return;

          // Shuffle the songs array
          const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);

          const tracks: Track[] = [];

          for (const song of shuffledSongs) {
            const bestUrl = getBestAvailableUrl(song);
            if (bestUrl) {
              tracks.push({
                id: song.id,
                url: bestUrl,
                title: song.name,
                artist: song.primaryArtists,
                artwork: song.image,
                album: song.album,
                duration: song.duration,
              });
            }
          }

          if (tracks.length === 0) return;

          await TrackPlayer.reset();
          await TrackPlayer.add(tracks);
          await TrackPlayer.play();

          set({
            queue: tracks,
            currentIndex: 0,
            currentTrack: tracks[0],
            isPlaying: true,
          });

          // Track play count for first song
          await incrementPlayAndMaybeCache(shuffledSongs[0]);
        } catch (e) {
          console.warn("Failed to shuffle play:", e);
        }
      },

      playInOrder: async (songs: SaavnSong[]) => {
        try {
          if (songs.length === 0) return;

          const tracks: Track[] = [];

          for (const song of songs) {
            const bestUrl = getBestAvailableUrl(song);
            if (bestUrl) {
              tracks.push({
                id: song.id,
                url: bestUrl,
                title: song.name,
                artist: song.primaryArtists,
                artwork: song.image,
                album: song.album,
                duration: song.duration,
              });
            }
          }

          if (tracks.length === 0) return;

          await TrackPlayer.reset();
          await TrackPlayer.add(tracks);
          await TrackPlayer.play();

          set({
            queue: tracks,
            currentIndex: 0,
            currentTrack: tracks[0],
            isPlaying: true,
          });

          // Track play count for first song
          await incrementPlayAndMaybeCache(songs[0]);
        } catch (e) {
          console.warn("Failed to play in order:", e);
        }
      },

      setCurrentTrack: (track: Track | null) => set({ currentTrack: track }),
      setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
      setPosition: (position: number) => set({ position }),
      setDuration: (duration: number) => set({ duration }),

      updateFromTrackPlayer: async () => {
        try {
          // Check if TrackPlayer is properly initialized
          if (!(await TrackPlayer.isServiceRunning())) {
            return;
          }

          const [track, position, duration, queue, currentIndex, state] =
            await Promise.all([
              TrackPlayer.getActiveTrack(),
              TrackPlayer.getPosition(),
              TrackPlayer.getDuration(),
              TrackPlayer.getQueue(),
              TrackPlayer.getActiveTrackIndex(),
              TrackPlayer.getPlaybackState(),
            ]);

          set({
            currentTrack: track || null,
            isPlaying: state.state === State.Playing,
            position,
            duration,
            queue,
            currentIndex: currentIndex || 0,
          });
        } catch (e) {
          console.warn("Failed to update from TrackPlayer:", e);
        }
      },
    }),
    {
      name: "player-store",
      storage: {
        getItem: async (name: string) => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error("Failed to load persisted player store:", error);
            return null;
          }
        },
        setItem: async (name: string, value: any) => {
          try {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error("Failed to persist player store:", error);
          }
        },
        removeItem: async (name: string) => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (error) {
            console.error("Failed to remove persisted player store:", error);
          }
        },
      },
      partialize: (state) => ({
        // Only persist queue and track info, not playback state
        queue: state.queue,
        currentIndex: state.currentIndex,
        currentTrack: state.currentTrack,
        // Don't persist: isPlaying, isLoading, position, duration
      }),
      version: 1,
    }
  )
);
