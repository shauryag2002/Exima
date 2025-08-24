import { SaavnService, SaavnSong } from "@/services/SongApiService";
import { useHomeStore } from "@/store/homeStore";
import { useSearchStore } from "@/store/searchStore";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
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
  const { recentlyPlayedSongs, recentlyPlayedAlbums, loadRecentlyPlayed } =
    useHomeStore();

  // State for suggestions
  const [goodSongSuggestions, setGoodSongSuggestions] = useState<SaavnSong[]>(
    []
  );
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Mood categories for exploration
  const moodCategories = [
    { id: "romantic", name: "Romantic", icon: "heart", color: "#FF69B4" },
    { id: "sad", name: "Sad", icon: "sad", color: "#6B7280" },
    { id: "angry", name: "Angry", icon: "flame", color: "#EF4444" },
    { id: "happy", name: "Happy", icon: "happy", color: "#F59E0B" },
    { id: "chill", name: "Chill", icon: "leaf", color: "#10B981" },
    { id: "party", name: "Party", icon: "musical-notes", color: "#8B5CF6" },
    { id: "workout", name: "Workout", icon: "fitness", color: "#F97316" },
    { id: "devotional", name: "Devotional", icon: "flower", color: "#06B6D4" },
  ];

  // Static fallback recommendations
  const staticRecommendations = [
    {
      id: "static-1",
      title: "Kesariya",
      artist: "Arijit Singh",
      source: "static",
    },
    {
      id: "static-2",
      title: "Apna Bana Le",
      artist: "Arijit Singh",
      source: "static",
    },
    {
      id: "static-3",
      title: "Raataan Lambiyan",
      artist: "Tanishk Bagchi",
      source: "static",
    },
    {
      id: "static-4",
      title: "Malang Sajna",
      artist: "Sachet Tandon",
      source: "static",
    },
    {
      id: "static-5",
      title: "Tere Hawaale",
      artist: "Arijit Singh",
      source: "static",
    },
  ];

  // Generate dynamic recommendations
  const recommendations = useMemo(() => {
    interface Recommendation {
      id: string;
      title: string;
      artist: string;
      source: string;
    }

    const dynamicRecs: Recommendation[] = [];

    // Add recommendations from recently played songs
    if (recentlyPlayedSongs && recentlyPlayedSongs.length > 0) {
      recentlyPlayedSongs.slice(0, 3).forEach((song, index) => {
        dynamicRecs.push({
          id: `recent-song-${index}`,
          title: song.name,
          artist: song.primaryArtists || "Unknown Artist",
          source: "recently_played",
        });
      });
    }

    // Add recommendations from recently played albums
    if (recentlyPlayedAlbums && recentlyPlayedAlbums.length > 0) {
      recentlyPlayedAlbums.slice(0, 2).forEach((album, index) => {
        dynamicRecs.push({
          id: `recent-album-${index}`,
          title: album.name,
          artist: album.primaryArtists || "Various Artists",
          source: "recently_played_album",
        });
      });
    }

    // Extract artists from recent searches and create recommendations
    if (recentSearches && recentSearches.length > 0) {
      const uniqueSearches = [...new Set(recentSearches.slice(0, 3))];
      uniqueSearches.forEach((search, index) => {
        // Only add if it looks like an artist/song name (not too generic)
        if (search.length > 2 && !search.toLowerCase().includes("song")) {
          dynamicRecs.push({
            id: `search-${index}`,
            title: `Search for "${search}"`,
            artist: "Based on your searches",
            source: "recent_search",
          });
        }
      });
    }

    // If we have dynamic recommendations, use them; otherwise fallback to static
    return dynamicRecs.length > 0
      ? dynamicRecs.slice(0, 5)
      : staticRecommendations;
  }, [recentlyPlayedSongs, recentlyPlayedAlbums, recentSearches]);

  const getRecommendationIcon = (source: string) => {
    switch (source) {
      case "recently_played":
        return "play-circle";
      case "recently_played_album":
        return "albums";
      case "recent_search":
        return "search";
      default:
        return "musical-notes";
    }
  };

  const getRecommendationIconColor = (source: string) => {
    switch (source) {
      case "recently_played":
        return "#10B981"; // green
      case "recently_played_album":
        return "#3B82F6"; // blue
      case "recent_search":
        return "#F59E0B"; // yellow
      default:
        return "#fff";
    }
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  const handleRecommendationPress = (recommendation: {
    id: string;
    title: string;
    artist: string;
    source: string;
  }) => {
    if (recommendation.source === "recent_search") {
      // Extract the search term from the title
      const searchTerm = recommendation.title
        .replace('Search for "', "")
        .replace('"', "");
      router.push(
        `/search?query=${encodeURIComponent(searchTerm)}&noFocus=true`
      );
    } else {
      // For songs/albums, search for the title and artist
      const searchQuery = `${recommendation.title} ${recommendation.artist}`;
      router.push(
        `/search?query=${encodeURIComponent(searchQuery)}&noFocus=true`
      );
    }
  };

  const handleMoodPress = (mood: string) => {
    router.push(
      `/search?query=${encodeURIComponent(mood + " songs")}&noFocus=true`
    );
  };

  const handleSongSuggestionPress = (song: SaavnSong) => {
    const searchQuery = `${song.name} ${song.primaryArtists}`;
    router.push(
      `/search?query=${encodeURIComponent(searchQuery)}&noFocus=true`
    );
  };

  const loadGoodSongSuggestions = async () => {
    if (loadingSuggestions) return;

    setLoadingSuggestions(true);
    try {
      // Get suggestions from recently played songs or use a popular song ID as fallback
      let songId = "IBulFsqL"; // Default popular song ID

      if (recentlyPlayedSongs && recentlyPlayedSongs.length > 0) {
        songId = recentlyPlayedSongs[0].id;
      }

      const suggestions = await SaavnService.getSongSuggestions(songId);

      if (suggestions.length > 0) {
        setGoodSongSuggestions(suggestions.slice(0, 6)); // Show 6 suggestions in 2x3 grid
      } else {
        // Fallback to mood-based suggestions if song suggestions fail
        const fallbackSongs = await SaavnService.getMoodSongs("happy", 6);
        setGoodSongSuggestions(fallbackSongs);
      }
    } catch (error) {
      console.error("Error loading song suggestions:", error);
      // Ultimate fallback - create some static suggestions
      const staticSongs: SaavnSong[] = [
        {
          id: "static-song-1",
          name: "Kesariya",
          primaryArtists: "Arijit Singh",
          image: "https://via.placeholder.com/150",
        },
        {
          id: "static-song-2",
          name: "Apna Bana Le",
          primaryArtists: "Arijit Singh",
          image: "https://via.placeholder.com/150",
        },
        {
          id: "static-song-3",
          name: "Tum Hi Ho",
          primaryArtists: "Arijit Singh",
          image: "https://via.placeholder.com/150",
        },
        {
          id: "static-song-4",
          name: "Raabta",
          primaryArtists: "Arijit Singh",
          image: "https://via.placeholder.com/150",
        },
        {
          id: "static-song-5",
          name: "Tera Ban Jaunga",
          primaryArtists: "Tulsi Kumar, Akhil Sachdeva",
          image: "https://via.placeholder.com/150",
        },
        {
          id: "static-song-6",
          name: "Perfect",
          primaryArtists: "Ed Sheeran",
          image: "https://via.placeholder.com/150",
        },
      ];
      setGoodSongSuggestions(staticSongs);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    // Load recently played data for recommendations
    loadRecentlyPlayed();
    // Load good song suggestions
    loadGoodSongSuggestions();
  }, [loadRecentlyPlayed]);

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
        className="flex-row items-center bg-neutral-800 p-3 rounded-lg border border-neutral-700"
        onPress={handleSearchPress}
      >
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <Text className="ml-3 text-neutral-400 text-base">
          Search songs, albums, playlists, artists...
        </Text>
      </TouchableOpacity>

      {recentSearches.length > 0 && (
        <View className="mt-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-white">
              Recent searches
            </Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text className="text-neutral-400 text-sm">Clear all</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center justify-between py-3"
              onPress={() =>
                router.push(
                  `/search?query=${encodeURIComponent(search)}&noFocus=true`
                )
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
          ))}
        </View>
      )}

      {/* Explore Moods Section */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">Explore</Text>
        <View className="flex-row flex-wrap gap-3">
          {moodCategories.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              className="flex-row items-center bg-neutral-800 px-4 py-3 rounded-full border border-neutral-700"
              onPress={() => handleMoodPress(mood.id)}
            >
              <Ionicons name={mood.icon as any} size={18} color={mood.color} />
              <Text className="ml-2 text-white text-sm font-medium">
                {mood.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Good Song Suggestions Section */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">
          Good Song Suggestions
        </Text>
        {loadingSuggestions ? (
          <View className="flex-row justify-center py-8">
            <Text className="text-neutral-400">Loading suggestions...</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {goodSongSuggestions.map((song, index) => (
              <TouchableOpacity
                key={song.id}
                className="w-[48%] bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700"
                onPress={() => handleSongSuggestionPress(song)}
              >
                <Image
                  source={{
                    uri: song.image || "https://via.placeholder.com/150",
                  }}
                  className="w-full h-24"
                  resizeMode="cover"
                />
                <View className="p-3">
                  <Text
                    className="text-white text-sm font-medium"
                    numberOfLines={1}
                  >
                    {song.name}
                  </Text>
                  <Text
                    className="text-neutral-400 text-xs mt-1"
                    numberOfLines={1}
                  >
                    {song.primaryArtists || "Unknown Artist"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
            onPress={() => handleRecommendationPress(item)}
          >
            <View className="w-12 h-12 bg-neutral-700 rounded justify-center items-center">
              <Ionicons
                name={getRecommendationIcon(item.source) as any}
                size={24}
                color={getRecommendationIconColor(item.source)}
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base text-white font-medium">
                {item.title}
              </Text>
              <Text className="text-sm text-gray-600 mt-0.5">
                {item.artist}
              </Text>
            </View>
            {item.source !== "static" && (
              <View className="px-2 py-1 rounded-full bg-neutral-800">
                <Text className="text-xs text-neutral-400 capitalize">
                  {item.source.replace("_", " ")}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default SearchTab;
