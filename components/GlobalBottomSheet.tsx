import {
  downloadSong,
  isDownloaded,
  isDownloading,
} from "@/services/SongApiService";
import { useBottomSheetStore } from "@/store/bottomSheetStore";
import { usePlayerStore } from "@/store/playerStore";
import { usePlaylistStore } from "@/store/playlistStore";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function GlobalBottomSheet() {
  const { isVisible, selectedSong, hideBottomSheet } = useBottomSheetStore();
  const { playNow, addToQueue } = usePlayerStore();
  const { playlists, addSongToPlaylist } = usePlaylistStore();
  const [isDownloadingState, setIsDownloadingState] = useState(false);

  const handlePlayNow = () => {
    if (selectedSong) {
      playNow(selectedSong);
      hideBottomSheet();
    }
  };

  const handleAddToQueue = () => {
    if (selectedSong) {
      addToQueue(selectedSong);
      hideBottomSheet();
    }
  };

  const handleDownload = async () => {
    if (selectedSong) {
      try {
        setIsDownloadingState(true);
        await downloadSong(selectedSong);
        Alert.alert("Success", selectedSong.name + " has been downloaded!");
      } catch (error) {
        console.error("Download failed:", error);
        Alert.alert(
          "Download Failed",
          "Could not download " + selectedSong.name + ". Please try again."
        );
      } finally {
        setIsDownloadingState(false);
        hideBottomSheet();
      }
    }
  };

  const handleShare = () => {
    if (selectedSong) {
      console.log("Share song:", selectedSong.name);
      hideBottomSheet();
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (selectedSong) {
      addSongToPlaylist(playlistId, selectedSong);
      hideBottomSheet();
    }
  };

  if (!selectedSong) {
    return null;
  }

  const songIsDownloaded = isDownloaded(selectedSong.id);
  const songIsDownloading =
    isDownloading(selectedSong.id) || isDownloadingState;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={hideBottomSheet}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={hideBottomSheet}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View className="bg-neutral-900 rounded-t-3xl p-6">
            {/* Song Info */}
            <View className="flex-row items-center mb-6">
              <View className="w-16 h-16 rounded-xl bg-neutral-800 justify-center items-center mr-4">
                {selectedSong.image ? (
                  <Image
                    source={{ uri: selectedSong.image }}
                    style={{ width: 64, height: 64, borderRadius: 12 }}
                    transition={200}
                  />
                ) : (
                  <Text className="text-neutral-400 text-lg">🎵</Text>
                )}
              </View>
              <View className="flex-1">
                <Text
                  className="text-neutral-100 text-lg font-semibold"
                  numberOfLines={1}
                >
                  {selectedSong.name}
                </Text>
                <Text
                  className="text-neutral-400 text-sm mt-1"
                  numberOfLines={1}
                >
                  {selectedSong.primaryArtists}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="space-y-3">
              <TouchableOpacity
                onPress={handlePlayNow}
                className="flex-row items-center py-4 px-4 bg-neutral-800 rounded-xl"
              >
                <Text className="text-xl mr-4">▶️</Text>
                <Text className="text-neutral-100 text-base font-medium">
                  Play Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddToQueue}
                className="flex-row items-center py-4 px-4 bg-neutral-800 rounded-xl"
              >
                <Text className="text-xl mr-4">📝</Text>
                <Text className="text-neutral-100 text-base font-medium">
                  Add to Queue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDownload}
                disabled={songIsDownloaded || songIsDownloading}
                className={`flex-row items-center py-4 px-4 rounded-xl ${
                  songIsDownloaded
                    ? "bg-green-500/20 border border-green-500"
                    : songIsDownloading
                      ? "bg-blue-500/20 border border-blue-500"
                      : "bg-neutral-800"
                }`}
              >
                {songIsDownloading ? (
                  <ActivityIndicator
                    size="small"
                    color="#3b82f6"
                    style={{ marginRight: 16 }}
                  />
                ) : (
                  <Text className="text-xl mr-4">
                    {songIsDownloaded ? "✅" : "⬇️"}
                  </Text>
                )}
                <Text
                  className={`text-base font-medium ${
                    songIsDownloaded
                      ? "text-green-400"
                      : songIsDownloading
                        ? "text-blue-400"
                        : "text-neutral-100"
                  }`}
                >
                  {songIsDownloaded
                    ? "Downloaded"
                    : songIsDownloading
                      ? "Downloading..."
                      : "Download"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                className="flex-row items-center py-4 px-4 bg-neutral-800 rounded-xl"
              >
                <Text className="text-xl mr-4">📤</Text>
                <Text className="text-neutral-100 text-base font-medium">
                  Share
                </Text>
              </TouchableOpacity>

              {/* Add to Playlist Section */}
              {playlists.length > 0 && (
                <>
                  <View className="border-t border-neutral-700 pt-4 mt-2">
                    <Text className="text-neutral-400 text-sm font-medium mb-3">
                      ADD TO PLAYLIST
                    </Text>
                  </View>

                  {playlists.slice(0, 3).map((playlist) => (
                    <TouchableOpacity
                      key={playlist.id}
                      onPress={() => handleAddToPlaylist(playlist.id)}
                      className="flex-row items-center py-3 px-4 bg-neutral-800 rounded-xl"
                    >
                      <View className="w-10 h-10 rounded-lg bg-neutral-700 justify-center items-center mr-3">
                        <Text className="text-neutral-400 text-sm">🎵</Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-neutral-200 text-base"
                          numberOfLines={1}
                        >
                          {playlist.name}
                        </Text>
                        <Text className="text-neutral-500 text-sm">
                          {playlist.songs.length} song
                          {playlist.songs.length !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
