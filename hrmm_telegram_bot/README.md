# HRMM Telegram Bot

HRMM tizimi (`hrmm-production` backend) bilan bog‘langan Telegram bot.

## Bot imkoniyatlari

| Buyruq | Vazifa |
|--------|--------|
| `/start` | Boshlash |
| `/login username parol` | Tizimga kirish |
| `/code 123456` | 2FA yoki email kod |
| `/me` | Profil |
| `/stat` | Umumiy statistika |
| `/navbat` | Kutilayotgan tasdiqlar |
| `/bolimlar` | Bo‘limlar bo‘yicha ariza / bildirishnoma / funksiya / hisobot |
| `/arizalar` | So‘nggi arizalar |
| `/hisobotlar` | So‘nggi hisobotlar |
| `/xabarlar` | Bildirishnomalar |
| `/logout` | Chiqish |

---

## 1-qadam: Telegram da bot yaratish

1. Telegramda [@BotFather](https://t.me/BotFather) ni oching.
2. `/newbot` yuboring.
3. Bot nomi va username tanlang (masalan `hrmm_uz_bot`).
4. **Token** ni nusxalang — `123456789:AAH...` ko‘rinishida.

---

## 2-qadam: Lokal sinov (ixtiyoriy)

```bash
cd hrmm_telegram_bot
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# .env ichiga TELEGRAM_BOT_TOKEN va HRMM_API_BASE_URL yozing

python bot.py
```

Telegramda botingizga `/start` va `/login` yuboring.

---

## 3-qadam: Railway ga deploy (rasmdagi loyiha yoniga)

Sizda allaqachon **HRMM**, **exemplary-elegance** va **Postgres** bor. Bot — **yangi 4-service**.

### A) GitHub ga yuklash

Butun `HRMM` repozitoriyangiz GitHub da bo‘lishi kerak (bot `hrmm_telegram_bot/` papkasida).

```bash
git add hrmm_telegram_bot
git commit -m "Add HRMM Telegram bot for Railway"
git push
```

### B) Railway da yangi servis

1. [https://railway.com/](https://railway.com/) → loyihangizni oching.
2. **+ New** → **GitHub Repo** (yoki mavjud repodan **New Service**).
3. **HRMM** reponi tanlang.
4. Servis sozlamalari:
   - **Settings** → **Root Directory**: `hrmm_telegram_bot`
   - **Settings** → **Watch Paths** (ixtiyoriy): `hrmm_telegram_bot/**`
5. **Variables** (muhim):

| O‘zgaruvchi | Qiymat |
|-------------|--------|
| `TELEGRAM_BOT_TOKEN` | BotFather token |
| `HRMM_API_BASE_URL` | `https://hrmm-production-9c37.up.railway.app` |
| `SESSIONS_FILE` | `/tmp/hrmm_bot_sessions.json` |
| `PORT` | `8080` |

6. **Deploy** — logda `HRMM bot ishga tushdi` ko‘rinishi kerak.
7. Servis **Online** bo‘lsa yetarli (domaining shart emas — bot polling ishlatadi).

### C) Networking

- **Public domain** shart emas (long polling).
- Agar Railway healthcheck so‘rasa, bot `PORT` da `/` javob beradi.

### D) Postgres bilan bog‘lanish

Bot **to‘g‘ridan-to‘g‘ri Postgres ga ulanmaydi** — faqat HRMM **REST API** orqali ishlaydi. Shuning uchun `HRMM_API_BASE_URL` to‘g‘ri bo‘lishi kifoya.

---

## 4-qadam: Foydalanish

1. Telegramda botni toping.
2. `/login Mamaniyozov parolingiz` (HRMM web dagi login).
3. Agar Google Authenticator yoqilgan bo‘lsa: telefondagi 6 xonali kod → `/code 654321`.
4. `/bolimlar` — bo‘limlar statistikasi.
5. `/navbat` — tasdiqlash navbati (direktor / rahbarlar uchun).

---

## Muammolar

| Muammo | Yechim |
|--------|--------|
| `TELEGRAM_BOT_TOKEN o'rnatilmagan` | Railway Variables ga token qo‘shing |
| Login xatosi | Username/parol web bilan bir xil |
| `/bolimlar` 404 | Backend yangilangan bo‘lsin (`/api/v1/dashboard/operations/`) |
| Sessiya yo‘qoladi | Railway restart — qayta `/login` (sessiya `/tmp` da) |

Doimiy sessiya uchun Railway **Volume** qo‘shib `SESSIONS_FILE=/data/sessions.json` qiling.

---

## Fayl tuzilmasi

```
hrmm_telegram_bot/
  bot.py           # Asosiy bot
  hrmm_client.py   # API mijoz
  sessions.py      # Telegram ↔ JWT sessiya
  config.py
  requirements.txt
  railway.toml
  README.md
```
