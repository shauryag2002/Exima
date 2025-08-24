import axios from "axios";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import DownloadService from "./DownloadService";
import NetworkService from "./NetworkService";

// Simple persistent play count + downloaded flags store via a JSON file.
const STORE_FILE = FileSystem.documentDirectory + "play_store.json";
const PLAY_THRESHOLD = 5;
const API_BASE = process.env.EXPO_PUBLIC_BASE_API;
const SUGGESTION_API = "https://jiosavan-api2.vercel.app";

export interface SaavnSong {
  id: string;
  name: string;
  album?: string;
  albumId?: string;
  year?: string;
  primaryArtists?: string;
  image?: string; // largest image url
  downloadUrl?: string; // highest quality url
  duration?: number; // seconds
}

export interface SaavnAlbum {
  id: string;
  name: string;
  image?: string;
  primaryArtists?: string;
  year?: string;
  songCount?: number;
  language?: string;
  type: "album";
}

export interface SaavnPlaylist {
  id: string;
  name: string;
  image?: string;
  followerCount?: number;
  songCount?: number;
  type: "playlist";
}

export interface SaavnArtist {
  id: string;
  name: string;
  image?: string;
  followerCount?: number;
  type: "artist";
}

export interface SearchResponse<T> {
  data: {
    results: T[];
    total: number;
    start: number;
    more: boolean;
  };
}

interface PersistShape {
  playCounts: Record<string, number>;
  downloaded: Record<string, boolean>;
  recentlyPlayed: SaavnSong[];
}

let memory: PersistShape = {
  playCounts: {},
  downloaded: {},
  recentlyPlayed: [],
};
let loaded = false;

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const msg = status
      ? `Saavn API error ${status}`
      : err.message || "Network error";
    return Promise.reject(new Error(msg));
  }
);

async function loadStore() {
  if (loaded) return;
  try {
    const info = await FileSystem.getInfoAsync(STORE_FILE);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(STORE_FILE);
      const parsed = JSON.parse(raw);
      memory = {
        playCounts: parsed.playCounts || {},
        downloaded: parsed.downloaded || {},
        recentlyPlayed: parsed.recentlyPlayed || [],
      };
    }
  } catch {
    // ignore
  } finally {
    loaded = true;
  }
}

// Export loadStore for external use
export { loadStore };

async function saveStore() {
  try {
    await FileSystem.writeAsStringAsync(STORE_FILE, JSON.stringify(memory));
  } catch (e) {
    console.warn("Persist store write failed", e);
  }
}

async function api<T>(path: string): Promise<T> {
  const res = await apiClient.get<T>(path);
  return res.data as any;
}

// --- Mapping helpers -------------------------------------------------------
function mapSong(raw: any): SaavnSong {
  if (!raw) return {} as any;

  // Image extraction (objects may have url or link)
  const imgField = raw.image || raw.images;
  let image: string | undefined;
  if (Array.isArray(imgField)) {
    const last = imgField[imgField.length - 1];
    image = last?.link || last?.url || imgField[0]?.link || imgField[0]?.url;
  } else if (typeof imgField === "string") {
    image = imgField;
  }

  // Download URL extraction (array of { quality, url|link })
  const dlField = raw.downloadUrl || raw.download_url || raw.downloadUrls;
  let downloadUrl: string | undefined;
  if (Array.isArray(dlField)) {
    const sorted = [...dlField].sort(
      (a, b) => parseInt(b.quality) - parseInt(a.quality)
    );
    downloadUrl = sorted[0]?.link || sorted[0]?.url;
  } else if (typeof dlField === "string") {
    downloadUrl = dlField;
  }

  // Primary artists normalization
  const primaryArtists =
    raw.primaryArtists ||
    raw.primary_artists ||
    (raw.artists?.primary
      ? raw.artists.primary.map((a: any) => a.name).join(", ")
      : undefined);

  // Album name may be an object
  const albumName =
    (raw.album && typeof raw.album === "object" ? raw.album.name : raw.album) ||
    raw.album_name;

  // Album ID extraction
  const albumId =
    (raw.album && typeof raw.album === "object" ? raw.album.id : undefined) ||
    raw.album_id;

  return {
    id: raw.id,
    name: raw.name || raw.title,
    album: albumName,
    albumId,
    year: raw.year,
    primaryArtists,
    image,
    downloadUrl,
    duration: raw.duration != null ? Number(raw.duration) : undefined,
  };
}

