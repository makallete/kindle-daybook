# Fotoğrafını Kindle ekran koruyucusu yap

Fotoğrafını Codex’e veya Claude Code’a yükle ve “Bunu Kindle’ın ekran koruyucusu yap” yaz. Fotoğraf, Kindle uyuduğunda görünür; App ikonu ve kütüphane kapağından ayrıdır.

## Codex / Claude Code için uygulama sırası

Bu, geliştirme cihazında uygulanan yöntemin rehberidir; mevcut App kurucusu bu değişikliği otomatik yapmaz. İşlemleri kullanıcının kendi fotoğrafıyla, kendi cihazında yap. Fotoğrafı, SSH anahtarını ve cihaz yedeğini Git’e veya herkese açık siteye koyma.

1. **Cihazı doğrula.** Yöntem yalnızca 90D4 Paperwhite 2, firmware 5.12.2.2 üzerinde denenmiştir. Root SSH erişimini, `/usr/share/blanket/screensaver/` altında `bg_ss00.png`–`bg_ss19.png` adlı 20 normal dosyayı, dosya izinlerini ve boş alanı kontrol et. Sembolik bağlantı, farklı dosya düzeni, başka ekran koruyucu eklentisiyle karşılaşırsan bu dosya değiştirme yöntemini uygulama; önce uyumluluğu araştır.
2. **Fotoğrafı hazırla.** Orijinali koru. 758 × 1024 piksel, dikey, 8 bit gri tonlamalı PNG hazırla. Fotoğrafı esnetme; kırpma veya boşluk tercihini kullanıcıyla netleştir. Kırpılmış önizlemeyi değişikliği uygulamadan önce göster.
3. **Özgün dosyaları yedekle.** 20 dosyanın SHA-256 listesini kaydet. `screensaver/` klasörünü `/usr/share/blanket` dizinine göre arşivle. Cihazda `/mnt/us/kindle-daybook/backup/screensaver-stock.tar`, bilgisayarda Git dışında `native-local/screensaver/` altında bir kopya tut. Var olan yedeğin üzerine yazma; yeni tarihli yedek kullan. Arşivi açarak dosya listesini ve içerik karmalarını doğrula. Yedek doğrulanmadan devam etme.
4. **Fotoğrafı aktar.** Hazırlanan PNG’yi `/mnt/us/kindle-daybook/screensaver.png` konumuna aktar. Bilgisayardaki ve cihazdaki SHA-256 değerlerinin aynı olduğunu doğrula.
5. **Ekran koruyucuları değiştir.** Yalnızca ön kontrolde doğrulanan 20 `bg_ssNN.png` dosyasına dokun. Sistemi kısa süreliğine yazılabilir bağla; hata durumunda da salt okunur moda döndüren çıkış kancasını önce kur. Her dosyayı aynı klasörde geçici dosya ve atomik yeniden adlandırmayla değiştir; sahiplik `root:root`, izin `0644` olsun. Ardından `sync` çalıştır, sistemi salt okunur moda döndür ve 20 dosyanın yeni PNG ile aynı karmaya sahip olduğunu doğrula. Başka firmware’e bu yolları uyarlayarak tahminde bulunma.
6. **Gerçek uykuda kontrol et.** Önce App’ten ana ekrana çık. Kindle’ı güç düğmesiyle uykuya al ve kullanıcıdan fotoğrafın göründüğünü doğrulamasını iste. App açıkken uyku engellendiği için bu kontrol ana ekrandan yapılmalı. Cihazı uyandırınca kitaplar ve App normal açılmalı.
7. **Geri alma yolunu bırak.** Kullanıcıya kendi yedeğinin tam konumlarını ver. Geri almada arşivin yol listesini doğrula; yalnızca yedeklenen 20 dosyayı `/usr/share/blanket/screensaver/` içine sahiplik ve izinleriyle geri yükle. Aynı yazılabilir/salt okunur bağlama düzenini kullan, eski SHA-256 listesiyle karşılaştır ve uyku ekranını tekrar kontrol et. App kaldırıcı bu sistem dosyalarını geri yüklemez; App’i kaldırmadan önce bu geri almayı yap.
