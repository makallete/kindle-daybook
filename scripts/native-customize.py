#!/usr/bin/env python3
"""Optional PW2 native customization. Default is a read-only device plan; --apply changes the device."""
import argparse,hashlib,io,json,pathlib,re,shlex,subprocess,sys,tarfile
ROOT=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts/native'))
from build import build,HASHES
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--host',required=True);p.add_argument('--identity',required=True,type=pathlib.Path);p.add_argument('--known-hosts',type=pathlib.Path);p.add_argument('--feature',choices=['home','store','all'],default='all');p.add_argument('--button-label',default='Daybook');p.add_argument('--apply',action='store_true');p.add_argument('--output',type=pathlib.Path,default=ROOT/'native-local');a=p.parse_args()
if not re.fullmatch(r'[A-Za-z0-9.:-]+',a.host) or a.host.startswith('-'):p.error('Invalid host')
if not a.identity.expanduser().is_file():p.error('SSH identity file does not exist')
ssh=['ssh','-i',str(a.identity.expanduser()),'-o','BatchMode=yes','-o','ConnectTimeout=10','root@'+a.host]
if a.known_hosts:ssh[1:1]=['-o','UserKnownHostsFile='+str(a.known_hosts.expanduser())]
def remote(command,data=None):
 try:return subprocess.run(ssh+[command],input=data,check=True,capture_output=True,timeout=120).stdout
 except subprocess.CalledProcessError as e:raise SystemExit('Device check/command failed: '+e.stderr.decode(errors='replace').strip())
 except subprocess.TimeoutExpired:raise SystemExit('SSH timed out. Wake the device and check its screen before retrying.')
info=remote('set -e; cut -c1-4 /proc/usid; cat /etc/prettyversion; test -e /mnt/us/kindle-daybook/installed; test ! -e /mnt/us/kindle-daybook/native-installed; test -x /mnt/us/usbnet/bin/curl; test -r /tmp/session_token; command -v sha256sum; command -v sqlite3').decode(errors='replace')
if '90D4' not in info or not re.search(r'5\.12\.2\.2(?![0-9.])',info):raise SystemExit('Unsupported device/firmware')
local=a.output.resolve();originals=local/'originals';patched=local/'patched';originals.mkdir(parents=True,exist_ok=True);local.chmod(0o700)
paths={'home.jar':'/opt/amazon/ebook/booklet/home.jar','kaf.jar':'/opt/amazon/ebook/lib/kaf.jar','searchbar-assets.jar':'/opt/amazon/ebook/lib/searchbar-assets.jar'}
names=['home.jar'] if a.feature=='home' else ['kaf.jar','searchbar-assets.jar'] if a.feature=='store' else list(paths)
def read_file(path):
 raw=remote("printf '\\nDAYBOOK_FILE\\n'; cat "+shlex.quote(path));return raw.split(b'\nDAYBOOK_FILE\n',1)[1]
for name in names:
 data=read_file(paths[name])
 if hashlib.sha256(data).hexdigest()!=HASHES[name]:raise SystemExit('Original hash mismatch: '+name+'. Other modifications or firmware detected; nothing applied.')
 (originals/name).write_bytes(data);(originals/name).chmod(0o600)
store_hash=None
if a.feature in ['store','all']:
 data=read_file('/var/local/mesquite/store/index.html');(originals/'store-index.html').write_bytes(data);store_hash=hashlib.sha256(data).hexdigest()
build(originals,patched,a.feature,a.button_label)
manifest={'feature':a.feature,'files':[{ 'name':n,'path':paths[n],'original':HASHES[n],'patched':hashlib.sha256((patched/n).read_bytes()).hexdigest()} for n in names],'store_original':store_hash}
(local/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Verified factory originals. Planned:',a.feature,'; toolbar label:',a.button_label)
if not a.apply:print('Read-only device plan complete. Private local originals are in native-local; keep them out of Git. Add --apply only to install this plan.');raise SystemExit(0)
# Snapshot only the catalog fields this optional feature changes; book history is not modified.
snapshot=[]
if a.feature in ['home','all']:
 query="SELECT p_uuid,p_isVisibleInHome,p_lastAccess FROM Entries WHERE p_location='/mnt/us/documents/Daybook.sh' OR p_type IN ('Entry:Item:OOBE','Entry:Item:Feedback');"
 raw=remote("printf '\\nDAYBOOK_ROWS\\n'; sqlite3 /var/local/cc.db "+shlex.quote(query)).decode().split('\nDAYBOOK_ROWS\n',1)[1]
 for line in raw.splitlines():
  uuid,visible,last=line.split('|');snapshot.append({'update':{'uuid':uuid,'isVisibleInHome':None if visible=='' else bool(int(visible)),'lastAccess':None if last=='' else float(last)}})
archive=io.BytesIO()
with tarfile.open(fileobj=archive,mode='w:gz') as tar:
 for name in names:tar.add(patched/name,arcname=name)
 for name in ['apply.sh','restore.sh','pin-home.sh','daybook-home.conf','store-shortcut.html']:tar.add(ROOT/'kindle/native'/name,arcname=name)
 def extra(name,data):
  item=tarfile.TarInfo(name);item.size=len(data);item.mode=0o600;tar.addfile(item,io.BytesIO(data))
 extra('manifest.json',json.dumps(manifest).encode());extra('catalog-before.json',json.dumps({'commands':snapshot}).encode())
 lines=['#!/bin/sh','set -eu']
 for row in manifest['files']:lines+=['test "$(sha256sum '+shlex.quote(row['path'])+' | cut -d " " -f 1)" = '+shlex.quote(row['original'])]
 if store_hash:lines+=['test "$(sha256sum /var/local/mesquite/store/index.html | cut -d " " -f 1)" = '+shlex.quote(store_hash)]
 extra('verify-originals.sh',('\n'.join(lines)+'\n').encode())
 sums=''.join(hashlib.sha256((patched/n).read_bytes()).hexdigest()+'  '+n+'\n' for n in names);extra('PATCHED-SHA256SUMS',sums.encode())
remote('mkdir -p /mnt/us/kindle-daybook/native-staging; rm -f /mnt/us/kindle-daybook/native-staging/home.jar /mnt/us/kindle-daybook/native-staging/kaf.jar /mnt/us/kindle-daybook/native-staging/searchbar-assets.jar; tar xzf - -C /mnt/us/kindle-daybook/native-staging',archive.getvalue())
print(remote('sh /mnt/us/kindle-daybook/native-staging/apply.sh '+shlex.quote(a.feature)).decode(errors='replace'))
