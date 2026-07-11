# AI-Notes yozish qoidalari

Ushbu loyihada muhim qarorlar, o'zgarishlar va muammolarni kelajakda tez qidirish va tushunish uchun qisqa eslatmalar (AI-Notes) yoziladi.

## 1. Nima uchun AI-Notes?

- Loyiha bo'ylab muhim qarorlarni va sabablarini xotirada saqlash.
- Yangi dasturchi yoki o'zimiz keyinroq qaytib kelganda kontekstni tez tiklash.
- Texnik qarorlarning tarixi bo'lish.

## 2. Qachon AI-Note yoziladi?

- Muhim texnik qarorlar qabul qilinganda (architektura, kutubxona, API tanlovi).
- Murakkab xatolik (bug) tuzatilganda va uning sababi aniq bo'lganda.
- Katta refaktor yoki modul o'chirilishi/qo'shilishida.
- Foydalanuvchi talabi asosida muhim o'zgarish qilinganda.
- Qabul qilingan dizayn, UI/UX yoki theme o'zgarishlarida.
- Yangi integratsiya, xavfsizlik yoki performance qarorlarida.

## 3. Qachon YOZILMAYDI?

- Kichik, o'z-o'zidan tushunarli o'zgarishlar (misol: matn tuzatish, 1 qatorlik fix).
- Boshqa hujjat yoki commit xabari to'liq tushuntirsa.
- Dublikat ma'lumot bo'lsa.
- Real-time chat yoki tez-tez o'zgaruvchi rejalar uchun.

## 4. AI-Note formati

Har bir eslatma `AI-Notes/<loyiha-nomi>/<YYYY-MM-DD-HH-mm-slug>.md` ko'rinishida saqlanadi:

```markdown
---
project: HRMM
created: 2026-07-11T12:21:00.000Z
tags: ["ai-note", "hrmm", "theme"]
summary: "Ikki Ton mavzusi qo'shildi..."
---

# Ikki Ton mavzusi qo'shildi

Qisqa tushuntma: nima o'zgardi, nega o'zgardi, qayerga tegdi.
```

## 5. AI-Note yozish usuli

`d:\HRMM` papkasidan quyidagi buyruqni ishga tushiring:

```bash
node scripts/ai-notes.js "Sarlavha" "Kontent matni"
```

Yoki to'liq shaklda:

```bash
node scripts/ai-notes.js --title "Sarlavha" --content "Kontent matni" --tags theme,frontend
```

Muhit o'zgaruvchilarini sozlash:

```powershell
$env:AI_NOTES_VAULT="C:\Users\user\Documents\Obsidian Vault"
$env:AI_NOTES_PROJECT="HRMM"
```

Agar `AI_NOTES_VAULT` ko'rsatilmagan bo'lsa, skript avtomatik ravishda `Documents` va `OneDrive` ichidagi Obsidian vault'larni qidiradi. Topilmasa, `d:\HRMM\AI-Notes` papkasiga yozadi.

## 6. Loyiha papkasi

- `d:\HRMM\scripts\ai-notes.js` — AI-Note yaratish skripti.
- `d:\HRMM\AI_NOTES_GUIDELINES.md` — ushbu qoidalar.
- `d:\HRMM\AI-Notes\HRMM\` — yaratilgan eslatmalar.
