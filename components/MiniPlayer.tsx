import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to vertical swipes
      return (
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
        Math.abs(gestureState.dy) > 10
      );
    },
    onPanResponderMove: (_, gestureState) => {
      // Optional: Add visual feedback during swipe
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dy, vy } = gestureState;

      // Swipe up to open (negative dy)
      if (dy < -50 || vy < -0.5) {
        if (!isExpanded) {
          setIsExpanded(true);
        }
      }
      // Swipe down to close (positive dy)
      else if (dy > 50 || vy > 0.5) {
        if (isExpanded) {
          setIsExpanded(false);
        }
      }
    },
  });

  // Pan responder for modal content (only for closing)
  const modalPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to downward swipes in expanded mode
      return (
        gestureState.dy > 0 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
      );
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dy, vy } = gestureState;

      // Swipe down to close
      if (dy > 100 || vy > 0.7) {
        setIsExpanded(false);
      }
    },
  });

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

  const handleMiniPlayerPress = () => {
    setIsExpanded(true);
  };

  const handleCloseExpanded = () => {
    setIsExpanded(false);
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* Mini Player */}
      <View className="absolute bottom-20 left-4 right-4 z-50">
        <View {...panResponder.panHandlers}>
          <TouchableOpacity
            onPress={handleMiniPlayerPress}
            activeOpacity={0.95}
            className="bg-neutral-800/95 backdrop-blur-lg border border-neutral-600/50 rounded-xl p-3 shadow-2xl"
          >
            <View className="flex-row items-center">
              {/* Album Art */}
              <View className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-700">
                {currentTrack.artwork ? (
                  <Image
                    source={{ uri: currentTrack.artwork }}
                    className="w-full h-full"
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-neutral-700 items-center justify-center">
                    <Ionicons name="musical-notes" size={20} color="#666" />
                  </View>
                )}
              </View>

              {/* Track Info */}
              <View className="flex-1 mx-3">
                <Text
                  className="text-white font-semibold text-sm"
                  numberOfLines={1}
                >
                  {currentTrack.title}
                </Text>
                <Text
                  className="text-neutral-400 text-xs mt-0.5"
                  numberOfLines={1}
                >
                  {currentTrack.artist}
                </Text>
              </View>

              {/* Play/Pause Button */}
              <Pressable
                onPress={handlePlayPause}
                className={`w-10 h-10 rounded-full bg-white items-center justify-center ${
                  isLoading ? "opacity-70" : ""
                }`}
                disabled={isLoading}
              >
                <Ionicons
                  name={isLoading ? "reload" : isPlaying ? "pause" : "play"}
                  size={20}
                  color="black"
                  style={{ marginLeft: isPlaying ? 0 : 2 }}
                />
              </Pressable>
            </View>

            {/* Progress Bar */}
            <View className="mt-2 h-1 bg-neutral-600 rounded-full overflow-hidden">
              <View
                className="h-full bg-white rounded-full"
                style={{
                  width: `${duration ? (position / duration) * 100 : 0}%`,
                }}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded Player Modal */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseExpanded}
      >
        <View
          className="flex-1 bg-neutral-950"
          style={{ paddingTop: insets.top }}
          {...modalPanResponder.panHandlers}
        >
          {/* Swipe Indicator */}
          <View className="items-center py-2">
            <View className="w-10 h-1 bg-neutral-600 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <TouchableOpacity
              onPress={handleCloseExpanded}
              className="p-2 -ml-2"
            >
              <Ionicons name="chevron-down" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">
              Now Playing
            </Text>
            <TouchableOpacity onPress={openFullPlayer} className="p-2 -mr-2">
              <Ionicons name="ellipsis-horizontal" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View className="flex-1 px-8 py-6">
            {/* Album Art */}
            <View className="flex-1 items-center justify-center">
              <View
                className="bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
                style={{
                  width: Math.min(SCREEN_WIDTH * 0.75, 300),
                  height: Math.min(SCREEN_WIDTH * 0.75, 300),
                }}
              >
                {currentTrack.artwork ? (
                  <Image
                    source={{ uri: currentTrack.artwork }}
                    className="w-full h-full"
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-neutral-800 items-center justify-center">
                    <Ionicons name="musical-notes" size={80} color="#666" />
                  </View>
                )}
              </View>
            </View>

            {/* Track Info */}
            <View className="py-6">
              <Text
                className="text-white text-2xl font-bold text-center"
                numberOfLines={2}
              >
                {currentTrack.title}
              </Text>
              <Text
                className="text-neutral-400 text-lg text-center mt-2"
                numberOfLines={1}
              >
                {currentTrack.artist}
              </Text>
            </View>

            {/* Progress Section */}
            <View className="py-4">
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor="#fff"
                maximumTrackTintColor="#666"
              />
              <View className="flex-row justify-between mt-2">
                <Text className="text-neutral-400 text-sm">
                  {formatTime(position)}
                </Text>
                <Text className="text-neutral-400 text-sm">
                  {formatTime(duration || 0)}
                </Text>
              </View>
            </View>

            {/* Controls */}
            <View className="flex-row items-center justify-center py-6">
              <View className="flex-row items-center justify-between w-full max-w-sm">
                {/* Shuffle */}
                <TouchableOpacity onPress={toggleShuffle} className="p-3">
                  <Ionicons
                    name="shuffle"
                    size={24}
                    color={shuffleEnabled ? "white" : "#666"}
                  />
                </TouchableOpacity>

                {/* Previous */}
                <TouchableOpacity onPress={skipToPrevious} className="p-3">
                  <Ionicons name="play-skip-back" size={32} color="white" />
                </TouchableOpacity>

                {/* Play/Pause */}
                <TouchableOpacity
                  onPress={handlePlayPause}
                  className={`w-16 h-16 bg-white rounded-full items-center justify-center shadow-lg ${
                    isLoading ? "opacity-70" : ""
                  }`}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={isLoading ? "reload" : isPlaying ? "pause" : "play"}
                    size={32}
                    color="black"
                    style={{ marginLeft: isPlaying ? 0 : 3 }}
                  />
                </TouchableOpacity>

                {/* Next */}
                <TouchableOpacity onPress={skipToNext} className="p-3">
                  <Ionicons name="play-skip-forward" size={32} color="white" />
                </TouchableOpacity>

                {/* Repeat */}
                <TouchableOpacity onPress={toggleRepeat} className="p-3">
                  <Ionicons
                    name={getRepeatIcon()}
                    size={24}
                    color={repeatMode !== "off" ? "white" : "#666"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
