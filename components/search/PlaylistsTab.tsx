import { SaavnPlaylist } from "@/services/SongApiService";
import { useSearchStore } from "@/store/searchStore";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PlaylistsTab() {
  const { results, isLoading, isLoadingMore, hasMore, loadMore, error } =
    useSearchStore();

  const handlePlaylistPress = (playlist: SaavnPlaylist) => {
    router.push(`/playlist/${playlist.id}`);
  };

  const handleLoadMore = () => {
    if (hasMore.playlists && !isLoadingMore.playlists && !isLoading.playlists) {
      loadMore("playlists");
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore.playlists) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator color="#d4d4d8" />
        <Text className="text-neutral-400 mt-2 text-sm">
          Loading more playlists...
        </Text>
      </View>
    );
  };

  if (isLoading.playlists && results.playlists.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color="#d4d4d8" size="large" />
        <Text className="text-neutral-400 mt-2">Searching playlists...</Text>
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
        data={results.playlists}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-800" />}
        onEndReached={
          hasMore.playlists && !isLoadingMore.playlists && !isLoading.playlists
            ? handleLoadMore
            : undefined
        }
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePlaylistPress(item)}
            className="flex-row gap-4 py-4 px-4 active:bg-neutral-800"
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: 64, height: 64, borderRadius: 12 }}
                transition={200}
              />
            ) : (
              <View className="w-16 h-16 rounded-xl bg-neutral-800 justify-center items-center">
                <Text className="text-neutral-400 text-xs">No Art</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-neutral-100 font-medium" numberOfLines={1}>
                {item.name}
              </Text>
              {item.songCount && (
                <Text className="text-neutral-400 text-sm mt-1">
                  {item.songCount} songs
                </Text>
              )}
              {item.followerCount && (
                <Text className="text-neutral-500 text-xs mt-0.5">
                  {item.followerCount.toLocaleString()} followers
                </Text>
              )}
            </View>
            <View className="justify-center items-end">
              <TouchableOpacity className="w-10 h-10 rounded-full bg-neutral-700 justify-center items-center">
                <Text className="text-neutral-300 text-sm">▶</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-16">
            <Text className="text-neutral-500 text-center">
              No playlists found
            </Text>
            <Text className="text-neutral-600 text-sm text-center mt-1">
              Try searching with different keywords
            </Text>
          </View>
        }
      />
    </View>
  );
}
