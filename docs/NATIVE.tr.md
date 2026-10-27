# İsteğe bağlı: Home, Store kısayolu ve temizlik

[English](NATIVE.en.md) · [Temel kurulum](KURULUM.md)

Sitedeki önce/sonra görselleri açıkça etiketlenmiş **şematik gösterimlerdir**. Bu adım temel uygulamadan sonra gelir ve isteğe bağlıdır. Yalnızca PW2 90D4 / 5.12.2.2 sürümünün doğruladığımız özgün dosyaları kabul edilir. Home düzeninin ilk hali gerçek cihazda doğrulandı; genelleştirilmiş dağıtım henüz ikinci temiz cihazda uygulanmadı ve alpha’dır.

## Neler değişir?

- **Store:** takvim simgeli uygulama kısayoluna dönüşür. Buton etiketi alan darlığı nedeniyle en fazla 8 ASCII karakterdir. Uygulamanın/kütüphane başlatıcısının adı daha uzun ve Türkçe karakterli olabilir.
- **Home:** öneri ve okuma listesi panelleri kaldırılır. Büyük ve sabit Daybook kartının yanında son okunan dört kitap iki sıra halinde hizalanır. Setup/Feedback kartları Home’da gizlenir. Kitapların okuma konumu ve erişim zamanı değiştirilmez.
- **Temizlik:** ayrı araç yalnızca bilinen kurulum artıklarını listeler. Arşivleme bunları tarihli yedeğe taşır, kalıcı silmez. Hız veya pil kazancı ölçülmedi.

Amazon JAR’ı, firmware veya decompile edilmiş Amazon kaynakları dağıtılmaz. Herkes kendi cihazının özgün dosyalarını SSH ile yerel bilgisayarına alır. Bilinen SHA-256 değerleri eşleşmeden yama üretilmez. Farklı sürüm veya önceden değişmiş dosyada işlem durur.

## Önce plan, sonra uygulama

Temel Daybook kurulu olmalı. Depo kökünden:

```sh
python3 scripts/native-customize.py --host 192.168.1.20 --identity ~/.ssh/kindle --feature all
```

Varsayılan işlem **cihazda salt okunurdur**. Model/firmware kontrol edilir; özgünler git tarafından dışlanan `native-local/originals/` klasörüne alınır, yama `native-local/patched/` altında üretilir. Bu yerel dosyaları GitHub’a koyma. İki özellik yerine yalnızca `--feature store` veya `--feature home` seçebilirsin.

Plan geçerse:

```sh
python3 scripts/native-customize.py --host 192.168.1.20 --identity ~/.ssh/kindle --feature all --button-label Daybook --apply
```

Uygulama cihazdaki özgün karmaları tekrar kontrol eder, aktarılan yamaları doğrular ve özgünleri `/mnt/us/kindle-daybook/native-backup/` içine kaydeder. Dosya değişiminde framework durur; ardından root bölümü tekrar salt okunur olur ve arayüz yeniden başlar. Yaklaşık 90 saniye bekle; açılış sırasında kısa süre beyaz ekran olabilir. Home açılınca kısayolu, kitap açmayı, dört kitap yerleşimini ve güç düğmesi çıkışını kontrol et. Bu butondan mağaza yerine uygulama açılacağı için özellik isteğe bağlıdır.

Seçilen özellikler tek kurulum işlemi olarak kaydedilir. Sonradan kapsam değiştirmek için önce geri al, sonra istediğin kapsamı uygula. Karma kontrolünü atlama veya başka cihazdan hazırlanmış dosyaları kullanma.

## Kurulum artıklarını arşivle

```sh
python3 scripts/cleanup.py --host 192.168.1.20 --identity ~/.ssh/kindle
# Yalnızca listelenen bilinen yolları yedeğe taşı:
python3 scripts/cleanup.py --host 192.168.1.20 --identity ~/.ssh/kindle --archive
```

Varsayılan liste: `/mnt/us/fill_disk`, `/mnt/us/usbnet_installer`. `/mnt/us/emergency.sh` ve `/mnt/us/RUNME.sh` ancak ayrıca `--include-recovery` verilirse dahil edilir. Özel açılış/kurtarma kancan bunlardan birine bağlıysa o dosyayı yerinde bırak. Komut `/mnt/us/usbnet`, documents/kitaplar, MKK, jailbreak yük klasörleri veya liste dışındaki kişisel dosyaları hedeflemez. Yedek `/mnt/us/kindle-daybook/cleanup-backup/<UTC tarih-saat>/` altında kalır. Geri almak için dosyayı aynı adla `/mnt/us/` köküne taşı. Aynı cihazdaki arşivleme depolama alanını boşaltmaz; artık dosyaları geri alınabilir biçimde düzenler.

## Özgün görünümü geri al

```sh
ssh -i ~/.ssh/kindle root@192.168.1.20 'sh /mnt/us/kindle-daybook/native-restore.sh'
```

Önce yedek karmaları doğrulanır. Yalnızca bu özellikteki sistem dosyaları, başlangıç görevi, kısayol kaydı ve değiştirilen katalog alanları geri alınır; bütün katalog veritabanı değiştirilmez. Kitaplar, jailbreak, temel uygulama ve yedekler korunur. Framework açıldıktan sonra katalog API’si hazır değilse betik tekrar çalıştırmanı ister ve işaret dosyasını tutar.

Temel uygulamayı kaldırmadan **önce native değişiklikleri geri al**. Uygulama kaldırıcı, native yama dururken işlemi reddeder.
