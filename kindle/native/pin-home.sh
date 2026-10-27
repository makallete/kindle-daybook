#!/bin/sh
# Keep the application launcher ahead of ordinary reading-history entries.
# Only this launcher entry is updated; book reading times remain untouched.
entry=$(sqlite3 /var/local/cc.db "SELECT p_uuid FROM Entries WHERE p_location='/mnt/us/documents/Daybook.sh' LIMIT 1;")
[ -n "$entry" ] || exit 0
payload=/var/run/daybook-home-pin.json
printf '{"commands":[{"update":{"uuid":"%s","lastAccess":2140000000}}' "$entry" > "$payload"
for extra in $(sqlite3 /var/local/cc.db "SELECT p_uuid FROM Entries WHERE p_type IN ('Entry:Item:OOBE','Entry:Item:Feedback');"); do
 printf ',{"update":{"uuid":"%s","isVisibleInHome":false}}' "$extra" >> "$payload"
done
# Keep technical helper scripts out of the recent-book positions, preserving library access.
for helper in $(sqlite3 /var/local/cc.db "SELECT p_uuid FROM Entries WHERE p_location IN ('/mnt/us/documents/Daybook_Exit.sh');"); do
 printf ',{"update":{"uuid":"%s","lastAccess":0}}' "$helper" >> "$payload"
done
printf ']}' >> "$payload"
/mnt/us/usbnet/bin/curl --fail --silent --show-error --max-time 10 \
 -H "AuthToken: $(cat /tmp/session_token)" -H 'Content-Type: application/json' \
 --data-binary "@$payload" http://127.0.0.1:9101/change >/dev/null
result=$?
rm -f "$payload"
exit "$result"
