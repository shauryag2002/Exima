import { SaavnSong } from "@/services/SongApiService";
import { Image } from "expo-image";
import React from "react";
import { Alert, AlertButton, Text, TouchableOpacity, View } from "react-native";

interface ReorderableSongItemProps {
  song: SaavnSong;
  index: number;
  isCurrentSong?: boolean;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  onAddToQueue?: () => void;
  formatDuration?: (seconds?: number) => string;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  showTrackNumber?: boolean;
  showRemove?: boolean;
}

export default function ReorderableSongItem({
  song,
  index,
  isCurrentSong = false,
  onPress,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAddToQueue,
  formatDuration,
  canMoveUp = false,
  canMoveDown = false,
  showTrackNumber = false,
  showRemove = false,
}: ReorderableSongItemProps) {
  const defaultFormatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOptionsPress = () => {
    const options: AlertButton[] = [{ text: "Cancel", style: "cancel" }];

    if (onAddToQueue) {
      options.splice(-1, 0, { text: "Add to Queue", onPress: onAddToQueue });
    }

    if (onRemove && showRemove) {
      options.splice(-1, 0, {
        text: "Remove",
        style: "destructive",
        onPress: onRemove,
      });
    }

    if (canMoveUp && onMoveUp) {
      options.splice(-1, 0, { text: "Move Up", onPress: onMoveUp });
    }

    if (canMoveDown && onMoveDown) {
      options.splice(-1, 0, { text: "Move Down", onPress: onMoveDown });
    }

    Alert.alert(
      "Song Options",
      `What would you like to do with "${song.name}"?`,
      options
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center p-4 ${
        isCurrentSong ? "bg-blue-500/20" : "active:bg-neutral-800"
      }`}
    >
      {/* Track Number */}
      {showTrackNumber && (
        <View className="w-8 items-center mr-3">
          <Text
            className={`text-sm ${isCurrentSong ? "text-blue-500" : "text-neutral-400"}`}
          >
            {(index + 1).toString().padStart(2, "0")}
          </Text>
        </View>
      )}

      {/* Song Artwork */}
      {song.image ? (
        <Image
          source={{ uri: song.image }}
          style={{ width: 48, height: 48, borderRadius: 8 }}
          transition={200}
        />
      ) : (
        <View className="w-12 h-12 rounded-lg bg-neutral-800 justify-center items-center">
          <Text className="text-neutral-400 text-xs">♪</Text>
        </View>
      )}

      {/* Song Info */}
      <View className="flex-1 ml-3">
        <Text
          className={`text-base font-medium ${
            isCurrentSong ? "text-blue-500" : "text-neutral-100"
          }`}
          numberOfLines={1}
        >
          {song.name}
        </Text>
        {song.primaryArtists && (
          <Text className="text-neutral-400 text-sm mt-1" numberOfLines={1}>
            {song.primaryArtists}
          </Text>
        )}
      </View>

      {/* Duration */}
      <Text className="text-neutral-400 text-sm ml-2">
        {(formatDuration || defaultFormatDuration)(song.duration)}
      </Text>

      {/* Reorder Controls */}
      {(canMoveUp || canMoveDown) && (
        <View className="flex-col ml-2">
          <TouchableOpacity
            onPress={onMoveUp}
            disabled={!canMoveUp}
            className={`p-1 ${!canMoveUp ? "opacity-30" : ""}`}
          >
            <Text className="text-neutral-400 text-xs">▲</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMoveDown}
            disabled={!canMoveDown}
            className={`p-1 ${!canMoveDown ? "opacity-30" : ""}`}
          >
            <Text className="text-neutral-400 text-xs">▼</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* More Options */}
      <TouchableOpacity onPress={handleOptionsPress} className="p-2 ml-2">
        <Text className="text-neutral-400 text-lg">⋯</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
