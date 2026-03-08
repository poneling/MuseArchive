# MuseArchive

Spotify benzeri bir müzik streaming web uygulaması.

## Teknik Stack

- **Backend**: ASP.NET Core Web API (C#)
- **Frontend**: React + Tailwind CSS
- **Veritabanı**: SQL Server
- **ORM**: Entity Framework Core

## Proje Yapısı

```
MuseArchive/
├── backend/           # ASP.NET Core Web API
├── frontend/          # React uygulaması
├── docs/             # Proje dokümantasyonu
└── README.md         # Bu dosya
```

## Temel Özellikler

- 🎵 Şık Müzik Çalar arayüzü (Play/Pause/Queue)
- 📝 Sanatçı biyografilerini gösteren Wiki Modülü
- 📚 Çalma listesi oluşturma ve favorilere ekleme (Library)
- 🔍 Gelişmiş Arama motoru

## Veritabanı Şeması

- **Users** - Kullanıcı bilgileri
- **Artists** - Sanatçı bilgileri
- **Albums** - Albüm bilgileri
- **Tracks** - Şarkı bilgileri
- **Playlists** - Çalma listeleri

## Kurulum

### Backend
```bash
cd backend/MuseArchive.API
dotnet restore
dotnet run
```

Backend https://localhost:7001 adresinde çalışacaktır.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend http://localhost:3000 adresinde çalışacaktır.

## Proje Durumu

 **Tamamlanan Özellikler:**
- Proje yapısı oluşturma
- ASP.NET Core Web API backend kurulumu
- React + TypeScript + Tailwind CSS frontend kurulumu
- SQL Server veritabanı şeması (Users, Artists, Albums, Tracks, Playlists)
- Entity Framework Core modelleri ve DbContext
- Temel API controller'ları (Artists, Albums, Tracks, Playlists, Search)

 **Devam Eden Özellikler:**
- Frontend dependency'lerinin yüklenmesi (npm install gerekiyor)
- Müzik çalar arayüzü
- Kullanıcı kimlik doğrulama
- Dosya yükleme (audio, image)

## API Endpoints

### Artists
- `GET /api/artists` - Tüm sanatçıları listele
- `GET /api/artists/{id}` - Sanatçı detayları
- `POST /api/artists` - Yeni sanatçı ekle
- `PUT /api/artists/{id}` - Sanatçı güncelle
- `DELETE /api/artists/{id}` - Sanatçı sil

### Albums
- `GET /api/albums` - Tüm albümleri listele
- `GET /api/albums/{id}` - Albüm detayları
- `GET /api/albums/byartist/{artistId}` - Sanatçıya göre albümler
- `POST /api/albums` - Yeni albüm ekle
- `PUT /api/albums/{id}` - Albüm güncelle
- `DELETE /api/albums/{id}` - Albüm sil

### Tracks
- `GET /api/tracks` - Tüm şarkıları listele
- `GET /api/tracks/{id}` - Şarkı detayları
- `GET /api/tracks/byalbum/{albumId}` - Albüme göre şarkılar
- `GET /api/tracks/byartist/{artistId}` - Sanatçıya göre şarkılar
- `POST /api/tracks` - Yeni şarkı ekle
- `PUT /api/tracks/{id}` - Şarkı güncelle
- `DELETE /api/tracks/{id}` - Şarkı sil
- `POST /api/tracks/{id}/play` - Şarkı dinleme sayısını artır

### Playlists
- `GET /api/playlists` - Tüm çalma listelerini listele
- `GET /api/playlists/{id}` - Çalma listesi detayları
- `GET /api/playlists/byuser/{userId}` - Kullanıcıya göre çalma listeleri
- `POST /api/playlists` - Yeni çalma listesi oluştur
- `PUT /api/playlists/{id}` - Çalma listesi güncelle
- `DELETE /api/playlists/{id}` - Çalma listesi sil
- `POST /api/playlists/{id}/addtrack` - Çalma listesine şarkı ekle
- `DELETE /api/playlists/{id}/removetrack/{trackId}` - Çalma listesinden şarkı çıkar

### Search
- `GET /api/search?q=query` - Genel arama
- `GET /api/search/artists?q=query` - Sanatçı arama
- `GET /api/search/albums?q=query` - Albüm arama
- `GET /api/search/tracks?q=query` - Şarkı arama
- `GET /api/search/playlists?q=query` - Çalma listesi arama

## Lisans

MIT License
