#!/bin/sh
set -eu
BASE=/mnt/us/kindle-daybook
APP=org.kindledaybook.dashboard
APPDIR=/var/local/mesquite/kindle-daybook
[ "$(id -u)" = 0 ] || { echo 'Root SSH is required'; exit 1; }
[ -x "$BASE/tools/wmctrl" ] && [ -x /mnt/us/usbnet/bin/evtest ] || { echo 'Missing wmctrl or USBNetwork evtest'; exit 1; }
[ -x /var/local/mkk/su ] || { echo 'Scriptlet integration / MKK su is required'; exit 1; }
[ ! -e "$BASE/installed" ] || { echo 'Already installed. Uninstall before replacing this alpha release.'; exit 1; }
[ ! -e /mnt/us/documents/Daybook.sh ] && [ ! -e /mnt/us/documents/Daybook_Exit.sh ] || { echo 'Launcher paths already exist'; exit 1; }
COUNT=$(sqlite3 /var/local/appreg.db "SELECT count(*) FROM properties WHERE handlerId='$APP';")
[ "$COUNT" = 0 ] || { echo 'App ID already exists; refusing to replace it'; exit 1; }
mkdir -p "$BASE/backup" "$APPDIR"
# Keep a consistent backup before changing application registration.
sqlite3 /var/local/appreg.db ".backup '$BASE/backup/appreg.db'"
cp "$BASE/fullscreen/config.xml" "$BASE/fullscreen/index.html" "$BASE/screen-config.js" "$APPDIR/"
cp "$BASE/tools/wmctrl" "$BASE/wmctrl"
cp "$BASE/fullscreen/fullscreen-watch.sh" "$BASE/fullscreen-watch.sh"
cp "$BASE/Daybook.sh" /mnt/us/documents/Daybook.sh
cp "$BASE/Daybook_Exit.sh" /mnt/us/documents/Daybook_Exit.sh
chmod 755 "$BASE/wmctrl" "$BASE/fullscreen-watch.sh" /mnt/us/documents/Daybook*.sh
sqlite3 /var/local/appreg.db <<SQL
BEGIN;
INSERT OR IGNORE INTO interfaces(interface) VALUES('application');
INSERT OR IGNORE INTO handlerIds(handlerId) VALUES('$APP');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP','lipcId','$APP');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP','command','/usr/bin/mesquite -l $APP -c file://$APPDIR/ -j');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP','supportedOrientation','U');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP','default-chrome-style','NH');
COMMIT;
SQL
touch "$BASE/installed"
lipc-set-prop com.lab126.scanner doFullScan 1 || true
echo 'Installed. Open Daybook from the Kindle library; a framework restart may be needed.'
