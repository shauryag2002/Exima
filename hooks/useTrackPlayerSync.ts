import { usePlayerStore } from "@/store/playerStore";
import { useEffect } from "react";
import TrackPlayer, {
  Event,
  useTrackPlayerEvents,
} from "react-native-track-player";

const events = [
  Event.PlaybackState,
  Event.PlaybackActiveTrackChanged,
  Event.PlaybackProgressUpdated,
];

export function useTrackPlayerSync() {
  const {
    setIsPlaying,
    setCurrentTrack,
    setPosition,
    setDuration,
    updateFromTrackPlayer,
    checkAndLoadRecommendations,
  } = usePlayerStore();

  useTrackPlayerEvents(events, async (event) => {
    switch (event.type) {
      case Event.PlaybackState:
        setIsPlaying(event.state === "playing");
        break;

      case Event.PlaybackActiveTrackChanged:
        if (event.track) {
          setCurrentTrack(event.track);
          // Check for recommendations when track changes
          checkAndLoadRecommendations();
        }
        break;

      case Event.PlaybackProgressUpdated:
        setPosition(event.position);
        setDuration(event.duration || 0);
        break;
    }
  });

  // Initial sync when hook mounts - only if TrackPlayer is running
  useEffect(() => {
    const initSync = async () => {
      try {
        if (await TrackPlayer.isServiceRunning()) {
          updateFromTrackPlayer();
        }
      } catch (error) {
        // Silent fail - TrackPlayer may not be initialized yet
      }
    };

    initSync();
  }, [updateFromTrackPlayer]);
}
