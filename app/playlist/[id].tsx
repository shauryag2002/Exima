import {
  SaavnPlaylist,
  SaavnSong,
  getPlaylistDetails,
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

interface PlaylistDetails extends SaavnPlaylist {
  songs: SaavnSong[];
  description?: string;
  createdBy?: string;
  isPublic?: boolean;
}

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedSongIndex, setDraggedSongIndex] = useState<number | null>(null);

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
      fetchPlaylistDetails(id);
    }
  }, [id]);

  const fetchPlaylistDetails = async (playlistId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPlaylistDetails(playlistId);

      if (result) {
        const playlistDetails: PlaylistDetails = {
          ...result.playlist,
          songs: result.songs,
        };
        setPlaylist(playlistDetails);
      } else {
        setError("Playlist not found");
      }
    } catch (err) {
      setError("Failed to load playlist details");
      console.error("Playlist fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (playlist?.songs && playlist.songs.length > 0) {
      playInOrder(playlist.songs);
    }
  };

  const handleShuffle = () => {
    if (playlist?.songs && playlist.songs.length > 0) {
      const shuffledSongs = [...playlist.songs].sort(() => Math.random() - 0.5);
      shufflePlay(shuffledSongs);
    }
  };

  const handleSongPress = (song: SaavnSong, index: number) => {
    if (playlist?.songs) {
      // Play from this song onwards
      const songsFromIndex = playlist.songs.slice(index);
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

  const handleRemoveFromPlaylist = (songIndex: number) => {
    if (!playlist) return;

    Alert.alert(
      "Remove Song",
      "Are you sure you want to remove this song from the playlist?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const updatedSongs = playlist.songs.filter(
              (_, index) => index !== songIndex
            );
            setPlaylist({
              ...playlist,
              songs: updatedSongs,
              songCount: updatedSongs.length,
            });
          },
        },
      ]
    );
  };

  const handleReorderSongs = (fromIndex: number, toIndex: number) => {
    if (!playlist || fromIndex === toIndex) return;

    const updatedSongs = [...playlist.songs];
    const [movedSong] = updatedSongs.splice(fromIndex, 1);
    updatedSongs.splice(toIndex, 0, movedSong);

    setPlaylist({
      ...playlist,
      songs: updatedSongs,
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalDuration = () => {
    if (!playlist?.songs) return "0:00";
    const totalSeconds = playlist.songs.reduce(
      (sum, song) => sum + (song.duration || 0),
      0
    );
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderSongItem = ({
    item,
    index,
  }: {
    item: SaavnSong;
    index: number;
  }) => {
    const isCurrentSong = currentTrack?.id === item.id;
    const isDragged = draggedSongIndex === index;

    return (
      <TouchableOpacity
        onPress={() => handleSongPress(item, index)}
        onLongPress={() => {
          // Start drag mode
          setDraggedSongIndex(index);
        }}
        className={`flex-row items-center p-4 ${
          isCurrentSong
            ? "bg-blue-500/20"
            : isDragged
              ? "bg-neutral-700"
              : "active:bg-neutral-800"
        }`}
      >
        {/* Drag Handle */}
        <TouchableOpacity className="p-2 mr-2">
          <Text className="text-neutral-500 text-lg">⋮⋮</Text>
        </TouchableOpacity>

        {/* Song Artwork */}
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: 48, height: 48, borderRadius: 8 }}
            transition={200}
          />
        ) : (
          <View className="w-12 h-12 rounded-lg bg-neutral-800 justify-center items-center">
            <Text className="text-neutral-400 text-xs">♪</Text>
          </View>
        )}

        {/* Song Info */}
        <View className="flex-1 ml-3">
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
          onPress={() => {
            Alert.alert(
              "Song Options",
              `What would you like to do with "${item.name}"?`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Add to Queue", onPress: () => handleAddToQueue(item) },
                {
                  text: "Remove from Playlist",
                  style: "destructive",
                  onPress: () => handleRemoveFromPlaylist(index),
                },
              ]
            );
          }}
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
        <Text className="text-neutral-400 mt-4">Loading playlist...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral-950 justify-center items-center px-6">
        <Text className="text-red-400 text-lg text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={() => id && fetchPlaylistDetails(id)}
          className="bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!playlist) {
    return (
      <View className="flex-1 bg-neutral-950 justify-center items-center">
        <Text className="text-neutral-400">Playlist not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-950">
      <FlatList
        data={playlist.songs}
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
              <TouchableOpacity>
                <Text className="text-neutral-300 text-2xl">⋯</Text>
              </TouchableOpacity>
            </View>

            {/* Playlist Cover and Info */}
            <View className="items-center px-6 pb-8">
              {playlist.image ? (
                <Image
                  source={{ uri: playlist.image }}
                  style={{ width: 280, height: 280, borderRadius: 16 }}
                  transition={300}
                />
              ) : (
                <View className="w-70 h-70 rounded-2xl bg-neutral-800 justify-center items-center">
                  <Text className="text-neutral-400 text-4xl">📋</Text>
                </View>
              )}

              <Text className="text-neutral-100 text-2xl font-bold mt-6 text-center">
                {playlist.name}
              </Text>

              {playlist.createdBy && (
                <Text className="text-neutral-300 text-lg mt-2 text-center">
                  by {playlist.createdBy}
                </Text>
              )}

              <View className="flex-row items-center space-x-4 mt-3">
                {playlist.songCount && (
                  <Text className="text-neutral-400 text-sm">
                    {playlist.songCount} songs
                  </Text>
                )}
                <Text className="text-neutral-400 text-sm">
                  {getTotalDuration()}
                </Text>
                {playlist.followerCount && (
                  <Text className="text-neutral-400 text-sm">
                    {playlist.followerCount.toLocaleString()} followers
                  </Text>
                )}
              </View>

              {playlist.description && (
                <Text className="text-neutral-400 text-sm mt-3 text-center px-4">
                  {playlist.description}
                </Text>
              )}
            </View>

            {/* Control Buttons */}
            <View className="flex-row justify-center space-x-4 px-6 pb-6">
              <TouchableOpacity
                onPress={handlePlayAll}
                className="flex-1 bg-blue-500 py-4 rounded-full items-center"
                disabled={!playlist.songs || playlist.songs.length === 0}
              >
                <Text className="text-white font-semibold text-lg">
                  Play All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShuffle}
                className="bg-neutral-800 px-6 py-4 rounded-full items-center"
                disabled={!playlist.songs || playlist.songs.length === 0}
              >
                <Text className="text-neutral-100 font-semibold">🔀</Text>
              </TouchableOpacity>
            </View>

            {/* Songs Header */}
            {playlist.songs && playlist.songs.length > 0 && (
              <View className="px-6 pb-4">
                <Text className="text-neutral-100 text-lg font-semibold">
                  Songs
                </Text>
                <Text className="text-neutral-400 text-sm mt-1">
                  Long press and drag to reorder songs
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-16">
            <Text className="text-neutral-400 text-lg">
              No songs in this playlist
            </Text>
            <Text className="text-neutral-500 text-sm mt-2">
              Add some songs to get started
            </Text>
          </View>
        }
      />
    </View>
  );
}
