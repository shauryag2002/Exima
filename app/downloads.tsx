import DownloadService, { DownloadProgress } from "@/services/DownloadService";
import {
  SaavnSong,
  deleteSong,
  getDownloadProgress,
  getDownloadedSongs,
  isDownloading,
} from "@/services/SongApiService";
import { usePlayerStore } from "@/store/playerStore";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Download progress indicator component
const DownloadProgressIndicator = ({ songId }: { songId: string }) => {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  useEffect(() => {
    const updateProgress = (progressData: DownloadProgress) => {
      if (progressData.songId === songId) {
        setProgress(progressData);
      }
    };

    const unsubscribe = DownloadService.onProgressUpdate(updateProgress);

    // Get initial progress
    const initialProgress = getDownloadProgress(songId);
    if (initialProgress) {
      setProgress(initialProgress);
    }

    return unsubscribe;
  }, [songId]);

  if (!progress || progress.progress >= 1) return null;

  const progressWidth = Math.round(progress.progress * 100);

  return (
    <View className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700">
      <View
        className="h-full bg-blue-500"
        style={{ width: `${progressWidth}%` }}
      />
    </View>
  );
};

export default function DownloadsScreen() {
  const [downloadedSongs, setDownloadedSongs] = useState<SaavnSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { playInOrder } = usePlayerStore();

  const loadDownloadedSongs = useCallback(async () => {
    try {
      // Wait for DownloadService to be initialized
      await DownloadService.waitForInitialization();

      // Force DownloadService to reload from storage first
      await DownloadService.refreshDownloadedSongs();

      // Get Exima downloaded songs only
      const songs = getDownloadedSongs();

      setDownloadedSongs(songs);
    } catch (error) {
      console.error("Error loading downloaded songs:", error);
    }
  }, []);

  useEffect(() => {
    loadDownloadedSongs().finally(() => setIsLoading(false));
  }, [loadDownloadedSongs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDownloadedSongs();
    setRefreshing(false);
  }, [loadDownloadedSongs]);

  const handleSongPress = useCallback(
    (song: SaavnSong, index: number) => {
      // Play from this song onwards
      const songsFromIndex = downloadedSongs.slice(index);
      playInOrder(songsFromIndex);
    },
    [downloadedSongs, playInOrder]
  );

  const handleSongLongPress = useCallback(
    (song: SaavnSong) => {
      const confirmDelete = () => {
        Alert.alert(
          "Delete Download",
          `Are you sure you want to delete "${song.name}" from your downloads?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  await deleteSong(song.id);
                  await loadDownloadedSongs();
                } catch (error) {
                  Alert.alert("Error", "Failed to delete song");
                }
              },
            },
          ]
        );
      };

      Alert.alert(
        "Song Options",
        `What would you like to do with "${song.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Play",
            onPress: () => {
              const index = downloadedSongs.findIndex((s) => s.id === song.id);
              handleSongPress(song, index);
            },
          },
          {
            text: "Delete Download",
            style: "destructive",
            onPress: confirmDelete,
          },
        ]
      );
    },
    [downloadedSongs, handleSongPress, loadDownloadedSongs]
  );

  const formatDuration = useCallback((seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }, []);

  const renderSong = useCallback(
    ({ item, index }: { item: SaavnSong; index: number }) => {
      const isCurrentlyDownloading = isDownloading(item.id);

      return (
        <TouchableOpacity
          onPress={() => handleSongPress(item, index)}
          onLongPress={() => handleSongLongPress(item)}
          className="flex-row gap-4 py-3 px-4 active:bg-neutral-800 relative"
          disabled={isCurrentlyDownloading}
        >
          <View className="w-14 h-14 rounded-xl bg-neutral-800 justify-center items-center relative">
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: 56, height: 56, borderRadius: 12 }}
                transition={200}
              />
            ) : (
              <View className="w-full h-full rounded-xl bg-neutral-800 items-center justify-center">
                <Text className="text-neutral-400 text-lg">🎵</Text>
              </View>
            )}

            {isCurrentlyDownloading && (
              <View className="absolute inset-0 bg-black/50 rounded-xl justify-center items-center">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-neutral-100 font-medium" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-neutral-400 text-sm mt-1" numberOfLines={1}>
              {item.primaryArtists}
            </Text>
            <View className="flex-row items-center mt-1">
              {item.duration && (
                <Text className="text-neutral-500 text-xs">
                  {formatDuration(item.duration)}
                </Text>
              )}
              <Text className="text-neutral-500 text-xs mx-1">•</Text>
              <Text className="text-blue-400 text-xs">Downloaded</Text>
            </View>
          </View>

          <View className="justify-center">
            <Text className="text-neutral-500 text-xs">♪</Text>
          </View>

          {isCurrentlyDownloading && (
            <DownloadProgressIndicator songId={item.id} />
          )}
        </TouchableOpacity>
      );
    },
    [handleSongPress, handleSongLongPress, formatDuration]
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-6xl mb-4">📱</Text>
      <Text className="text-neutral-100 text-xl font-semibold mb-2 text-center">
        No Downloads Yet
      </Text>
      <Text className="text-neutral-400 text-center leading-6">
        Songs you download will appear here.{"\n"}
        Enable Smart Caching in settings to auto-download frequently played
        songs.
      </Text>

      {/* Debug info */}
      <View className="mt-4 p-3 bg-neutral-800 rounded-lg">
        <Text className="text-neutral-300 text-xs text-center">
          Debug: Checking for downloads...{"\n"}
          Total storage: {formatFileSize(DownloadService.getTotalStorageUsed())}
        </Text>
      </View>

      <View className="flex-row gap-3 mt-6">
        <TouchableOpacity
          className="flex-1 bg-blue-500 px-6 py-3 rounded-xl"
          onPress={() => router.push("/search")}
        >
          <Text className="text-white font-semibold text-center">
            Discover Music
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-green-600 px-6 py-3 rounded-xl"
          onPress={async () => {
            try {
              // Test download with a sample song
              const testSong = {
                id: "test-123",
                name: "Test Song",
                primaryArtists: "Test Artist",
                downloadUrl:
                  "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
              };
              Alert.alert("Testing", "Attempting test download...");
              await DownloadService.downloadSong(testSong as any);
              await loadDownloadedSongs();
            } catch (error) {
              Alert.alert("Test Failed", String(error));
            }
          }}
        >
          <Text className="text-white font-semibold text-center">
            Test Download
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-neutral-400 mt-4">Loading downloads...</Text>
      </View>
    );
  }

  const songsCount = downloadedSongs.length;
  const storageUsed = formatFileSize(DownloadService.getTotalStorageUsed());

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Header */}
      <View className="px-6 pt-16 pb-4">
        <Text className="text-3xl font-bold text-white">Downloads</Text>
        <Text className="text-neutral-400 text-base mt-1">
          Your offline music collection
        </Text>
      </View>

      {songsCount === 0 ? (
        renderEmptyState()
      ) : (
        <View className="flex-1">
          {/* Header Stats */}
          <View className="px-4 py-3 border-b border-neutral-800">
            <Text className="text-neutral-100 font-semibold">
              {songsCount} song{songsCount !== 1 ? "s" : ""} downloaded
            </Text>
            <Text className="text-neutral-400 text-sm">
              Storage: {storageUsed}
            </Text>
          </View>

          <FlatList
            data={downloadedSongs}
            keyExtractor={(item) => item.id}
            renderItem={renderSong}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#3b82f6"
                colors={["#3b82f6"]}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        </View>
      )}
    </View>
  );
}
