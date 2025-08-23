import { SaavnAlbum } from "@/services/SongApiService";
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

export default function AlbumsTab() {
  const { results, isLoading, isLoadingMore, hasMore, loadMore, error } =
    useSearchStore();

  const handleAlbumPress = (album: SaavnAlbum) => {
    // TODO: Navigate to album details page
    console.log("Navigate to album:", album.name);
  };

  const handleLoadMore = () => {
    if (hasMore.albums && !isLoadingMore.albums && !isLoading.albums) {
      console.log("Loading more albums...");
      loadMore("albums");
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore.albums) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator color="#d4d4d8" />
        <Text className="text-neutral-400 mt-2 text-sm">
          Loading more albums...
        </Text>
      </View>
    );
  };

  if (isLoading.albums && results.albums.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color="#d4d4d8" size="large" />
        <Text className="text-neutral-400 mt-2">Searching albums...</Text>
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
        data={results.albums}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{ paddingBottom: 120 }}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        ItemSeparatorComponent={() => <View className="h-4" />}
        onEndReached={
          hasMore.albums && !isLoadingMore.albums && !isLoading.albums
            ? handleLoadMore
            : undefined
        }
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleAlbumPress(item)}
            className="w-[48%] active:opacity-80"
          >
            <View className="bg-neutral-800 rounded-xl p-3">
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={{
                    width: "100%",
                    aspectRatio: 1,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                  transition={200}
                />
              ) : (
                <View className="w-full aspect-square rounded-lg bg-neutral-700 justify-center items-center mb-2">
                  <Text className="text-neutral-400 text-xs">No Art</Text>
                </View>
              )}
              <Text
                className="text-neutral-100 font-medium text-sm"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text className="text-neutral-400 text-xs mt-1" numberOfLines={1}>
                {item.primaryArtists}
              </Text>
              {item.year && (
                <Text className="text-neutral-500 text-xs mt-0.5">
                  {item.year}
                </Text>
              )}
              {item.songCount && (
                <Text className="text-neutral-500 text-xs mt-0.5">
                  {item.songCount} songs
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-16">
            <Text className="text-neutral-500 text-center">
              No albums found
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
