import zipfile,struct
from pathlib import Path
from classfile import ClassFile
p='work/kindle-home-aligned.jar';z=zipfile.ZipFile(p);target='com/amazon/kindle/home/view/ExtendedHomeLandingPanel$1.class';c=ClassFile(z.read(target))
code=b'\xbb'+struct.pack('>H',c.cls('java/awt/Dimension'))+b'\x59\x03\x03\xb7'+struct.pack('>H',c.ref(10,'java/awt/Dimension','<init>','(II)V'))+b'\xb0'
new=c.patch({('getScrollPanelSize','()Ljava/awt/Dimension;'):(4,1,code)})
with zipfile.ZipFile('work/kindle-home-aligned-final.jar','w',zipfile.ZIP_DEFLATED) as dst:
 for info in z.infolist():dst.writestr(info,new if info.filename==target else z.read(info.filename))
Path('work/Home-scroll-gutter.class').write_bytes(new)
print('Unused Home scroll gutter removed.')
