#!/usr/bin/env python3
"""Retrieve the independently licensed PW2 window tool from upstream, verify before use."""
import hashlib,io,pathlib,urllib.request,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
URL='https://github.com/koreader/koreader/releases/download/v2026.07.1/koreader-kindlepw2-v2026.07.1.zip'
EXPECTED='66f19025ae90e1d016fad5c5a69d86d55b6cf687129db2e242597cb809b14b46'
with urllib.request.urlopen(URL,timeout=120) as response: content=response.read()
with zipfile.ZipFile(io.BytesIO(content)) as archive:
 names=[n for n in archive.namelist() if n.rsplit('/',1)[-1]=='wmctrl']
 if len(names)!=1:raise SystemExit('Unexpected upstream archive layout')
 data=archive.read(names[0])
 if hashlib.sha256(data).hexdigest()!=EXPECTED:raise SystemExit('wmctrl checksum mismatch')
 target=ROOT/'kindle/tools';target.mkdir(exist_ok=True)
 (target/'wmctrl').write_bytes(data);(target/'wmctrl').chmod(0o755)
 (target/'COPYING').write_bytes(archive.read('koreader/COPYING'))
print('PW2 wmctrl verified. Upstream license saved beside the tool.')
