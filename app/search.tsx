import TabBarView from "@/components/TabBarView";
import { useSearchStore } from "@/store/searchStore";
import { useLocalSearchParams } from "expo-router/build/hooks";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SearchScreen() {
  const { query, isLoading, error, setQuery, searchAll, clearResults } =
    useSearchStore();
  const params: { query?: string } = useLocalSearchParams();

  useEffect(() => {
    if (params.query) {
      setQuery(params.query as string);
      searchAll(params.query as string);
    }
  }, [params.query, setQuery, searchAll]);

  // Clear results when component unmounts
  useEffect(() => {
    return () => clearResults();
  }, [clearResults]);

  const handleSearch = () => {
    if (query.trim()) {
      searchAll(query);
    }
  };

  const isAnyLoading =
    isLoading.songs ||
    isLoading.albums ||
    isLoading.playlists ||
    isLoading.artists;

  return (
    <View className="flex-1 bg-neutral-900">
      {/* Search Header */}
      <View className="px-4 pt-12 pb-4 bg-neutral-900 border-b border-neutral-800">
        <View className="flex-row items-center gap-3">
          <TextInput
            placeholder="Search songs, albums, playlists, artists..."
            placeholderTextColor="#6b7280"
            className="flex-1 bg-neutral-800 text-neutral-100 px-4 py-3 rounded-xl border border-neutral-700 text-base"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          <TouchableOpacity
            onPress={handleSearch}
            disabled={!query.trim() || isAnyLoading}
            className={`px-5 py-3 rounded-xl ${
              query.trim() && !isAnyLoading
                ? "bg-blue-600 active:bg-blue-700"
                : "bg-neutral-700"
            }`}
          >
            {isAnyLoading ? (
              <ActivityIndicator color="#d4d4d8" size="small" />
            ) : (
              <Text
                className={`font-medium ${
                  query.trim() && !isAnyLoading
                    ? "text-white"
                    : "text-neutral-400"
                }`}
              >
                Go
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {error && (
          <View className="mt-3 bg-red-900/20 border border-red-800 rounded-lg p-3">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}
      </View>

      {/* Tab Content */}
      <View className="flex-1">
        {query.trim() ? (
          <TabBarView />
        ) : (
          <View className="flex-1 justify-center items-center px-6">
            <View className="items-center">
              <Text className="text-6xl mb-4">🎵</Text>
              <Text className="text-neutral-100 text-xl font-semibold mb-2 text-center">
                Search for Music
              </Text>
              <Text className="text-neutral-400 text-center leading-6">
                Find your favorite songs, albums, playlists, and artists
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
