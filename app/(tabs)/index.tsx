import { HorizontalAlbumList } from "@/components/home/HorizontalAlbumList";
import { HorizontalSongList } from "@/components/home/HorizontalSongList";
import { OfflineIndicator } from "@/components/NetworkStatus";
import { SaavnAlbum } from "@/services/SongApiService";
import { useHomeStore } from "@/store/homeStore";
import { useNetworkStore } from "@/store/networkStore";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

export default function HomeScreen() {
  const {
    recentlyPlayedSongs,
    recentlyPlayedAlbums,
    recommendations,
    topCharts,
    trending,
    latestReleases,
    isLoadingRecentlyPlayed,
    isLoadingRecommendations,
    isLoadingTopCharts,
    isLoadingTrending,
    isLoadingLatestReleases,
    loadAllData,
    refreshAll,
    loadRecommendations,
    loadTopCharts,
    loadTrending,
    loadLatestReleases,
  } = useHomeStore();

  const { isOnline } = useNetworkStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const handleAlbumPress = (album: SaavnAlbum) => {
    router.push(`/album/${album.id}`);
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ffffff"
            colors={["#ffffff"]}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-16 pb-8">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-white">
                {getGreeting()}
              </Text>
              <Text className="text-neutral-400 text-base mt-1">
                {isOnline ? "Discover your music" : "Your downloaded music"}
              </Text>
            </View>
            <OfflineIndicator />
          </View>
        </View>

        {/* Recently Played Songs */}
        {(recentlyPlayedSongs.length > 0 || isLoadingRecentlyPlayed) && (
          <HorizontalSongList
            title="Recently Played Songs"
            songs={recentlyPlayedSongs}
            isLoading={isLoadingRecentlyPlayed}
          />
        )}

        {/* Recently Played Albums */}
        {(recentlyPlayedAlbums.length > 0 || isLoadingRecentlyPlayed) && (
          <HorizontalAlbumList
            title="Recently Played Albums"
            albums={recentlyPlayedAlbums}
            onAlbumPress={handleAlbumPress}
            isLoading={isLoadingRecentlyPlayed}
          />
        )}

        {/* Good Songs Recommendations - Only show when online */}
        {isOnline && (
          <HorizontalSongList
            title="Recommended for You"
            songs={recommendations}
            isLoading={isLoadingRecommendations}
            onRefresh={loadRecommendations}
          />
        )}

        {/* Top Charts Songs - Show always (offline returns downloaded content) */}
        <HorizontalSongList
          title={isOnline ? "Top Chart Songs" : "Your Downloaded Songs"}
          songs={topCharts.songs}
          isLoading={isLoadingTopCharts}
          onRefresh={loadTopCharts}
        />

        {/* Top Charts Albums - Show always (offline returns downloaded content) */}
        <HorizontalAlbumList
          title={isOnline ? "Top Chart Albums" : "Your Downloaded Albums"}
          albums={topCharts.albums}
          isLoading={isLoadingTopCharts}
          onRefresh={loadTopCharts}
          onAlbumPress={handleAlbumPress}
        />

        {/* Trending Songs - Show always (offline returns downloaded content) */}
        <HorizontalSongList
          title={isOnline ? "Trending Songs" : "Recently Played Downloaded"}
          songs={trending.songs}
          isLoading={isLoadingTrending}
          onRefresh={loadTrending}
        />

        {/* Latest Release Songs - Only show when online */}
        {isOnline && (
          <HorizontalSongList
            title="Latest Release Songs"
            songs={latestReleases.songs}
            isLoading={isLoadingLatestReleases}
            onRefresh={loadLatestReleases}
          />
        )}

        {/* Latest Release Albums - Only show when online */}
        {isOnline && (
          <HorizontalAlbumList
            title="Latest Release Albums"
            albums={latestReleases.albums}
            isLoading={isLoadingLatestReleases}
            onRefresh={loadLatestReleases}
            onAlbumPress={handleAlbumPress}
          />
        )}

        {/* Bottom Spacing */}
        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