function mapAlbum(raw: any): SaavnAlbum {
  if (!raw) return {} as any;

  // Image extraction
  const imgField = raw.image || raw.images;
  let image: string | undefined;
  if (Array.isArray(imgField)) {
    const last = imgField[imgField.length - 1];
    image = last?.link || last?.url || imgField[0]?.link || imgField[0]?.url;
  } else if (typeof imgField === "string") {
    image = imgField;
  }

  // Primary artists normalization
  const primaryArtists =
    raw.primaryArtists ||
    raw.primary_artists ||
    (raw.artists?.primary
      ? raw.artists.primary.map((a: any) => a.name).join(", ")
      : undefined) ||
    raw.artist ||
    raw.more_info?.artistMap?.primary_artists
      ?.map((a: any) => a.name)
      .join(", ");

  return {
    id: raw.id,
    name: raw.name || raw.title,
    image,
    primaryArtists,
    year: raw.year || raw.more_info?.year,
    songCount: raw.songCount || raw.song_count || raw.more_info?.song_count,
    language: raw.language || raw.more_info?.language,
    type: "album",
  };
}

function mapPlaylist(raw: any): SaavnPlaylist {
  if (!raw) return {} as any;

  // Image extraction
  const imgField = raw.image || raw.images;
  let image: string | undefined;
  if (Array.isArray(imgField)) {
    const last = imgField[imgField.length - 1];
    image = last?.link || last?.url || imgField[0]?.link || imgField[0]?.url;
  } else if (typeof imgField === "string") {
    image = imgField;
  }

  return {
    id: raw.id,
    name: raw.name || raw.title,
    image,
    followerCount:
      raw.followerCount || raw.follower_count || raw.more_info?.follower_count,
    songCount: raw.songCount || raw.song_count || raw.more_info?.song_count,
    type: "playlist",
  };
}

function mapArtist(raw: any): SaavnArtist {
  if (!raw) return {} as any;

  // Image extraction
  const imgField = raw.image || raw.images;
  let image: string | undefined;
  if (Array.isArray(imgField)) {
    const last = imgField[imgField.length - 1];
    image = last?.link || last?.url || imgField[0]?.link || imgField[0]?.url;
  } else if (typeof imgField === "string") {
    image = imgField;
  }

  return {
    id: raw.id,
    name: raw.name || raw.title,
    image,
    followerCount:
      raw.followerCount || raw.follower_count || raw.more_info?.follower_count,
    type: "artist",
  };
}

// Also update the permission check to be more specific
async function ensurePermissions() {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn(
        "MediaLibrary permission not granted, files will be saved in app directory"
      );
    }
    return status === "granted";
  } catch (e) {
    console.warn("Permission check failed:", e);
    return false;
  }
}

async function isAlreadyDownloaded(songId: string): Promise<boolean> {
  if (memory.downloaded[songId]) return true;
  try {
    const assets = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
      first: 200,
      sortBy: MediaLibrary.SortBy.creationTime,
    });
    return assets.assets.some((a) => a.filename?.includes(songId));
  } catch {
    return false;
  }
}

// Helper to sanitize filename
function sanitizeFilename(filename: string, maxLength: number = 50): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // Remove invalid characters
    .replace(/[\s]{2,}/g, " ") // Replace multiple spaces with single space
    .trim()
    .slice(0, maxLength)
    .replace(/\.$/, ""); // Remove trailing dot
}

// ...existing code until ensureDownloaded function...

// Replace the ensureDownloaded function with this:

