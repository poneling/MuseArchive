<h1 align="center">MuseArchive</h1>

<p align="center">
  <strong>Spotify-inspired self-hosted music streaming platform</strong><br/>
  Built with ASP.NET Core + React + SQL Server
</p>

<p align="center">
  <img src="https://img.shields.io/badge/.NET-10.0-blueviolet" alt=".NET 10" />
  <img src="https://img.shields.io/badge/React-18-blue" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-38bdf8" alt="Tailwind" />
  <img src="https://img.shields.io/badge/SQL%20Server-LocalDB-red" alt="SQL Server" />
</p>

---

## About

MuseArchive is a full-stack music streaming web application that scans a local music folder, reads ID3 tags, and serves tracks through a modern Spotify-like UI. It features JWT authentication, playlist management, artist biographies via Wikipedia, genre-based search, and a real-time media player.

## Features

- **Music Scanner** -- Automatically imports `.mp3` files from a local folder, reads ID3 tags (title, genre, duration), extracts embedded cover art
- **Media Player** -- Play, pause, skip, seek, volume control, shuffle (Fisher-Yates), repeat, queue management
- **Authentication** -- JWT-based register/login, password hashing with PBKDF2
- **Playlists** -- Create, rename, delete playlists; add/remove tracks
- **Favorites** -- Like/unlike tracks, synced to server; dedicated "Liked Songs" page
- **Artist Pages** -- Hero banner, bio from Wikipedia API, popular tracks with play count, album grid, follow/unfollow
- **Album Pages** -- Cover art, track listing, play all
- **Search** -- Debounced full-text search across artists, albums, tracks; genre category browsing with colored cards
- **Internationalization** -- Turkish / English with one-click toggle (react-i18next)
- **Duplicate Prevention** -- Unique DB indexes + startup cleanup service

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | ASP.NET Core 10 Web API, C# |
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS 3, Lucide Icons |
| **State** | Zustand (persisted to localStorage) |
| **Database** | SQL Server (LocalDB), Entity Framework Core |
| **Auth** | JWT Bearer (HMAC-SHA256, 30-day tokens) |
| **External API** | Wikipedia REST API (artist bios) |
| **Audio Tags** | TagLib# (ID3 tag reading) |

## Project Structure

```
MuseArchive/
├── backend/MuseArchive.API/
│   ├── Controllers/        # API endpoints
│   ├── Models/              # EF Core entity models
│   ├── Data/                # DbContext + migrations
│   ├── Services/            # Scanner, WikiService, DuplicateCleanup
│   └── Program.cs           # App startup & middleware
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, Player, LoginModal, AddToPlaylistMenu
│   │   ├── pages/           # Home, Search, Library, ArtistPage, AlbumPage, PlaylistPage
│   │   ├── store/           # Zustand stores (musicStore, authStore)
│   │   ├── services/        # Axios API wrapper
│   │   └── i18n/            # Translation files (en.json, tr.json)
│   └── index.html
└── README.md
```

## Getting Started

### Prerequisites

- [.NET SDK 10.0+](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- SQL Server (LocalDB is fine -- comes with Visual Studio)
- A folder of `.mp3` files

### 1. Clone & Configure

```bash
git clone https://github.com/your-username/MuseArchive.git
cd MuseArchive
```

Edit `backend/MuseArchive.API/Program.cs` line 74 to set your music folder path:
```csharp
var musicPath = @"C:\path\to\your\music";
```

Music folder structure should be: `{Artist} - {Album}/song.mp3`

### 2. Backend

```bash
cd backend/MuseArchive.API
dotnet restore
dotnet run
```

The API starts at **http://localhost:5222**. On first run it will:
1. Apply all EF Core migrations (creates the database)
2. Clean any duplicate artists/albums
3. Scan the music folder and import tracks

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://localhost:3000**

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/auth/favorites` | User's favorite tracks |
| POST | `/api/auth/favorites/{trackId}` | Add favorite |
| DELETE | `/api/auth/favorites/{trackId}` | Remove favorite |

### Artists, Albums, Tracks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/artists` | List all artists |
| GET | `/api/artists/{id}/wiki` | Get Wikipedia bio |
| GET | `/api/tracks?limit=200` | List tracks (paginated) |
| POST | `/api/tracks/{id}/play` | Increment play count |
| GET | `/api/search?q=query` | Full-text search |
| GET | `/api/search/bygenre?genre=Rock` | Genre filter |

### Playlists
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/playlists` | Create playlist |
| PUT | `/api/playlists/{id}` | Rename playlist |
| DELETE | `/api/playlists/{id}` | Delete playlist |
| POST | `/api/playlists/{id}/addtrack` | Add track |
| DELETE | `/api/playlists/{id}/removetrack/{trackId}` | Remove track |

## Screenshots

> Coming soon

## License

MIT License
