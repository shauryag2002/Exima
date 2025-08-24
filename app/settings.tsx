import DownloadService from "@/services/DownloadService";
import { useSettingsStore } from "@/store/settingsStore";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const {
    audioQuality,
    downloadOverWifiOnly,
    autoDownloadOnPlay,
    smartCacheThreshold,
    setAudioQuality,
    setDownloadOverWifiOnly,
    setAutoDownloadOnPlay,
    setSmartCacheThreshold,
  } = useSettingsStore();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleClearDownloads = () => {
    Alert.alert(
      "Clear All Downloads",
      "Are you sure you want to delete all downloaded songs? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await DownloadService.clearAllDownloads();
              Alert.alert("Success", "All downloads have been cleared.");
            } catch (error) {
              Alert.alert("Error", "Failed to clear downloads.");
            }
          },
        },
      ]
    );
  };

  const QualityOption = ({
    quality,
    label,
    description,
  }: {
    quality: "low" | "medium" | "high";
    label: string;
    description: string;
  }) => (
    <TouchableOpacity
      onPress={() => setAudioQuality(quality)}
      className={`p-4 border border-neutral-700 rounded-xl mb-3 ${
        audioQuality === quality
          ? "bg-blue-500/20 border-blue-500"
          : "bg-neutral-900"
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-neutral-100 font-semibold text-base">
            {label}
          </Text>
          <Text className="text-neutral-400 text-sm mt-1">{description}</Text>
        </View>
        <View
          className={`w-5 h-5 rounded-full border-2 ${
            audioQuality === quality
              ? "border-blue-500 bg-blue-500"
              : "border-neutral-500"
          }`}
        >
          {audioQuality === quality && (
            <View className="w-full h-full rounded-full bg-blue-500" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const ThresholdOption = ({
    threshold,
    label,
  }: {
    threshold: number;
    label: string;
  }) => (
    <TouchableOpacity
      onPress={() => setSmartCacheThreshold(threshold)}
      className={`p-3 border border-neutral-700 rounded-lg mr-3 ${
        smartCacheThreshold === threshold
          ? "bg-blue-500/20 border-blue-500"
          : "bg-neutral-900"
      }`}
    >
      <Text
        className={`text-center font-semibold ${
          smartCacheThreshold === threshold
            ? "text-blue-400"
            : "text-neutral-100"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const storageUsed = formatFileSize(DownloadService.getTotalStorageUsed());
  const storageByQuality = DownloadService.getStorageByQuality();

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 border-b border-neutral-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2 -ml-2"
          >
            <Text className="text-blue-500 text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-white">Settings</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Audio Quality Section */}
        <View className="px-6 py-6 border-b border-neutral-800">
          <Text className="text-xl font-bold text-white mb-2">
            Audio Quality
          </Text>
          <Text className="text-neutral-400 text-sm mb-4">
            Choose the audio quality for downloads and streaming
          </Text>

          <QualityOption
            quality="high"
            label="High Quality (320 kbps)"
            description="Best audio quality, larger file size"
          />
          <QualityOption
            quality="medium"
            label="Medium Quality (160 kbps)"
            description="Good balance between quality and size"
          />
          <QualityOption
            quality="low"
            label="Low Quality (96 kbps)"
            description="Smaller file size, lower quality"
          />
        </View>

        {/* Download Settings Section */}
        <View className="px-6 py-6 border-b border-neutral-800">
          <Text className="text-xl font-bold text-white mb-4">
            Download Settings
          </Text>

          {/* WiFi Only */}
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text className="text-neutral-100 font-semibold">
                Download over WiFi only
              </Text>
              <Text className="text-neutral-400 text-sm mt-1">
                Prevent downloads over mobile data
              </Text>
            </View>
            <Switch
              value={downloadOverWifiOnly}
              onValueChange={setDownloadOverWifiOnly}
              trackColor={{ false: "#374151", true: "#3b82f6" }}
              thumbColor={downloadOverWifiOnly ? "#ffffff" : "#d1d5db"}
            />
          </View>
        </View>

        {/* Smart Caching Section */}
        <View className="px-6 py-6 border-b border-neutral-800">
          <Text className="text-xl font-bold text-white mb-2">
            Smart Caching
          </Text>
          <Text className="text-neutral-400 text-sm mb-4">
            Automatically download songs you play frequently
          </Text>

          {/* Enable Smart Caching */}
          <View className="flex-row items-center justify-between py-3 mb-4">
            <View className="flex-1">
              <Text className="text-neutral-100 font-semibold">
                Enable Smart Caching
              </Text>
              <Text className="text-neutral-400 text-sm mt-1">
                Auto-download songs after playing them multiple times
              </Text>
            </View>
            <Switch
              value={autoDownloadOnPlay}
              onValueChange={setAutoDownloadOnPlay}
              trackColor={{ false: "#374151", true: "#3b82f6" }}
              thumbColor={autoDownloadOnPlay ? "#ffffff" : "#d1d5db"}
            />
          </View>

          {/* Threshold Selection */}
          {autoDownloadOnPlay && (
            <View>
              <Text className="text-neutral-200 font-semibold mb-3">
                Auto-download after plays:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                  <ThresholdOption threshold={1} label="1 play" />
                  <ThresholdOption threshold={2} label="2 plays" />
                  <ThresholdOption threshold={3} label="3 plays" />
                  <ThresholdOption threshold={5} label="5 plays" />
                  <ThresholdOption threshold={10} label="10 plays" />
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Storage Information */}
        <View className="px-6 py-6 border-b border-neutral-800">
          <Text className="text-xl font-bold text-white mb-4">
            Storage Usage
          </Text>

          <View className="bg-neutral-900 rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-neutral-200 font-semibold">
                Total Downloads
              </Text>
              <Text className="text-blue-400 font-semibold">{storageUsed}</Text>
            </View>

            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-neutral-400 text-sm">High Quality:</Text>
                <Text className="text-neutral-300 text-sm">
                  {formatFileSize(storageByQuality.high)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-neutral-400 text-sm">
                  Medium Quality:
                </Text>
                <Text className="text-neutral-300 text-sm">
                  {formatFileSize(storageByQuality.medium)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-neutral-400 text-sm">Low Quality:</Text>
                <Text className="text-neutral-300 text-sm">
                  {formatFileSize(storageByQuality.low)}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleClearDownloads}
            className="bg-red-500/20 border border-red-500 rounded-xl p-4"
          >
            <Text className="text-red-400 font-semibold text-center">
              Clear All Downloads
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="px-6 py-6">
          <Text className="text-xl font-bold text-white mb-4">About Exima</Text>
          <Text className="text-neutral-400 text-sm leading-6">
            Exima Music Player with advanced downloading capabilities, smart
            caching, and high-quality audio streaming. Enjoy your music offline
            with proper metadata and organized storage.
          </Text>
          <Text className="text-neutral-500 text-xs mt-4">Version 1.0.0</Text>
        </View>

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
