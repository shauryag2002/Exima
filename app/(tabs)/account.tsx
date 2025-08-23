import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function AccountScreen() {
  const handleDownloadsPress = () => {
    router.push("/downloads" as any);
  };

  const handlePlaylistsPress = () => {
    router.push("/playlists" as any);
  };

  return (
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
          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-neutral-900 px-4 py-4">
            <View className="flex-row items-center">
              <Text className="mr-3 text-base text-neutral-300">🌙</Text>
              <Text className="text-base text-white">Dark Mode</Text>
            </View>
            <View className="flex-row items-center justify-end rounded-full bg-blue-500 w-12 h-6 px-1">
              <View className="h-4 w-4 rounded-full bg-white" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-neutral-900 px-4 py-4">
            <View className="flex-row items-center">
              <Text className="mr-3 text-base text-neutral-300">🔊</Text>
              <Text className="text-base text-white">Audio Quality</Text>
            </View>
            <Text className="text-sm text-neutral-400">High</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-neutral-900 px-4 py-4">
            <View className="flex-row items-center">
              <Text className="mr-3 text-base text-neutral-300">📱</Text>
              <Text className="text-base text-white">Storage</Text>
            </View>
            <Text className="text-sm text-neutral-400">2.4 GB</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