async function ensureDownloaded(song: SaavnSong) {
  if (!song.downloadUrl) return;
  if (await isAlreadyDownloaded(song.id)) {
    memory.downloaded[song.id] = true;
    return;
  }

  const hasPermission = await ensurePermissions();
  if (!hasPermission) {
    throw new Error("Storage permission required for downloading");
  }

  // Create a simple, safe filename
  const cleanTitle = sanitizeFilename(song.name || "Unknown", 30);
  const cleanArtist = sanitizeFilename(song.primaryArtists || "Unknown", 20);
  const filename = `${cleanArtist} - ${cleanTitle}.mp3`;

  try {
    // Download to temp location first
    const tempPath = FileSystem.cacheDirectory + `temp_${song.id}.mp3`;

    const downloadResult = await FileSystem.downloadAsync(
      song.downloadUrl,
      tempPath
    );

    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status: ${downloadResult.status}`);
    }

    // Verify file
    const tempFileInfo = await FileSystem.getInfoAsync(tempPath);
    if (
      !tempFileInfo.exists ||
      (tempFileInfo.size && tempFileInfo.size < 1000)
    ) {
      throw new Error("Downloaded file is invalid or too small");
    }

    // Create MediaLibrary asset directly from temp file
    const asset = await MediaLibrary.createAssetAsync(tempPath);

    if (!asset) {
      throw new Error("Failed to create MediaLibrary asset");
    }

    // Try to organize in album
    try {
      let album = await MediaLibrary.getAlbumAsync("Exima Music");
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(
          "Exima Music",
          asset,
          false
        );
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } catch (albumError) {
      console.warn("Album organization failed:", albumError);
    }

    // Clean up temp file
    await FileSystem.deleteAsync(tempPath, { idempotent: true });

    memory.downloaded[song.id] = true;
  } catch (e) {
    console.error("Download failed for", song.name, ":", e);
    // Clean up temp file
    try {
      await FileSystem.deleteAsync(
        FileSystem.cacheDirectory + `temp_${song.id}.mp3`,
        { idempotent: true }
      );
    } catch {}
    throw e;
  }
}
// ...rest of the code remains the same...

// --- Public API ------------------------------------------------------------
export async function searchSongs(
  query: string,
  page: number = 0,
  limit: number = 20
): Promise<{ songs: SaavnSong[]; hasMore: boolean }> {
  if (!query.trim()) return { songs: [], hasMore: false };

  const data = await api<any>(
    `/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );

  const results = data.data?.results || data.results || [];
  const songs = results.map(mapSong);

  // Calculate hasMore based on whether we got a full page of results
  // If we get fewer results than the limit, there are no more results
  const hasMore = results.length >= limit;

  return { songs, hasMore };
}

export async function searchAlbums(
  query: string,
  page: number = 0,
  limit: number = 20
): Promise<{ albums: SaavnAlbum[]; hasMore: boolean }> {
  if (!query.trim()) return { albums: [], hasMore: false };

  const data = await api<any>(
    `/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );

  const results = data.data?.results || data.results || [];
  const albums = results.map(mapAlbum);

  // Calculate hasMore based on whether we got a full page of results
  const hasMore = results.length >= limit;

  return { albums, hasMore };
}

export async function searchPlaylists(
  query: string,
  page: number = 0,
  limit: number = 20
): Promise<{ playlists: SaavnPlaylist[]; hasMore: boolean }> {
  if (!query.trim()) return { playlists: [], hasMore: false };

  const data = await api<any>(
    `/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );

  const results = data.data?.results || data.results || [];
  const playlists = results.map(mapPlaylist);

  // Calculate hasMore based on whether we got a full page of results
  const hasMore = results.length >= limit;

  return { playlists, hasMore };
}

