import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  Dimensions,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const MINI_PLAYER_HEIGHT = 70;
const TAB_BAR_HEIGHT = 80;
const SNAP_THRESHOLD = 0.3;

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    isPlaying,
    isLoading,
    position,
    duration,
    play,
    pause,
    skipToNext,
    skipToPrevious,
    seekTo,
  } = usePlayerStore();

  const { shuffleEnabled, repeatMode, setShuffleEnabled, setRepeatMode } =
    useSettingsStore();

  const translateY = useSharedValue(0);
  const gestureActive = useSharedValue(false);
  const expansionProgress = useSharedValue(0);

  const playerState = useDerivedValue(() => {
    if (expansionProgress.value > 0.8) return "expanded";
    if (expansionProgress.value > 0.2) return "expanding";
    return "collapsed";
  });

  // Calculate the maximum expansion height (from bottom tab to top safe area)
  const maxExpandedHeight = SCREEN_HEIGHT - TAB_BAR_HEIGHT - insets.top;
  const maxTranslateY = maxExpandedHeight - MINI_PLAYER_HEIGHT - 650;

  const handlePlayPause = useCallback(() => {
    if (isLoading) return;
    isPlaying ? pause() : play();
  }, [isLoading, isPlaying, pause, play]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (value: number) => {
    seekTo(value);
  };

  const toggleShuffle = () => {
    setShuffleEnabled(!shuffleEnabled);
  };

  const toggleRepeat = () => {
    const modes = ["off", "queue", "track"] as const;
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case "track":
        return "repeat-outline";
      case "queue":
        return "repeat";
      default:
        return "repeat";
    }
  };

  const openFullPlayer = useCallback(() => {
    router.push("/player");
  }, []);

  const expandPlayer = useCallback(() => {
    "worklet";
    translateY.value = withSpring(maxTranslateY, {
      damping: 50,
      stiffness: 300,
    });
  }, [translateY, maxTranslateY]);

  const collapsePlayer = useCallback(() => {
    "worklet";
    translateY.value = withSpring(0, {
      damping: 50,
      stiffness: 300,
    });
  }, [translateY]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureActive.value = true;
    })
    .onUpdate((event) => {
      const newTranslateY = Math.max(
        maxTranslateY,
        Math.min(0, event.translationY + translateY.value)
      );
      translateY.value = newTranslateY;
    })
    .onEnd((event) => {
      gestureActive.value = false;
      const progress = Math.abs(translateY.value) / Math.abs(maxTranslateY);

      if (event.velocityY > 500) {
        // Fast swipe down - collapse
        collapsePlayer();
      } else if (event.velocityY < -500) {
        // Fast swipe up - expand
        expandPlayer();
      } else if (progress > SNAP_THRESHOLD) {
        // Crossed threshold - expand
        expandPlayer();
      } else {
        // Below threshold - collapse
        collapsePlayer();
      }
    });
  const isExpanded = useDerivedValue(() => {
    return Math.abs(translateY.value) > Math.abs(maxTranslateY) * 0.5;
  });
  const tapGesture = Gesture.Tap().onEnd(() => {
    const isExpanded =
      Math.abs(translateY.value) > Math.abs(maxTranslateY) * 0.5;
    if (!isExpanded) {
      expandPlayer();
    }
  });

  const combinedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateY.value) / Math.abs(maxTranslateY);

    return {
      transform: [{ translateY: translateY.value }],
      height: interpolate(
        progress,
        [0, 1],
        [MINI_PLAYER_HEIGHT, maxExpandedHeight],
        Extrapolation.CLAMP
      ),
    };
  });

  const miniPlayerStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateY.value) / Math.abs(maxTranslateY);

    return {
      opacity: interpolate(progress, [0, 0.3], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(progress, [0, 0.3], [1, 0.8], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const expandedPlayerStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateY.value) / Math.abs(maxTranslateY);

    return {
      opacity: interpolate(progress, [0.2, 0.5], [0, 1], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(
            progress,
            [0, 1],
            [50, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const artworkStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateY.value) / Math.abs(maxTranslateY);

    return {
      width: interpolate(
        progress,
        [0, 1],
        [40, Math.min(SCREEN_WIDTH * 0.7, 280)],
        Extrapolation.CLAMP
      ),
      height: interpolate(
        progress,
        [0, 1],
        [40, Math.min(SCREEN_WIDTH * 0.7, 280)],
        Extrapolation.CLAMP
      ),
      borderRadius: interpolate(progress, [0, 1], [8, 20], Extrapolation.CLAMP),
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateY.value) / Math.abs(maxTranslateY);

    return {
      backgroundColor: `rgba(23, 23, 23, ${interpolate(
        progress,
        [0, 0.5],
        [0, 0.95],
        Extrapolation.CLAMP
      )})`,
    };
  });

  if (!currentTrack) return null;

  return (
    <GestureHandlerRootView
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      {/* Main player container */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: TAB_BAR_HEIGHT,
            left: 16,
            right: 16,
            backgroundColor: "rgba(38, 38, 38, 0.95)",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(64, 64, 64, 0.5)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            overflow: "hidden",
          },
          animatedStyle,
        ]}
      >
        <GestureDetector gesture={combinedGesture}>
          <View style={{ flex: 1 }}>
            {/* Drag Indicator */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 8,
                  left: "50%",
                  marginLeft: -20,
                  width: 40,
                  height: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  borderRadius: 2,
                  zIndex: 1000,
                },
                expandedPlayerStyle,
              ]}
            />

            {/* Mini Player View */}
            <Animated.View
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  height: MINI_PLAYER_HEIGHT,
                },
                miniPlayerStyle,
              ]}
            >
              {currentTrack.artwork && (
                <Animated.Image
                  source={{ uri: currentTrack.artwork }}
                  style={[
                    {
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                    },
                    artworkStyle,
                  ]}
                />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{ color: "white", fontWeight: "600", fontSize: 14 }}
                  numberOfLines={1}
                >
                  {currentTrack.title}
                </Text>
                <Text
                  style={{ color: "#a3a3a3", fontSize: 12, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {currentTrack.artist}
                </Text>
              </View>
              <Pressable
                onPress={handlePlayPause}
                style={{
                  padding: 8,
                  opacity: isLoading ? 0.7 : 1,
                }}
                disabled={isLoading}
              >
                <Ionicons
                  name={isLoading ? "reload" : isPlaying ? "pause" : "play"}
                  size={24}
                  color="white"
                />
              </Pressable>
            </Animated.View>

            {/* Expanded Player View */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: maxExpandedHeight,
                  paddingTop: 20,
                  paddingBottom: 20,
                  paddingHorizontal: 20,
                },
                expandedPlayerStyle,
              ]}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                  paddingTop: 10,
                }}
              >
                <TouchableOpacity onPress={collapsePlayer}>
                  <Ionicons name="chevron-down" size={28} color="white" />
                </TouchableOpacity>
                <Text
                  style={{ color: "white", fontSize: 18, fontWeight: "500" }}
                >
                  Now Playing
                </Text>
                <TouchableOpacity onPress={openFullPlayer}>
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={28}
                    color="white"
                  />
                </TouchableOpacity>
              </View>

              {/* Album Art */}
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  minHeight: 200,
                }}
              >
                <Animated.View
                  style={[
                    {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                      elevation: 16,
                    },
                    artworkStyle,
                  ]}
                >
                  {currentTrack.artwork ? (
                    <Image
                      source={{ uri: currentTrack.artwork }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 20,
                      }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#262626",
                        borderRadius: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="musical-notes" size={60} color="#666" />
                    </View>
                  )}
                </Animated.View>
              </View>

              {/* Track Info */}
              <View style={{ paddingVertical: 16 }}>
                <Text
                  style={{
                    color: "white",
                    fontSize: 22,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                  numberOfLines={2}
                >
                  {currentTrack.title}
                </Text>
                <Text
                  style={{
                    color: "#a3a3a3",
                    fontSize: 16,
                    textAlign: "center",
                    marginTop: 6,
                  }}
                  numberOfLines={1}
                >
                  {currentTrack.artist}
                </Text>
              </View>

              {/* Progress Slider */}
              <View style={{ paddingVertical: 12, zIndex: 10000 }}>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={duration || 1}
                  value={position}
                  onSlidingComplete={handleSeek}
                  minimumTrackTintColor="#fff"
                  maximumTrackTintColor="#666"
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 6,
                  }}
                >
                  <Text style={{ color: "#a3a3a3", fontSize: 12 }}>
                    {formatTime(position)}
                  </Text>
                  <Text style={{ color: "#a3a3a3", fontSize: 12 }}>
                    {formatTime(duration || 0)}
                  </Text>
                </View>
              </View>

              {/* Controls */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 16,
                  gap: 24,
                }}
              >
                <TouchableOpacity onPress={toggleShuffle}>
                  <Ionicons
                    name="shuffle"
                    size={22}
                    color={shuffleEnabled ? "white" : "#666"}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={skipToPrevious}>
                  <Ionicons name="play-skip-back" size={28} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePlayPause}
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: "white",
                    borderRadius: 28,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={isLoading ? "reload" : isPlaying ? "pause" : "play"}
                    size={28}
                    color="black"
                    style={{ marginLeft: isPlaying ? 0 : 2 }}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={skipToNext}>
                  <Ionicons name="play-skip-forward" size={28} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleRepeat}>
                  <Ionicons
                    name={getRepeatIcon()}
                    size={22}
                    color={repeatMode !== "off" ? "white" : "#666"}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </GestureDetector>
      </Animated.View>
    </GestureHandlerRootView>
  );
}
