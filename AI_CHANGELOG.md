# AI_CHANGELOG — MuseArchive Proje Değişiklik Günlüğü

Bu dosya, AI tarafından yapılan her kod değişikliğini, alınan mimari kararları ve tamamlanan adımları kayıt altına alır.

---

## [2026-03-08] — 5 Adımlı Büyük Güncelleme

### ADIM 1 — MusicLibraryScanner.cs Yeniden Yazıldı
**Dosya:** `backend/MuseArchive.API/Services/MusicLibraryScanner.cs`

**Değişiklikler:**
- Eski klasör-adı tabanlı parsing tamamen kaldırıldı.
- Tüm `.mp3` dosyaları **recursive** olarak taranır (`SearchOption.AllDirectories`).
- Her dosya için **TagLib** ile gerçek ID3 tag'leri okunur: `Artist`, `Album`, `Title`, `Genre`, `Duration`.
- Tag boşsa fallback: klasör adından `Artist - Album` formatında parse edilir.
- Fiziksel dosya organizasyonu: `{musicPath}/{CleanArtist}/{CleanAlbum}/dosya.mp3` hiyerarşisine taşınır.
- `CleanPathName()`: Windows'ta geçersiz dosya karakterleri temizlenir, max 100 karakter.
- Çakışan dosya adları için UUID suffix eklenir.
- Boş klasörler taşıma sonrası silinir (`CleanEmptyDirectories`).
- DB'ye `Genre` alanı da kaydedilir.
- `audioUrl`: `Path.GetRelativePath()` ile gerçek path'ten oluşturulur (URL encoding yok).

**Mimari Karar:** ID3 tag → fiziksel taşıma → DB kaydı sırası benimsendi. Bu sayede DB her zaman dosya sisteminin gerçek durumunu yansıtır.

---

### ADIM 2 — Layout.tsx Sidebar Temizliği
**Dosya:** `frontend/src/components/Layout.tsx`

**Değişiklikler:**
- Tüm şarkı listesi (`tracks.map(...)`) sidebar'dan kaldırıldı.
- `tracksService.getAll()` çağrısı Layout'tan kaldırıldı.
- Tüm local player state (`isPlaying`, `currentTrack`, `progress` vb.) kaldırıldı — Zustand store'a taşındı.
- Sidebar artık sadece: Logo, Navigation (Home/Search/Library), Your Library (Liked Songs shortcut) içeriyor.
- `Player` componenti artık props almıyor, kendi store'undan okuyor: `<Player />`.

---

### ADIM 2b — Player.tsx Zustand Entegrasyonu
**Dosya:** `frontend/src/components/Player.tsx`

**Değişiklikler:**
- Tüm prop interface'i kaldırıldı (`PlayerProps`).
- `useMusicStore` ile state okur: `currentTrack`, `isPlaying`, `volume`, `togglePlayPause`, `nextTrack`, `prevTrack`, `shufflePlay`, `setVolume`, `toggleFavorite`, `isFavorite`.
- `repeat` state'i Player'da local kalır (loop için).
- `<audio>` element track değişince yeniden yüklenir, otomatik çalar.
- Volume mute/unmute butonu eklendi (`VolumeX` icon).
- Seek bar tıklanabilir, `audio.currentTime` güncellenir.
- Player'da Like (Heart) butonu eklendi — store'daki `toggleFavorite` ile bağlı.

---

### Zustand Store Kurulumu
**Dosya:** `frontend/src/store/musicStore.ts`  
**Paket:** `npm install zustand`

**Store State:**
- `currentTrack`, `queue`, `queueIndex`, `isPlaying`, `volume`, `progress`
- `recentlyPlayed` (max 30, deduplicated)
- `favorites` (track ID array)

**Persist:** `recentlyPlayed`, `favorites`, `volume` → `localStorage` üzerinde `musearchive-store` key'iyle saklanır.

**Actions:** `playTrack`, `togglePlayPause`, `nextTrack`, `prevTrack`, `shufflePlay`, `setVolume`, `setProgress`, `toggleFavorite`, `isFavorite`, `setQueue`

---

### ADIM 3 — ArtistPage.tsx + Route
**Dosya (yeni):** `frontend/src/pages/ArtistPage.tsx`  
**Dosya:** `frontend/src/App.tsx`

