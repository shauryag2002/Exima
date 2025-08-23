import { SaavnArtist } from "@/services/SongApiService";
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

export default function ArtistsTab() {
  const { results, isLoading, isLoadingMore, hasMore, loadMore, error } =
    useSearchStore();

  const handleArtistPress = (artist: SaavnArtist) => {
    // TODO: Navigate to artist details page
  };

  const handleLoadMore = () => {
    if (hasMore.artists && !isLoadingMore.artists && !isLoading.artists) {
      loadMore("artists");
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore.artists) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator color="#d4d4d8" />
        <Text className="text-neutral-400 mt-2 text-sm">
          Loading more artists...
        </Text>
      </View>
    );
  };

  if (isLoading.artists && results.artists.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color="#d4d4d8" size="large" />
        <Text className="text-neutral-400 mt-2">Searching artists...</Text>
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
        data={results.artists}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{ paddingBottom: 120 }}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        ItemSeparatorComponent={() => <View className="h-4" />}
        onEndReached={
          hasMore.artists && !isLoadingMore.artists && !isLoading.artists
            ? handleLoadMore
            : undefined
        }
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleArtistPress(item)}
            className="w-[48%] active:opacity-80"
          >
            <View className="bg-neutral-800 rounded-xl p-3 items-center">
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    marginBottom: 8,
                  }}
                  transition={200}
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-neutral-700 justify-center items-center mb-2">
                  <Text className="text-neutral-400 text-xs">No Art</Text>
                </View>
              )}
              <Text
                className="text-neutral-100 font-medium text-sm text-center"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.followerCount && (
                <Text className="text-neutral-400 text-xs mt-1 text-center">
                  {item.followerCount.toLocaleString()} followers
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-16">
            <Text className="text-neutral-500 text-center">
              No artists found
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
