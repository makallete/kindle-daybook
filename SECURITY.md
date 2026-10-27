# Security

Do not post private calendar URLs, screen tokens or API/SSH keys in public issues. If accidentally exposed, revoke/rotate them in the originating service.

For a reproducible security issue, open an issue with a minimal fictional example and no private values. If exploit details would expose an active deployment, use GitHub private vulnerability reporting if enabled on this repository. No response-time guarantee is offered for this community alpha.

The display uses a private bearer URL, not per-user authentication. Anyone with that URL can read the display. Use separate deployments/tokens for separate users. Self-host in your own Cloudflare account; no centralized calendar collection service is supplied.
