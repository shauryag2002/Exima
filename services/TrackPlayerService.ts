import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
} from "react-native-track-player";

export const DefaultRepeatMode = RepeatMode.Queue;
export const DefaultAudioServiceBehaviour =
  AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification;

// Store reference to player store to avoid circular dependency
let playerStoreRef: any = null;

export const setPlayerStoreRef = (store: any) => {
  playerStoreRef = store;
};

export const setupPlayer = async () => {
  try {
    if (await TrackPlayer.isServiceRunning()) {
      return;
    }
    await TrackPlayer.setupPlayer({ autoHandleInterruptions: true });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: DefaultAudioServiceBehaviour,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.JumpBackward,
        Capability.JumpForward,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 1,
    });
    await TrackPlayer.setRepeatMode(DefaultRepeatMode);
  } catch (error) {
    console.error("Error setting up player:", error);
    throw error;
  }
};

const TrackPlayerService = async () => {
  try {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => {
      TrackPlayer.skipToNext();
      // Trigger recommendation check when user skips
      if (playerStoreRef) {
        playerStoreRef.getState().checkAndLoadRecommendations();
      }
    });
    TrackPlayer.addEventListener(Event.RemotePrevious, () =>
      TrackPlayer.skipToPrevious()
    );
    TrackPlayer.addEventListener(Event.RemoteSeek, (data) => {
      TrackPlayer.seekTo(data.position);
    });

    // Listen for track changes to update store and check recommendations
    TrackPlayer.addEventListener(
      Event.PlaybackActiveTrackChanged,
      async (data) => {
        if (playerStoreRef) {
          await playerStoreRef.getState().updateFromTrackPlayer();
          // Check if we need to load recommendations
          playerStoreRef.getState().checkAndLoadRecommendations();
        }
      }
    );

    // Listen for playback state changes
    TrackPlayer.addEventListener(Event.PlaybackState, async (data) => {
      if (playerStoreRef) {
        const store = playerStoreRef.getState();

        // Update playing state
        store.setIsPlaying(data.state === State.Playing);

        // If a song ended naturally and we're near the end of queue, load recommendations
        if (data.state === State.Ended || data.state === State.Ready) {
          store.checkAndLoadRecommendations();
        }
      }
    });

    // Listen for queue ended event
    TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (data) => {
      if (playerStoreRef) {
        const store = playerStoreRef.getState();
        const currentTrack = await TrackPlayer.getActiveTrack();

        if (currentTrack && store.autoRecommendationsEnabled) {
          const currentSong = {
            id: currentTrack.id || "",
            name: currentTrack.title || "",
            primaryArtists: currentTrack.artist,
            album: currentTrack.album,
            image: currentTrack.artwork,
            duration: currentTrack.duration,
          };
          await store.loadRecommendations(currentSong);
        }
      }
    });
  } catch (error) {
    console.error("Error in TrackPlayerService:", error);
  }
};

export default TrackPlayerService;
