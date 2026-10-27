#!/usr/bin/env python3
"""PW2 alpha installer. --check is read-only; installation needs an explicit --install."""
import argparse,io,json,pathlib,re,shlex,subprocess,tarfile,urllib.parse,urllib.request,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--host',required=True);p.add_argument('--identity',required=True,type=pathlib.Path)
p.add_argument('--known-hosts',type=pathlib.Path);p.add_argument('--url');p.add_argument('--name',default='Daybook')
p.add_argument('--install',action='store_true');p.add_argument('--check',action='store_true')
a=p.parse_args()
if not re.fullmatch(r'[A-Za-z0-9.:-]+',a.host) or a.host.startswith('-'):p.error('Invalid host')
if not a.identity.expanduser().is_file():p.error('SSH identity file does not exist')
ssh=['ssh','-i',str(a.identity.expanduser()),'-o','BatchMode=yes','-o','ConnectTimeout=10','root@'+a.host]
if a.known_hosts:ssh[1:1]=['-o','UserKnownHostsFile='+str(a.known_hosts.expanduser())]
def remote(command,data=None):
 try:return subprocess.run(ssh+[command],input=data,check=True,capture_output=True,timeout=90).stdout
 except subprocess.CalledProcessError as e:raise SystemExit('SSH/device check failed. Wake the Kindle, verify the IP, host key and prerequisites. '+e.stderr.decode(errors='replace').strip())
 except subprocess.TimeoutExpired:raise SystemExit('Device command timed out; check the Kindle screen and connection.')
check=remote("set -e; printf 'DAYBOOK_CHECK\n'; cut -c1-4 /proc/usid; cat /etc/prettyversion; id -u; test -x /var/local/mkk/su; test -x /mnt/us/usbnet/bin/evtest; command -v sqlite3; command -v mesquite; command -v tar; test ! -e /mnt/us/kindle-daybook/installed").decode(errors='replace')
if '90D4' not in check or not re.search(r'5\.12\.2\.2(?![0-9.])',check):raise SystemExit('This alpha installer only supports the validated 90D4 PW2 variant on 5.12.2.2')
print('Supported PW2 firmware, root SSH, scriptlets, evtest and SQLite verified.')
if not a.install:print('Read-only check complete. Add --install with --url to install.');raise SystemExit(0)
url=urllib.parse.urlparse(a.url or '')
if url.scheme!='https' or not url.hostname or url.username or url.password or not re.fullmatch('/d/[A-Za-z0-9_-]{32,}',url.path) or url.query or url.fragment:p.error('Use the deployed HTTPS /d/<random-token> URL')
if not 1<=len(a.name)<=40 or any(ord(c)<32 for c in a.name):p.error('Name must contain 1–40 printable characters')
if not (ROOT/'kindle/tools/wmctrl').is_file():raise SystemExit('Run python3 scripts/fetch-tools.py first')
# Test only HEAD; this checks access without consuming a Google route query.
with urllib.request.urlopen(urllib.request.Request(a.url,method='HEAD'),timeout=20) as r:
 if r.status!=200:raise SystemExit('Dashboard is not reachable')
archive=io.BytesIO()
with tarfile.open(fileobj=archive,mode='w:gz') as tar:
 for file in (ROOT/'kindle').rglob('*'):
  if file.is_file():tar.add(file,arcname=file.relative_to(ROOT/'kindle'))
 def extra(name,data):
  item=tarfile.TarInfo(name);item.size=len(data);item.mode=0o600;tar.addfile(item,io.BytesIO(data))
 extra('screen-config.js',('window.dashboardURL = '+json.dumps(a.url)+';\n').encode())
 ET.register_namespace('', 'http://www.w3.org/ns/widgets');ET.register_namespace('kindle','http://kindle.amazon.com/ns/widget-extensions')
 tree=ET.parse(ROOT/'kindle/fullscreen/config.xml');tree.getroot().find('{http://www.w3.org/ns/widgets}name').text=a.name
 extra('fullscreen/config.xml',ET.tostring(tree.getroot(),encoding='utf-8',xml_declaration=True))
 launcher=(ROOT/'kindle/Daybook.sh').read_text().replace('# Name: Daybook','# Name: '+a.name)
 extra('Daybook.sh',launcher.encode())
remote('mkdir -p /mnt/us/kindle-daybook; tar xzf - -C /mnt/us/kindle-daybook',archive.getvalue())
result=remote('sh /mnt/us/kindle-daybook/install.sh');print(result.decode(errors='replace'))
