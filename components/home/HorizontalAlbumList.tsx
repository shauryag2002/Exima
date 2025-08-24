import { SaavnAlbum } from "@/services/SongApiService";
import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 3; // 3 items per row with padding

interface AlbumCardProps {
  album: SaavnAlbum;
  onPress: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mr-3 mb-4"
      style={{ width: ITEM_WIDTH }}
    >
      <View className="bg-neutral-900 rounded-xl p-3">
        {/* Album Image */}
        <View className="aspect-square mb-3 rounded-lg overflow-hidden bg-neutral-800">
          {album.image ? (
            <Image
              source={{ uri: album.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-neutral-800 items-center justify-center">
              <Text className="text-neutral-400 text-2xl">💿</Text>
            </View>
          )}
        </View>

        {/* Album Info */}
        <Text
          className="text-white text-sm font-semibold mb-1"
          numberOfLines={2}
        >
          {album.name}
        </Text>
        {album.primaryArtists && (
          <Text className="text-neutral-400 text-xs" numberOfLines={1}>
            {album.primaryArtists}
          </Text>
        )}
        {album.year && (
          <Text className="text-neutral-500 text-xs mt-1">{album.year}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface HorizontalAlbumListProps {
  title: string;
  albums: SaavnAlbum[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onAlbumPress?: (album: SaavnAlbum) => void;
}

export const HorizontalAlbumList: React.FC<HorizontalAlbumListProps> = ({
  title,
  albums,
  isLoading = false,
  onRefresh,
  onAlbumPress,
}) => {
  const handleAlbumPress = (album: SaavnAlbum) => {
    if (onAlbumPress) {
      onAlbumPress(album);
    }
  };

  const renderAlbum = ({
    item,
    index,
  }: {
    item: SaavnAlbum;
    index: number;
  }) => <AlbumCard album={item} onPress={() => handleAlbumPress(item)} />;

  const renderEmptyState = () => (
    <View className="h-32 items-center justify-center">
      <Text className="text-neutral-400 text-sm">
        {isLoading ? "Loading albums..." : "No albums available"}
      </Text>
    </View>
  );

  return (
    <View className="mb-8">
      {/* Section Header */}
      <View className="flex-row items-center justify-between px-6 mb-4">
        <Text className="text-white text-xl font-bold">{title}</Text>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh}>
            <Text className="text-blue-400 text-sm font-medium">Refresh</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Album List */}
      {albums.length > 0 ? (
        <FlatList
          data={albums}
          renderItem={renderAlbum}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
          }}
          numColumns={1}
          snapToAlignment="start"
          decelerationRate="fast"
          pagingEnabled={false}
          snapToInterval={ITEM_WIDTH + 12} // item width + margin
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};
