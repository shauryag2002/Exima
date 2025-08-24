import { useNetworkStore } from "@/store/networkStore";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function NetworkStatusBanner() {
  const { isOnline, showOfflineMessage, setShowOfflineMessage } =
    useNetworkStore();

  if (isOnline || !showOfflineMessage) {
    return null;
  }

  return (
    <View className="bg-orange-500 px-4 py-3 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <Ionicons name="wifi-outline" size={20} color="white" />
        <Text className="text-white text-sm font-medium ml-2">
          You're offline - Only downloaded content is available
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowOfflineMessage(false)}
        className="p-1"
      >
        <Ionicons name="close" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}

export function OfflineIndicator() {
  const { isOnline } = useNetworkStore();

  if (isOnline) {
    return null;
  }

  return (
    <View className="flex-row items-center bg-orange-100 px-3 py-2 rounded-full">
      <Ionicons name="wifi-outline" size={16} color="#ea580c" />
      <Text className="text-orange-600 text-xs font-medium ml-1">Offline</Text>
    </View>
  );
}
