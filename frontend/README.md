# MuseArchive Frontend

React + TypeScript + Tailwind CSS tabanlı modern müzik streaming platformu arayüzü.

## Teknolojiler

- **React 18** - Modern UI kütüphanesi
- **TypeScript** - Tip güvenli JavaScript
- **Vite** - Hızlı build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Lucide React** - Modern ikon seti
- **Axios** - HTTP client

## Kurulum

### Ön Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükle:**
```bash
npm install
```

2. **Geliştirme sunucusunu başlat:**
```bash
npm run dev
```

3. **Tarayıcıda aç:**
```
http://localhost:3000
```

## Proje Yapısı

```
src/
├── components/          # Tekrar kullanılabilir component'ler
│   ├── Layout.tsx      # Ana layout (sidebar + header)
│   └── Player.tsx      # Müzik çaler
├── pages/              # Sayfa component'leri
│   ├── Home.tsx        # Ana sayfa
│   ├── Search.tsx      # Arama sayfası
│   ├── Library.tsx     # Kütüphane sayfası
│   └── ArtistWiki.tsx  # Sanatçı wiki sayfası
├── services/           # API servis katmanı
│   └── api.ts          # Axios configuration ve API calls
├── types/              # TypeScript tipleri
│   └── index.ts        # Veri modelleri
├── App.tsx             # Ana uygulama component'i
├── main.tsx            # Uygulama giriş noktası
└── index.css           # Tailwind CSS stilleri
```

## Özellikler

### 🎨 Spotify Tarzı Arayüz
- Karanlık tema (dark mode)
- Yeşil accent renkler
- Modern ve minimalist tasarım

### 📱 Responsive Layout
- Sol sidebar navigasyon
- Ana içerik alanı
- Sabit alt müzik çaler

### 🎵 Müzik Çaler
- Play/Pause kontrolleri
- Önceki/Sonraki şarkı
- Progress bar
- Ses kontrolü
- Shuffle/Repeat modları

### 🔍 Arama ve Keşfet
- Sanatçı, albüm, şarkı arama
- Çalma listesi keşfetme
- Kategori bazlı tarama

### 📚 Kütüphane
- Kişisel çalma listeleri
- Favori şarkılar
- Dinleme geçmişi

### 📝 Sanatçı Wiki
- Sanatçı biyografileri
- Albüm bilgileri
- Popüler şarkılar

## API Bağlantısı

Frontend, backend API'sine `http://localhost:5222` adresinden bağlanır.

### Servis Katmanı
- `artistsService` - Sanatçı işlemleri
- `albumsService` - Albüm işlemleri
- `tracksService` - Şarkı işlemleri
- `playlistsService` - Çalma listesi işlemleri
- `searchService` - Arama işlemleri

### Örnek Kullanım
```typescript
import { artistsService } from '../services/api'

// Tüm sanatçıları getir
const artists = await artistsService.getAll()

// ID'ye göre sanatçı bilgisi
const artist = await artistsService.getById(1)
```

## Tailwind CSS Yapılandırması

### Tema Renkleri
- **Primary:** Yeşil (Spotify tarzı)
- **Background:** Siyah ve gri tonları
- **Text:** Beyaz ve gri tonları

### Özel Sınıflar
```css
/* Ana renk paleti */
.bg-dark-bg      /* #000000 */
.bg-dark-surface /* #121212 */
.text-primary    /* #ffffff */
.text-secondary  /* #b3b3b3 */

/* Spotify yeşili */
.text-green-500   /* #1db954 */
.bg-green-500     /* #1db954 */
```

## Build ve Deploy

### Production build:
```bash
npm run build
```

### Preview:
```bash
npm run preview
```

### Lint:
```bash
npm run lint
```

## Geliştirme Notları

- Component'ler functional components ve hooks kullanıyor
- TypeScript strict mod aktif
- Tailwind CSS utility-first yaklaşım
- API çağrıları merkezi servis katmanında
- React Router DOM ile routing

## TODO

- [ ] Kullanıcı kimlik doğrulama
- [ ] Müzik dosyası yükleme
- [ ] WebSocket ile gerçek zamanlı özellikler
- [ ] Mobil uygulama desteği
- [ ] PWA (Progressive Web App)
