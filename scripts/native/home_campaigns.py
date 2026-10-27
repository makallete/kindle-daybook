from pathlib import Path
import zipfile,struct,hashlib
source=Path('work/kindle-home.jar')
target='com/amazon/kindle/home/controller/ExtendedHomeDisplayController.class'
raw=zipfile.ZipFile(source).read(target)
assert hashlib.sha256(source.read_bytes()).hexdigest() == 'fc76e61a411d50a3a2dfa78cea07b571a997f8f601ef5f357e1bc814da22cfbf'
u2=lambda b,p:struct.unpack_from('>H',b,p)[0]
u4=lambda b,p:struct.unpack_from('>I',b,p)[0]
count=u2(raw,8);p=10;cp={};i=1
while i<count:
 tag=raw[p];p+=1
 if tag==1:
  size=u2(raw,p);p+=2;cp[i]=raw[p:p+size].decode('utf-8',errors='replace');p+=size
 elif tag in (3,4):p+=4
 elif tag in (5,6):p+=8;i+=1
 elif tag in (7,8,16,19,20):p+=2
 elif tag in (9,10,11,12,17,18):p+=4
 elif tag==15:p+=3
 else:raise ValueError(tag)
 i+=1
p+=6
interfaces=u2(raw,p);p+=2+2*interfaces
fields=u2(raw,p);p+=2
for _ in range(fields):
 attrs=u2(raw,p+6);p+=8
 for _ in range(attrs):p+=6+u4(raw,p+2)
methods=u2(raw,p);p+=2;prefix=raw[:p];out=bytearray(prefix);changed=[]
for _ in range(methods):
 start=p;access,name,desc,attrs=struct.unpack_from('>HHHH',raw,p);p+=8;out+=raw[start:p]
 replace=cp[name] in ('bPM','bPQ','bPR') and cp[desc]=='()V'
 for _ in range(attrs):
  attr=u2(raw,p);length=u4(raw,p+2);data=raw[p+6:p+6+length];p+=6+length
  if replace and cp[attr]=='Code':
   data=struct.pack('>HHI',0,1,1)+b'\xb1'+struct.pack('>HH',0,0);changed.append(cp[name])
  out+=struct.pack('>HI',attr,len(data))+data
out+=raw[p:];assert sorted(changed)==['bPM','bPQ','bPR']
with zipfile.ZipFile(source) as z,zipfile.ZipFile('work/kindle-home-clean.jar','w',zipfile.ZIP_DEFLATED) as dst:
 for info in z.infolist():dst.writestr(info,bytes(out) if info.filename==target else z.read(info.filename))
with zipfile.ZipFile(source) as a,zipfile.ZipFile('work/kindle-home-clean.jar') as b:
 diffs=[n for n in a.namelist() if a.read(n)!=b.read(n)];assert diffs==[target]
Path('work/ExtendedHomeDisplayController-clean.class').write_bytes(out)
print('Only campaign loading, campaign validation and campaign impression handling changed:',changed)
print('Source SHA256:',hashlib.sha256(source.read_bytes()).hexdigest())
