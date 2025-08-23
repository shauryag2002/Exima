import { SearchTabType, useSearchStore } from "@/store/searchStore";
import * as React from "react";
import {
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SceneMap, TabView } from "react-native-tab-view";
import AlbumsTab from "./search/AlbumsTab";
import ArtistsTab from "./search/ArtistsTab";
import PlaylistsTab from "./search/PlaylistsTab";
import SongsTab from "./search/SongsTab";

const renderScene = SceneMap({
  songs: SongsTab,
  albums: AlbumsTab,
  playlists: PlaylistsTab,
  artists: ArtistsTab,
});

const routes = [
  { key: "songs", title: "Songs" },
  { key: "albums", title: "Albums" },
  { key: "playlists", title: "Playlists" },
  { key: "artists", title: "Artists" },
];

export default function TabBarView() {
  const layout = useWindowDimensions();
  const { activeTab, setActiveTab } = useSearchStore();

  const index = routes.findIndex((route) => route.key === activeTab);

  const handleIndexChange = (newIndex: number) => {
    const newTab = routes[newIndex]?.key as SearchTabType;
    if (newTab) {
      setActiveTab(newTab);
    }
  };

  const renderTabBar = (props: any) => {
    return (
      <View className="flex-row bg-neutral-900 border-b border-neutral-800">
        {routes.map((route, i) => {
          const isActive = index === i;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => handleIndexChange(i)}
              className={`flex-1 py-4 items-center border-b-2 ${
                isActive ? "border-blue-500" : "border-transparent"
              }`}
            >
              <Text
                className={`font-medium ${
                  isActive ? "text-blue-500" : "text-neutral-400"
                }`}
              >
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={handleIndexChange}
      initialLayout={{ width: layout.width }}
      renderTabBar={renderTabBar}
      style={{ backgroundColor: "#171717" }}
    />
  );
}
