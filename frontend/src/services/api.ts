import axios from 'axios';

const API_BASE_URL = 'http://localhost:5222/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — reads JWT from Zustand persist store
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('musearchive-auth');
      const token = raw ? JSON.parse(raw)?.state?.token : null;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { /* ignore parse errors */ }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// API Services
export const artistsService = {
  getAll: () => api.get('/artists'),
  getById: (id: number) => api.get(`/artists/${id}`),
  create: (data: any) => api.post('/artists', data),
  update: (id: number, data: any) => api.put(`/artists/${id}`, data),
  delete: (id: number) => api.delete(`/artists/${id}`),
  getFollowed: (userId: number) => api.get(`/artists/followed?userId=${userId}`),
  isFollowed: (artistId: number, userId: number) => api.get(`/artists/${artistId}/isfollowed?userId=${userId}`),
  follow: (artistId: number, userId: number) => api.post(`/artists/${artistId}/follow`, { userId }),
  unfollow: (artistId: number, userId: number) => api.delete(`/artists/${artistId}/unfollow?userId=${userId}`),
  getWiki: (artistId: number) => api.get(`/artists/${artistId}/wiki`),
};

export const authService = {
  login: (usernameOrEmail: string, password: string) => api.post('/auth/login', { usernameOrEmail, password }),
  register: (username: string, email: string, password: string) => api.post('/auth/register', { username, email, password }),
  getFavorites: () => api.get('/auth/favorites'),
  addFavorite: (trackId: number) => api.post(`/auth/favorites/${trackId}`, {}),
  removeFavorite: (trackId: number) => api.delete(`/auth/favorites/${trackId}`),
};

export const albumsService = {
  getAll: () => api.get('/albums'),
  getById: (id: number) => api.get(`/albums/${id}`),
  getByArtist: (artistId: number) => api.get(`/albums/byartist/${artistId}`),
  create: (data: any) => api.post('/albums', data),
  update: (id: number, data: any) => api.put(`/albums/${id}`, data),
  delete: (id: number) => api.delete(`/albums/${id}`),
};

export const tracksService = {
  getAll: (limit = 200) => api.get('/tracks', { params: { limit } }),
  getById: (id: number) => api.get(`/tracks/${id}`),
  getByAlbum: (albumId: number) => api.get(`/tracks/byalbum/${albumId}`),
  getByArtist: (artistId: number) => api.get(`/tracks/byartist/${artistId}`),
  getByGenre: (genre: string) => api.get(`/tracks/bygenre/${encodeURIComponent(genre)}`),
  create: (data: any) => api.post('/tracks', data),
  update: (id: number, data: any) => api.put(`/tracks/${id}`, data),
  delete: (id: number) => api.delete(`/tracks/${id}`),
  incrementPlayCount: (id: number) => api.post(`/tracks/${id}/play`),
};

export const playlistsService = {
  getAll: () => api.get('/playlists'),
  getById: (id: number) => api.get(`/playlists/${id}`),
  getByUser: (userId: number) => api.get(`/playlists/byuser/${userId}`),
  create: (data: any) => api.post('/playlists', data),
  update: (id: number, data: any) => api.put(`/playlists/${id}`, data),
  delete: (id: number) => api.delete(`/playlists/${id}`),
  addTrack: (playlistId: number, data: any) => api.post(`/playlists/${playlistId}/addtrack`, data),
  removeTrack: (playlistId: number, trackId: number) => api.delete(`/playlists/${playlistId}/removetrack/${trackId}`),
};

export const searchService = {
  search: (query: string, limit: number = 20) => 
    api.get('/search', { params: { q: query, limit } }),
  searchArtists: (query: string, limit: number = 20) => 
    api.get('/search/artists', { params: { q: query, limit } }),
  searchAlbums: (query: string, limit: number = 20) => 
    api.get('/search/albums', { params: { q: query, limit } }),
  searchTracks: (query: string, limit: number = 20) => 
    api.get('/search/tracks', { params: { q: query, limit } }),
  searchPlaylists: (query: string, limit: number = 20) => 
    api.get('/search/playlists', { params: { q: query, limit } }),
  searchByGenre: (genre: string, limit: number = 30) =>
    api.get('/search/bygenre', { params: { genre, limit } }),
};

export default api;
