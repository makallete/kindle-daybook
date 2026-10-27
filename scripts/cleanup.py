#!/usr/bin/env python3
"""List known installer leftovers; --archive moves them to a dated, reversible backup."""
import argparse,pathlib,re,shlex,subprocess
CANDIDATES=['/mnt/us/fill_disk','/mnt/us/usbnet_installer','/mnt/us/emergency.sh','/mnt/us/RUNME.sh']
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--host',required=True);p.add_argument('--identity',required=True,type=pathlib.Path);p.add_argument('--archive',action='store_true');p.add_argument('--include-recovery',action='store_true',help='Also include emergency.sh and RUNME.sh after checking their dependencies');a=p.parse_args()
if not re.fullmatch(r'[A-Za-z0-9.:-]+',a.host) or a.host.startswith('-'):p.error('Invalid host')
if not a.identity.expanduser().is_file():p.error('SSH identity does not exist')
ssh=['ssh','-i',str(a.identity.expanduser()),'-o','BatchMode=yes','-o','ConnectTimeout=10','root@'+a.host]
script='set -eu\ntest -e /mnt/us/kindle-daybook/installed\n'
if a.archive:script+='DEST=/mnt/us/kindle-daybook/cleanup-backup/$(date -u +%Y%m%dT%H%M%SZ)-$$\nmkdir -p "$DEST"\n'
for item in (CANDIDATES if a.include_recovery else CANDIDATES[:2]):
 quoted=shlex.quote(item)
 if a.archive:script+='if [ -e '+quoted+' ]; then mv '+quoted+' "$DEST/"; printf "Archived: %s\\n" '+quoted+'; fi\n'
 else:script+='if [ -e '+quoted+' ]; then du -sk '+quoted+'; fi\n'
if a.archive:script+='echo "Backup: $DEST. Move individual items back to /mnt/us to restore. No permanent deletion performed."\n'
else:script+='echo "Read-only list. --archive moves only the listed known paths; books, usbnet and jailbreak components stay untouched."\n'
r=subprocess.run(ssh+['sh'],input=script.encode(),capture_output=True,timeout=90)
print(r.stdout.decode(errors='replace'))
if r.returncode:raise SystemExit(r.stderr.decode(errors='replace'))
