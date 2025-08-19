import {
  SaavnService,
  SaavnSong,
  incrementPlayAndMaybeCache,
} from "@/services/SongApiService";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TrackPlayer from "react-native-track-player";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SaavnSong[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function onSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await SaavnService.searchSongs(query.trim());
      setResults(data);
    } catch (e: any) {
      setError(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function playSong(item: SaavnSong) {
    try {
      await TrackPlayer.reset();
      await incrementPlayAndMaybeCache(item);
      await TrackPlayer.add({
        id: item.id,
        url: item.downloadUrl || "",
        title: item.name,
        artist: item.primaryArtists,
        album: item.album,
        artwork: item.image,
      });
      await TrackPlayer.play();
    } catch (e) {
      console.warn("Playback error", e);
    }
  }

  return (
    <View className="flex-1 bg-neutral-900 px-4 pt-12">
      <View className="flex-row items-center mb-4 gap-2">
        <TextInput
          placeholder="Search songs..."
          placeholderTextColor="#6b7280"
          className="flex-1 bg-neutral-800 text-neutral-100 px-4 py-3 rounded-xl border border-neutral-700"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity
          onPress={onSearch}
          className="bg-neutral-700 px-4 py-3 rounded-xl active:opacity-80"
        >
          <Text className="text-neutral-100">Go</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color="#d4d4d8" className="mt-4" />}
      {error && <Text className="text-red-400 mb-2">{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-800" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => playSong(item)}
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
          !loading ? (
            <Text className="text-neutral-500 mt-12 text-center">
              Search for a track
            </Text>
          ) : null
        }
      />
    </View>
  );
}
