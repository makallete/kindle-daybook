#!/usr/bin/env python3
"""Check the distributable tree for syntax, local secrets and device-specific data."""
import ast,pathlib,re,subprocess,sys
root=pathlib.Path(__file__).resolve().parents[1]
skip={'work','native-local','native-originals','site','.impeccable','node_modules','.git','.openai','tools','__pycache__'}
for p in root.rglob('*'):
 if not p.is_file() or skip.intersection(p.relative_to(root).parts):continue
 if p.suffix in {'.zip','.ttf','.png','.jpg'}:continue
 text=p.read_text(encoding='utf-8')
 # Patterns match real credentials rather than the documented variable names.
 forbidden=[r'AIza[0-9A-Za-z_-]{30,}',r'private-[0-9a-f]{20,}',r'-----BEGIN (?:OPENSSH|RSA|EC) PRIVATE KEY-----',r'/Users/[A-Za-z0-9_.-]+/',r'ChIJ[A-Za-z0-9_-]{20,}']
 if p.name!='check-package.py':
  for pattern in forbidden:
   if re.search(pattern,text):raise SystemExit('Private-data pattern found in '+str(p.relative_to(root)))
 if p.suffix=='.py':ast.parse(text,filename=str(p))
 if p.suffix in {'.js','.mjs'}:subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
 if p.suffix=='.sh':subprocess.run(['sh','-n',str(p)],check=True,capture_output=True)
print('Package syntax and secret-pattern checks passed.')
