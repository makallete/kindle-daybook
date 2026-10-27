# Kindle Daybook

[English](docs/README.en.md) · [Türkçe kurulum](docs/KURULUM.md) · [Project site](https://kindle-daybook-makallete.netlify.app)

Eski Kindle’ına gündelik hayatta yeni bir iş ver: takvim, hava durumu ve isteğe bağlı yol durumu. Ekranının adını kendin seç. Cloudflare Worker senin hesabında çalışır; bilgisayarının açık kalması gerekmez.

**v0.1.1-alpha — ilk topluluk sürümü.** Çalışan temel uygulama Paperwhite 2 (2013), 5.12.2.2 üzerinde doğrulandı. Genelleştirilmiş kurulum paketi henüz sıfırdan kurulmuş ikinci bir cihazda denenmedi. Diğer modeller desteklenmiş sayılmaz. Kurucu şu aşamada yalnızca 90D4 ile başlayan PW2 varyantını kabul eder.

## Neler var?

- Kişisel ve ortak iCal takvimleri, yinelenen ve çok günlü etkinlikler.
- Dokunulabilir haftalık şerit, altı etkinlik ve sayfalama; 100 saniyede güncele dönüş.
- Open-Meteo ile üç günlük hava durumu; şehir ve koordinatlar ayarlanabilir.
- İsteğe bağlı Google Routes: iki yön, trafik dahil en hızlı alternatif ve gerçek rota çizgisi.
- Kullanıcı tarafından adlandırılan ekran; Türkçe/İngilizce arayüz (APP_LANGUAGE), 24 saat biçimi, Türkiye saat dilimi.
- Desteklenen cihazda Mesquite tam ekran, fiziksel güç düğmesiyle çıkış ve normal uykuya dönüş.

## Başla

1. Modelini ve firmware’ini kontrol et. [KindleModding sihirbazından](https://kindlemodding.org/jailbreaking/) uygun jailbreak yolunu seç. Bizim geliştirdiğimiz bir jailbreak değildir.
2. Jailbreak sonrası scriptlet/MKK ve anahtarla root SSH erişimini hazırla. Ayrıntılar ve bağlantılar [kurulum rehberinde](docs/KURULUM.md).
3. `worker/` içindeki Worker’ı kendi Cloudflare hesabına yayınla; iCal adresini secret olarak ekle.
4. Önce standart tarayıcıdan ekranı dene. Sonra desteklenen PW2 için tam ekran kurucusunu çalıştır.
5. Trafiği istersen ayrıca etkinleştir. Kart veya faturalandırmasız kullanım sözü verilmez; güncel Google koşulları geçerlidir.

```sh
cd worker
npm ci
npm test
npx wrangler login
npx wrangler secret put SCREEN_TOKEN
npx wrangler secret put ICAL_URL
npx wrangler deploy
```

`SCREEN_TOKEN` için `openssl rand -hex 32` ile yeni değer üret. Kendi Worker adresinin `/d/<SCREEN_TOKEN>` yolunu aç. Bu özel adresi bilenler ekran içeriğine erişebilir.

## Depo

`worker/` sunucu ve testler · `kindle/` özgün tam ekran uygulaması · `scripts/` kurucu ve araç indirme · `docs/` rehberler · `website/` statik proje sitesi ve kurgu verili demo.

Amazon sistem JAR’ları, firmware, jailbreak yükleri, kitaplar, özel SSH anahtarları veya kişisel takvimler bu depoda yoktur. Home/Store değişiklikleri ayrı ve isteğe bağlıdır: [native rehber](docs/NATIVE.tr.md). Ekran koruyucu App kurucusundan ayrı uygulanır: [fotoğrafla ekran koruyucu rehberi](docs/SCREENSAVER.tr.md). Kişisel fotoğraflar pakete dahil değildir.

## Geliştirme ve katkı

Hata bildirirken model, firmware, paket sürümü ve gizli bilgilerden arındırılmış hata metnini ekle. iCal gizli bağlantısını, ekran anahtarını veya API anahtarını issue içine koyma. Katkı için [CONTRIBUTING.md](CONTRIBUTING.md), lisanslar için [THIRD_PARTY.md](THIRD_PARTY.md).

MIT · Developed by makallete
