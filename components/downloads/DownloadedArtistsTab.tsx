import React from "react";
import { Text, View } from "react-native";

export default function DownloadedArtistsTab() {
  return (
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
}
