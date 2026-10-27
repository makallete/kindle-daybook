# Changelog

## v0.1.1-alpha

- Publish the bilingual project site on Netlify under makallete.
- Update GitHub links and attribution after the account rename.
- Include beginner setup prompts and photo screensaver guides.


## 0.1.0-alpha — 2026-10-27

First public, self-hosted package derived from a working PW2 application.

- Personal data removed; name, weather coordinates and commute locations configurable.
- Turkish and English site and setup guides.
- Personal/shared iCal processing, weather, optional fastest traffic-aware commute.
- Separate native app namespace to avoid replacing the original personal installation.
- Read-only preflight, explicit installation, app-registration backup and scoped removal.
- Reproducible source ZIP, MIT original source license and separate upstream credits.
- No Amazon system binaries or jailbreak payloads distributed; optional native patches are built locally from verified factory originals.

Validation: 37 Worker tests, 3 mocked installer tests and 3 native builder tests pass. The generated Home entries match the physically verified original-device patch byte for byte. The original app was physically validated on PW2 90D4 / 5.12.2.2. The generalized installer is not yet verified on a second clean device. A live read-only preflight attempt was blocked by an offline/asleep SSH endpoint; no installation was attempted on the original device.
