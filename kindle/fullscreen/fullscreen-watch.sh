#!/bin/sh
APP=org.kindledaybook.dashboard
PIDFILE=/var/run/kindle-daybook-fullscreen.pid
FIFO=/var/run/kindle-daybook-button.fifo
EVENT_PID=
finish() {
    [ -z "$EVENT_PID" ] || kill "$EVENT_PID" 2>/dev/null
    rm -f "$FIFO"
    if [ "$(cat "$PIDFILE" 2>/dev/null)" = "$$" ]; then rm -f "$PIDFILE"; fi
    if [ "$(lipc-get-prop com.lab126.appmgrd activeApp 2>/dev/null)" != "$APP" ]; then
        lipc-set-prop com.lab126.powerd preventScreenSaver 0
    fi
}
trap finish EXIT
trap 'exit 0' TERM INT
rm -f "$FIFO"
mkfifo "$FIFO" || exit 1
# Read a second copy of key events; do not grab the input device.
/mnt/us/usbnet/bin/evtest /dev/input/event0 > "$FIFO" 2>/dev/null &
EVENT_PID=$!
echo BUTTON_LISTENER_READY
while IFS= read -r line; do
    case "$line" in
        *KEY_POWER*'value 0'*)
            [ "$(lipc-get-prop com.lab126.appmgrd activeApp 2>/dev/null)" = "$APP" ] || break
            lipc-set-prop com.lab126.powerd preventScreenSaver 0
            lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.home
            echo POWER_BUTTON_EXIT
            break
            ;;
    esac
done < "$FIFO"
