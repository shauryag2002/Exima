import { useSettingsStore } from "@/store/settingsStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { SaavnSong } from "./SongApiService";

export interface DownloadedSongMetadata {
  id: string;
  name: string;
  artist: string;
  album?: string;
  year?: string;
  image?: string;
  duration?: number;
  downloadedAt: number;
  quality: "low" | "medium" | "high";
  size: number;
  localUri: string;
  assetId?: string; // MediaLibrary asset ID
}

export interface DownloadProgress {
  songId: string;
  progress: number; // 0-1
  totalBytes?: number;
  downloadedBytes?: number;
}

class DownloadService {
  private static instance: DownloadService;
  private downloadQueue: Set<string> = new Set();
  private downloadProgress: Map<string, DownloadProgress> = new Map();
  private progressCallbacks: Set<(progress: DownloadProgress) => void> =
    new Set();
  private readonly STORAGE_KEY = "exima_downloaded_songs";
  private readonly ALBUM_NAME = "Exima Music";
  private downloadedSongs: Map<string, DownloadedSongMetadata> = new Map();
  private isInitialized = false;
  private permissionGranted: boolean | null = null; // Cache permission status

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  private constructor() {
    // Initialize permission status and load downloaded songs safely
    this.initializeAsync();
  }

  private async initializeAsync(): Promise<void> {
    try {
      // Check initial permission status without requesting
      const { status } = await MediaLibrary.getPermissionsAsync();
      this.permissionGranted = status === "granted";
      console.log("Initial permission status:", this.permissionGranted);

      // Load downloaded songs
      await this.loadDownloadedSongs();

      this.isInitialized = true;
      console.log("DownloadService initialized successfully");
    } catch (error) {
      console.error("Failed to initialize DownloadService:", error);
      this.isInitialized = true; // Continue with empty downloads map if loading fails
    }
  }

  // Safely check and request permissions with caching
  private async checkPermissions(): Promise<boolean> {
    try {
      // Return cached result if available
      if (this.permissionGranted !== null) {
        console.log("Using cached permission status:", this.permissionGranted);
        return this.permissionGranted;
      }

      console.log("Checking media library permissions...");
      const { status } = await MediaLibrary.getPermissionsAsync();

      if (status === "granted") {
        console.log("Permissions already granted");
        this.permissionGranted = true;
        return true;
      }

      console.log("Requesting media library permissions...");
      const { status: newStatus } =
        await MediaLibrary.requestPermissionsAsync();

      this.permissionGranted = newStatus === "granted";
      console.log("Permission request result:", this.permissionGranted);

      return this.permissionGranted;
    } catch (error) {
      console.error("Permission check failed:", error);
      this.permissionGranted = false;
      return false;
    }
  }

  // Reset permission cache (call this if permissions are revoked in settings)
  resetPermissionCache(): void {
    this.permissionGranted = null;
  }

