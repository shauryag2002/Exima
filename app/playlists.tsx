import { Playlist, usePlaylistStore } from "@/store/playlistStore";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PlaylistsScreen() {
  const { playlists, createPlaylist, deletePlaylist } = usePlaylistStore();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    await createPlaylist(newPlaylistName.trim(), newPlaylistDescription.trim());
    setNewPlaylistName("");
    setNewPlaylistDescription("");
    setIsCreateModalVisible(false);
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deletePlaylist(playlist.id),
        },
      ]
    );
  };

  const renderPlaylist = ({ item }: { item: Playlist }) => (
    <TouchableOpacity className="bg-neutral-900 rounded-xl p-4 mb-3 active:bg-neutral-800">
      <View className="flex-row items-center">
        {/* Playlist Cover */}
        <View className="w-16 h-16 rounded-lg bg-neutral-800 justify-center items-center mr-4">
          {item.songs.length > 0 && item.songs[0].image ? (
            <Image
              source={{ uri: item.songs[0].image }}
              style={{ width: 64, height: 64, borderRadius: 8 }}
            />
          ) : (
            <Text className="text-neutral-400 text-2xl">🎵</Text>
          )}
        </View>

        {/* Playlist Info */}
        <View className="flex-1">
          <Text
            className="text-neutral-100 text-lg font-semibold"
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text className="text-neutral-400 text-sm mt-1">
            {item.songs.length} song{item.songs.length !== 1 ? "s" : ""}
          </Text>
          {item.description && (
            <Text className="text-neutral-500 text-xs mt-1" numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={() => handleDeletePlaylist(item)}
          className="p-2"
        >
          <Text className="text-red-400 text-lg">⋯</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Header */}
      <View className="flex-row items-center justify-between pt-16 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-neutral-300 text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-neutral-100 text-xl font-semibold">
          My Playlists
        </Text>
        <TouchableOpacity onPress={() => setIsCreateModalVisible(true)}>
          <Text className="text-blue-400 text-2xl">+</Text>
        </TouchableOpacity>
      </View>

      {/* Playlists List */}
      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        renderItem={renderPlaylist}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-32">
            <Text className="text-6xl mb-4">🎵</Text>
            <Text className="text-neutral-400 text-lg font-medium">
              No playlists yet
            </Text>
            <Text className="text-neutral-500 text-sm text-center mt-2 px-8">
              Create your first playlist to organize your favorite songs
            </Text>
            <TouchableOpacity
              onPress={() => setIsCreateModalVisible(true)}
              className="bg-blue-500 px-6 py-3 rounded-xl mt-6"
            >
              <Text className="text-white font-semibold">Create Playlist</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create Playlist Modal */}
      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-neutral-900 rounded-t-3xl p-6">
            <Text className="text-neutral-100 text-xl font-semibold mb-6 text-center">
              Create New Playlist
            </Text>

            <TextInput
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              placeholder="Playlist name"
              placeholderTextColor="#737373"
              className="bg-neutral-800 text-neutral-100 px-4 py-3 rounded-xl mb-4"
              autoFocus
            />

            <TextInput
              value={newPlaylistDescription}
              onChangeText={setNewPlaylistDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#737373"
              className="bg-neutral-800 text-neutral-100 px-4 py-3 rounded-xl mb-6"
              multiline
              numberOfLines={3}
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setIsCreateModalVisible(false)}
                className="flex-1 bg-neutral-800 py-3 rounded-xl"
              >
                <Text className="text-neutral-300 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreatePlaylist}
                className="flex-1 bg-blue-500 py-3 rounded-xl"
                disabled={!newPlaylistName.trim()}
              >
                <Text className="text-white text-center font-semibold">
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
