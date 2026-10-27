#!/bin/sh
set -eu
BASE=/mnt/us/kindle-daybook
STAGE=$BASE/native-staging
BACKUP=$BASE/native-backup
FEATURE=${1:-}
case "$FEATURE" in home|store|all) ;; *) exit 1 ;; esac
[ "$(id -u)" = 0 ] && [ -e "$BASE/installed" ] && [ ! -e "$BASE/native-installed" ] || exit 1
[ ! -e /etc/upstart/daybook-home.conf ] || { echo 'Home startup path already exists'; exit 1; }
cd "$STAGE"
sh verify-originals.sh
sha256sum -c PATCHED-SHA256SUMS
if [ -d "$BACKUP" ]; then mv "$BACKUP" "$BASE/native-backup-$(date -u +%Y%m%dT%H%M%SZ)-$$"; fi
mkdir -p "$BACKUP"
cp manifest.json catalog-before.json "$BACKUP/"
for name in home.jar kaf.jar searchbar-assets.jar; do
 [ -f "$name" ] || continue
 case "$name" in home.jar) original=/opt/amazon/ebook/booklet/home.jar ;; *) original=/opt/amazon/ebook/lib/$name ;; esac
 [ ! -e "$BACKUP/$name" ] || { echo 'Backup already exists; inspect the prior attempt'; exit 1; }
 cp "$original" "$BACKUP/$name"
done
if [ "$FEATURE" = store ] || [ "$FEATURE" = all ]; then
 [ -f /var/local/mesquite/store/index.html ] || exit 1
 cp /var/local/mesquite/store/index.html "$BACKUP/store-index.html"
 [ "$(sqlite3 /var/local/appreg.db "SELECT count(*) FROM handlerIds WHERE handlerId='org.kindledaybook.launcher';")" = 0 ] || { echo 'Shortcut app ID already exists'; exit 1; }
fi
(cd "$BACKUP"; sha256sum *.jar > ORIGINAL-SHA256SUMS)
cp restore.sh "$BASE/native-restore.sh"
sh /mnt/us/documents/Daybook_Exit.sh
finish() {
 result=$?
 trap - EXIT
 if [ "$result" != 0 ]; then
  mount -o remount,rw / || true
  for name in home.jar kaf.jar searchbar-assets.jar; do
   [ -f "$BACKUP/$name" ] || continue
   case "$name" in home.jar) target=/opt/amazon/ebook/booklet/home.jar ;; *) target=/opt/amazon/ebook/lib/$name ;; esac
   cp "$BACKUP/$name" "$target" || true
  done
  [ ! -f "$BACKUP/store-index.html" ] || cp "$BACKUP/store-index.html" /var/local/mesquite/store/index.html
  rm -f /etc/upstart/daybook-home.conf "$BASE/pin-home.sh" "$BASE/native-installed"
  sqlite3 /var/local/appreg.db "DELETE FROM properties WHERE handlerId='org.kindledaybook.launcher'; DELETE FROM handlerIds WHERE handlerId='org.kindledaybook.launcher';" || true
 fi
 sync; mount -o remount,ro / || true
 /sbin/initctl start framework || true
 exit "$result"
}
trap finish EXIT
/sbin/initctl stop framework
mount -o remount,rw /
for name in home.jar kaf.jar searchbar-assets.jar; do
 [ -f "$STAGE/$name" ] || continue
 case "$name" in home.jar) target=/opt/amazon/ebook/booklet/home.jar ;; *) target=/opt/amazon/ebook/lib/$name ;; esac
 cp "$STAGE/$name" "$target.daybook-new"; chmod 644 "$target.daybook-new"; mv "$target.daybook-new" "$target"
done
if [ "$FEATURE" = home ] || [ "$FEATURE" = all ]; then
 cp pin-home.sh "$BASE/pin-home.sh"; chmod 755 "$BASE/pin-home.sh"
 cp daybook-home.conf /etc/upstart/daybook-home.conf
fi
if [ "$FEATURE" = store ] || [ "$FEATURE" = all ]; then
 cp store-shortcut.html /var/local/mesquite/store/index.html
 sqlite3 /var/local/appreg.db <<SQL
BEGIN;
INSERT INTO handlerIds(handlerId) VALUES('org.kindledaybook.launcher');
INSERT INTO properties(handlerId,name,value) VALUES('org.kindledaybook.launcher','command','/bin/sh /mnt/us/documents/Daybook.sh');
COMMIT;
SQL
fi
printf '%s\n' "$FEATURE" > "$BASE/native-installed"
echo 'Native customization installed. Framework is restarting; allow around 90 seconds.'
