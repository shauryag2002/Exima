import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function PlayerScreen() {
  const router = useRouter();
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

  if (!currentTrack) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 justify-center items-center">
        <Text className="text-white text-lg">No track selected</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-neutral-700 px-6 py-3 rounded-lg"
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (isLoading) return;
    isPlaying ? pause() : play();
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

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-medium">Now Playing</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-80 h-80 rounded-2xl overflow-hidden shadow-lg">
          {currentTrack.artwork ? (
            <Image
              source={{ uri: currentTrack.artwork }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View className="w-full h-full bg-neutral-800 justify-center items-center">
              <Ionicons name="musical-notes" size={80} color="#666" />
            </View>
          )}
        </View>
      </View>

      {/* Track Info */}
      <View className="px-8 py-4">
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

      {/* Progress Slider */}
      <View className="px-8 py-4">
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
          <Text className="text-neutral-400">{formatTime(position)}</Text>
          <Text className="text-neutral-400">{formatTime(duration || 0)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View className="flex-row items-center justify-center px-8 py-6 gap-8">
        <TouchableOpacity onPress={toggleShuffle}>
          <Ionicons
            name="shuffle"
            size={24}
            color={shuffleEnabled ? "white" : "#666"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={skipToPrevious}>
          <Ionicons name="play-skip-back" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          className="w-16 h-16 bg-white rounded-full justify-center items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <Ionicons name="reload" size={32} color="black" />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={32}
              color="black"
              style={{ marginLeft: isPlaying ? 0 : 2 }}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={skipToNext}>
          <Ionicons name="play-skip-forward" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleRepeat}>
          <Ionicons
            name={getRepeatIcon()}
            size={24}
            color={repeatMode !== "off" ? "white" : "#666"}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
