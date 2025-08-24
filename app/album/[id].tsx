import { OfflineIndicator } from "@/components/NetworkStatus";
import {
  SaavnAlbum,
  SaavnSong,
  getAlbumDetailsOffline,
  isOffline,
} from "@/services/SongApiService";
import { usePlayerStore } from "@/store/playerStore";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AlbumDetails extends SaavnAlbum {
  songs: SaavnSong[];
  description?: string;
  releaseDate?: string;
  genre?: string;
}

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    playNow,
    addToQueue,
    shufflePlay,
    playInOrder,
    queue,
    currentTrack,
    isPlaying,
  } = usePlayerStore();

  useEffect(() => {
    if (id) {
      fetchAlbumDetails(id);
    }
  }, [id]);

  const fetchAlbumDetails = async (albumId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Use offline-compatible function
      const result = await getAlbumDetailsOffline(albumId);

      if (result) {
        const albumDetails: AlbumDetails = {
          ...result.album,
          songs: result.songs,
        };
        setAlbum(albumDetails);
      } else {
        // Show different error message based on network status
        const errorMessage = isOffline()
          ? "No downloaded songs found for this album. Download some songs when online to access them offline."
          : "Album not found";
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = isOffline()
        ? "Failed to load offline album details"
        : "Failed to load album details";
      setError(errorMessage);
      console.error("Album fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (album?.songs && album.songs.length > 0) {
      playInOrder(album.songs);
    }
  };

  const handleShuffle = () => {
    if (album?.songs && album.songs.length > 0) {
      const shuffledSongs = [...album.songs].sort(() => Math.random() - 0.5);
      shufflePlay(shuffledSongs);
    }
  };

  const handleSongPress = (song: SaavnSong, index: number) => {
    if (album?.songs) {
      // Play from this song onwards
      const songsFromIndex = album.songs.slice(index);
      playInOrder(songsFromIndex);
    }
  };

  const handleAddToQueue = (song: SaavnSong) => {
    addToQueue(song);
    Alert.alert(
      "Added to Queue",
      `"${song.name}" has been added to your queue.`
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderSongItem = ({
    item,
    index,
  }: {
    item: SaavnSong;
    index: number;
  }) => {
    const isCurrentSong = currentTrack?.id === item.id;

    return (
      <TouchableOpacity
        onPress={() => handleSongPress(item, index)}
        onLongPress={() => handleAddToQueue(item)}
        className={`flex-row items-center p-4 ${
          isCurrentSong ? "bg-blue-500/20" : "active:bg-neutral-800"
        }`}
      >
        {/* Track Number */}
        <View className="w-8 items-center mr-3">
          {isCurrentSong && isPlaying ? (
            <View className="flex-row space-x-1">
              <View className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" />
              <View
                className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
              <View
                className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              />
            </View>
          ) : (
            <Text
              className={`text-sm ${isCurrentSong ? "text-blue-500" : "text-neutral-400"}`}
            >
              {(index + 1).toString().padStart(2, "0")}
            </Text>
          )}
        </View>

        {/* Song Info */}
        <View className="flex-1">
          <Text
            className={`text-base font-medium ${
              isCurrentSong ? "text-blue-500" : "text-neutral-100"
            }`}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.primaryArtists && (
            <Text className="text-neutral-400 text-sm mt-1" numberOfLines={1}>
              {item.primaryArtists}
            </Text>
          )}
        </View>

        {/* Duration */}
        <Text className="text-neutral-400 text-sm ml-2">
          {formatDuration(item.duration)}
        </Text>

        {/* More Options */}
        <TouchableOpacity
          onPress={() => handleAddToQueue(item)}
          className="p-2 ml-2"
        >
          <Text className="text-neutral-400 text-lg">⋯</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-neutral-950 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-neutral-400 mt-4">Loading album...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral-950 justify-center items-center px-6">
        <Text className="text-red-400 text-lg text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={() => id && fetchAlbumDetails(id)}
          className="bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!album) {
    return (
      <View className="flex-1 bg-neutral-950 justify-center items-center">
        <Text className="text-neutral-400">Album not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-950">
      <FlatList
        data={album.songs}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderSongItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            {/* Header with back button */}
            <View className="flex-row items-center justify-between pt-16 pb-4 px-6">
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-neutral-300 text-2xl">‹</Text>
              </TouchableOpacity>
              <OfflineIndicator />
              <TouchableOpacity>
                <Text className="text-neutral-300 text-2xl">⋯</Text>
              </TouchableOpacity>
            </View>

            {/* Album Cover and Info */}
            <View className="items-center px-6 pb-8">
              {album.image ? (
                <Image
                  source={{ uri: album.image }}
                  style={{ width: 280, height: 280, borderRadius: 16 }}
                  transition={300}
                />
              ) : (
                <View className="w-70 h-70 rounded-2xl bg-neutral-800 justify-center items-center">
                  <Text className="text-neutral-400 text-4xl">🎵</Text>
                </View>
              )}

              <Text className="text-neutral-100 text-2xl font-bold mt-6 text-center">
                {album.name}
              </Text>

              {album.primaryArtists && (
                <Text className="text-neutral-300 text-lg mt-2 text-center">
                  {album.primaryArtists}
                </Text>
              )}

              <View className="flex-row items-center space-x-4 mt-3">
                {album.year && (
                  <Text className="text-neutral-400 text-sm">{album.year}</Text>
                )}
                {album.songCount && (
                  <Text className="text-neutral-400 text-sm">
                    {album.songCount} songs
                  </Text>
                )}
              </View>

              {/* Offline mode note */}
              {isOffline() && (
                <Text className="text-orange-400 text-xs mt-2 text-center px-4">
                  Showing downloaded songs only (Offline Mode)
                </Text>
              )}

              {album.description && (
                <Text className="text-neutral-400 text-sm mt-3 text-center px-4">
                  {album.description}
                </Text>
              )}
            </View>

            {/* Control Buttons */}
            <View className="flex-row justify-center space-x-4 px-6 pb-6">
              <TouchableOpacity
                onPress={handlePlayAll}
                className="flex-1 bg-blue-500 py-4 rounded-full items-center"
                disabled={!album.songs || album.songs.length === 0}
              >
                <Text className="text-white font-semibold text-lg">
                  Play All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShuffle}
                className="bg-neutral-800 px-6 py-4 rounded-full items-center"
                disabled={!album.songs || album.songs.length === 0}
              >
                <Text className="text-neutral-100 font-semibold">🔀</Text>
              </TouchableOpacity>
            </View>

            {/* Songs Header */}
            {album.songs && album.songs.length > 0 && (
              <View className="px-6 pb-4">
                <Text className="text-neutral-100 text-lg font-semibold">
                  Songs
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-16">
            <Text className="text-neutral-400 text-lg">No songs available</Text>
            <Text className="text-neutral-500 text-sm mt-2">
              This album doesn&apos;t have any songs yet
            </Text>
          </View>
        }
      />
    </View>
  );
}
