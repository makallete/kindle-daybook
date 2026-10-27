#!/bin/sh
set -eu
BASE=/mnt/us/kindle-daybook
BACKUP=$BASE/native-backup
FEATURE=$(cat "$BASE/native-installed" 2>/dev/null || true)
[ "$(id -u)" = 0 ] && [ -e "$BASE/native-installed" ] && [ -s "$BACKUP/ORIGINAL-SHA256SUMS" ] || exit 1
(cd "$BACKUP"; sha256sum -c ORIGINAL-SHA256SUMS)
sh /mnt/us/documents/Daybook_Exit.sh || true
trap 'sync; mount -o remount,ro / >/dev/null 2>&1 || true; /sbin/initctl start framework >/dev/null 2>&1 || true' EXIT
/sbin/initctl stop framework
mount -o remount,rw /
for name in home.jar kaf.jar searchbar-assets.jar; do
 [ -f "$BACKUP/$name" ] || continue
 case "$name" in home.jar) target=/opt/amazon/ebook/booklet/home.jar ;; *) target=/opt/amazon/ebook/lib/$name ;; esac
 cp "$BACKUP/$name" "$target.daybook-new"; chmod 644 "$target.daybook-new"; mv "$target.daybook-new" "$target"
done
[ ! -f "$BACKUP/store-index.html" ] || cp "$BACKUP/store-index.html" /var/local/mesquite/store/index.html
rm -f /etc/upstart/daybook-home.conf "$BASE/pin-home.sh"
sqlite3 /var/local/appreg.db "DELETE FROM properties WHERE handlerId='org.kindledaybook.launcher'; DELETE FROM handlerIds WHERE handlerId='org.kindledaybook.launcher';"
# Restart first; the catalog API may not be available while framework is stopped.
sync
mount -o remount,ro /
/sbin/initctl start framework
trap - EXIT
if [ "$FEATURE" != store ] && [ -s "$BACKUP/catalog-before.json" ]; then
 restored=no
 for pass in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if /mnt/us/usbnet/bin/curl --fail --silent --max-time 3 -H "AuthToken: $(cat /tmp/session_token)" -H 'Content-Type: application/json' --data-binary "@$BACKUP/catalog-before.json" http://127.0.0.1:9101/change >/dev/null; then restored=yes; break; fi
  sleep 6
 done
 [ "$restored" = yes ] || { echo 'Originals restored; catalog API still unavailable. Run this restore script again after Home opens.'; exit 1; }
fi
rm -f "$BASE/native-installed"
echo 'Native originals and changed catalog fields restored. The local backup remains.'
