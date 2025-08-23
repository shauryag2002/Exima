import {
  SaavnSong,
  incrementPlayAndMaybeCache,
} from "@/services/SongApiService";
import TrackPlayer, { State, Track } from "react-native-track-player";
import { create } from "zustand";

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

  // State updaters
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  updateFromTrackPlayer: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  queue: [],
  currentIndex: 0,

  play: async () => {
    set({ isLoading: true });
    try {
      await TrackPlayer.play();
      set({ isPlaying: true });
    } finally {
      set({ isLoading: false });
    }
  },

  pause: async () => {
    await TrackPlayer.pause();
    set({ isPlaying: false });
  },

  skipToNext: async () => {
    try {
      await TrackPlayer.skipToNext();
      await get().updateFromTrackPlayer();
    } catch (e) {
      console.warn("Skip to next failed:", e);
    }
  },

  skipToPrevious: async () => {
    try {
      await TrackPlayer.skipToPrevious();
      await get().updateFromTrackPlayer();
    } catch (e) {
      console.warn("Skip to previous failed:", e);
    }
  },

  seekTo: async (position: number) => {
    await TrackPlayer.seekTo(position);
    set({ position });
  },

  addToQueue: async (song: SaavnSong) => {
    const track: Track = {
      id: song.id,
      url: song.downloadUrl || "",
      title: song.name,
      artist: song.primaryArtists,
      album: song.album,
      artwork: song.image,
    };
    await TrackPlayer.add(track);
    const queue = await TrackPlayer.getQueue();
    set({ queue });
  },

  playNow: async (song: SaavnSong) => {
    set({ isLoading: true });
    try {
      await TrackPlayer.reset();
      await incrementPlayAndMaybeCache(song);

      const track: Track = {
        id: song.id,
        url: song.downloadUrl || "",
        title: song.name,
        artist: song.primaryArtists,
        album: song.album,
        artwork: song.image,
      };

      await TrackPlayer.add(track);
      await TrackPlayer.play();

      set({
        currentTrack: track,
        isPlaying: true,
        queue: [track],
        currentIndex: 0,
      });
    } catch (e) {
      console.warn("Playback error", e);
    } finally {
      set({ isLoading: false });
    }
  },

  clearQueue: async () => {
    await TrackPlayer.reset();
    set({
      queue: [],
      currentTrack: null,
      isPlaying: false,
      currentIndex: 0,
      position: 0,
      duration: 0,
    });
  },

  shufflePlay: async (songs: SaavnSong[]) => {
    if (songs.length === 0) return;

    set({ isLoading: true });
    try {
      await TrackPlayer.reset();

      // Shuffle the songs array
      const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);

      // Convert to tracks and add to queue
      const tracks: Track[] = shuffledSongs.map((song) => ({
        id: song.id,
        url: song.downloadUrl || "",
        title: song.name,
        artist: song.primaryArtists,
        album: song.album,
        artwork: song.image,
      }));

      await TrackPlayer.add(tracks);
      await TrackPlayer.play();

      // Increment play count for first song
      await incrementPlayAndMaybeCache(shuffledSongs[0]);

      set({
        currentTrack: tracks[0],
        isPlaying: true,
        queue: tracks,
        currentIndex: 0,
      });
    } catch (e) {
      console.warn("Shuffle play error", e);
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),

  updateFromTrackPlayer: async () => {
    try {
      const track = await TrackPlayer.getActiveTrack();
      const state = await TrackPlayer.getPlaybackState();
      const position = await TrackPlayer.getPosition();
      const duration = await TrackPlayer.getDuration();
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getActiveTrackIndex();

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
}));