export async function searchArtists(
  query: string,
  page: number = 0,
  limit: number = 20
): Promise<{ artists: SaavnArtist[]; hasMore: boolean }> {
  if (!query.trim()) return { artists: [], hasMore: false };

  const data = await api<any>(
    `/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );

  const results = data.data?.results || data.results || [];
  const artists = results.map(mapArtist);

  // Calculate hasMore based on whether we got a full page of results
  const hasMore = results.length >= limit;

  return { artists, hasMore };
}

export async function searchAll(
  query: string,
  page: number = 0,
  limit: number = 20
): Promise<{
  songs: SaavnSong[];
  albums: SaavnAlbum[];
  playlists: SaavnPlaylist[];
  artists: SaavnArtist[];
  hasMore: {
    songs: boolean;
    albums: boolean;
    playlists: boolean;
    artists: boolean;
  };
}> {
  if (!query.trim()) {
    return {
      songs: [],
      albums: [],
      playlists: [],
      artists: [],
      hasMore: {
        songs: false,
        albums: false,
        playlists: false,
        artists: false,
      },
    };
  }

  const [songsResult, albumsResult, playlistsResult, artistsResult] =
    await Promise.allSettled([
      searchSongs(query, page, limit),
      searchAlbums(query, page, limit),
      searchPlaylists(query, page, limit),
      searchArtists(query, page, limit),
    ]);

  return {
    songs: songsResult.status === "fulfilled" ? songsResult.value.songs : [],
    albums:
      albumsResult.status === "fulfilled" ? albumsResult.value.albums : [],
    playlists:
      playlistsResult.status === "fulfilled"
        ? playlistsResult.value.playlists
        : [],
    artists:
      artistsResult.status === "fulfilled" ? artistsResult.value.artists : [],
    hasMore: {
      songs:
        songsResult.status === "fulfilled" ? songsResult.value.hasMore : false,
      albums:
        albumsResult.status === "fulfilled"
          ? albumsResult.value.hasMore
          : false,
      playlists:
        playlistsResult.status === "fulfilled"
          ? playlistsResult.value.hasMore
          : false,
      artists:
        artistsResult.status === "fulfilled"
          ? artistsResult.value.hasMore
          : false,
    },
  };
}

export async function getSong(id: string): Promise<SaavnSong | null> {
  const data = await api<any>(`/songs?id=${encodeURIComponent(id)}`);
  const entry = Array.isArray(data.data) ? data.data[0] : data.data;
  return entry ? mapSong(entry) : null;
}

export async function getAlbum(id: string): Promise<SaavnAlbum | null> {
  const data = await api<any>(`/albums?id=${encodeURIComponent(id)}`);
  const entry = Array.isArray(data.data) ? data.data[0] : data.data;
  return entry ? mapAlbum(entry) : null;
}

export async function getAlbumDetails(id: string): Promise<{
  album: SaavnAlbum;
  songs: SaavnSong[];
} | null> {
  try {
    const data = await api<any>(`/albums?id=${encodeURIComponent(id)}`);
    const entry = Array.isArray(data.data) ? data.data[0] : data.data;

    if (!entry) return null;

    const album = mapAlbum(entry);
    const songs = (entry.songs || [])
      .map(mapSong)
      .filter((song: SaavnSong) => song.id);

    return { album, songs };
  } catch (error) {
    console.error("Failed to fetch album details:", error);
    return null;
  }
}

export async function getPlaylist(id: string): Promise<SaavnPlaylist | null> {
  const data = await api<any>(`/playlists?id=${encodeURIComponent(id)}`);
  const entry = Array.isArray(data.data) ? data.data[0] : data.data;
  return entry ? mapPlaylist(entry) : null;
}

export async function getPlaylistDetails(id: string): Promise<{
  playlist: SaavnPlaylist;
  songs: SaavnSong[];
} | null> {
  try {
    const data = await api<any>(`/playlists?id=${encodeURIComponent(id)}`);
    const entry = Array.isArray(data.data) ? data.data[0] : data.data;

    if (!entry) return null;

    const playlist = mapPlaylist(entry);
    const songs = (entry.songs || [])
      .map(mapSong)
      .filter((song: SaavnSong) => song.id);

    return { playlist, songs };
  } catch (error) {
    console.error("Failed to fetch playlist details:", error);
    return null;
  }
}

export async function incrementPlayAndMaybeCache(song: SaavnSong) {
  await loadStore();
  if (!song.id) return;

  const current = (memory.playCounts[song.id] || 0) + 1;
  memory.playCounts[song.id] = current;

  // Add to recently played (remove if already exists, then add to front)
  memory.recentlyPlayed = memory.recentlyPlayed.filter((s) => s.id !== song.id);
  memory.recentlyPlayed.unshift(song);

  // Keep only last 50 recently played songs
  if (memory.recentlyPlayed.length > 50) {
    memory.recentlyPlayed = memory.recentlyPlayed.slice(0, 50);
  }

  // Smart caching using new download service
  await DownloadService.checkSmartCache(song, current);

  await saveStore();
}

export function getPlayCount(id: string): number {
  return memory.playCounts[id] || 0;
}

export function isDownloaded(id: string): boolean {
  return DownloadService.isDownloaded(id);
}

// Get the best available URL for a song (local if downloaded, otherwise CDN)
export function getBestAvailableUrl(song: SaavnSong): string | undefined {
  // First check if song is downloaded locally
  const localUri = DownloadService.getLocalUri(song.id);
  if (localUri) {
    return localUri;
  }

  // Fallback to CDN URL only if online
  if (NetworkService.isOnline()) {
    return song.downloadUrl;
  }

  // Offline and no local file available
  return undefined;
}

// Check if device is offline
export function isOffline(): boolean {
  return NetworkService.isOffline();
}

// Check if device is online
export function isOnline(): boolean {
  return NetworkService.isOnline();
}

// Get recently played songs (offline-compatible)
export function getRecentlyPlayedOffline(): SaavnSong[] {
  if (!memory.recentlyPlayed) return [];

  // Filter to only show downloaded songs when offline
  if (NetworkService.isOffline()) {
    return memory.recentlyPlayed.filter((song) =>
      DownloadService.isDownloaded(song.id)
    );
  }

  // Show all when online
  return memory.recentlyPlayed;
}

// Get downloaded songs by album name
export function getDownloadedSongsByAlbum(albumName: string): SaavnSong[] {
  const downloadedSongs = getDownloadedSongs();
  return downloadedSongs.filter(
    (song) =>
      song.album && song.album.toLowerCase().includes(albumName.toLowerCase())
  );
}

// Get downloaded songs by album ID (if available)
export function getDownloadedSongsByAlbumId(albumId: string): SaavnSong[] {
  const downloadedSongs = getDownloadedSongs();
  return downloadedSongs.filter((song) => song.id === albumId);
}

// Create offline album details from downloaded songs
export function createOfflineAlbumFromSongs(
  songs: SaavnSong[],
  albumName?: string
): {
  album: SaavnAlbum;
  songs: SaavnSong[];
} | null {
  if (songs.length === 0) return null;

  const firstSong = songs[0];
  const album: SaavnAlbum = {
    id: firstSong.id, // Use first song ID as album ID
    name: albumName || firstSong.album || "Unknown Album",
    image: firstSong.image,
    primaryArtists: firstSong.primaryArtists,
    year: firstSong.year,
    songCount: songs.length,
    language: "Unknown",
    type: "album" as const,
  };

  return { album, songs };
}

// Offline-compatible album details function
export async function getAlbumDetailsOffline(albumId: string): Promise<{
  album: SaavnAlbum;
  songs: SaavnSong[];
} | null> {
  // If online, try regular API first
  if (NetworkService.isOnline()) {
    try {
      return await getAlbumDetails(albumId);
    } catch (error) {
      console.log("Online album fetch failed, trying offline:", error);
    }
  }

  // Offline mode or online failed - try to find downloaded songs

  // Try to find songs by album ID first
  let downloadedSongs = getDownloadedSongsByAlbumId(albumId);

  // If no songs found by ID, try to match by album name from recently played
  if (downloadedSongs.length === 0) {
    const recentSongs = getRecentlyPlayedOffline();
    const albumSong = recentSongs.find(
      (song) => song.id === albumId || song.album?.includes(albumId)
    );

    if (albumSong && albumSong.album) {
      downloadedSongs = getDownloadedSongsByAlbum(albumSong.album);
    }
  }

  // Create offline album from found songs
  return createOfflineAlbumFromSongs(downloadedSongs);
}

// Get downloaded albums from recently played songs
export function getDownloadedAlbumsFromRecent(): SaavnAlbum[] {
  const downloadedSongs = getDownloadedSongs();
  const albumsMap = new Map<string, SaavnAlbum>();

  downloadedSongs.forEach((song) => {
    if (song.album && song.id) {
      const albumId = song.id; // Using song ID as album identifier for simplicity
      if (!albumsMap.has(albumId)) {
        albumsMap.set(albumId, {
          id: albumId,
          name: song.album,
          image: song.image,
          primaryArtists: song.primaryArtists,
          year: song.year,
          songCount: 1,
          type: "album" as const,
        });
      } else {
        const existing = albumsMap.get(albumId)!;
        existing.songCount = (existing.songCount || 0) + 1;
      }
    }
  });

  return Array.from(albumsMap.values());
}

// Offline-compatible home page functions
export async function getTopChartsOffline(): Promise<{
  songs: SaavnSong[];
  albums: SaavnAlbum[];
}> {
  // If offline, return only recently played downloaded content
  if (NetworkService.isOffline()) {
    const recentSongs = getRecentlyPlayedOffline();
    const recentAlbums = getDownloadedAlbumsFromRecent();

    return {
      songs: recentSongs.slice(0, 20),
      albums: recentAlbums.slice(0, 20),
    };
  }

  // If online, use regular API
  return await getTopCharts();
}

export async function getTrendingOffline(): Promise<{
  songs: SaavnSong[];
  albums: SaavnAlbum[];
}> {
  // If offline, return only recently played downloaded content
  if (NetworkService.isOffline()) {
    const recentSongs = getRecentlyPlayedOffline();
    const recentAlbums = getDownloadedAlbumsFromRecent();

    return {
      songs: recentSongs.slice(0, 20),
      albums: recentAlbums.slice(0, 20),
    };
  }

  // If online, use regular API
  return await getTrending();
} // Home page API functions
export async function getTopCharts(): Promise<{
  songs: SaavnSong[];
  albums: SaavnAlbum[];
}> {
  try {
    // Use search-based approach for more reliable results
    const [songsResponse, albumsResponse] = await Promise.allSettled([
      api<any>("/search/songs?query=bollywood hits 2024&limit=20"),
      api<any>("/search/albums?query=top albums 2024&limit=20"),
    ]);

    let songs: SaavnSong[] = [];
    let albums: SaavnAlbum[] = [];

    if (
      songsResponse.status === "fulfilled" &&
      songsResponse.value.data?.results
    ) {
      songs = songsResponse.value.data.results
        .map(mapSong)
        .filter((s: SaavnSong) => s.id);
    }

    if (
      albumsResponse.status === "fulfilled" &&
      albumsResponse.value.data?.results
    ) {
      albums = albumsResponse.value.data.results
        .map(mapAlbum)
        .filter((a: SaavnAlbum) => a.id);
    }

    return { songs: songs.slice(0, 20), albums: albums.slice(0, 20) };
  } catch (error) {
    console.error("Failed to fetch top charts:", error);
    return { songs: [], albums: [] };
  }
}

export async function getTrending(): Promise<{
  songs: SaavnSong[];
  albums: SaavnAlbum[];
}> {
  try {
    // Use search-based approach for trending content
    const trendingQueries = [
      "trending songs 2024",
      "popular hindi songs",
      "viral songs",
      "hit songs",
    ];

    const albumQueries = [
      "trending albums 2024",
      "popular albums",
      "new albums",
    ];

    const randomSongQuery =
      trendingQueries[Math.floor(Math.random() * trendingQueries.length)];
    const randomAlbumQuery =
      albumQueries[Math.floor(Math.random() * albumQueries.length)];

    const [songsResponse, albumsResponse] = await Promise.allSettled([
      api<any>(
        `/search/songs?query=${encodeURIComponent(randomSongQuery)}&limit=20`
      ),
      api<any>(
        `/search/albums?query=${encodeURIComponent(randomAlbumQuery)}&limit=20`
      ),
    ]);

    let songs: SaavnSong[] = [];
    let albums: SaavnAlbum[] = [];

    if (
      songsResponse.status === "fulfilled" &&
      songsResponse.value.data?.results
    ) {
      songs = songsResponse.value.data.results
        .map(mapSong)
        .filter((s: SaavnSong) => s.id);
    }

    if (
      albumsResponse.status === "fulfilled" &&
      albumsResponse.value.data?.results
    ) {
      albums = albumsResponse.value.data.results
        .map(mapAlbum)
        .filter((a: SaavnAlbum) => a.id);
    }

    return { songs: songs.slice(0, 20), albums: albums.slice(0, 20) };
  } catch (error) {
    console.error("Failed to fetch trending:", error);
    return { songs: [], albums: [] };
  }
}

export async function getRecommendations(): Promise<SaavnSong[]> {
  try {
    await loadStore(); // Ensure store is loaded

    let recommendations: SaavnSong[] = [];

    // Use search-based recommendations instead of problematic suggestions endpoint
    const recommendationQueries = [
      "bollywood hits",
      "hindi romantic songs",
      "punjabi songs",
      "tamil hits",
      "telugu songs",
      "popular songs",
    ];

    // If user has played songs, try to get similar content based on recently played
    if (memory.recentlyPlayed.length > 0) {
      const recentSong = memory.recentlyPlayed[0];
      if (recentSong.primaryArtists) {
        // Search for more songs by the same artist
        try {
          const artistResponse = await api<any>(
            `/search/songs?query=${encodeURIComponent(recentSong.primaryArtists)}&limit=10`
          );
          if (artistResponse.data?.results) {
            const artistSongs = artistResponse.data.results
              .map(mapSong)
              .filter((s: SaavnSong) => s.id && s.id !== recentSong.id);
            recommendations.push(...artistSongs);
          }
        } catch (e) {
          // Silent fail for artist-based recommendations
        }
      }
    }

    // Fill remaining recommendations with popular searches
    if (recommendations.length < 15) {
      const randomQuery =
        recommendationQueries[
          Math.floor(Math.random() * recommendationQueries.length)
        ];

      try {
        const fallbackResponse = await api<any>(
          `/search/songs?query=${encodeURIComponent(randomQuery)}&limit=${15 - recommendations.length}`
        );

        if (fallbackResponse.data?.results) {
          const fallbackSongs = fallbackResponse.data.results
            .map(mapSong)
            .filter((s: SaavnSong) => s.id);
          recommendations.push(...fallbackSongs);
        }
      } catch (e) {
        console.warn("Fallback recommendations failed:", e);
      }
    }

    // Remove duplicates and return
    const uniqueRecommendations = recommendations.filter(
      (song, index, self) => self.findIndex((s) => s.id === song.id) === index
    );

    return uniqueRecommendations.slice(0, 15);
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return [];
  }
}

export async function getLatestReleases(): Promise<{
  songs: SaavnSong[];
  albums: SaavnAlbum[];
}> {
  try {
    let songs: SaavnSong[] = [];
    let albums: SaavnAlbum[] = [];

    // Use search-based approach for latest releases
    const latestQueries = {
      songs: [
        "new songs 2024",
        "latest bollywood songs",
        "fresh releases",
        "new hindi songs",
      ],
      albums: [
        "new albums 2024",
        "latest album releases",
        "fresh albums",
        "new bollywood albums",
      ],
    };

    const randomSongQuery =
      latestQueries.songs[
        Math.floor(Math.random() * latestQueries.songs.length)
      ];
    const randomAlbumQuery =
      latestQueries.albums[
        Math.floor(Math.random() * latestQueries.albums.length)
      ];

    const [songsResponse, albumsResponse] = await Promise.allSettled([
      api<any>(
        `/search/songs?query=${encodeURIComponent(randomSongQuery)}&limit=20`
      ),
      api<any>(
        `/search/albums?query=${encodeURIComponent(randomAlbumQuery)}&limit=20`
      ),
    ]);

    if (
      songsResponse.status === "fulfilled" &&
      songsResponse.value.data?.results
    ) {
      songs = songsResponse.value.data.results
        .map(mapSong)
        .filter((s: SaavnSong) => s.id);
    }

    if (
      albumsResponse.status === "fulfilled" &&
      albumsResponse.value.data?.results
    ) {
      albums = albumsResponse.value.data.results
        .map(mapAlbum)
        .filter((a: SaavnAlbum) => a.id);
    }

    // Remove duplicates
    const uniqueSongs = songs.filter(
      (song, index, self) => self.findIndex((s) => s.id === song.id) === index
    );
    const uniqueAlbums = albums.filter(
      (album, index, self) => self.findIndex((a) => a.id === album.id) === index
    );

    return {
      songs: uniqueSongs.slice(0, 20),
      albums: uniqueAlbums.slice(0, 20),
    };
  } catch (error) {
    console.error("Failed to fetch latest releases:", error);
    return { songs: [], albums: [] };
  }
}

export function getRecentlyPlayedSongs(): SaavnSong[] {
  return memory.recentlyPlayed.slice(0, 20);
}

export function getRecentlyPlayedAlbums(): SaavnAlbum[] {
  // Extract unique albums from recently played songs
  const albumsMap = new Map<string, SaavnAlbum>();

  memory.recentlyPlayed.forEach((song: SaavnSong) => {
    if (song.album && song.albumId) {
      // Use the actual album ID from the API
      if (!albumsMap.has(song.albumId)) {
        albumsMap.set(song.albumId, {
          id: song.albumId,
          name: song.album,
          image: song.image,
          primaryArtists: song.primaryArtists,
          year: song.year,
          type: "album" as const,
        });
      }
    }
  });

  return Array.from(albumsMap.values()).slice(0, 20);
}

// Get downloaded songs (Exima only)
export function getDownloadedSongs() {
  return DownloadService.getDownloadedSongs().map((metadata) => ({
    id: metadata.id,
    name: metadata.name,
    primaryArtists: metadata.artist,
    album: metadata.album,
    year: metadata.year,
    image: metadata.image,
    duration: metadata.duration,
    downloadUrl: metadata.localUri,
  }));
}

// Download management functions
export async function downloadSong(song: SaavnSong) {
  return await DownloadService.downloadSong(song);
}

export async function deleteSong(songId: string) {
  return await DownloadService.deleteSong(songId);
}

export function getDownloadProgress(songId: string) {
  return DownloadService.getDownloadProgress(songId);
}

export function isDownloading(songId: string) {
  return DownloadService.isDownloading(songId);
}

// Suggestion API functions
export async function getSongSuggestions(songId: string): Promise<SaavnSong[]> {
  try {
    const response = await axios.get(
      `${SUGGESTION_API}/api/songs/${songId}/suggestions`
    );
    if (response.data.success && response.data.data.results) {
      return response.data.data.results.map((song: any) => ({
        id: song.id,
        name: song.name || song.title,
        album: song.album?.name,
        albumId: song.album?.id,
        year: song.year,
        primaryArtists:
          song.primaryArtists ||
          song.artists?.primary?.map((a: any) => a.name).join(", "),
        image: song.image?.[song.image.length - 1]?.url || song.image?.[0]?.url,
        downloadUrl: song.downloadUrl?.[song.downloadUrl.length - 1]?.url,
        duration: song.duration,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching song suggestions:", error);
    return [];
  }
}

export async function getArtistSuggestions(
  query: string
): Promise<SaavnArtist[]> {
  try {
    const response = await axios.get(
      `https://saavn.dev/api/search/artists?query=${encodeURIComponent(query)}`
    );
    if (response.data.success && response.data.data.results) {
      return response.data.data.results.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        image:
          artist.image?.[artist.image.length - 1]?.url ||
          artist.image?.[0]?.url,
        followerCount: artist.followerCount,
        type: "artist" as const,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching artist suggestions:", error);
    return [];
  }
}

