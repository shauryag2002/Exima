import { SafeWrapper } from "@/components/SafeWrapper";
import DownloadService from "@/services/DownloadService";
import { useSettingsStore } from "@/store/settingsStore";
import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function AccountScreen() {
  const {
    audioQuality,
    setAudioQuality,
    smartCacheThreshold,
    setSmartCacheThreshold,
    autoDownloadOnPlay,
    setAutoDownloadOnPlay,
  } = useSettingsStore();

  const handleDownloadsPress = async () => {
    try {
      router.push("/downloads" as any);
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Error", "Failed to open downloads page");
    }
  };

  const handlePlaylistsPress = () => {
    router.push("/playlists" as any);
  };

  const handleAudioQualityPress = () => {
    try {
      const qualities = [
        { label: "Low (96 kbps)", value: "low" as const },
        { label: "Medium (160 kbps)", value: "medium" as const },
        { label: "High (320 kbps)", value: "high" as const },
      ];

      const buttons = qualities.map((quality) => ({
        text: quality.label,
        onPress: () => {
          try {
            setAudioQuality(quality.value);
          } catch (error) {
            console.error("Failed to set audio quality:", error);
            Alert.alert("Error", "Failed to change audio quality");
          }
        },
        style: audioQuality === quality.value ? "default" : ("cancel" as any),
      }));

      Alert.alert(
        "Audio Quality",
        "Choose your preferred audio quality for downloads",
        [...buttons, { text: "Cancel", style: "cancel" }]
      );
    } catch (error) {
      console.error("Audio quality dialog error:", error);
      Alert.alert("Error", "Failed to open audio quality settings");
    }
  };

  const handleSmartCachePress = () => {
    if (!autoDownloadOnPlay) {
      // First enable auto download, then let user choose threshold
      Alert.alert(
        "Enable Smart Download?",
        "Smart Download automatically downloads songs after you play them a certain number of times. Enable this feature?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enable",
            onPress: () => {
              setAutoDownloadOnPlay(true);
              // Then show threshold options
              setTimeout(() => showThresholdOptions(), 500);
            },
          },
        ]
      );
      return;
    }

    showThresholdOptions();
  };

  const showThresholdOptions = () => {
    const thresholds = [
      { label: "After 1 play", value: 1 },
      { label: "After 3 plays", value: 3 },
      { label: "After 5 plays", value: 5 },
      { label: "After 10 plays", value: 10 },
      {
        label: "Disable Smart Download",
        value: 0,
        action: () => setAutoDownloadOnPlay(false),
      },
    ];

    const buttons = thresholds.map((threshold) => ({
      text: threshold.label,
      onPress: () => {
        if (threshold.action) {
          threshold.action();
        } else {
          setSmartCacheThreshold(threshold.value);
        }
      },
      style:
        smartCacheThreshold === threshold.value ? "default" : ("cancel" as any),
    }));

    Alert.alert(
      "Smart Download Threshold",
      "Auto-download songs after reaching play count",
      [...buttons, { text: "Cancel", style: "cancel" }]
    );
  };

  const getAudioQualityLabel = () => {
    switch (audioQuality) {
      case "low":
        return "Low (96 kbps)";
      case "medium":
        return "Medium (160 kbps)";
      case "high":
        return "High (320 kbps)";
      default:
        return "High";
    }
  };

  const getSmartCacheLabel = () => {
    if (!autoDownloadOnPlay) return "Disabled";
    if (smartCacheThreshold === 0) return "Disabled";
    return `After ${smartCacheThreshold} play${smartCacheThreshold === 1 ? "" : "s"}`;
  };

  const handleMediaLibraryPermissions = async () => {
    try {
      if (DownloadService.hasMediaLibraryPermissions()) {
        Alert.alert(
          "Media Library Access",
          "Your downloads are already being saved to the device music library. Downloaded songs will appear in your music app.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Enable Media Library Access?",
          "This will allow downloaded songs to appear in your device's music app. Without this, downloads are saved privately within Exima.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Enable",
              onPress: async () => {
                const granted =
                  await DownloadService.requestMediaLibraryPermissions();
                if (granted) {
                  Alert.alert(
                    "Success",
                    "Media library access granted! Future downloads will appear in your music app."
                  );
                } else {
                  Alert.alert(
                    "Permission Denied",
                    "You can enable this later in device settings if needed."
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to handle media library permissions");
    }
  };

  return (
    <SafeWrapper>
      <View className="flex-1 bg-black">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-32"
        >
          {/* Header */}
          <View className="px-6 pt-16 pb-8">
            <Text className="text-3xl font-bold text-white">Account</Text>
          </View>

          {/* User Profile Section */}
          <View className="mx-6 mb-8">
            <View className="rounded-2xl bg-neutral-900 p-6">
              <View className="flex-row items-center">
                {/* Avatar */}
                <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                  <Text className="text-xl font-bold text-white">JD</Text>
                </View>

                {/* User Info */}
                <View className="flex-1">
                  <Text className="text-xl font-semibold text-white">
                    John Doe
                  </Text>
                  <Text className="mt-1 text-sm text-neutral-400">
                    Music Enthusiast
                  </Text>
                  <Text className="mt-1 text-xs text-neutral-500">
                    john.doe@example.com
                  </Text>
                </View>

                {/* Edit Button */}
                <TouchableOpacity className="rounded-lg bg-neutral-800 px-4 py-2">
                  <Text className="text-sm font-medium text-neutral-300">
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Main Sections */}
          <View className="mx-6 space-y-4">
            {/* Downloads Section */}
            <TouchableOpacity
              onPress={handleDownloadsPress}
              className="active:bg-neutral-800 rounded-2xl bg-neutral-900 p-6"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                    <Text className="text-xl text-blue-400">⬇️</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white">
                      Downloads
                    </Text>
                    <Text className="mt-1 text-sm text-neutral-400">
                      View your downloaded music
                    </Text>
                  </View>
                </View>
                <Text className="text-lg text-neutral-400">›</Text>
              </View>
            </TouchableOpacity>

            {/* Playlists Section */}
            <TouchableOpacity
              onPress={handlePlaylistsPress}
              className="active:bg-neutral-800 rounded-2xl bg-neutral-900 p-6"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                    <Text className="text-xl text-green-400">🎵</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white">
                      My Playlists
                    </Text>
                    <Text className="mt-1 text-sm text-neutral-400">
                      Create and manage playlists
                    </Text>
                  </View>
                </View>
                <Text className="text-lg text-neutral-400">›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Additional Settings */}
          <View className="mx-6 mt-8 space-y-2">
            <Text className="mb-4 text-sm font-medium text-neutral-500">
              PREFERENCES
            </Text>

            {/* Settings Items */}

            <TouchableOpacity
              onPress={handleAudioQualityPress}
              className="flex-row items-center justify-between rounded-xl bg-neutral-900 px-4 py-4"
            >
              <View className="flex-row items-center">
                <Text className="mr-3 text-base text-neutral-300">🔊</Text>
                <Text className="text-base text-white">Audio Quality</Text>
              </View>
              <Text className="text-sm text-neutral-400">
                {getAudioQualityLabel()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSmartCachePress}
              className="flex-row items-center justify-between rounded-xl bg-neutral-900 px-4 py-4"
            >
              <View className="flex-row items-center">
                <Text className="mr-3 text-base text-neutral-300">📱</Text>
                <Text className="text-base text-white">Smart Download</Text>
              </View>
              <Text className="text-sm text-neutral-400">
                {getSmartCacheLabel()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMediaLibraryPermissions}
              className="flex-row items-center justify-between rounded-xl bg-neutral-900 px-4 py-4"
            >
              <View className="flex-row items-center">
                <Text className="mr-3 text-base text-neutral-300">🎵</Text>
                <Text className="text-base text-white">
                  Media Library Access
                </Text>
              </View>
              <Text className="text-sm text-neutral-400">
                {DownloadService.hasMediaLibraryPermissions()
                  ? "Enabled"
                  : "App Only"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeWrapper>
  );
}
