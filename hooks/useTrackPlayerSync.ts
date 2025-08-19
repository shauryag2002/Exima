import { usePlayerStore } from "@/store/playerStore";
import { useEffect } from "react";
import { Event, useTrackPlayerEvents } from "react-native-track-player";

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
  } = usePlayerStore();

  useTrackPlayerEvents(events, async (event) => {
    switch (event.type) {
      case Event.PlaybackState:
        setIsPlaying(event.state === "playing");
        break;

      case Event.PlaybackActiveTrackChanged:
        if (event.track) {
          setCurrentTrack(event.track);
        }
        break;

      case Event.PlaybackProgressUpdated:
        setPosition(event.position);
        setDuration(event.duration || 0);
        break;
    }
  });

  // Initial sync when hook mounts
  useEffect(() => {
    updateFromTrackPlayer();
  }, [updateFromTrackPlayer]);
}