export async function getMoodSongs(
  mood: string,
  limit: number = 20
): Promise<SaavnSong[]> {
  try {
    // Use search API to find songs related to the mood
    const moodQueries = {
      romantic: "romantic love songs bollywood",
      sad: "sad emotional songs hindi",
      angry: "rock metal aggressive songs",
      happy: "upbeat dance happy songs",
      chill: "chill relaxing ambient music",
      party: "party dance electronic bollywood",
      workout: "workout gym motivational songs",
      devotional: "devotional bhajan spiritual songs",
    };

    const query = moodQueries[mood as keyof typeof moodQueries] || mood;
    const response = await axios.get(`${API_BASE}/search/songs`, {
      params: { query, limit },
    });

    if (response.data.success && response.data.data.results) {
      return response.data.data.results.map((song: any) => ({
        id: song.id,
        name: song.name || song.title,
        album: song.album?.name,
        albumId: song.album?.id,
        year: song.year,
        primaryArtists:
          song.primaryArtists ||
          song.artists?.primary?.map((a: any) => a.name).join(", "),
        image: song.image?.[song.image.length - 1]?.url || song.image?.[0]?.url,
        downloadUrl: song.downloadUrl?.[song.downloadUrl.length - 1]?.url,
        duration: song.duration,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching mood songs:", error);
    return [];
  }
}

export const SaavnService = {
  searchSongs,
  searchAlbums,
  searchPlaylists,
  searchArtists,
  searchAll,
  getSong,
  getAlbum,
  getAlbumDetails,
  getPlaylist,
  getPlaylistDetails,
  incrementPlayAndMaybeCache,
  getPlayCount,
  isDownloaded,
  getBestAvailableUrl,
  getDownloadedSongs,
  downloadSong,
  deleteSong,
  getDownloadProgress,
  isDownloading,
  getTopCharts,
  getTrending,
  getRecommendations,
  getLatestReleases,
  getRecentlyPlayedSongs,
  getRecentlyPlayedAlbums,
  // Offline-compatible functions
  isOffline,
  isOnline,
  getRecentlyPlayedOffline,
  getDownloadedAlbumsFromRecent,
  getTopChartsOffline,
  getTrendingOffline,
  getAlbumDetailsOffline,
  getDownloadedSongsByAlbum,
  getDownloadedSongsByAlbumId,
  createOfflineAlbumFromSongs,
  // Suggestion functions
  getSongSuggestions,
  getArtistSuggestions,
  getMoodSongs,
};
