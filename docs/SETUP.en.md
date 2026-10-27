# Setup guide

[Türkçe](KURULUM.md) · [Overview](README.en.md)

## 1. Check the device and complete the prerequisites

This alpha installer accepts only the validated 90D4 Paperwhite 2 variant on firmware 5.12.2.2. Check Settings → Device Options → Device Info. Do not use this installer on other firmware/models.

Use the [KindleModding device/jailbreak guide](https://kindlemodding.org/jailbreaking/) to select the correct method. Our device used [WinterBreak2](https://kindlemodding.org/jailbreaking/WinterBreak2/), developed by Scam.Net and Penguins184. Follow their current instructions and post-jailbreak steps. A JAILBROKEN marker alone does not establish that scriptlets or SSH work.

Before using our installer, complete scriptlet/MKK support and configure **root SSH using your own key**. The installer requires `/var/local/mkk/su`, `/mnt/us/usbnet/bin/evtest`, SQLite and Mesquite. See [USBNetwork](https://wiki.mobileread.com/wiki/USBNetwork). This project does not install a jailbreak, change passwords or configure your network. The original device setup was tested from macOS; Windows/Linux transport has not been device-tested.

## 2. Prepare your computer and Worker

Install Node.js 22+, Python 3.10+ and an OpenSSH client. On Windows, substitute `py -3` for `python3` when appropriate.

```sh
git clone https://github.com/makallete/kindle-daybook.git
cd kindle-daybook/worker
npm ci
npm test
npx wrangler login
```

Edit `wrangler.jsonc`: choose a Worker name and set `APP_NAME`, `WEATHER_CITY`, `WEATHER_LAT` and `WEATHER_LON`. Set APP_LANGUAGE to tr or en for the Kindle interface, dates and commute labels. The timezone remains Europe/Istanbul.

Generate a new screen token with `openssl rand -hex 32`, then enter it when prompted:

```sh
npx wrangler secret put SCREEN_TOKEN
npx wrangler secret put ICAL_URL
# Optional second calendar:
npx wrangler secret put SHARED_ICAL_URL
npx wrangler deploy
```

In Google Calendar, get each calendar's secret iCal URL from Settings → Integrate calendar. Keep every real secret out of Git, screenshots and issues. Open your own deployed Worker URL at `/d/<SCREEN_TOKEN>`; the bare root intentionally returns 404. Anyone holding the full private display URL can read its screen data.

## 3. Verify in the browser, then install fullscreen

First open the private URL in a computer browser and the Kindle's normal browser. Native fullscreen is an optional next step; the normal browser retains its toolbar.

Make one normal SSH connection first and verify the device's host key. Substitute your own address and key path:

```sh
ssh -i ~/.ssh/kindle root@192.168.1.20
exit
```

From the repository root:

```sh
python3 scripts/fetch-tools.py
python3 scripts/install.py --host 192.168.1.20 --identity ~/.ssh/kindle --check
python3 scripts/install.py --host 192.168.1.20 --identity ~/.ssh/kindle --name "My Day" --url "https://YOUR-WORKER/d/YOUR_SCREEN_TOKEN" --install
```

The tool downloader retrieves only `wmctrl` and its upstream license from the pinned KOReader PW2 release and checks SHA-256. KOReader itself is not installed. `--check` is read-only. Use matching `APP_NAME` and `--name` values for the page and library launcher.

Installation adds its own files and app registration, backing up appreg.db under `/mnt/us/kindle-daybook/backup/`. It does not patch the Home screen, Store, firmware or screensaver. Open your chosen launcher in the Kindle library; a device/framework restart may be needed for discovery. A short press and release of Power returns Home and restores normal sleep. The fallback is `sh /mnt/us/documents/Daybook_Exit.sh` via SSH.

## 4. Optional live commute

Check [Google Routes usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing) before enabling it. We do not promise free or card-free access. Calendar and weather work without this feature. Create your own Routes-only API key and set:

```sh
cd worker
npx wrangler secret put GOOGLE_MAPS_API_KEY
npx wrangler secret put HOME_ADDRESS
npx wrangler secret put WORK_ADDRESS
npx wrangler deploy
```

Use exact building/vehicle entrance addresses. Different access points can change road distance. The server selects the lowest traffic-aware duration among returned alternatives, not the shortest distance.

Turkey-time default: home → work 00:00–11:59, work → home 12:00–23:59. Manual changes return after 30 seconds. Selected calendar days independently return after 100 seconds.

Weekdays: 36 home → work requests every five minutes from 08:00 to 10:55, plus 14 spread outside that interval. The return direction uses 15:00–17:55 plus 14 other slots. Weekends: hourly for both directions, 48 total. **This is an active-screen schedule, not a server-enforced daily spending limit.** Each opening/reload fetches both routes; multiple screens add usage. Configure a hard quota in your Google Cloud project. Missed slots while offline/asleep are not replayed. API keys never enter client HTML; the currently displayed routes are held in browser memory, not persisted in KV/D1.

## 5. Verify, troubleshoot and remove

- Missing `.sh` launchers: complete post-jailbreak scriptlet support first; repeatedly triggering jailbreak is not a setup method.
- SSH timeout: wake the device, check Wi-Fi and IP.
- 404: check your private `/d/<token>` URL and Worker secret.
- No route: check all three traffic secrets, API access and quota. No invented ETA is shown.
- Footer update time: last calendar/weather screen response; calendars can be cached for 5 minutes, weather for 10. The Google Maps timestamp belongs to the separate route request.
- Application Error: return Home and reopen once. For recurrence, report model/firmware and redacted logs in an issue.

```sh
ssh -i ~/.ssh/kindle root@192.168.1.20 'sh /mnt/us/kindle-daybook/uninstall.sh'
```

Removal deletes this app's registration and launchers, preserving books/jailbreak and leaving the backup/download folder. It does not restore the entire appreg database, which could undo unrelated later installs. Delete your Worker and API key separately if no longer wanted.

## Optional native appearance / İsteğe bağlı görünüm

[Store, Home and cleanup / Store, Home ve temizlik](NATIVE.en.md). Restore native changes before uninstalling the core app.
