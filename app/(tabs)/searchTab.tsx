import { useSearchStore } from "@/store/searchStore";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import React, { useEffect } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { onSearchInputFocusRequest } from "../../helpers/searchFocusEmitter";

const SearchTab = () => {
  const inputRef = React.useRef<TextInput>(null);
  const navigation = useNavigation();
  const { recentSearches, clearRecentSearches, removeFromRecentSearches } =
    useSearchStore();

  const recommendations = [
    { id: 1, title: "Kesariya", artist: "Arijit Singh" },
    { id: 2, title: "Apna Bana Le", artist: "Arijit Singh" },
    { id: 3, title: "Raataan Lambiyan", artist: "Tanishk Bagchi" },
    { id: 4, title: "Malang Sajna", artist: "Sachet Tandon" },
    { id: 5, title: "Tere Hawaale", artist: "Arijit Singh" },
  ];

  const handleSearchPress = () => {
    router.push("/search");
  };

  useEffect(() => {
    const unsub = onSearchInputFocusRequest(() => {
      requestAnimationFrame(() => handleSearchPress());
    });
    return unsub;
  }, []);

  return (
    <ScrollView className="flex-1 bg-black px-4">
      <View className="pt-16 pb-5">
        <Text className="text-3xl font-bold text-white">Search</Text>
      </View>

      <TouchableOpacity
        className="flex-row items-center bg-white rounded-lg px-3 py-3 mb-6"
        onPress={handleSearchPress}
      >
        <Ionicons name="search" size={20} color="#666" />
        <Text className="ml-2 text-base text-gray-600">
          What do you want to listen to?
        </Text>
      </TouchableOpacity>

      <View className="mb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-white">Recent searches</Text>
          {recentSearches.length > 0 && (
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text className="text-neutral-400 text-sm">Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
        {recentSearches.length > 0 ? (
          recentSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center justify-between py-3"
              onPress={() =>
                router.push(`/search?query=${encodeURIComponent(search)}`)
              }
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text className="ml-3 text-base text-white">{search}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeFromRecentSearches(search)}
                className="p-1"
              >
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-neutral-500 text-center py-4">
            No recent searches
          </Text>
        )}
      </View>

      <View className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">
          Recommended for you
        </Text>
        {recommendations.map((item) => (
          <TouchableOpacity
            key={item.id}
            className="flex-row items-center py-2"
          >
            <View className="w-12 h-12 bg-neutral-700 rounded justify-center items-center">
              <Ionicons name="musical-notes" size={24} color="#fff" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base text-white font-medium">
                {item.title}
              </Text>
              <Text className="text-sm text-gray-600 mt-0.5">
                {item.artist}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default SearchTab;
