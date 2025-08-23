import { SaavnSong } from "@/services/SongApiService";
import { useBottomSheetStore } from "@/store/bottomSheetStore";
import { usePlayerStore } from "@/store/playerStore";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DownloadedSongsTab() {
  const [downloadedSongs, setDownloadedSongs] = useState<SaavnSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playNow } = usePlayerStore();
  const { showBottomSheet } = useBottomSheetStore();

  useEffect(() => {
    loadDownloadedSongs();
  }, []);

  const loadDownloadedSongs = async () => {
    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setIsLoading(false);
        return;
      }

      // Get downloaded audio files
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: "audio",
        first: 1000,
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      // Convert MediaLibrary assets to SaavnSong format
      const songs: SaavnSong[] = assets.assets.map((asset, index) => ({
        id: asset.id,
        name: asset.filename.replace(/\.[^/.]+$/, ""), // Remove file extension
        primaryArtists: "Local Artist", // Default since we can't extract from filename
        duration: asset.duration,
        // We'll use a placeholder image since local files don't have images
        image: undefined,
        downloadUrl: asset.uri,
      }));

      setDownloadedSongs(songs);
    } catch (error) {
      console.error("Error loading downloaded songs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongPress = (song: SaavnSong) => {
    playNow(song);
  };

  const handleSongLongPress = (song: SaavnSong) => {
    showBottomSheet(song);
  };

  const renderSong = ({ item }: { item: SaavnSong }) => (
    <TouchableOpacity
      onPress={() => handleSongPress(item)}
      onLongPress={() => handleSongLongPress(item)}
      className="flex-row gap-4 py-3 px-4 active:bg-neutral-800"
    >
      {/* Song Image */}
      <View className="w-14 h-14 rounded-xl bg-neutral-800 justify-center items-center">
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: 56, height: 56, borderRadius: 12 }}
            transition={200}
          />
        ) : (
          <Text className="text-neutral-400 text-lg">🎵</Text>
        )}
      </View>

      {/* Song Info */}
      <View className="flex-1">
        <Text className="text-neutral-100 font-medium" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-neutral-400 text-sm mt-1" numberOfLines={1}>
          {item.primaryArtists}
        </Text>
        {item.duration && (
          <Text className="text-neutral-500 text-xs mt-0.5">
            {Math.floor(item.duration / 60)}:
            {(item.duration % 60).toString().padStart(2, "0")}
          </Text>
        )}
      </View>

      {/* Download Indicator */}
      <View className="justify-center items-center">
        <View className="w-6 h-6 rounded-full bg-green-500/20 justify-center items-center">
          <Text className="text-green-400 text-xs">✓</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color="#d4d4d8" size="large" />
        <Text className="text-neutral-400 mt-2">Loading downloads...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={downloadedSongs}
        keyExtractor={(item) => item.id}
        renderItem={renderSong}
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-800" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-16">
            <Text className="text-6xl mb-4">📱</Text>
            <Text className="text-neutral-500 text-center text-lg">
              No downloads found
            </Text>
            <Text className="text-neutral-600 text-sm text-center mt-2">
              Downloaded songs will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}
