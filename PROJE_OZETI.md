# MuseArchive - Proje Özeti

## Proje Nedir?
MuseArchive, Spotify benzeri bir müzik streaming web uygulamasıdır. Kullanıcıların müzik dinlemesine, çalma listeleri oluşturmasına, sanatçı bilgilerini görüntülemesine ve müzik araması yapmasına olanak tanır.

## Teknolojiler
- **Backend**: ASP.NET Core Web API (C#)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Veritabanı**: SQL Server
- **ORM**: Entity Framework Core

## Şu Ana Kadar Yapılanlar

### 1. Proje Yapısı
- ✅ Backend ve frontend klasörleri oluşturuldu
- ✅ ASP.NET Core Web API projesi kuruldu
- ✅ React + TypeScript projesi yapılandırıldı
- ✅ Tailwind CSS ile karanlık tema tasarlandı

### 2. Veritabanı
- ✅ 9 tablo tasarlandı:
  - Users (Kullanıcılar)
  - Artists (Sanatçılar)
  - Albums (Albümler)
  - Tracks (Şarkılar)
  - Playlists (Çalma Listeleri)
  - TrackArtist (Şarkı-Sanatçı ilişkisi)
  - PlaylistTrack (Çalma Listesi-Şarkı ilişkisi)
  - UserPlaylist (Kullanıcı-Çalma Listesi ilişkisi)
  - UserFavoriteTrack (Kullanıcı-Favori Şarkı ilişkisi)

### 3. Backend API
- ✅ Entity Framework Core modelleri oluşturuldu
- ✅ 5 adet API controller hazırlandı:
  - ArtistsController (Sanatçı işlemleri)
  - AlbumsController (Albüm işlemleri)
  - TracksController (Şarkı işlemleri)
  - PlaylistsController (Çalma listesi işlemleri)
  - SearchController (Arama işlemleri)

### 4. Frontend
- ✅ Ana sayfa tasarımı
- ✅ Arama sayfası
- ✅ Kütüphane sayfası
- ✅ Sanatçı wiki sayfası
- ✅ Yan menü ve navigasyon
- ✅ Karanlık tema tasarımı

## Temel Özellikler
- 🎵 Müzik çalar arayüzü (temel yapı)
- 📝 Sanatçı biyografileri (wiki modülü)
- 📚 Çalma listesi yönetimi
- 🔍 Gelişmiş arama motoru
- 🎨 Modern karanlık arayüz

## API Endpoints
- 25+ adet hazır endpoint
- CRUD işlemleri (Create, Read, Update, Delete)
- İlişkili veri sorgulama
- Arama ve filtreleme

## Proje Durumu
**Tamamlanan:** %70
- ✅ Veritabanı tasarımı
- ✅ Backend API
- ✅ Frontend temel yapısı

**Devam Eden:** %30
- 🔄 Müzik çaler fonksiyonları
- 🔄 Kullanıcı kimlik doğrulama
- 🔄 Dosya yükleme (ses, resim)

## Başlatma
```bash
# Backend
cd backend/MuseArchive.API
dotnet restore
dotnet run

# Frontend
cd frontend
npm install
npm run dev
```

## Sonraki Adımlar
1. Müzik çaler bileşenleri
2. Kullanıcı girişi sistemi
3. Ses dosyası yükleme
4. Gerçek zamanlı özellikler (WebSocket)

Proje, modern web teknolojileriyle geliştirilen tam teşekküllü bir müzik platformu altyapısına sahiptir.
