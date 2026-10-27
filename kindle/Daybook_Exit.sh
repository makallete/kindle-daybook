#!/bin/sh
# Name: Normal Uykuya Don
# Author: Kindle dashboard
if [ "$(id -u)" -ne 0 ]; then
    exec /var/local/mkk/su -s /bin/sh -c 'sh /mnt/us/documents/Daybook_Exit.sh'
fi
lipc-set-prop com.lab126.powerd preventScreenSaver 0
lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.home
PIDFILE=/var/run/kindle-daybook-fullscreen.pid
if [ -s "$PIDFILE" ]; then
    watcher=$(cat "$PIDFILE")
    if [ -r "/proc/$watcher/cmdline" ] && tr '\000' ' ' < "/proc/$watcher/cmdline" | grep -q 'fullscreen-watch.sh'; then
        kill "$watcher" 2>/dev/null
    fi
fi
