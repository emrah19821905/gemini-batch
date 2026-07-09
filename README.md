# Sessiz Su — Toplu Görsel Üretimi

Bu script, 35 sinematik prompt'u tek seferde Gemini'nin **Nano Banana** (gemini-2.5-flash-image) modeliyle görsele çevirir. Bu model ücretsiz katmanda günde ~500 istek hakkı veriyor, yani 35 görsel için hiç ücret ödemezsin.

## Kurulum (GitHub Codespaces'te)

```bash
npm install
```

## API Anahtarını Ayarla

```bash
export GEMINI_API_KEY="senin_google_ai_studio_anahtarin"
```

## Çalıştır

```bash
npm start
```

## Ne Olacak?

- `output/` klasörü oluşturulur
- Her prompt sırayla işlenir: `01.png`, `02.png` ... `35.png`
- İstekler arasında 4 saniye bekleme var (rate limit'e takılmamak için)
- Terminalde her görsel için ✓ ya da HATA mesajı görürsün
- Sonunda kaç tanesinin başarılı olduğunu özetler, başarısız olanların numaralarını listeler

## Başarısız Olan Görselleri Tekrar Üretmek İçin

`prompts.js` dosyasında hangi prompt'un başarısız olduğunu bulup, `generate.js`'te `prompts` dizisini geçici olarak sadece o prompt'la değiştirip tekrar çalıştırabilirsin. İstersen sana otomatik "sadece başarısızları tekrar dene" özelliği de ekleyebilirim.

## Notlar

- Prompt'lardan bazıları içerik politikasına takılabilir (özellikle "boğulma", "çamura batma" gibi ifadeler bazen reddedilebiliyor). Reddedilirse terminalde hata mesajı görürsün, o prompt'u daha atmosferik bir dille yeniden yazıp tekrar deneyebilirsin.
- Görsellerin boyutu model varsayılanına göre gelir (genelde 1024x1024 civarı).
