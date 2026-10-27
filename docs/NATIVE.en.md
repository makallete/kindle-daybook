# Optional native Home, Store shortcut and cleanup

[Türkçe](NATIVE.tr.md) · [Core setup](SETUP.en.md)

The website shows labeled before/after **schematics**, not fabricated device screenshots. This section is optional and comes after the core app. It supports only the validated PW2 90D4 / 5.12.2.2 factory originals. The original native Home layout was verified on a physical device; this generalized distribution is alpha and has not yet been applied to a second clean device.

## What changes

- **Store:** calendar icon and an up-to-eight-character ASCII button label, linked to your fullscreen app. The library and display name can be longer and Unicode; the native toolbar has limited space.
- **Home:** hides recommendation campaigns and the reading-list side panel. A large pinned Daybook launcher sits beside four recent books, aligned in two rows. Setup/Feedback cards are hidden from Home; book reading positions and access times are not rewritten.
- **Cleanup:** a separate tool lists only known installer leftovers. Archiving moves them to a dated backup; it does not permanently delete them. No speed or battery improvement has been measured.

No Amazon JAR, firmware or decompiled Amazon source is distributed. The owner downloads their own device's factory files locally over SSH. Known SHA-256 hashes must match before patching. Another firmware, existing modification or unknown variant causes a stop.

## Plan, then apply

With core Daybook already installed, from the repository root:

```sh
python3 scripts/native-customize.py --host 192.168.1.20 --identity ~/.ssh/kindle --feature all
```

Default is a **read-only device plan**. It verifies model/firmware, retrieves your factory originals into ignored `native-local/originals/`, and builds local patches in `native-local/patched/`. Keep these proprietary/local files out of public Git. `--feature store` or `--feature home` can select one branch instead of both.

If the plan passes:

```sh
python3 scripts/native-customize.py --host 192.168.1.20 --identity ~/.ssh/kindle --feature all --button-label Daybook --apply
```

The apply path rechecks the on-device original hashes, verifies uploaded patches, saves originals in `/mnt/us/kindle-daybook/native-backup/`, and stops the framework only for replacement. The root filesystem returns read-only and the framework restarts. Allow roughly 90 seconds; a briefly white screen can be normal during startup. After Home opens, verify shortcut launch, four book positions, book reading and physical-button exit. The Store shortcut replaces store access on that button; the feature is optional.

The selected set is one installation transaction. To change branches later, restore first and then apply the desired set. Never bypass a hash mismatch or apply compiled artifacts from another device.

## Archive known setup leftovers

```sh
python3 scripts/cleanup.py --host 192.168.1.20 --identity ~/.ssh/kindle
# Move only the listed known paths to backup:
python3 scripts/cleanup.py --host 192.168.1.20 --identity ~/.ssh/kindle --archive
```

Default allowlist: `/mnt/us/fill_disk`, `/mnt/us/usbnet_installer`. Only with explicit `--include-recovery` are `/mnt/us/emergency.sh` and `/mnt/us/RUNME.sh` included. Inspect any custom recovery dependencies first: if a startup/recovery hook still uses one of these exact paths, leave it in place. The command never targets `/mnt/us/usbnet`, documents/books, MKK, jailbreak payload folders or personal files outside this allowlist. Backup is `/mnt/us/kindle-daybook/cleanup-backup/<UTC timestamp>/`. Restore an item by moving it back to `/mnt/us/` with the same name. Archiving on the device does not free storage space; it organizes leftovers reversibly.

## Restore native originals

```sh
ssh -i ~/.ssh/kindle root@192.168.1.20 'sh /mnt/us/kindle-daybook/native-restore.sh'
```

Backup hashes are checked first. Restore replaces only this feature's system files, removes its startup task/shortcut registration, and restores only the catalog fields it changed. The whole catalog database is not replaced. Books, jailbreak, core app and backups remain. If the catalog API is not ready after framework startup, the script asks for a retry and retains its marker.

Restore native changes **before** uninstalling the core app; its uninstaller refuses while native changes remain installed.
