# AI Asistan - Full Stack Application

Modern React + Node.js + PostgreSQL tabanlı full stack uygulama.

## 🏗️ Proje Yapısı

```
AI-asistan/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Node.js + Express + TypeScript
├── shared/            # Ortak tipler ve utilities
└── package.json       # Workspace yönetimi
```

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin
```bash
npm run install:all
```

### 2. PostgreSQL Veritabanını Kurun
1. PostgreSQL 16.x'i yükleyin
2. pgAdmin 4 ile `aiasist_db` veritabanını oluşturun
3. `backend/database_setup.sql` script'ini çalıştırın

### 3. Environment Dosyalarını Oluşturun

**Backend (.env):**
```env
PORT=3001
DB_USER=postgres
DB_HOST=localhost
DB_NAME=aiasist_db
DB_PASSWORD=omercan095211
DB_PORT=5432
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

## 🏃‍♂️ Çalıştırma

### Geliştirme Modu (Hem Frontend + Backend)
```bash
npm run dev
```

### Sadece Frontend
```bash
npm run dev:frontend
```

### Sadece Backend
```bash
npm run dev:backend
```

## 🔐 Demo Kullanıcı

- **Email:** `demo@kt.com`
- **Şifre:** `demo123`

## 📡 API Endpoints

- `GET /api/health` - Sağlık kontrolü
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/verify` - Token doğrulama
- `PUT /api/auth/profile` - Profil güncelleme

## 🛠️ Teknolojiler

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- JWT Authentication
- bcryptjs

### Veritabanı
- PostgreSQL 16
- pgAdmin 4

## 📁 Dosya Yapısı

### Frontend
```
frontend/
├── src/
│   ├── auth/           # Authentication
│   ├── components/     # UI Components
│   ├── pages/          # Sayfa bileşenleri
│   └── ...
├── public/             # Statik dosyalar
└── package.json
```

### Backend
```
backend/
├── src/
│   ├── index.ts        # Ana server dosyası
│   ├── auth.ts         # Authentication logic
│   └── database.ts     # Database connection
├── database_setup.sql  # Database schema
└── package.json
```

## 🔧 Geliştirme

### Yeni Özellik Ekleme
1. Backend'de API endpoint'i ekleyin
2. Frontend'de UI bileşenini oluşturun
3. Shared types'ı güncelleyin

### Veritabanı Değişiklikleri
1. `backend/database_setup.sql`'i güncelleyin
2. pgAdmin 4'te script'i çalıştırın

## 📝 Notlar

- Backend port: 3001
- Frontend port: 5173
- Vite proxy ile API istekleri otomatik yönlendirilir
- JWT token'lar 24 saat geçerli
- Rate limiting: 100 istek/15 dakika
