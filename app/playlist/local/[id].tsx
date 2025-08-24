import ReorderableSongItem from "@/components/ReorderableSongItem";
import { SaavnSong } from "@/services/SongApiService";
import { usePlayerStore } from "@/store/playerStore";
import { Playlist, usePlaylistStore } from "@/store/playlistStore";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LocalPlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlaylist, updatePlaylist, removeSongFromPlaylist } =
    usePlaylistStore();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState("");

  const { addToQueue, shufflePlay, playInOrder, currentTrack } =
    usePlayerStore();

  useEffect(() => {
    if (id) {
      const foundPlaylist = getPlaylist(id);
      if (foundPlaylist) {
        setPlaylist(foundPlaylist);
        setEditName(foundPlaylist.name);
        setEditDescription(foundPlaylist.description || "");
      }
    }
  }, [id, getPlaylist]);

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
    const song = playlist.songs[songIndex];

    Alert.alert(
      "Remove Song",
      `Are you sure you want to remove "${song.name}" from the playlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeSongFromPlaylist(playlist.id, song.id);
            // Update local state
            const updatedPlaylist = getPlaylist(playlist.id);
            if (updatedPlaylist) {
              setPlaylist(updatedPlaylist);
            }
          },
        },
      ]
    );
  };

  const handleMoveSongUp = (index: number) => {
    if (!playlist || index <= 0) return;

    const newSongs = [...playlist.songs];
    [newSongs[index - 1], newSongs[index]] = [
      newSongs[index],
      newSongs[index - 1],
    ];

    updatePlaylist(playlist.id, { songs: newSongs });
    const updatedPlaylist = getPlaylist(playlist.id);
    if (updatedPlaylist) {
      setPlaylist(updatedPlaylist);
    }
  };

  const handleMoveSongDown = (index: number) => {
    if (!playlist || index >= playlist.songs.length - 1) return;

    const newSongs = [...playlist.songs];
    [newSongs[index], newSongs[index + 1]] = [
      newSongs[index + 1],
      newSongs[index],
    ];

    updatePlaylist(playlist.id, { songs: newSongs });
    const updatedPlaylist = getPlaylist(playlist.id);
    if (updatedPlaylist) {
      setPlaylist(updatedPlaylist);
    }
  };

  const handleSaveName = () => {
    if (playlist && editName.trim()) {
      updatePlaylist(playlist.id, { name: editName.trim() });
      const updatedPlaylist = getPlaylist(playlist.id);
      if (updatedPlaylist) {
        setPlaylist(updatedPlaylist);
      }
    }
    setIsEditingName(false);
  };

  const handleSaveDescription = () => {
    if (playlist) {
      updatePlaylist(playlist.id, { description: editDescription.trim() });
      const updatedPlaylist = getPlaylist(playlist.id);
      if (updatedPlaylist) {
        setPlaylist(updatedPlaylist);
      }
    }
    setIsEditingDescription(false);
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

    return (
      <TouchableOpacity
        onPress={() => handleSongPress(item, index)}
        className={`flex-row items-center p-4 ${
          isCurrentSong ? "bg-blue-500/20" : "active:bg-neutral-800"
        }`}
      >
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

  if (!playlist) {
    return (
      <View className="flex-1 bg-neutral-950 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-neutral-400 mt-4">Loading playlist...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-950">
      <FlatList
        data={playlist.songs}
        keyExtractor={(song, index) => `${song.id}-${index}`}
        renderItem={({ item: song, index }) => (
          <ReorderableSongItem
            song={song}
            index={index}
            showTrackNumber={true}
            onPress={() => handleSongPress(song, index)}
            onMoveUp={() => handleMoveSongUp(index)}
            onMoveDown={() => handleMoveSongDown(index)}
            onAddToQueue={() => handleAddToQueue(song)}
            onRemove={() => handleRemoveFromPlaylist(index)}
            canMoveUp={index > 0}
            canMoveDown={index < playlist.songs.length - 1}
            showRemove={true}
          />
        )}
      />
      {/* Edit Name Modal */}
      <Modal
        visible={isEditingName}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditingName(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-neutral-900 rounded-2xl p-6">
            <Text className="text-neutral-100 text-xl font-semibold mb-4 text-center">
              Edit Playlist Name
            </Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Playlist name"
              placeholderTextColor="#737373"
              className="bg-neutral-800 text-neutral-100 px-4 py-3 rounded-xl mb-6"
              autoFocus
            />
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setIsEditingName(false)}
                className="flex-1 bg-neutral-800 py-3 rounded-xl"
              >
                <Text className="text-neutral-300 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveName}
                className="flex-1 bg-blue-500 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Edit Description Modal */}
      <Modal
        visible={isEditingDescription}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditingDescription(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-neutral-900 rounded-2xl p-6">
            <Text className="text-neutral-100 text-xl font-semibold mb-4 text-center">
              Edit Description
            </Text>
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Playlist description"
              placeholderTextColor="#737373"
              className="bg-neutral-800 text-neutral-100 px-4 py-3 rounded-xl mb-6"
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setIsEditingDescription(false)}
                className="flex-1 bg-neutral-800 py-3 rounded-xl"
              >
                <Text className="text-neutral-300 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveDescription}
                className="flex-1 bg-blue-500 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
