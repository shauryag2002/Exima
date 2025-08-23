import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "./../global.css";

import GlobalBottomSheet from "@/components/GlobalBottomSheet";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTrackPlayerSync } from "@/hooks/useTrackPlayerSync";
import TrackPlayerService, { setupPlayer } from "@/services/TrackPlayerService";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TrackPlayer from "react-native-track-player";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [TrackPlayerReady, setTrackPlayerReady] = useState(false);

  // Sync TrackPlayer state with Zustand store
  useTrackPlayerSync();

  useEffect(() => {
    setupPlayer()
      .then(() => {
        // Player is ready to use
        setTrackPlayerReady(true);
      })
      .catch((error) => {
        console.error("Error setting up TrackPlayer:", error);
      });
  }, []);
  if (!loaded || !TrackPlayerReady) {
    // Async font loading only occurs in development.
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen
            name="search"
            options={{ title: "Search Songs", headerShown: false }}
          />
          <Stack.Screen
            name="player"
            options={{
              headerShown: false,
              presentation: "modal",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="downloads"
            options={{ title: "Downloads", headerShown: false }}
          />
          <Stack.Screen
            name="playlists"
            options={{ title: "Playlists", headerShown: false }}
          />
        </Stack>
        <StatusBar style="auto" />
        <MiniPlayer />
        <GlobalBottomSheet />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// Register playback service (factory must return the service handler)
TrackPlayer.registerPlaybackService(() => TrackPlayerService);
