import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
} from 'react-native-track-player';

export const DefaultRepeatMode = RepeatMode.Queue;
export const DefaultAudioServiceBehaviour =
  AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification;

export const setupPlayer = async () => {
  try {
    if(await TrackPlayer.isServiceRunning()) {
      return;
    }
      await TrackPlayer.setupPlayer({autoHandleInterruptions: true});

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
      progressUpdateEventInterval: 2,
    });
    await TrackPlayer.setRepeatMode(DefaultRepeatMode);
  } catch (error) {
    console.error('Error setting up player:', error);
    throw error;
  }
};

const TrackPlayerService = async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (data) => {
    TrackPlayer.seekTo(data.position);
  });
};
export default TrackPlayerService;