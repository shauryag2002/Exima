import { SaavnSong } from "@/services/SongApiService";
import { useBottomSheetStore } from "@/store/bottomSheetStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSearchStore } from "@/store/searchStore";
import { Image } from "expo-image";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SongsTab() {
  const { results, isLoading, isLoadingMore, hasMore, loadMore, error } =
    useSearchStore();
  const { playNow } = usePlayerStore();
  const { showBottomSheet } = useBottomSheetStore();

  const handlePlaySong = async (song: SaavnSong) => {
    await playNow(song);
  };

  const handleSongOptions = (song: SaavnSong) => {
    // This will be implemented when bottom sheet UI is added
    showBottomSheet(song);
  };

  const handleLoadMore = () => {
    if (hasMore.songs && !isLoadingMore.songs && !isLoading.songs) {
      loadMore("songs");
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore.songs) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator color="#d4d4d8" />
        <Text className="text-neutral-400 mt-2 text-sm">
          Loading more songs...
        </Text>
      </View>
    );
  };

  if (isLoading.songs && results.songs.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color="#d4d4d8" size="large" />
        <Text className="text-neutral-400 mt-2">Searching songs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-red-400 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={results.songs}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-800" />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={4}
        ListFooterComponent={renderFooter}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePlaySong(item)}
            className="flex-row gap-4 py-3 px-4 active:bg-neutral-800"
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: 56, height: 56, borderRadius: 12 }}
                transition={200}
              />
            ) : (
              <View className="w-14 h-14 rounded-xl bg-neutral-800 justify-center items-center">
                <Text className="text-neutral-400 text-xs">No Art</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-neutral-100 font-medium" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-neutral-400 text-sm mt-1" numberOfLines={1}>
                {item.primaryArtists}
              </Text>
              {item.album && (
                <Text
                  className="text-neutral-500 text-xs mt-0.5"
                  numberOfLines={1}
                >
                  {item.album}
                </Text>
              )}
            </View>
            <View className="justify-center items-end flex-row gap-2">
              <TouchableOpacity
                onPress={() => handlePlaySong(item)}
                className="w-8 h-8 rounded-full bg-neutral-700 justify-center items-center"
              >
                <Text className="text-neutral-300 text-xs">▶</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleSongOptions(item);
                }}
                className="w-8 h-8 rounded-full bg-neutral-700 justify-center items-center"
              >
                <Text className="text-neutral-300 text-xs">⋯</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-16">
            <Text className="text-neutral-500 text-center">No songs found</Text>
            <Text className="text-neutral-600 text-sm text-center mt-1">
              Try searching with different keywords
            </Text>
          </View>
        }
      />
    </View>
  );
}
