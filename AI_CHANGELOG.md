# AI_CHANGELOG — MuseArchive Proje Degisiklik Gunlugu

Bu dosya, AI tarafindan yapilan tum kod degisikliklerini kayit altina alir.
GitHub'a yuklenmez (.gitignore'da).

---

## FAZ 1 — Temel Altyapi (2026-03-08)

### Backend Kurulumu
- ASP.NET Core 10 Web API projesi olusturuldu
- Entity Framework Core + SQL Server (LocalDB) entegrasyonu
- Modeller: User, Artist, Album, Track, Playlist, PlaylistTrack, TrackArtist, UserFavoriteTrack, UserFavoriteArtist, UserPlaylist
- DbContext: Tum DbSet tanimlari, OnModelCreating iliskileri
- Controller'lar: ArtistsController, AlbumsController, TracksController, PlaylistsController, SearchController, AuthController

### MusicLibraryScanner.cs
- Ilk versiyon: Klasorden .mp3 dosyalarini recursive tarar
- TagLib ile ID3 tag okuma (title, genre, duration)
- Gomulu kapak resmi cikarma (cover.jpg)
- Fallback: Klasor adindan "Artist - Album" parse etme
- GetOrCreateArtistAsync / GetOrCreateAlbumAsync ile duplicate onleme
- Dosya tasima ozelligi (sonradan kaldirildi)

### Frontend Kurulumu
- React 18 + TypeScript + Vite
- Tailwind CSS 3 + Lucide Icons
- React Router DOM ile sayfa yonlendirme
- Zustand state management (musicStore, authStore)
- i18next ile coklu dil destegi (TR/EN)

---

## FAZ 2 — Ozellik Gelistirme (2026-03-08)

### Zustand Store (musicStore.ts)
- currentTrack, queue, queueIndex, isPlaying, volume, progress
- recentlyPlayed (max 30, deduplicated)
- favorites (track ID array, localStorage persist)
- cachedTracks/cachedAlbums (session-only cache)
- Actions: playTrack, togglePlayPause, nextTrack, prevTrack, shufflePlay, setVolume, setProgress, toggleFavorite, isFavorite, setQueue, setCachedData, clearCache, setFavorites

### Player.tsx
- Audio element ile muzik calma
- Play/Pause, Skip, Seek bar, Volume kontrolu
- Repeat modu (local state)
- Sarki degistiginde play count artirma (tracksService.incrementPlayCount)
- Sanatci/album linkleri (React Router Link)
- Begeni (Heart) butonu

### Layout.tsx
- Sidebar: Logo, Navigation (Home/Search/Library), Liked Songs shortcut
- Kullanici giris/cikis alani (sidebar alt)
- Header: Sayfa basligi, Login/Avatar+Logout, Dil secici
- Startup useEffect: Oturum aciksa sunucudan favorileri yukle

### Sayfalar
- **Home.tsx**: Karsilama mesaji (saat bazli), Recently Played, Liked Songs, Albums grid, Skeleton loading
- **Search.tsx**: 350ms debounce arama, Songs/Artists/Albums sonuclari, 8 genre kategorisi (renkli kartlar), genre tiklaninca sanatcilar+sarkilar
- **Library.tsx**: Begeni kartlari, Playlist CRUD, Takip edilen sanatcilar (gercek API verileri, mock yok)
- **ArtistPage.tsx**: Hero banner, Wikipedia bio, Popular tracks (5 default, Show More/Less), Play count, Album grid, Follow/Unfollow
- **AlbumPage.tsx**: Kapak resmi, sarki listesi, Play All
- **PlaylistPage.tsx**: Playlist detay, rename, silme, sarki cikarma, Play All
- **LikedSongsPage.tsx**: Mor/mavi hero, begeni filtreleme

---

## FAZ 3 — Auth & Playlist & Follow (2026-03-08)

### JWT Authentication
- Backend: AuthController (register, login, me, favorites CRUD)
- Sifre hash: PBKDF2 (SHA256, 100K iterasyon)
- JWT: HMAC-SHA256, 30 gun, issuer/audience = "MuseArchive"
- Frontend: authStore (login, register, logout + favorites sync)
- LoginModal (login/register mode toggle, form validation)
- api.ts interceptor: localStorage'dan JWT okuma

### Playlist CRUD
- PlaylistsController: Create (DTO), Update (DTO), Delete, AddTrack, RemoveTrack
- [Authorize] attribute tum mutation endpoint'lerinde
- Frontend: Library'de inline olusturma, PlaylistPage'de rename/sil

### Sanatci Takip
- UserFavoriteArtist modeli
- ArtistsController: followed, isfollowed, follow, unfollow endpoint'leri
- ArtistPage: Follow/Unfollow butonu (UserPlus/UserCheck ikonlari)

