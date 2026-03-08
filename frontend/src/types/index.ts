export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Artist {
  id: number;
  name: string;
  bio?: string;
  imageUrl?: string;
  country?: string;
  birthDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Album {
  id: number;
  title: string;
  coverImageUrl?: string;
  releaseDate: string;
  genre?: string;
  recordLabel?: string;
  totalTracks?: number;
  duration?: string;
  createdAt: string;
  updatedAt?: string;
  artistId: number;
  artist?: Artist;
}

export interface Track {
  id: number;
  title: string;
  audioUrl?: string;
  duration: string;
  trackNumber: number;
  genre?: string;
  playCount?: number;
  createdAt: string;
  updatedAt?: string;
  albumId: number;
  album?: Album;
  artists?: Artist[];
}

export interface Playlist {
  id: number;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic: boolean;
  isCollaborative: boolean;
  createdAt: string;
  updatedAt?: string;
  createdById: number;
  createdByUser?: User;
  tracks?: PlaylistTrack[];
}

export interface PlaylistTrack {
  id: number;
  playlistId: number;
  trackId: number;
  position: number;
  addedAt: string;
  addedById?: number;
  track?: Track;
}

export interface UserFavoriteTrack {
  id: number;
  userId: number;
  trackId: number;
  favoritedAt: string;
  track?: Track;
}