**Değişiklikler:**
- `/artist/:id` route'u `ArtistWiki` yerine yeni `ArtistPage` componentini kullanıyor.
- `ArtistPage` özellikleri:
  - Hero banner (sanatçı adı, track/album sayısı)
  - "Play All" butonu → tüm şarkıları queue'ya atar
  - About / Bio bölümü
  - "Popular" track listesi (max 20, double-click veya tıkla çal)
  - Like butonu her track'in yanında
  - Albums grid (5'li grid, hover'da Play butonu)
- `artistsService.getById()` + `tracksService.getByArtist()` paralel çağrılır.

---

### ADIM 4 — Search.tsx Backend Entegrasyonu
**Dosya:** `frontend/src/pages/Search.tsx`

**Değişiklikler:**
- 350ms **debounce** ile `searchService.search()` çağrısı yapılır.
- Sonuçlar: Songs, Artists, Albums — ayrı bölümler halinde gösterilir.
- **Play all** butonu her bölümde.
- Sanatçı kartlarına tıklayınca `/artist/:id` sayfasına gidilir.
- **Browse Categories**: 8 genre kartı (renkli gradient).
- Genre kartına tıklanınca `tracksService.getByGenre()` çağrısı yapılır, sonuçlar listelenir.
- Aynı genre'ye tekrar tıklayınca toggle (kapat).
- Arama yaparken genre bölümü gizlenir, boş sorguda kategori bölümü gösterilir.
- Heart butonu her track için — store'dan `toggleFavorite`.

**Backend:** `GET /api/Tracks/ByGenre/{genre}` endpoint'i eklendi (`TracksController.cs`).

---

### ADIM 5 — Home.tsx Güncellendi
**Dosya:** `frontend/src/pages/Home.tsx`

**Değişiklikler:**
- Zustand `recentlyPlayed` array'i hero bölümünde "Quick Picks" olarak gösterilir (henüz boşsa tüm trackler).
- **Recently played** bölümü: yatay kaydırılabilir (`overflow-x-auto`), kartlar.
- **Liked songs** bölümü: `favorites` store'dan, grid formatında.
- **Albums** bölümü: API'den çekilir, hover'da Play.
- **All tracks** bölümü: Henüz hiç dinlenmemişse fallback olarak gösterilir.
- Her kart üzerinde Heart butonu (store ile bağlı).
- Saatine göre karşılama mesajı: Good morning / afternoon / evening.

---

### api.ts Güncellemesi
**Dosya:** `frontend/src/services/api.ts`

- `tracksService.getByGenre(genre)` eklendi → `GET /api/tracks/bygenre/{genre}`

---

## Önemli Mimari Kararlar

| Karar | Gerekçe |
|-------|---------|
| Zustand ile global state | Context API'ye göre daha az boilerplate, persist middleware ile localStorage entegrasyonu |
| Player prop-free | Layout ile coupling'i ortadan kaldırır, herhangi bir sayfadan tetiklenebilir |
| ID3 tag önceliği | Klasör adlarından çok daha güvenilir, sanatçı/albüm verisi doğru |
| Fiziksel dosya taşıma | Tek seferlik çalışır, mevcut dosyalar zaten doğru yerdeyse taşınmaz |
| `audioUrl` = relative path (URL encoding yok) | Browser URL encoding yapar, static file middleware decode eder |

---

## Aktif Servisler

| Servis | Port | Durum |
|--------|------|-------|
| Backend (.NET) | http://localhost:5222 | ✅ |
| Frontend (Vite) | http://localhost:3000 | ✅ |

---

*Son Güncelleme: 2026-03-08*

---

## [2026-03-08] — FAZ 2: Platform Olgunlaştırma

### FAZ2-ADIM1 — Scanner İyileştirmeleri + Kapak Fotoğrafları
**Dosya:** `backend/MuseArchive.API/Services/MusicLibraryScanner.cs`

