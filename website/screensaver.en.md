# Use your photo as the Kindle screensaver

Upload your photo to Codex or Claude Code and say “Use this as my Kindle screensaver.” It appears while the Kindle sleeps, separately from the app icon and library cover.

## Procedure for Codex / Claude Code

This documents the method used on the development device. The current app installer does not apply it automatically. Use the owner's own photo and device. Keep photos, SSH keys and device backups out of Git and public sites.

1. **Verify the device.** This method was tested only on the 90D4 Paperwhite 2 with firmware 5.12.2.2. Check root SSH, the 20 regular files `bg_ss00.png` through `bg_ss19.png` in `/usr/share/blanket/screensaver/`, permissions and available space. Do not apply this replacement method to symlinks, a different file layout, another screensaver extension; investigate compatibility first.
2. **Prepare the photo.** Preserve the original. Create a portrait 758 × 1024, 8-bit grayscale PNG without stretching it. Confirm cropping versus padding with the owner and show a preview before applying it.
3. **Back up the originals.** Record SHA-256 hashes for all 20 files. Archive `screensaver/` relative to `/usr/share/blanket`. Keep copies at `/mnt/us/kindle-daybook/backup/screensaver-stock.tar` on the device and under the Git-excluded `native-local/screensaver/` on the computer. Never overwrite an existing backup; use a new dated archive. Read the archive back and verify its paths and contents against the hashes before proceeding.
4. **Transfer the image.** Copy the prepared PNG to `/mnt/us/kindle-daybook/screensaver.png`. Verify matching local and remote SHA-256 hashes.
5. **Replace the screensavers.** Touch only the 20 files verified during preflight. Install an exit trap that restores the root filesystem to read-only even on errors before briefly remounting it writable. Replace each image through a temporary file in the same directory and atomic rename, preserving `root:root` ownership and `0644` permissions. Run `sync`, restore read-only mounting and verify all 20 hashes match the new PNG. Do not guess equivalent paths on other firmware.
6. **Test actual sleep.** Exit the app to Home, then put the Kindle to sleep with Power. Ask the owner to confirm the photo appears. The app prevents sleep while running, so perform this check from Home. Wake the device and check that books and the app still open normally.
7. **Leave a restore path.** Give the owner their exact backup locations. Before restoring, validate the archive's path list; restore only the 20 backed-up files into `/usr/share/blanket/screensaver/`, including ownership and permissions. Use the same writable/read-only mount discipline, verify the original SHA-256 list and check sleep again. The app uninstaller does not restore these system files; restore them before removing the app.
