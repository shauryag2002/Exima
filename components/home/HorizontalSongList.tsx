import { SaavnSong } from "@/services/SongApiService";
import { useBottomSheetStore } from "@/store/bottomSheetStore";
import { usePlayerStore } from "@/store/playerStore";
import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 3; // 3 items per row with padding

interface SongCardProps {
  song: SaavnSong;
  onPress: () => void;
  onLongPress: () => void;
}

const SongCard: React.FC<SongCardProps> = ({ song, onPress, onLongPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      className="mr-3 mb-4"
      style={{ width: ITEM_WIDTH }}
    >
      <View className="bg-neutral-900 rounded-xl p-3">
        {/* Song Image */}
        <View className="aspect-square mb-3 rounded-lg overflow-hidden bg-neutral-800">
          {song.image ? (
            <Image
              source={{ uri: song.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-neutral-800 items-center justify-center">
              <Text className="text-neutral-400 text-2xl">🎵</Text>
            </View>
          )}
        </View>

        {/* Song Info */}
        <Text
          className="text-white text-sm font-semibold mb-1"
          numberOfLines={2}
        >
          {song.name}
        </Text>
        {song.primaryArtists && (
          <Text className="text-neutral-400 text-xs" numberOfLines={1}>
            {song.primaryArtists}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface HorizontalSongListProps {
  title: string;
  songs: SaavnSong[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const HorizontalSongList: React.FC<HorizontalSongListProps> = ({
  title,
  songs,
  isLoading = false,
  onRefresh,
}) => {
  const { playNow } = usePlayerStore();
  const { showBottomSheet } = useBottomSheetStore();

  const handleSongPress = (song: SaavnSong) => {
    playNow(song);
  };

  const handleSongLongPress = (song: SaavnSong) => {
    showBottomSheet(song);
  };

  const renderSong = ({ item, index }: { item: SaavnSong; index: number }) => (
    <SongCard
      song={item}
      onPress={() => handleSongPress(item)}
      onLongPress={() => handleSongLongPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View className="h-32 items-center justify-center">
      <Text className="text-neutral-400 text-sm">
        {isLoading ? "Loading songs..." : "No songs available"}
      </Text>
    </View>
  );

  return (
    <View className="mb-8">
      {/* Section Header */}
      <View className="flex-row items-center justify-between px-6 mb-4">
        <Text className="text-white text-xl font-bold">{title}</Text>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh}>
            <Text className="text-blue-400 text-sm font-medium">Refresh</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Song List */}
      {songs.length > 0 ? (
        <FlatList
          data={songs}
          renderItem={renderSong}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
          }}
          numColumns={1}
          snapToAlignment="start"
          decelerationRate="fast"
          pagingEnabled={false}
          snapToInterval={ITEM_WIDTH + 12} // item width + margin
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};
