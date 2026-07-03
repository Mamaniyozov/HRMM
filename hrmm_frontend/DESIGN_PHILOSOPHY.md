# Aurora Precision — HRMM dizayn falsafasi

## Manifest

**Aurora Precision** — chuqurlik va aniqlik harakati. Interfeys tekis rang emas, balki nafas oluvchi muhit: fon qatlamlari shimoliy yog'du kabi bir-biriga singib ketadi, kontent esa shisha yuzalarda suzadi. Har bir panel — ehtiyotkorlik bilan silliqlangan shisha plastinka; har bir soya — yorug'lik manbasining ongli qarori. Bu ish son-sanoqsiz soatlab sayqallangandek, o'z sohasining eng yuqori pog'onasidagi usta qo'lidan chiqqandek ko'rinishi shart.

## Fazo va shakl

Fazo uch qatlamda yashaydi: eng pastda aurora-fon (harakatsiz, lekin tirik gradient to'qimasi), o'rtada shisha yuzalar (blur + shaffoflik), eng yuqorida kontent. Radiuslar bitta tilda gapiradi — kichik elementlar 10–12px, panellar 16–18px, modal va kartalar 20–24px. Hech bir burchak tasodifiy emas.

## Rang va material

Rang tizim tokenlaridan tug'iladi (`--accent`, `--radial-*`, `--panel`) — hech qachon qattiq kodlanmaydi. Dark rejimda material — tungi shisha: oq 4–6% qatlamlar, ichki 1px yorug' chiziq. Light rejimda — mat oq chinni: toza yuzalar, havodor soyalar. Ikkala rejim bir xil hurmat bilan ishlangan.

## Masshtab va ritm

Spacing 4px panjarasida raqsga tushadi. Hover — 150–250ms ichida faqat `transform`, `opacity`, `box-shadow` orqali javob beradi: karta 2–3px ko'tariladi, soya chuqurlashadi, boshqa hech narsa qimirlamaydi. Harakat — bezak emas, javob.

## Kompozitsiya va ierarxiya

Ko'z avval aurora fonini his qiladi, so'ng shisha panelga qo'nadi, so'ng aksent rangdagi harakat nuqtasini topadi. Jadval sarlavhalari pichirlaydi (kichik, uppercase, muted), qiymatlar gapiradi. Fokus halqasi — yorqin, 3–4px, aksent rangda: klaviatura foydalanuvchisi hech qachon adashmaydi. Har bir tekislash — yuzlab tuzatishlar mahsuli.