---

## FAZ 4 — Bug Fix'ler (2026-03-08)

### Kritik: JWT Interceptor Bug
- **Sorun**: `JSON.parse(raw)?.token` → Zustand persist `{ state: { token } }` formatinda sakliyor, `.token` undefined donuyordu
- **Fix**: `JSON.parse(raw)?.state?.token`
- **Etki**: Tum [Authorize] endpoint'ler (playlist, favorites) calismaya basladi

### toggleFavorite Backend Sync
- **Sorun**: Sadece localStorage guncelliyordu, sunucuya istek atmiyordu
- **Fix**: Optimistic local update + `authService.addFavorite/removeFavorite` API cagrisi

### Login Sonrasi Favorites Yukleme
- authStore login: `authService.getFavorites()` → `setFavorites(ids)`
- Layout.tsx startup useEffect: Sayfa yenilemede favorileri sunucudan yukle
- logout: `setFavorites([])` ile temizle

### DuplicateCleanupService Genre Kolon Hatasi
- **Sorun**: Cleanup, MigrateAsync'tan once calisiyordu ama EF modeli Genre kolonunu bekliyordu (DB'de henuz yok)
- **Fix**: `.Select(a => new { a.Id, a.Name })` projection ile Genre kolonuna bagimlilik kaldirildi
- Program.cs startup sirasi: MigrateAsync → CleanDuplicatesAsync → ScanAndImportMusicLibraryAsync

### Scanner Yeniden Yazimi
- Dosya tasima tamamen kaldirildi
- Klasor adindan "Artist - Album" parse etme birincil kaynak olarak kullaniliyor
- ID3 tag'lerden sadece title, genre, duration, cover art okunuyor
- Sanatci/album ismi KLASOR ADINDAN geliyor (coklu performer sorunu cozuldu)

---

## FAZ 5 — Son Rotuslari (2026-03-10)

### Shuffle Fix (musicStore.ts)
- **Sorun**: shufflePlay sadece rastgele bir track seciyordu, queue sirasini degistirmiyordu
- **Fix**: Fisher-Yates shuffle algoritmasi ile queue'yu gercekten karistir, ilk track'ten baslat

### PlaylistsController PUT Endpoint
- **Sorun**: Tam Playlist entity bekliyordu, frontend sadece `{ name }` gonderiyordu → 400 Bad Request
- **Fix**: `UpdatePlaylistDto` (name, description) ile degistirildi, FindAsync + partial update

### Dil Secici Duzeltmesi (Layout.tsx)
- **Sorun**: Buton mevcut dili gosteriyordu (TR = Turkcedesin), kullanici "TR'ye tikla → Turkceye gec" bekliyordu
- **Fix**: Buton artik HEDEF dili gosteriyor (TR iken EN goster, EN iken TR goster)

### Header Logout Butonu (Layout.tsx)
- Header'daki avatar yanina "Cikis" butonu eklendi
- Tiklaninca: logout() + window.location.href = '/' ile anasayfaya yonlendir

### White Light / Sidewalks and Skeletons Ters Isim
- **Sorun**: Klasor adi "White Light - Sidewalks and Skeletons" → Scanner Artist=White Light, Album=Sidewalks and Skeletons olarak parse ediyordu. Gercekte Artist=Sidewalks and Skeletons, Album=White Light
- **Fix**: Klasor adi "Sidewalks and Skeletons - White Light" olarak yeniden adlandirildi, DB drop + rescan

### Dokumantasyon
- FRONTEND_KURULUM.md silindi
- .gitignore: AI_CHANGELOG.md ve PROJECT_JOURNEY.md eklendi
- README.md: Profesyonel formatta yeniden yazildi (badges, tech stack tablosu, API reference, kurulum talimatlari)
- PROJECT_JOURNEY.md: Projenin teknik hikayesi (ayri dosya)

### Degistirilen Dosyalar Ozeti

| Dosya | Degisiklik |
|-------|-----------|
| musicStore.ts | Fisher-Yates shuffle |
| Layout.tsx | Dil secici fix + Header logout |
| PlaylistsController.cs | UpdatePlaylistDto |
| PlaylistPage.tsx | Rename DTO fix |
| DuplicateCleanupService.cs | Projection ile Genre kolon hatasi fix |
| MusicLibraryScanner.cs | Dosya tasima kaldirildi, klasor adi parse |
| Program.cs | Startup sirasi: migrate → cleanup → scan |
| api.ts | JWT interceptor .state?.token fix |
| authStore.ts | login/register/logout favorites sync |
| .gitignore | AI_CHANGELOG.md + PROJECT_JOURNEY.md |
| README.md | Profesyonel guncelleme |

*Son Guncelleme: 2026-03-10*
