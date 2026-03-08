# Frontend Kurulum ve Başlatma

## 🚀 MuseArchive Frontend Kurulumu

Frontend projemiz tamamlanmış durumda! Node.js kurulu olduğunda aşağı adımları izleyerek başlatabilirsiniz.

### 📋 Kurulum Adımları

1. **Terminali aç ve frontend klasörüne git:**
```bash
cd frontend
```

2. **Bağımlılıkları yükle:**
```bash
npm install
```

3. **Geliştirme sunucusunu başlat:**
```bash
npm run dev
```

4. **Tarayıcıda aç:**
```
http://localhost:3000
```

### 🎨 Tamamlanan Özellikler

#### ✅ Spotify Tarzı Arayüz
- **Karanlık tema:** Siyah ve gri tonları
- **Yeşil accent renkler:** Spotify'dan ilham alan tasarım
- **Modern ve minimalist:** Temiz ve kullanıcı dostu arayüz

#### ✅ Layout Yapısı
- **Sol Sidebar:** Ana Sayfa, Arama, Kütüphane navigasyonu
- **Ana içerik alanı:** Sayfa içerikleri burada gösterilir
- **Sabit alt müzik çaler:** Ekranı kaplayan player kontrolü

#### ✅ Component'ler
- **Layout.tsx:** Ana layout (sidebar + header + player)
- **Player.tsx:** Tam fonksiyonel müzik çaler
- **Home.tsx:** Spotify ana sayfası tarzı
- **Search.tsx:** Arama ve keşfet sayfası
- **Library.tsx:** Kütüphane ve çalma listeleri
- **ArtistWiki.tsx:** Sanatçı biyografileri

#### ✅ API Servis Katmanı
- **api.ts:** Merkezi API yönetimi
- **artistsService:** Sanatçı işlemleri
- **albumsService:** Albüm işlemleri
- **tracksService:** Şarkı işlemleri
- **playlistsService:** Çalma listesi işlemleri
- **searchService:** Arama işlemleri

#### ✅ Teknolojiler
- **React 18 + TypeScript:** Modern ve tip güvenli
- **Vite:** Hızlı development ve build
- **Tailwind CSS:** Utility-first styling
- **React Router DOM:** Client-side routing
- **Lucide React:** Modern ikon seti
- **Axios:** HTTP client

### 🎵 Müzik Çaler Özellikleri

- **Play/Pause:** Şarkı oynatma/durdurma
- **Önceki/Sonraki:** Şarkı geçişleri
- **Progress bar:** Şarkı ilerlemesi
- **Ses kontrolü:** Ses ayarları
- **Shuffle/Repeat:** Çalma modları
- **Şarkı bilgileri:** Başlık, sanatçı, albüm gösterimi

### 🔍 Arama ve Keşfet

- **Genel arama:** Sanatçı, albüm, şarkı, çalma listesi
- **Kategori bazlı:** Tür ve kategori filtreleme
- **Anlık sonuçlar:** Real-time arama deneyimi

### 📚 Kütüphane Özellikleri

- **Kişisel çalma listeleri:** Oluştur ve yönet
- **Favori şarkılar:** Beğenilen şarkılar
- **Dinleme geçmişi:** Son dinlenenler
- **Öneriler:** Kişiselleştirilmiş öneriler

### 📝 Sanatçı Wiki

- **Biyografi:** Detaylı sanatçı bilgileri
- **Albümler:** Sanatçı albümleri
- **Popüler şarkılar:** En çok dinlenenler
- **İlgili sanatçılar:** Benzer sanatçılar

### 🌐 Backend Bağlantısı

Frontend, backend API'sine hazır durumda:
- **Base URL:** `http://localhost:5222/api`
- **CORS:** Backend'de yapılandırılmış
- **Error handling:** Merkezi hata yönetimi
- **Authentication:** Token tabanlı (hazır)

### 🎯 Örnek API Kullanımı

```typescript
import { artistsService, searchService } from './services/api'

// Sanatçıları getir
const artists = await artistsService.getAll()

// Arama yap
const results = await searchService.search('Queen')

// Şarkı çal
await tracksService.incrementPlayCount(trackId)
```

### 📱 Responsive Tasarım

- **Masaüstü:** Full featured deneyim
- **Tablet:** Optimize edilmiş arayüz
- **Mobil:** Temel özellikler

### 🔧 Geliştirme Araçları

- **Hot reload:** Anlık değişiklik görme
- **TypeScript:** Tip güvenliği
- **ESLint:** Kod kalitesi
- **Vite:** Hızlı build

### 🚀 Başlatma Sonrası

1. **Backend'in çalıştığından emin ol:** `http://localhost:5222`
2. **Frontend'i başlat:** `npm run dev`
3. **Tarayıcıda aç:** `http://localhost:3000`
4. **Arayüzü keşfet!**

### 📝 Notlar

- Tüm component'ler hazır ve çalışır durumda
- API bağlantıları yapılandırılmış
- TypeScript tipleri tanımlanmış
- Tailwind CSS stilleri hazır
- React Router yapılandırılmış

**Proje tamamen kullanıma hazır!** 🎉
