import { SaavnSong } from "@/services/SongApiService";
import { Image } from "expo-image";
import { useState } from "react";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DraggableSongItemProps {
  song: SaavnSong;
  index: number;
  isCurrentSong: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDragStart?: (index: number) => void;
  onDragEnd?: (fromIndex: number, toIndex: number) => void;
  formatDuration: (seconds?: number) => string;
}

export default function DraggableSongItem({
  song,
  index,
  isCurrentSong,
  onPress,
  onLongPress,
  onDragStart,
  onDragEnd,
  formatDuration,
}: DraggableSongItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleGestureEvent = (event: any) => {
    // Handle drag gesture
    const { translationY } = event.nativeEvent;
    // This is a simplified version - you might want to use react-native-reanimated for smoother animations
  };

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === 4) {
      // GESTURE_STATE_END
      setIsDragging(false);
      // Calculate drop position and call onDragEnd
    }
  };

  return (
    <GestureHandlerRootView>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        enabled={true}
      >
        <View
          className={`flex-row items-center p-4 ${
            isCurrentSong
              ? "bg-blue-500/20"
              : isDragging
                ? "bg-neutral-700"
                : "active:bg-neutral-800"
          }`}
        >
          {/* Drag Handle */}
          <TouchableOpacity
            className="p-2 mr-2"
            onPressIn={() => {
              setIsDragging(true);
              onDragStart?.(index);
            }}
          >
            <Text className="text-neutral-500 text-lg">⋮⋮</Text>
          </TouchableOpacity>

          {/* Song Content */}
          <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            className="flex-1 flex-row items-center"
          >
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
                <Text
                  className="text-neutral-400 text-sm mt-1"
                  numberOfLines={1}
                >
                  {song.primaryArtists}
                </Text>
              )}
            </View>

            {/* Duration */}
            <Text className="text-neutral-400 text-sm ml-2">
              {formatDuration(song.duration)}
            </Text>
          </TouchableOpacity>

          {/* More Options */}
          <TouchableOpacity onPress={onLongPress} className="p-2 ml-2">
            <Text className="text-neutral-400 text-lg">⋯</Text>
          </TouchableOpacity>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}
