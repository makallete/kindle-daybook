#!/bin/sh
# Name: Daybook
# Author: Daybook contributors
if [ "$(id -u)" -ne 0 ]; then
    exec /var/local/mkk/su -s /bin/sh -c 'sh /mnt/us/documents/Daybook.sh'
fi
BASE=/mnt/us/kindle-daybook
APP=org.kindledaybook.dashboard
PIDFILE=/var/run/kindle-daybook-fullscreen.pid
[ -x "$BASE/wmctrl" ] || exit 1
lipc-set-prop com.lab126.powerd preventScreenSaver 1 || exit 1
lipc-set-prop com.lab126.appmgrd start "app://$APP" || exit 1
export DISPLAY=:0
tries=0
while [ "$tries" -lt 20 ]; do
    window=$("$BASE/wmctrl" -l | awk '/ID:org.kindledaybook.dashboard/ {print $1; exit}')
    if [ -n "$window" ]; then
        "$BASE/wmctrl" -i -r "$window" -N "L:A_N:application_PC:N_ID:$APP"
        # Mesquite may reset its title while loading. Reapply after settling.
        sleep 2
        "$BASE/wmctrl" -i -r "$window" -N "L:A_N:application_PC:N_ID:$APP"
        break
    fi
    usleep 250000
    tries=$((tries + 1))
done
[ -n "$window" ] || exit 1
if [ -s "$PIDFILE" ]; then
    previous=$(cat "$PIDFILE")
    if [ -r "/proc/$previous/cmdline" ] && tr '\000' ' ' < "/proc/$previous/cmdline" | grep -q 'fullscreen-watch.sh'; then
        kill "$previous" 2>/dev/null
        sleep 1
    fi
fi
nohup sh "$BASE/fullscreen-watch.sh" > "$BASE/fullscreen.log" 2>&1 < /dev/null &
echo "$!" > "$PIDFILE"

