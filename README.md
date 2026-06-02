# 🏢 HRMM - Human Resource Management System

Kompaniyaning insan resurslarini boshqarish uchun to'liq va zamonaviy web-ilovasining tizimi.

## 📋 Loyihaning Tavsifi

**HRMM** (Human Resource Management System) — bu xodimlarning ma'lumotlari, ish vaqti, ta'til arizalari, hisobotlari va boshqa HR operatsiyalarini boshqaradigan zamonaviy raqamli tizim. Tizim Django REST Framework orqali qurilgan ishonchli backend va Express.js orqali qurilgan interaktiv frontend dan iborat.

## 🎯 Asosiy Xususiyatlar

### 🔐 Autentifikatsiya va Xavfsizlik
- JWT token-based autentifikatsiya
- Email OTP tasdiqlash
- Ikki faktorli autentifikatsiya (2FA)
- Token revokation (bekor qilish)

### 👥 Foydalanuvchilar Boshqarishi
- Foydalanuvchi profiллeri
- Avatar/rasm yuklash
- Departament tayiniy
- Rol va ruxsatnomalarni boshqarish

### 🏪 Departamentlar
- Departament boshqarish
- Boshqaruvchi tayyiniy
- Departament ierarxiyasi

### 🗓️ Ta'til Boshqarishi
- Ta'til arizalarini yaratish
- Ta'til tasdiqiy jarayoni
- Ekran suratlari bilan ma'lumotlar
- Ta'til qolgan kunlar statistikasi

### 📊 Hisobotlar
- Turli xil hisobotlar yaratish
- Hisobotlarga qo'shimcha fayllar
- Tasdiqiy jarayoni bilan hisobotlar
- Hisobotlar arxivi

### 📬 Bildirishnomalar
- Real-time bildirishnomalar
- Email bildirishnomalar
- Bildirishnoma tariхi

### 📝 Audit Jurnali
- Barcha o'zgarishliklarin qaydlanishi
- Foydalanuvchi harakatlari jurnali
- Tizim xavfsizligi monitoring

### ⚙️ Ish Oqimlari (Workflows)
- Avtomatlashtirilgan ish oqimlari
- Jarayonlarni boshqarish
- Kutilgan korruklarni talab qilish

### 📱 Telegram Bot
- Telegram orqali xabarlashuvchi
- Bildirishnomalarni yuborish
- Tizim bilan o'zaro aloqa

## 🛠️ Texnologiya Yiğini

### Backend
- **Django 5.2.14** — Web framework
- **Django REST Framework** — API yaratish uchun
- **Django Simple JWT** — JWT autentifikatsiya
- **Drf Spectacular** — API dokumentatsiyasi
- **PostgreSQL** — Ma'lumotlar bazasi
- **Gunicorn** — Production server

### Frontend
- **Express.js** — Server framework
- **HTML/CSS/JavaScript** — Frontend texnologiyalari
- **CORS** — Cross-Origin Requests qo'llami

### Boshqa
- **Python-dotenv** — Environment o'zgaruvchilar
- **Psycopg2** — PostgreSQL driver

## 📁 Loyihaning Tuzilishi

```
HRMM/
├── hrmm_backend/              # Django backend
│   ├── apps/                  # Django ilovalar
│   │   ├── authentication/    # Autentifikatsiya
│   │   ├── users/             # Foydalanuvchilar
│   │   ├── departments/       # Departamentlar
│   │   ├── leave_management/  # Ta'til boshqarishi
│   │   ├── reports/           # Hisobotlar
│   │   ├── notifications/     # Bildirishnomalar
│   │   ├── audit/             # Audit jurnali
│   │   ├── workflows/         # Ish oqimlari
│   │   ├── units/             # Birliklar
│   │   └── dashboard/         # Dashboard
│   ├── config/                # Django konfiguratsiyasi
│   ├── manage.py              # Django boshqarish skripti
│   ├── requirements.txt        # Python paketlari
│   ├── .env                   # Environment o'zgaruvchilar
│   └── venv/                  # Virtual muhit
├── hrmm_frontend/             # Express.js frontend
│   ├── public/                # Statik fayllar
│   ├── views/                 # HTML shablonlar
│   ├── package.json           # Node.js paketlari
│   └── server.js              # Asosiy server fayli
├── hrmm_telegram_bot/         # Telegram bot
│   ├── requirements.txt        # Python paketlari
│   └── .env.example           # Environment shabloni
└── README.md                  # Bu fayl
```

## 🚀 Ishga Tushirish

### Talablar
- Python 3.10+
- Node.js 16+
- PostgreSQL 12+
- pip va npm

### Backend Sozlash (Django)

1. **Backend papkaga kiring:**
```bash
cd hrmm_backend
```

2. **Virtual muhitni yaratib aktivlashtiring:**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. **Kerakli paketlarni o'rnatting:**
```bash
pip install -r requirements.txt
```

4. **.env faylini konfiguratsiya qiling:**
```bash
# .env faylini yaratib, kerakli parametrlarni o'rnating
# Masalan:
# DEBUG=True
# SECRET_KEY=your-secret-key
# DATABASE_URL=postgresql://user:password@localhost:5432/hrmm
```

5. **Ma'lumotlar bazasini migratsiya qiling:**
```bash
python manage.py migrate
```

6. **Super foydalanuvchi yaratib:**
```bash
python manage.py createsuperuser
```

7. **Backend serverni ishga tushiring:**
```bash
python manage.py runserver
```
Backend `http://127.0.0.1:8000` manzilida ishga tushadi.

### Frontend Sozlash (Express.js)

1. **Frontend papkaga kiring:**
```bash
cd hrmm_frontend
```

2. **Paketlarni o'rnatting:**
```bash
npm install
```

3. **Frontend serverni ishga tushiring:**
```bash
npm start
```
Frontend `http://127.0.0.1:5500` manzilida ochiladi.

### Telegram Bot Sozlash

1. **Bot papkaga kiring:**
```bash
cd hrmm_telegram_bot
```

2. **Paketlarni o'rnatting:**
```bash
pip install -r requirements.txt
```

3. **.env faylini sozlang (env.example asosida):**
```bash
# Bot token va boshqa parametrlarni qo'ying
```

4. **Botni ishga tushiring:**
```bash
python bot.py
```

## 🔗 API Dokumentatsiyasi

Backend API dokumentatsiyasi:
```
http://127.0.0.1:8000/api/schema/swagger/
```

Swagger UI orqali barcha API endpoint-larini ko'rishingiz va sinashingiz mumkin.

## 👨‍💻 Ishtirokdaorlik

Bu loyihaga hissa qo'shish uchun:

1. Forklashtiring
2. Feature branch yaratib (`git checkout -b feature/AmazingFeature`)
3. O'zgarishliklari commit qiling (`git commit -m 'Add some AmazingFeature'`)
4. Branch-ga push qiling (`git push origin feature/AmazingFeature`)
5. Pull Request oching

## 📝 Litsenziya

Bu loyiha MIT litsenziyasi asosida tarqatiladi. Batafsil ma'lumot uchun [LICENSE](LICENSE) faylini ko'ring.

## 📞 Bog'lanish

Savollari yoki taklif bo'yicha:
- Email: support@hrmm.uz
- GitHub Issues: [Issues](https://github.com/yourusername/HRMM/issues)

## 🙏 Minnatdorchilik

Qo'llaniladigan barcha kutubxona va framework-larga rahmat!

---

**🚀 Tizimni yanada yaxshi qilish uchun faol ishchi bo'ling va xavfsizlikka e'tibor qiling!**
