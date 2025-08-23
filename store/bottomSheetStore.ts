import { SaavnSong } from "@/services/SongApiService";
import { create } from "zustand";

export interface BottomSheetAction {
  id: string;
  title: string;
  icon?: string;
  action: (song: SaavnSong) => void;
}

interface BottomSheetState {
  // Bottom sheet state
  isVisible: boolean;
  selectedSong: SaavnSong | null;
  actions: BottomSheetAction[];

  // Actions
  showBottomSheet: (song: SaavnSong, actions?: BottomSheetAction[]) => void;
  hideBottomSheet: () => void;
  setActions: (actions: BottomSheetAction[]) => void;
}

// Default actions that can be used for songs
export const defaultSongActions: BottomSheetAction[] = [
  {
    id: "play",
    title: "Play Now",
    icon: "▶️",
    action: (song) => {
      // This will be implemented when needed
      console.log("Play song:", song.name);
    },
  },
  {
    id: "add-to-queue",
    title: "Add to Queue",
    icon: "📝",
    action: (song) => {
      console.log("Add to queue:", song.name);
    },
  },
  {
    id: "add-to-playlist",
    title: "Add to Playlist",
    icon: "➕",
    action: (song) => {
      console.log("Add to playlist:", song.name);
    },
  },
  {
    id: "download",
    title: "Download",
    icon: "⬇️",
    action: (song) => {
      console.log("Download song:", song.name);
    },
  },
  {
    id: "share",
    title: "Share",
    icon: "📤",
    action: (song) => {
      console.log("Share song:", song.name);
    },
  },
];

export const useBottomSheetStore = create<BottomSheetState>((set) => ({
  isVisible: false,
  selectedSong: null,
  actions: defaultSongActions,

  showBottomSheet: (song, actions) => {
    set({
      isVisible: true,
      selectedSong: song,
      actions: actions || defaultSongActions,
    });
  },

  hideBottomSheet: () => {
    set({
      isVisible: false,
      selectedSong: null,
    });
  },

  setActions: (actions) => {
    set({ actions });
  },
}));
