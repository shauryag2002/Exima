import axios from "axios";
import { SaavnSong } from "./SongApiService";

const SUGGESTION_API = "https://jiosavan-api2.vercel.app";

interface RecommendationServiceInterface {
  getSongRecommendations(songId: string): Promise<SaavnSong[]>;
  getArtistRecommendations(artistName: string): Promise<SaavnSong[]>;
  getSmartRecommendations(currentSong: SaavnSong): Promise<SaavnSong[]>;
}

class RecommendationService implements RecommendationServiceInterface {
  private cache = new Map<string, { data: SaavnSong[]; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private getCachedData(key: string): SaavnSong[] | null {
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: SaavnSong[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private mapSongFromAPI(rawSong: any): SaavnSong {
    // Extract image URL from array
    let image: string | undefined;
    if (Array.isArray(rawSong.image)) {
      const imageObj =
        rawSong.image[rawSong.image.length - 1] || rawSong.image[0];
      image = imageObj?.url;
    }

    // Extract download URL from array
    let downloadUrl: string | undefined;
    if (Array.isArray(rawSong.downloadUrl)) {
      const sortedUrls = [...rawSong.downloadUrl].sort(
        (a, b) => parseInt(b.quality) - parseInt(a.quality)
      );
      downloadUrl = sortedUrls[0]?.url;
    }

    // Extract primary artists
    let primaryArtists: string | undefined;
    if (rawSong.artists?.primary) {
      primaryArtists = rawSong.artists.primary
        .map((artist: any) => artist.name)
        .join(", ");
    }

    return {
      id: rawSong.id,
      name: rawSong.name,
      album: rawSong.album?.name,
      albumId: rawSong.album?.id,
      year: rawSong.year,
      primaryArtists,
      image,
      downloadUrl,
      duration: rawSong.duration,
    };
  }

  async getSongRecommendations(songId: string): Promise<SaavnSong[]> {
    const cacheKey = `song_${songId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(
        `${SUGGESTION_API}/api/songs/${songId}/suggestions`,
        {
          timeout: 10000,
        }
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        const songs = response.data.data
          .map((song: any) => this.mapSongFromAPI(song))
          .filter((song: SaavnSong) => song.id && song.name)
          .slice(0, 10); // Limit to 10 songs

        this.setCachedData(cacheKey, songs);
        return songs;
      }

      return [];
    } catch (error) {
      console.error("Error fetching song recommendations:", error);
      return [];
    }
  }

  async getArtistRecommendations(artistName: string): Promise<SaavnSong[]> {
    const cacheKey = `artist_${artistName}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // First, search for the artist
      const artistResponse = await axios.get(
        `${SUGGESTION_API}/api/search/artists`,
        {
          params: { query: artistName },
          timeout: 10000,
        }
      );

      if (
        !artistResponse.data.success ||
        !artistResponse.data.data?.results?.length
      ) {
        return [];
      }

      const artist = artistResponse.data.data.results[0];
      const artistId = artist.id;

      // Then get artist's songs using suggestions
      const songsResponse = await axios.get(
        `${SUGGESTION_API}/api/search/artists`,
        {
          params: { query: `${artistName}/suggestions` },
          timeout: 10000,
        }
      );

      if (
        songsResponse.data.success &&
        Array.isArray(songsResponse.data.data)
      ) {
        const songs = songsResponse.data.data
          .map((song: any) => this.mapSongFromAPI(song))
          .filter((song: SaavnSong) => song.id && song.name)
          .slice(0, 10);

        this.setCachedData(cacheKey, songs);
        return songs;
      }

      return [];
    } catch (error) {
      console.error("Error fetching artist recommendations:", error);
      return [];
    }
  }

  async getSmartRecommendations(currentSong: SaavnSong): Promise<SaavnSong[]> {
    try {
      // Strategy 1: Try to get recommendations based on the current song
      let recommendations = await this.getSongRecommendations(currentSong.id);

      // Strategy 2: If song recommendations fail or return few results, try artist-based recommendations
      if (recommendations.length < 5 && currentSong.primaryArtists) {
        const artistName = currentSong.primaryArtists.split(",")[0].trim();
        const artistRecommendations =
          await this.getArtistRecommendations(artistName);

        // Filter out the current song and merge with existing recommendations
        const filteredArtistRecs = artistRecommendations.filter(
          (song) => song.id !== currentSong.id
        );

        recommendations = [...recommendations, ...filteredArtistRecs];
      }

      // Strategy 3: If still not enough recommendations, use genre/mood-based fallback
      if (recommendations.length < 5) {
        const fallbackRecommendations =
          await this.getFallbackRecommendations(currentSong);
        recommendations = [...recommendations, ...fallbackRecommendations];
      }

      // Remove duplicates and current song, then limit to 10
      const uniqueRecommendations = recommendations
        .filter((song, index, self) => {
          return (
            song.id !== currentSong.id &&
            self.findIndex((s) => s.id === song.id) === index
          );
        })
        .slice(0, 10);

      return uniqueRecommendations;
    } catch (error) {
      console.error("Error getting smart recommendations:", error);
      return [];
    }
  }

  private async getFallbackRecommendations(
    currentSong: SaavnSong
  ): Promise<SaavnSong[]> {
    try {
      // Determine mood/genre based on song characteristics
      let searchQuery = "trending songs";

      if (currentSong.primaryArtists) {
        const artistName = currentSong.primaryArtists.toLowerCase();
        if (artistName.includes("arijit") || artistName.includes("rahat")) {
          searchQuery = "bollywood romantic songs";
        } else if (
          artistName.includes("yo yo") ||
          artistName.includes("badshah")
        ) {
          searchQuery = "hip hop rap songs";
        } else if (
          artistName.includes("guru randhawa") ||
          artistName.includes("diljit")
        ) {
          searchQuery = "punjabi hits";
        }
      }

      const response = await axios.get(`${SUGGESTION_API}/api/search/songs`, {
        params: { query: searchQuery, limit: 10 },
        timeout: 10000,
      });

      if (response.data.success && Array.isArray(response.data.data?.results)) {
        return response.data.data.results
          .map((song: any) => this.mapSongFromAPI(song))
          .filter((song: SaavnSong) => song.id && song.name)
          .slice(0, 10);
      }

      return [];
    } catch (error) {
      console.error("Error fetching fallback recommendations:", error);
      return [];
    }
  }

  // Clear cache method
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export default new RecommendationService();
