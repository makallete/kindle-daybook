#!/usr/bin/env python3
"""Build the source download from an allowlist; never package local credentials/tools."""
import pathlib,zipfile,hashlib
root=pathlib.Path(__file__).resolve().parents[1]
target=root/'website/kindle-daybook-v0.1.0-alpha.zip'
files=[]
for folder in ['worker','kindle','scripts','docs']:
 for p in (root/folder).rglob('*'):
  if p.is_file() and not {'work','node_modules','.wrangler','tools','__pycache__'}.intersection(p.relative_to(root).parts) and p.name not in {'.dev.vars','.env'}:files.append(p)
for name in ['README.md','LICENSE','THIRD_PARTY.md','CONTRIBUTING.md','SECURITY.md','CHANGELOG.md','PRODUCT.md','DESIGN.md','.gitignore']:files.append(root/name)
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
 for p in sorted(files):
  item=zipfile.ZipInfo('kindle-daybook/'+str(p.relative_to(root)),date_time=(2026,10,27,0,0,0));item.compress_type=zipfile.ZIP_DEFLATED;item.external_attr=0o644<<16;archive.writestr(item,p.read_bytes())
(root/'website/SHA256SUMS.txt').write_text(hashlib.sha256(target.read_bytes()).hexdigest()+'  '+target.name+'\n')
print('Source download packaged:',len(files),'files;',target.stat().st_size,'bytes')