  // Allow user to manually grant MediaLibrary permissions
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      console.log("User requesting MediaLibrary permissions...");
      const { status } = await MediaLibrary.requestPermissionsAsync();
      this.permissionGranted = status === "granted";
      console.log("MediaLibrary permission granted:", this.permissionGranted);
      return this.permissionGranted;
    } catch (error) {
      console.error("Failed to request MediaLibrary permissions:", error);
      this.permissionGranted = false;
      return false;
    }
  }

  // Check if MediaLibrary permissions are available
  hasMediaLibraryPermissions(): boolean {
    return this.permissionGranted === true;
  }

  // Load downloaded songs metadata from storage
  private async loadDownloadedSongs(): Promise<void> {
    try {
      console.log("Loading downloaded songs from storage...");
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      console.log("Raw stored data:", stored);

      if (stored) {
        const parsed: DownloadedSongMetadata[] = JSON.parse(stored);
        console.log("Parsed downloaded songs:", parsed.length, parsed);
        this.downloadedSongs.clear();
        parsed.forEach((song) => {
          this.downloadedSongs.set(song.id, song);
        });
        console.log("Loaded", this.downloadedSongs.size, "downloaded songs");
      } else {
        console.log("No downloaded songs found in storage");
      }
    } catch (error) {
      console.error("Failed to load downloaded songs:", error);
    }
  }

  // Save downloaded songs metadata to storage
  private async saveDownloadedSongs(): Promise<void> {
    try {
      const songs = Array.from(this.downloadedSongs.values());
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(songs));
    } catch (error) {
      console.error("Failed to save downloaded songs:", error);
    }
  }

  // Get quality-specific download URL
  private getQualityUrl(
    song: SaavnSong,
    quality: "low" | "medium" | "high"
  ): string | undefined {
    if (!song.downloadUrl) return undefined;

    // If downloadUrl is an array with quality options
    if (Array.isArray(song.downloadUrl)) {
      const qualityMap = { low: "96", medium: "160", high: "320" };
      const targetQuality = qualityMap[quality];

      const sorted = [...song.downloadUrl].sort(
        (a: any, b: any) => parseInt(b.quality) - parseInt(a.quality)
      );

      // Find exact quality or closest
      const exactMatch = sorted.find(
        (url: any) => url.quality === targetQuality
      );
      if (exactMatch) return exactMatch.link || exactMatch.url;

      // Fallback to highest available if high quality requested
      if (quality === "high") return sorted[0]?.link || sorted[0]?.url;

      // Fallback to lowest available if low quality requested
      if (quality === "low")
        return (
          sorted[sorted.length - 1]?.link || sorted[sorted.length - 1]?.url
        );

      // Medium quality fallback
      return (
        sorted[Math.floor(sorted.length / 2)]?.link ||
        sorted[Math.floor(sorted.length / 2)]?.url
      );
    }

    // If downloadUrl is a string, use as-is
    return song.downloadUrl;
  }

  // Check if WiFi is required and available
  private async checkNetworkConditions(): Promise<boolean> {
    const settings = useSettingsStore.getState();
    if (!settings.downloadOverWifiOnly) return true;

    const netInfo = await NetInfo.fetch();
    return netInfo.type === "wifi" && netInfo.isConnected === true;
  }

  // Sanitize filename for safe storage
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/[\s]{2,}/g, " ")
      .trim()
      .slice(0, 50);
  }

  // Generate proper filename with metadata
  private generateFilename(song: SaavnSong): string {
    const artist = this.sanitizeFilename(
      song.primaryArtists || "Unknown Artist"
    );
    const title = this.sanitizeFilename(song.name || "Unknown Title");
    return `${artist} - ${title}.mp3`;
  }

  // Download song with progress tracking
  async downloadSong(song: SaavnSong): Promise<DownloadedSongMetadata> {
    if (this.downloadQueue.has(song.id)) {
      throw new Error("Song is already being downloaded");
    }

    if (this.isDownloaded(song.id)) {
      return this.downloadedSongs.get(song.id)!;
    }

    // Check network conditions
    if (!(await this.checkNetworkConditions())) {
      throw new Error("WiFi connection required for downloading");
    }

    this.downloadQueue.add(song.id);

    try {
      const settings = useSettingsStore.getState();
      const downloadUrl = this.getQualityUrl(song, settings.audioQuality);

      if (!downloadUrl) {
        throw new Error("No download URL available");
      }

      const filename = this.generateFilename(song);
      const tempPath = `${FileSystem.cacheDirectory}temp_${song.id}.mp3`;

      // Initialize progress tracking
      const progressData: DownloadProgress = {
        songId: song.id,
        progress: 0,
      };
      this.downloadProgress.set(song.id, progressData);
      this.notifyProgress(progressData);

      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        tempPath,
        {},
        (downloadProgress) => {
          const { totalBytesWritten, totalBytesExpectedToWrite } =
            downloadProgress;
          const progress =
            totalBytesExpectedToWrite > 0
              ? totalBytesWritten / totalBytesExpectedToWrite
              : 0;

          const updatedProgress: DownloadProgress = {
            songId: song.id,
            progress,
            totalBytes: totalBytesExpectedToWrite,
            downloadedBytes: totalBytesWritten,
          };

          this.downloadProgress.set(song.id, updatedProgress);
          this.notifyProgress(updatedProgress);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result || result.status !== 200) {
        throw new Error(`Download failed with status: ${result?.status}`);
      }

      // Verify downloaded file
      const fileInfo = await FileSystem.getInfoAsync(tempPath);
      if (!fileInfo.exists || (fileInfo.size && fileInfo.size < 1000)) {
        throw new Error("Downloaded file is invalid or corrupted");
      }

      // Create MediaLibrary asset only if permissions are available (don't request)
      let asset;
      let finalPath;

      // Only try MediaLibrary if we have permissions (don't request them)
      if (this.permissionGranted === true) {
        try {
          console.log("Permissions available, creating MediaLibrary asset...");
          asset = await MediaLibrary.createAssetAsync(tempPath);
          finalPath = asset.uri;

          // Try to organize in Exima album (optional)
          try {
            let album = await MediaLibrary.getAlbumAsync(this.ALBUM_NAME);
            if (!album) {
              album = await MediaLibrary.createAlbumAsync(
                this.ALBUM_NAME,
                asset,
                false
              );
            } else {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }
            console.log("Successfully added to Exima album");
          } catch (albumError) {
            console.warn(
              "Failed to organize in album (continuing anyway):",
              albumError
            );
          }
        } catch (assetError) {
          console.warn(
            "Failed to create MediaLibrary asset, using app storage:",
            assetError
          );
          asset = null;
        }
      } else {
        console.log("No MediaLibrary permissions, using app storage");
      }

      // If MediaLibrary failed or no permissions, use app-internal storage
      if (!asset) {
        finalPath = `${FileSystem.documentDirectory}downloads/${filename}`;
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.documentDirectory}downloads/`,
          { intermediates: true }
        );
        await FileSystem.moveAsync({
          from: tempPath,
          to: finalPath,
        });
        console.log("Saved to app-internal storage:", finalPath);
      } else {
        // Clean up temp file if using MediaLibrary
        await FileSystem.deleteAsync(tempPath, { idempotent: true });
      }

      // Create metadata
      const metadata: DownloadedSongMetadata = {
        id: song.id,
        name: song.name,
        artist: song.primaryArtists || "Unknown Artist",
        album: song.album,
        year: song.year,
        image: song.image,
        duration: song.duration,
        downloadedAt: Date.now(),
        quality: settings.audioQuality,
        size: fileInfo.size || 0,
        localUri: finalPath || tempPath,
        assetId: asset?.id,
      };

      // Store metadata
      this.downloadedSongs.set(song.id, metadata);
      await this.saveDownloadedSongs();

      // Clean up temp file
      await FileSystem.deleteAsync(tempPath, { idempotent: true });

      // Complete progress
      const finalProgress: DownloadProgress = {
        songId: song.id,
        progress: 1,
        totalBytes: fileInfo.size,
        downloadedBytes: fileInfo.size,
      };
      this.downloadProgress.set(song.id, finalProgress);
      this.notifyProgress(finalProgress);

      return metadata;
    } finally {
      this.downloadQueue.delete(song.id);
      setTimeout(() => {
        this.downloadProgress.delete(song.id);
      }, 5000); // Keep progress for 5 seconds after completion
    }
  }

  // Check if song is downloaded
  isDownloaded(songId: string): boolean {
    return this.downloadedSongs.has(songId);
  }

  // Get downloaded song metadata
  getDownloadedSong(songId: string): DownloadedSongMetadata | undefined {
    return this.downloadedSongs.get(songId);
  }

  // Get local URI for a song if downloaded, otherwise return undefined
  getLocalUri(songId: string): string | undefined {
    const downloadedSong = this.downloadedSongs.get(songId);
    return downloadedSong?.localUri;
  }

  // Wait for initialization to complete
  async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Public method to refresh downloaded songs from storage
  async refreshDownloadedSongs(): Promise<void> {
    await this.loadDownloadedSongs();
  }

  // Debug method to check storage
  async debugStorage(): Promise<void> {
    try {
      console.log("=== DOWNLOAD SERVICE DEBUG ===");
      console.log("Storage key:", this.STORAGE_KEY);

      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      console.log("Raw stored data:", stored);

      console.log(
        "Current downloadedSongs map size:",
        this.downloadedSongs.size
      );
      console.log(
        "Current downloadedSongs content:",
        Array.from(this.downloadedSongs.entries())
      );

      // Check all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("All AsyncStorage keys:", allKeys);

      console.log("=== END DEBUG ===");
    } catch (error) {
      console.error("Debug storage error:", error);
    }
  }

  // Get all downloaded songs (Exima only)
  getDownloadedSongs(): DownloadedSongMetadata[] {
    return Array.from(this.downloadedSongs.values()).sort(
      (a, b) => b.downloadedAt - a.downloadedAt
    ); // Most recent first
  }

  // Delete downloaded song
  async deleteSong(songId: string): Promise<void> {
    const metadata = this.downloadedSongs.get(songId);
    if (!metadata) return;

    try {
      // Delete from MediaLibrary if asset ID exists
      if (metadata.assetId) {
        await MediaLibrary.deleteAssetsAsync([metadata.assetId]);
      }
    } catch (error) {
      console.warn("Failed to delete from MediaLibrary:", error);
    }

    // Remove from our records
    this.downloadedSongs.delete(songId);
    await this.saveDownloadedSongs();
  }

  // Clear all downloads
  async clearAllDownloads(): Promise<void> {
    const songs = this.getDownloadedSongs();
    for (const song of songs) {
      await this.deleteSong(song.id);
    }
  }

  // Get download progress
  getDownloadProgress(songId: string): DownloadProgress | undefined {
    return this.downloadProgress.get(songId);
  }

  // Subscribe to progress updates
  onProgressUpdate(callback: (progress: DownloadProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  private notifyProgress(progress: DownloadProgress): void {
    this.progressCallbacks.forEach((callback) => callback(progress));
  }

  // Check if song is currently being downloaded
  isDownloading(songId: string): boolean {
    return this.downloadQueue.has(songId);
  }

  // Smart caching: Auto-download after X plays
  async checkSmartCache(song: SaavnSong, playCount: number): Promise<void> {
    const settings = useSettingsStore.getState();
    if (!settings.autoDownloadOnPlay) return;
    if (this.isDownloaded(song.id)) return;
    if (this.isDownloading(song.id)) return;

    // Auto-download after threshold plays
    if (playCount >= settings.smartCacheThreshold) {
      try {
        await this.downloadSong(song);
      } catch (error) {
        console.warn("Smart cache download failed:", error);
      }
    }
  }

  // Get total storage used by downloads
  getTotalStorageUsed(): number {
    return Array.from(this.downloadedSongs.values()).reduce(
      (total, song) => total + song.size,
      0
    );
  }

  // Get storage usage by quality
  getStorageByQuality(): Record<"low" | "medium" | "high", number> {
    const usage = { low: 0, medium: 0, high: 0 };
    Array.from(this.downloadedSongs.values()).forEach((song) => {
      usage[song.quality] += song.size;
    });
    return usage;
  }
}

export default DownloadService.getInstance();
