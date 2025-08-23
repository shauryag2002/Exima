# Search Tab Implementation

## Overview

This implementation creates a 3-tab search interface with Songs, Albums, and Playlists tabs using NativeWind for styling and Zustand for global state management.

## Architecture

### State Management (Zustand)

#### `searchStore.ts`

- **Purpose**: Manages search functionality for all three content types
- **Key Features**:
  - Separate search results for songs, albums, and playlists
  - Individual loading states for each tab
  - Active tab tracking
  - Search history management
  - Unified search across all content types

#### `bottomSheetStore.ts`

- **Purpose**: Manages bottom sheet functionality for song actions
- **Key Features**:
  - Configurable action buttons
  - Song selection state
  - Visibility management
  - Default actions (Play, Add to Queue, Add to Playlist, Download, Share)

### Components

#### `TabBarView.tsx`

- **Purpose**: Main tab container with custom tab bar
- **Features**:
  - 3 tabs: Songs, Albums, Playlists
  - Custom tab bar with NativeWind styling
  - State integration with search store
  - Responsive design

#### `search/SongsTab.tsx`

- **Purpose**: Display search results for songs
- **Features**:
  - Song list with artwork, title, artist, album
  - Play button integration
  - Options button for bottom sheet (future implementation)
  - Loading and error states

#### `search/AlbumsTab.tsx`

- **Purpose**: Display search results for albums
- **Features**:
  - Grid layout for album covers
  - Album navigation placeholder
  - Responsive design

#### `search/PlaylistsTab.tsx`

- **Purpose**: Display search results for playlists
- **Features**:
  - List layout with playlist info
  - Follower count and song count display
  - Navigation placeholder

#### `search.tsx`

- **Purpose**: Main search screen
- **Features**:
  - Search input with real-time state management
  - Error display
  - Empty state with onboarding
  - Tab integration

## Styling

All components use **NativeWind** exclusively for styling:

- Consistent dark theme with neutral colors
- Responsive design patterns
- Proper touch states and transitions
- Accessibility-friendly color contrasts

## State Flow

1. **Search Input**: User types in search query
2. **State Update**: `searchStore.setQuery()` updates global state
3. **Search Execution**: `searchStore.searchAll()` triggers API calls
4. **Loading States**: Individual loading states for each tab
5. **Results Display**: Results populated in respective tabs
6. **Tab Navigation**: `activeTab` state manages which tab is visible

## Future Implementation Plans

### Bottom Sheet for Songs

- Use `bottomSheetStore` for managing song actions
- Implement bottom sheet UI component
- Add functionalities:
  - Add to playlist
  - Add to queue
  - Download
  - Share

### Album and Playlist Pages

- Create dedicated pages for album/playlist details
- Implement navigation from search results
- Add song lists within albums/playlists

### API Integration

- Currently only songs API is implemented
- Add album search API integration
- Add playlist search API integration

## Type Safety

All components and stores are fully typed with TypeScript:

- `SaavnSong` interface for song data
- `SaavnAlbum` interface for album data
- `SaavnPlaylist` interface for playlist data
- `SearchTabType` for tab management
- Proper Zustand store typing

## Usage Example

```tsx
// Access search state
const { query, results, isLoading, activeTab, setQuery, searchAll } =
  useSearchStore();

// Switch tabs
setActiveTab("albums");

// Perform search
searchAll("taylor swift");

// Access bottom sheet (future)
const { showBottomSheet, hideBottomSheet } = useBottomSheetStore();
showBottomSheet(song, customActions);
```

## File Structure

```
store/
├── searchStore.ts          # Main search state management
├── bottomSheetStore.ts     # Bottom sheet functionality

components/
├── TabBarView.tsx          # Main tab container
└── search/
    ├── SongsTab.tsx        # Songs search results
    ├── AlbumsTab.tsx       # Albums search results
    └── PlaylistsTab.tsx    # Playlists search results

app/
└── search.tsx              # Main search screen
```
