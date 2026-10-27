#!/bin/sh
set -eu
BASE=/mnt/us/kindle-daybook
APP=org.kindledaybook.dashboard
[ "$(id -u)" = 0 ] || exit 1
[ ! -e "$BASE/native-installed" ] || { echo 'Restore optional native changes with native-restore.sh before uninstalling the app.'; exit 1; }
[ -e "$BASE/installed" ] || { echo 'No managed installation found'; exit 1; }
sh /mnt/us/documents/Daybook_Exit.sh || true
sqlite3 /var/local/appreg.db <<SQL
BEGIN;
DELETE FROM properties WHERE handlerId='$APP';
DELETE FROM handlerIds WHERE handlerId='$APP';
COMMIT;
SQL
rm -f /mnt/us/documents/Daybook.sh /mnt/us/documents/Daybook_Exit.sh
rm -rf /var/local/mesquite/kindle-daybook
rm -f "$BASE/installed"
echo 'Removed. The backup and downloaded files remain in /mnt/us/kindle-daybook.'
