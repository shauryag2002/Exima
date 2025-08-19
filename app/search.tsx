import { SaavnSong } from "@/services/SongApiService";
import { usePlayerStore } from "@/store/playerStore";
import { useSearchStore } from "@/store/searchStore";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router/build/hooks";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SearchScreen() {
  const {
    query,
    results,
    isLoading,
    error,
    setQuery,
    searchSongs,
    clearResults,
  } = useSearchStore();
  const params: { query?: string } = useLocalSearchParams();

  const { playNow } = usePlayerStore();

  useEffect(() => {
    console.log("Search params:", params);
    if (params.query) {
      setQuery(params.query as string);
      searchSongs(params.query as string);
    }
  }, [params.query, setQuery, searchSongs]);

  // Clear results when component unmounts
  useEffect(() => {
    return () => clearResults();
  }, [clearResults]);

  const handleSearch = () => {
    searchSongs(query);
  };

  const handlePlaySong = async (song: SaavnSong) => {
    await playNow(song);
  };

  return (
    <View className="flex-1 bg-neutral-900 px-4 pt-12">
      <View className="flex-row items-center mb-4 gap-2">
        <TextInput
          placeholder="Search songs..."
          placeholderTextColor="#6b7280"
          className="flex-1 bg-neutral-800 text-neutral-100 px-4 py-3 rounded-xl border border-neutral-700"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity
          onPress={handleSearch}
          className="bg-neutral-700 px-4 py-3 rounded-xl active:opacity-80"
        >
          <Text className="text-neutral-100">Go</Text>
        </TouchableOpacity>
      </View>
      {isLoading && <ActivityIndicator color="#d4d4d8" className="mt-4" />}
      {error && <Text className="text-red-400 mb-2">{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-800" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePlaySong(item)}
            className="flex-row gap-4 py-3"
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: 56, height: 56, borderRadius: 12 }}
              />
            ) : (
              <View className="w-14 h-14 rounded-xl bg-neutral-800 justify-center items-center">
                <Text className="text-neutral-400 text-xs">No Art</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-neutral-100" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-neutral-400 text-xs mt-1" numberOfLines={1}>
                {item.primaryArtists}
              </Text>
            </View>
            <View className="justify-center items-end">
              <Text className="text-neutral-500 text-xs">Play</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text className="text-neutral-500 mt-12 text-center">
              Search for a track
            </Text>
          ) : null
        }
      />
    </View>
  );
}
