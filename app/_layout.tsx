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

import { useColorScheme } from "@/hooks/useColorScheme";
import TrackPlayerService, { setupPlayer } from "@/services/TrackPlayerService";
import { useEffect, useState } from "react";
import TrackPlayer from "react-native-track-player";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [TrackPlayerReady, setTrackPlayerReady] = useState(false);

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
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="search"
          options={{ title: "Search Songs", headerShown: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// Register playback service (factory must return the service handler)
TrackPlayer.registerPlaybackService(() => TrackPlayerService);