**Değişiklikler:**
- `AlbumArtists` artık `Performers`'dan önce okunuyor — compilation albümlerinde sanatçı tutarsızlığı giderildi.
- `FirstNonEmpty(tag.AlbumArtists?.FirstOrDefault(...), tag.Performers?.FirstOrDefault(...))` sırası.
- **Kapak fotoğrafı extraction:** `tag.Pictures` içinde `FrontCover` öncelikli, yoksa ilk resim alınır.
- Kapak verisi `cover.jpg` olarak `{musicPath}/{Artist}/{Album}/cover.jpg`'e yazılır.
- `GetOrCreateAlbumAsync` artık `coverImageUrl?` parametresi alır; mevcut albümlerin cover'ı null ise güncellenir.
- Skip durumunda (track zaten DB'de) bile cover URL güncellemesi yapılır.

### FAZ2-ADIM2 — AlbumPage + Routing + Player UI
**Dosya (yeni):** `frontend/src/pages/AlbumPage.tsx`  
**Dosya:** `frontend/src/App.tsx`  
**Dosya:** `frontend/src/pages/Home.tsx`

**Değişiklikler:**
- `AlbumPage.tsx`: Hero bölümü (kapak, albüm adı, sanatçı, yıl, şarkı sayısı), Play All butonu, şarkı listesi (track num sırası, double-click çal, like butonu, süre).
- Albüm kapağı `<img>` tag'i ile gösterilir (`onError` fallback ile).
- `/album/:id` route `App.tsx`'e eklendi.
- Home.tsx albüm kartları `/album/:id`'ye bağlandı; kapak görseli varsa gösterilir; sanatçı adı `/artist/:id`'ye yönlendirir. Nested `<a>` sorunu `<div>+<Link>` yapısıyla çözüldü.

### FAZ2-ADIM3 — JWT Authentication Sistemi

**Backend:**
- **Paket:** `Microsoft.AspNetCore.Authentication.JwtBearer v9.0.3` eklendi.
- **`AuthController.cs` (yeni):** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/auth/favorites`, `POST /api/auth/favorites/{trackId}`, `DELETE /api/auth/favorites/{trackId}`.
- **Şifre hash:** .NET built-in PBKDF2 (Rfc2898DeriveBytes, SHA256, 100.000 iterasyon) — ekstra NuGet paketi gerekmez.
- **JWT üretimi:** HMAC-SHA256, 30 günlük token, issuer/audience = "MuseArchive".
- **`appsettings.json`:** `Jwt.Secret` key eklendi.
- **`Program.cs`:** `AddAuthentication(JwtBearer)` + `UseAuthentication()` eklendi.

**Frontend:**
- **`authStore.ts` (yeni):** Zustand + persist — `user`, `token`, `isAuthenticated`, `login()`, `register()`, `logout()`.
- **`LoginModal.tsx` (yeni):** Login/Register modal; form validation, error gösterimi, mode toggle.
- **`Layout.tsx`:** Sidebar'ın altında kullanıcı bilgisi veya "Log in" butonu; header'da da "Log in" / avatar gösterilir.

### FAZ2-ADIM4 — ArtistWikiService (Wikipedia Entegrasyonu)

**Backend:**
- **`ArtistWikiService.cs` (yeni):** `GET https://en.wikipedia.org/api/rest_v1/page/summary/{name}` çağrısı; "extract" alanından max 1000 karakter alınır.
- DB'de `Bio` boş veya default ise Wikipedia'dan çeker, DB'ye yazar; doluysa direkt döner.
- `IHttpClientFactory` kullanılır — `AddHttpClient()` ile kayıtlı.
- **`ArtistsController`:** `GET /api/artists/{id}/wiki` endpoint'i eklendi.
- **`Program.cs`:** `AddScoped<ArtistWikiService>()` eklendi.

**Frontend:**
- **`ArtistPage.tsx`:** `api.get('/artists/{id}/wiki')` non-blocking çağrısı; `wikiBio` state'i — Wikipedia bio DB bio'dan önce gelir.

### FAZ2-ADIM5 — Çok Dil Desteği (i18n)

**Paketler:** `react-i18next`, `i18next` kuruldu.

**Dosyalar (yeni):**
- `src/i18n/en.json` — İngilizce çeviriler (nav, sidebar, home, search, player, artist, album, auth, language)
- `src/i18n/tr.json` — Türkçe çeviriler
- `src/i18n/i18n.ts` — i18next init; `localStorage`'dan dil tercihi okunur.

**Güncellenen dosyalar:**
- `main.tsx`: `import './i18n/i18n'` eklendi.
- `Layout.tsx`: `useTranslation()` ile nav, sidebar, auth butonları çevrildi; header sağına **TR/EN dil değiştirici butonu** eklendi (toggle + localStorage persist).
- `Home.tsx`: greeting, section başlıkları, loading mesajı çevrildi; `t` adı çakışmasını önlemek için lambda parametreleri `track`/`tr`/`al` olarak yeniden adlandırıldı.
- `Search.tsx`: başlık, placeholder, no-results, section başlıkları, "Browse Categories", "Play all" çevrildi.

**Mimari Kararlar:**
| Karar | Gerekçe |
|-------|---------|
| PBKDF2 yerine BCrypt kullanmama | Ekstra NuGet paketi gerektirmez, .NET built-in |
| JWT v9 (net10 projede) | net10 için resmi JWT Bearer paketi henüz net10'u hedeflemez; v9 ile uyumlu |
| `localStorage.setItem('musearchive-lang', next)` | i18next'in kendi persist mekanizması yerine manuel — daha öngörülü |
| Wikipedia bio non-blocking | Sayfa yüklemesini yavaşlatmaz; bio sidebar'da ayrıca yüklenir |

---

## [2026-03-08] — FAZ 3: Bug Fix'ler + Auth + Playlist CRUD + Artist Follow

### FAZ3-ADIM1 — Bug Fix'ler & UI Düzenlemeleri

**i18n Dil Tersliği Düzeltmesi** (`Layout.tsx`)
- **Problem:** Buton SONRAKI dili gösteriyordu; kullanıcı "TR" görerek Türkçe modda olduğunu sanıyordu.
- **Fix:** `i18n.resolvedLanguage` kullanıma alındı. Buton artık **MEVCUT** dili gösterir (EN → İngilizce'desin, TR → Türkçe'desin). Hover tooltip ile hedef dil belirtilir.
- `currentLang = i18n.resolvedLanguage ?? i18n.language` yapısı eklendi.

**Login Butonu Konumu** (`Layout.tsx`)
- Login/Avatar butonu ve dil seçici ayrı elementler yerine tek `<div className="flex items-center gap-2">` içine alındı.
- Sıra: `[Avatar/Login] [EN|TR]` — login butonu dil seçicinin solunda.

**Player Yönlendirme Linkleri** (`Player.tsx`)
- `Link` importu eklendi.
- Sanatçı adı → `<Link to="/artist/:artistId">` tıklanabilir hale getirildi.
- Albüm adı → `<Link to="/album/:albumId">` sanatçı adının yanına `·` separator ile eklendi.
- Her ikisi de sadece `currentTrack?.artistId` / `currentTrack?.albumId` mevcutsa gösterilir.

### FAZ3-ADIM2 — Auth Sistem Düzeltmesi

**`frontend/src/services/api.ts`**
- **Problem:** JWT interceptor `localStorage.getItem('authToken')` okuyordu; bu key hiç doldurulmuyordu.
- **Fix:** Zustand persist store'dan token okunur: `JSON.parse(localStorage.getItem('musearchive-auth'))?.token`
- `authService` eklendi: `login`, `register`, `getFavorites`, `addFavorite`, `removeFavorite`.

### FAZ3-ADIM3 — Library Sayfası Temizliği

**`frontend/src/pages/Library.tsx`** — Komple yeniden yazıldı.
- Tüm mock data (`[1,2,3,4,5].map(...)` placeholder'ları) silindi.
- **Giriş yapmamış kullanıcı:** `LogIn` ikonu + açıklama mesajı.
- **Beğenilen Şarkılar kartı:** Mor/mavi gradient, `favorites.length` şarkı sayısı, `/liked` rotasına yönlendir.
- **Çalma Listelerim:** `playlistsService.getByUser(user.id)` ile gerçek listeler. Boşsa "Henüz liste yok" mesajı + inline oluştur butonu. Her kart üzerinde hover'da çöp ikonu ile silme.
- **Takip Edilen Sanatçılar:** `artistsService.getFollowed(user.id)` ile gerçek sanatçı listesi, `/artist/:id` linkleri.
- **Yeni Çalma Listesi butonu:** Header'da buton → inline isim input → Enter ile oluştur + `/playlist/:id` yönlendir.

**Yeni sayfa:** `frontend/src/pages/LikedSongsPage.tsx`
- Beğenilen şarkıları musicStore favorites ile filtreler ve gösterir.
- Mor/mavi hero alanı, Play All butonu, şarkı listesi.

### FAZ3-ADIM4 — Playlist CRUD

**Backend — `PlaylistsController.cs`:** Mevcut endpoint'ler yeterliydi (Create, Rename/PUT, Delete, AddTrack, RemoveTrack). Ek değişiklik gerekmedi.

**`frontend/src/components/AddToPlaylistMenu.tsx`** — Yeni reusable component
- Şarkı satırlarında `<ListPlus>` ikonu ile açılan dropdown.
- Açıldığında `playlistsService.getByUser()` ile kullanıcının listelerini çeker.
- Listeye tıklanınca `playlistsService.addTrack()` çağrısı yapılır.
- Başarılı eklemede `<Check>` ikonu gösterilir, 800ms sonra kapanır.
- Dışarı tıklanınca otomatik kapanır.
- Auth yoksa hiç render edilmez.

**`frontend/src/pages/PlaylistPage.tsx`** — Yeni sayfa (`/playlist/:id`)
- Hero: gradient, playlist adı, şarkı sayısı.
- **Yeniden adlandırma:** Pencil ikonu → inline input → Enter ile kaydet.
- **Silme:** Trash ikonu → window.confirm → delete → `/library` yönlendir.
- Şarkı listesi: position sıralı, double-click çal, ♡ like, Trash ile şarkıyı listeden çıkar, artist/album linkleri.
- `isOwner` kontrolü (yeniden adlandır/sil sadece oluşturucu için).

**`App.tsx`:** `/playlist/:id` ve `/liked` rotaları eklendi.

**`AlbumPage.tsx`, `ArtistPage.tsx`:** `AddToPlaylistMenu` bileşeni track satırlarına eklendi.

**`api.ts`:** `playlistsService` zaten mevcuttu, ek endpoint yok.

### FAZ3-ADIM5 — Sanatçı Takip Etme

**Backend:**
- **`Models/UserFavoriteArtist.cs`** — Yeni model: `UserId`, `ArtistId`, `FollowedAt`.
- **`Data/MuseArchiveDbContext.cs`:** `UserFavoriteArtists` DbSet + EF Core konfigürasyonu (unique index, cascade delete, GETUTCDATE default).
- **`Controllers/ArtistsController.cs`:** Yeni endpoint'ler:
  - `GET /api/artists/followed?userId=` — kullanıcının takip ettikleri
  - `GET /api/artists/{id}/isfollowed?userId=` — tekil kontrol
  - `POST /api/artists/{id}/follow` — takip et (body: `{userId}`)
  - `DELETE /api/artists/{id}/unfollow?userId=` — takibi bırak
- `UserActionRequest` DTO sınıfı eklendi.

**Frontend:**
- **`ArtistPage.tsx`:** `followed` + `followLoading` state, `handleFollow()` fonksiyonu, `isAuthenticated` kontrolü.
  - Takip edilmiyorsa: `<UserPlus>` + "Takip Et" butonu (border outline stil).
  - Takip ediliyorsa: `<UserCheck>` + "Takip Ediliyor" (hover'da kırmızıya döner).
  - Sayfa yüklenince `artistsService.isFollowed()` ile mevcut durum kontrol edilir.
- **`api.ts`:** `artistsService.getFollowed`, `isFollowed`, `follow`, `unfollow`, `getWiki` eklendi.

**Doğrulama:**
- `npx tsc --noEmit` → exit 0 ✅
- Backend `error CS` → yok ✅

> **ÖNEMLİ — Backend Yeniden Başlatma Gerekli:**
> `UserFavoriteArtist` tablosu DB'de oluşturulması için backend restart + `EnsureCreated` veya migration çalıştırılmalıdır.
> Eğer SQLite kullanıyorsanız DB dosyasını silin veya migration ekleyin: `dotnet ef migrations add AddUserFavoriteArtist && dotnet ef database update`
