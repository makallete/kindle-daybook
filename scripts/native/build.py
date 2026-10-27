#!/usr/bin/env python3
"""Build guarded PW2 native patches from the owner's original files; no Amazon binaries bundled."""
import argparse,hashlib,os,pathlib,re,runpy,shutil,struct,sys,tempfile,zipfile,zlib
HERE=pathlib.Path(__file__).resolve().parent
HASHES={'home.jar':'fc76e61a411d50a3a2dfa78cea07b571a997f8f601ef5f357e1bc814da22cfbf','kaf.jar':'30bd94d79931fab85a8c95a546fc73d88339f230721c31b9df6d6b8b31b2a1d4','searchbar-assets.jar':'90030292c7a96703e731741877faf3b97614fe9396947a6bc7e1b7eee582322b'}
def replace_strings(raw,replacements):
 count=struct.unpack_from('>H',raw,8)[0];pos=10;out=bytearray(raw[:10]);i=1;changed=set()
 while i<count:
  tag=raw[pos];out.append(tag);pos+=1
  if tag==1:
   size=struct.unpack_from('>H',raw,pos)[0];pos+=2;value=raw[pos:pos+size];pos+=size
   if value in replacements:changed.add(value);value=replacements[value].encode('utf8')
   out+=struct.pack('>H',len(value))+value
  else:
   size={3:4,4:4,5:8,6:8,7:2,8:2,9:4,10:4,11:4,12:4,15:3,16:2,17:4,18:4,19:2,20:2}[tag];out+=raw[pos:pos+size];pos+=size
   if tag in (5,6):i+=1
  i+=1
 if changed!=set(replacements):raise ValueError('Unexpected ChromeResources strings')
 out+=raw[pos:];return bytes(out)
def calendar_png(original,active=False,disabled=False):
 if not original.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('Unexpected toolbar image format')
 w,h=struct.unpack('>II',original[16:24]);pixels=bytearray(w*h*4);color=(255,255,255,255) if active else (140,140,140,255) if disabled else (0,0,0,255)
 def dot(x,y):
  radius=max(0,round(w/35)-1)
  for xx in range(x-radius,x+radius+1):
   for yy in range(y-radius,y+radius+1):
    if 0<=xx<w and 0<=yy<h:pixels[(yy*w+xx)*4:(yy*w+xx)*4+4]=bytes(color)
 def line(a,b):
  x,y=round(a[0]*w/35),round(a[1]*h/35);ex,ey=round(b[0]*w/35),round(b[1]*h/35);dx=abs(ex-x);dy=-abs(ey-y);sx=1 if x<ex else -1;sy=1 if y<ey else -1;err=dx+dy
  while True:
   dot(x,y)
   if x==ex and y==ey:break
   e=2*err
   if e>=dy:err+=dy;x+=sx
   if e<=dx:err+=dx;y+=sy
 for a,b in [((5,8),(30,8)),((30,8),(30,31)),((30,31),(5,31)),((5,31),(5,8)),((5,15),(30,15)),((11,3),(11,11)),((24,3),(24,11)),((11,21),(14,21)),((21,21),(24,21)),((11,26),(14,26)),((21,26),(24,26))]:line(a,b)
 def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
 raw=b''.join(b'\0'+pixels[y*w*4:(y+1)*w*4] for y in range(h))
 return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
def build(originals,output,feature='all',label='Daybook'):
 originals=pathlib.Path(originals).resolve();output=pathlib.Path(output).resolve();output.mkdir(parents=True,exist_ok=True)
 if not re.fullmatch(r'[A-Za-z0-9 _-]{1,8}',label):raise ValueError('Toolbar label must be 1–8 ASCII characters')
 names=['home.jar'] if feature=='home' else ['kaf.jar','searchbar-assets.jar'] if feature=='store' else list(HASHES)
 for name in names:
  if hashlib.sha256((originals/name).read_bytes()).hexdigest()!=HASHES[name]:raise ValueError('Unsupported or already modified original: '+name)
 if 'home.jar' in names:
  previous=pathlib.Path.cwd()
  with tempfile.TemporaryDirectory() as temporary:
   try:
    os.chdir(temporary);pathlib.Path('work').mkdir();shutil.copy(originals/'home.jar','work/kindle-home.jar');sys.path.insert(0,str(HERE))
    for script in ['home_campaigns.py','home_library.py','align_home.py','remove_gutter.py']:runpy.run_path(str(HERE/script))
    with zipfile.ZipFile('work/kindle-home-aligned-final.jar') as src,zipfile.ZipFile(output/'home.jar','w',zipfile.ZIP_DEFLATED) as dst:
     for info in src.infolist():
      data=src.read(info.filename)
      if info.filename.endswith('ResumePrimaryPanel.properties'):data=data.replace(b'140.6f',b'134.36f').replace(b'0.68f, 11.04f, 0, 4.8f',b'0.68f, 4.8f, 0, 4.8f')
      if info.filename.endswith('ResumeSecondaryPanel.properties'):data=data.replace(b'104.4f',b'106.8f')
      dst.writestr(info,data)
   finally:os.chdir(previous)
 if 'kaf.jar' in names:
  target='com/amazon/kindle/restricted/device/chrome/resources/ChromeResources.class'
  with zipfile.ZipFile(originals/'kaf.jar') as src,zipfile.ZipFile(output/'kaf.jar','w',zipfile.ZIP_DEFLATED) as dst:
   for info in src.infolist():dst.writestr(info,replace_strings(src.read(info.filename),{b'store':label,b'Store':label}) if info.filename==target else src.read(info.filename))
  with zipfile.ZipFile(originals/'searchbar-assets.jar') as src,zipfile.ZipFile(output/'searchbar-assets.jar','w',zipfile.ZIP_DEFLATED) as dst:
   for info in src.infolist():
    name=info.filename.rsplit('/',1)[-1];data=src.read(info.filename)
    if name in ['store.png','store_active.png','store_disabled.png']:data=calendar_png(data,active=name=='store_active.png',disabled=name=='store_disabled.png')
    dst.writestr(info,data)
 return names
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--originals',required=True);p.add_argument('--output',required=True);p.add_argument('--feature',choices=['home','store','all'],default='all');p.add_argument('--button-label',default='Daybook');a=p.parse_args()
 try:print('Built:',', '.join(build(a.originals,a.output,a.feature,a.button_label)))
 except (ValueError,FileNotFoundError) as e:raise SystemExit(str(e))
