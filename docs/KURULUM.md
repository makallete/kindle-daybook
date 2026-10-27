# Adım adım kurulum

[English](SETUP.en.md) · [Ana sayfa](../README.md)

## 1. Uyumluluk ve jailbreak

Bu sürümün cihaz kanıtı: Paperwhite 2 (2013), firmware **5.12.2.2**, 90D4 varyantı. Ayarlar → Cihaz seçenekleri → Cihaz bilgileri bölümünden kontrol et. Başka model/sürümde bu kurucuyu çalıştırma.

Jailbreak yöntemi model ve firmware’e bağlıdır. Önce [KindleModding başlangıç sayfasını](https://kindlemodding.org/jailbreaking/) kullan. Bizim cihazımızda [WinterBreak2](https://kindlemodding.org/jailbreaking/WinterBreak2/) kullanıldı; güncel adımları özgün rehberden takip et. İndirilecek dosyalar ve cihazdaki dokunuşlar orada anlatılır. Bu depo jailbreak’i yeniden dağıtmaz veya otomatik uygulamaz.

Jailbreak sonrasında rehberin “What's Next” adımlarını tamamla. Yalnızca `JAILBROKEN.txt` bulunması, `.sh` başlatıcıların ve SSH’nin hazır olduğunu göstermez. Kütüphaneden `.sh` çalıştırma / MKK entegrasyonu ve USBNetwork gereklidir. [USBNetwork dokümanı](https://wiki.mobileread.com/wiki/USBNetwork) ve [KindleModding](https://kindlemodding.org/) kaynaklarını izleyerek anahtarla root SSH erişimini kur. Kurucu parola veya ağ ayarlarını değiştirmez.

## 2. Bilgisayarı hazırla

Node.js 22 veya üstü (npm ile), Python 3.10 veya üstü ve OpenSSH istemcisi gerekir. macOS/Linux komutlarında `python3`, Windows’ta uygun kurulum için `py -3` kullanabilirsin. Windows ve Linux akışı henüz gerçek cihazla doğrulanmadı.

Depoyu indirip aç veya klonla:

```sh
git clone https://github.com/makallete/kindle-daybook.git
cd kindle-daybook
```

## 3. Kendi sunucunu yayınla

```sh
cd worker
npm ci
npm test
npx wrangler login
```

`wrangler.jsonc` içindeki `name` alanı senin Worker adın. `vars` altında `APP_NAME`, `WEATHER_CITY`, `WEATHER_LAT`, `WEATHER_LON` ayarla. APP_LANGUAGE ile tr veya en seç. Kindle arayüzü, tarihler ve yol kartı bu dile göre görünür; saat dilimi Europe/Istanbul olarak kalır.

Yeni ekran anahtarı üret: `openssl rand -hex 32`. Sonucu terminalde aşağıdaki komut isteyince yapıştır. iCal için Google Takvim → Ayarlar → ilgili takvim → Takvimi entegre et → iCal biçimindeki gizli adres.

```sh
npx wrangler secret put SCREEN_TOKEN
npx wrangler secret put ICAL_URL
# İkinci takvimin varsa:
npx wrangler secret put SHARED_ICAL_URL
npx wrangler deploy
```

`SCREEN_TOKEN` en az 32 karakterlik harf/rakam/alt çizgi/tire olmalı. Çıktıdaki Worker adresine `/d/SENIN_SCREEN_TOKEN_DEGERIN` ekle. Ana URL’nin 404 olması normaldir. Önce bilgisayar tarayıcısında takvim/hava durumunu kontrol et. Secret değerlerini kaynak dosyaya, siteye, GitHub’a veya issue’ya yazma.

## 4. Kindle’a tam ekran kur

Standart tarayıcıdan özel ekran adresini açmak, kurucudan bağımsız ilk denemedir. Tarayıcıda araç çubukları görünür. Tam ekran için aşağıdaki ek adımlar gerekir.

Anahtar ve cihaz adresinle bir kez normal SSH bağlantısı aç; ilk bağlantıda cihazın host anahtarını doğrula. Kendi IP ve anahtar yolunu kullan:

```sh
ssh -i ~/.ssh/kindle root@192.168.1.20
exit
```

Depo kökünde:

```sh
python3 scripts/fetch-tools.py
python3 scripts/install.py --host 192.168.1.20 --identity ~/.ssh/kindle --check
```

Araç indirme komutu KOReader’ın sabit PW2 sürümünden yalnızca `wmctrl` ve lisansını alır, SHA-256 doğrular. KOReader kurulmaz. `--check` salt okunurdur; firmware, varyant, root, scriptlet, evtest ve SQLite kontrol eder.

Kontrol geçerse kendi özel URL’nle kur:

```sh
python3 scripts/install.py --host 192.168.1.20 --identity ~/.ssh/kindle --name "Benim Günüm" --url "https://SENIN-WORKER-ADRESIN/d/SENIN_SCREEN_TOKEN_DEGERIN" --install
```

Kütüphaneden verdiğin adı aç. Ad hemen görünmezse Kindle arayüzünü/cihazı yeniden başlat. Worker’daki `APP_NAME` ile `--name` aynı adı kullanmalı; biri sayfanın, diğeri kütüphane başlatıcısının adıdır.

Kurucu kitaplara, Home yerleşimine, Store düğmesine ve ekran koruyucuya dokunmaz. Yalnızca kendi dosyalarını ve uygulama kayıtlarını ekler; uygulama kaydı yedeğini `/mnt/us/kindle-daybook/backup/appreg.db` içine alır. Güç düğmesine kısa basıp bırakınca Home’a dönmeli ve uyku normale dönmelidir. Çalışmazsa kütüphaneden `Normal Uykuya Don` başlatıcısını veya SSH’den `sh /mnt/us/documents/Daybook_Exit.sh` çalıştır.

## 5. İsteğe bağlı yol durumu

Google Cloud’da Routes API ve ona kısıtlı API anahtarı gerekir. [Güncel kullanım/faturalandırma koşullarını](https://developers.google.com/maps/documentation/routes/usage-and-billing) kendin kontrol et; bu proje ücretsiz veya kartsız erişim garantisi vermez. Trafik olmadan takvim/hava durumu çalışır.

```sh
cd worker
npx wrangler secret put GOOGLE_MAPS_API_KEY
npx wrangler secret put HOME_ADDRESS
npx wrangler secret put WORK_ADDRESS
npx wrangler deploy
```

Adresleri kapı/giriş belli olacak şekilde gir. Aynı adla görünen farklı bina girişleri farklı mesafe döndürebilir. İki yönde Google’ın döndürdüğü alternatiflerden trafik dahil süresi en kısa olanı seçilir; en kısa mesafe şartı yoktur.

Türkiye saatiyle varsayılan yön: 00.00–11.59 evden işe, 12.00–23.59 işten eve. Elle yön değiştirince 30 saniyede varsayılana döner. Takvimde gün seçimi ayrı olarak 100 saniyede güncele döner.

Hafta içi plan: evden işe 08.00–10.55 beş dakikada bir 36; kalan saatlere 14 sorgu. İşten eve 15.00–17.55 aynı şekilde 36+14. Hafta sonu iki yönde saatte bir, toplam 48. **Bunlar açık ekranın sorgu planıdır, sunucuda kesin harcama limiti değildir.** Açılış/yeniden yükleme iki ek sorgu yapar; birden fazla açık ekran da tüketimi artırır. Google Cloud’da kendi sert kotanı ayrıca ayarla. Uyuyan/bağlantısız cihaz kaçan sorguları sonradan topluca çalıştırmaz.

## 6. Kontrol ve sorun giderme

- `.sh` kitap gibi açılmıyorsa jailbreak sonrası scriptlet entegrasyonu tamamlanmamıştır; jailbreak’i tekrar tekrar tetiklemek çözüm sayılmaz.
- SSH zaman aşımı: cihazı uyandır, Wi-Fi’yi ve IP’yi kontrol et. SSH kurulumu bu uygulamadan ayrı önkoşuldur.
- 404: özel `/d/<token>` yolu ve Worker secret değerini karşılaştır.
- Yol verisi yok: üç trafik secret’ını, Routes yetkisini ve Google kotasını kontrol et. Sahte süre/rota gösterilmez.
- En alttaki saat, takvim/hava bölümünün son ekran yanıtıdır. Kaynak takvim 5, hava 10 dakika önbellekte olabilir. Yol kartındaki Google Maps saati ayrı sorgu saatidir.
- Application Error: Home’a dönüp uygulamayı bir kez yeniden aç. Tekrarlarsa model/firmware ve gizli bilgilerden arındırılmış hata kaydıyla issue aç.

## 7. Kaldır

```sh
ssh -i ~/.ssh/kindle root@192.168.1.20 'sh /mnt/us/kindle-daybook/uninstall.sh'
```

Kendi uygulama kayıtları/başlatıcıları kaldırılır; kitaplar ve jailbreak korunur. İndirme ve yedek klasörü bilerek bırakılır. Yedekten tüm appreg veritabanını geri yüklemek, sonradan kurulmuş başka uygulamaları etkileyebilir; normal kaldırmada yapılmaz. Cloudflare Worker’ı ve Google anahtarını istemiyorsan kendi hesaplarından ayrıca sil.

## Optional native appearance / İsteğe bağlı görünüm

[Store, Home and cleanup / Store, Home ve temizlik](NATIVE.tr.md). Restore native changes before uninstalling the core app.
