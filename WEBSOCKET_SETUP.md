# 🤖 AI Asistan WebRTC Kurulum Rehberi

## 📋 **Gerekli Kurulumlar**

### 1. **Environment Variables Ayarları**

Backend klasöründe `.env` dosyası oluşturun:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_asistan
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
WEBRTC_PORT=8080
FRONTEND_URL=http://localhost:5173

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# WebRTC Configuration
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=your_turn_server_here
TURN_USERNAME=your_turn_username
TURN_CREDENTIAL=your_turn_credential
```

### 2. **OpenAI API Key Alma**

1. [OpenAI Platform](https://platform.openai.com/) adresine gidin
2. API Keys bölümünden yeni key oluşturun
3. `.env` dosyasına `OPENAI_API_KEY=sk-...` şeklinde ekleyin

### 3. **Database Migration'ları Çalıştırma**

```sql
-- PostgreSQL'de çalıştırın:

-- 1. docs_json kolonu ekleme
ALTER TABLE projects ADD COLUMN IF NOT EXISTS docs_json JSONB DEFAULT '{}';
UPDATE projects SET docs_json = '{}' WHERE docs_json IS NULL;

-- 2. outcome alanları ekleme
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome VARCHAR(50);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome_notes TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS next_action TEXT;
UPDATE calls SET outcome = NULL, outcome_notes = NULL, next_action = NULL WHERE outcome IS NULL;
```

## 🚀 **Test Etme**

### 1. **Backend'i Başlatın**
```bash
cd backend
npm run dev
```

### 2. **Frontend'i Başlatın**
```bash
cd frontend
npm run dev
```

### 3. **Test Adımları**

1. **Login:** `http://localhost:5173` adresine gidin
2. **Proje Oluştur:** CRM > Proje Yönetimi > Yeni Proje
3. **Lead Oluştur:** CRM > Müşteri Yönetimi > Yeni Lead
4. **Görüşme Başlat:** Lead detayında "Görüşme Başlat" butonuna basın
5. **WebRTC Client:** Açılan sayfada "Bağlan" butonuna basın

## 🔧 **Sorun Giderme**

### **AI Konuşmuyor**
- OpenAI API key'in doğru olduğundan emin olun
- Backend console'da hata mesajlarını kontrol edin
- WebSocket bağlantısının başarılı olduğunu kontrol edin

### **WebSocket Bağlantı Hatası**
- Backend'in çalıştığından emin olun
- Port 3001'in açık olduğunu kontrol edin
- CORS ayarlarını kontrol edin

### **Mikrofon İzni**
- Browser'da mikrofon iznini verin
- HTTPS kullanıyorsanız sertifika sorunlarını kontrol edin

## 📞 **Destek**

Sorun yaşarsanız:
1. Backend console loglarını kontrol edin
2. Browser developer tools'da Network ve Console sekmelerini kontrol edin
3. WebRTC client sayfasındaki hata mesajlarını okuyun

## 🎯 **Beklenen Davranış**

Başarılı kurulum sonrası:
1. ✅ WebRTC client sayfası açılır
2. ✅ "Bağlan" butonuna basınca mikrofon izni istenir
3. ✅ WebSocket bağlantısı kurulur
4. ✅ AI asistan konuşmaya başlar
5. ✅ Canlı transkript görünür
6. ✅ Görüşme sonunda özet oluşturulur
