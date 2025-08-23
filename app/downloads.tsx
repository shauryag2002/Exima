import { SaavnSong } from "@/services/SongApiService";
import { useBottomSheetStore } from "@/store/bottomSheetStore";
import { usePlayerStore } from "@/store/playerStore";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TabBar, TabView } from "react-native-tab-view";

// Inline components to avoid import issues
const DownloadedSongsTab = ({
  onSongsLoaded,
}: {
  onSongsLoaded: (songs: SaavnSong[]) => void;
}) => {
  const [downloadedSongs, setDownloadedSongs] = useState<SaavnSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playNow } = usePlayerStore();
  const { showBottomSheet } = useBottomSheetStore();

  useEffect(() => {
    loadDownloadedSongs();
  }, []);

  const loadDownloadedSongs = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setIsLoading(false);
        return;
      }

      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: "audio",
        first: 1000,
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      const songs: SaavnSong[] = assets.assets.map((asset, index) => ({
        id: asset.id,
        name: asset.filename.replace(/\.[^/.]+$/, ""),
        primaryArtists: "Local Artist",
        duration: asset.duration,
        image: undefined,
        downloadUrl: asset.uri,
      }));

      setDownloadedSongs(songs);
      onSongsLoaded(songs); // Share songs with parent component
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
};

const DownloadedAlbumsTab = () => (
  <View className="flex-1 justify-center items-center">
    <Text className="text-6xl mb-4">💿</Text>
    <Text className="text-neutral-500 text-center text-lg">
      No downloaded albums
    </Text>
    <Text className="text-neutral-600 text-sm text-center mt-2">
      Downloaded albums will appear here
    </Text>
  </View>
);

const DownloadedPlaylistsTab = () => (
  <View className="flex-1 justify-center items-center">
    <Text className="text-6xl mb-4">📋</Text>
    <Text className="text-neutral-500 text-center text-lg">
      No downloaded playlists
    </Text>
    <Text className="text-neutral-600 text-sm text-center mt-2">
      Downloaded playlists will appear here
    </Text>
  </View>
);

const DownloadedArtistsTab = () => (
  <View className="flex-1 justify-center items-center">
    <Text className="text-6xl mb-4">👨‍🎤</Text>
    <Text className="text-neutral-500 text-center text-lg">
      No downloaded artists
    </Text>
    <Text className="text-neutral-600 text-sm text-center mt-2">
      Downloaded artist content will appear here
    </Text>
  </View>
);

const routes = [
  { key: "songs", title: "Songs" },
  { key: "albums", title: "Albums" },
  { key: "playlists", title: "Playlists" },
  { key: "artists", title: "Artists" },
];

export default function DownloadsScreen() {
  const [index, setIndex] = useState(0);
  const [allDownloadedSongs, setAllDownloadedSongs] = useState<SaavnSong[]>([]);
  const { shufflePlay } = usePlayerStore();

  const handleShufflePress = () => {
    if (allDownloadedSongs.length > 0) {
      shufflePlay(allDownloadedSongs);
    }
  };

  const handleSongsLoaded = (songs: SaavnSong[]) => {
    setAllDownloadedSongs(songs);
  };

  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case "songs":
        return <DownloadedSongsTab onSongsLoaded={handleSongsLoaded} />;
      case "albums":
        return <DownloadedAlbumsTab />;
      case "playlists":
        return <DownloadedPlaylistsTab />;
      case "artists":
        return <DownloadedArtistsTab />;
      default:
        return null;
    }
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: "#d4d4d8", height: 2 }}
      style={{ backgroundColor: "transparent", elevation: 0 }}
      labelStyle={{
        fontSize: 14,
        fontWeight: "600",
        textTransform: "none",
      }}
      activeColor="#d4d4d8"
      inactiveColor="#737373"
      pressColor="transparent"
      scrollEnabled={false}
    />
  );

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Header */}
      <View className="flex-row items-center justify-between pt-16 pb-4 px-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-neutral-300 text-lg">‹</Text>
        </TouchableOpacity>
        <Text className="text-neutral-100 text-xl font-semibold">
          Downloads
        </Text>
        <View className="w-6" />
      </View>

      {/* Tab View */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={renderTabBar}
        style={{ flex: 1 }}
      />

      {/* Shuffle Button - Fixed Bottom Right */}
      <TouchableOpacity
        onPress={handleShufflePress}
        className="absolute bottom-24 right-6 w-14 h-14 bg-blue-500 rounded-full justify-center items-center shadow-lg"
        style={{ elevation: 8 }}
      >
        <Text className="text-white text-xl">🔀</Text>
      </TouchableOpacity>
    </View>
  );
}
