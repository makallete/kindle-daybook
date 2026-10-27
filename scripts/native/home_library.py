from pathlib import Path
import struct,zipfile
from classfile import ClassFile
z=zipfile.ZipFile('work/kindle-home-clean.jar');changes={};base='com/amazon/kindle/home/'
name=base+'view/ResumeSecondaryPanel.class';c=ClassFile(z.read(name));owner=base+'view/ResumeSecondaryPanel'
ref=lambda op,t,cl,n,d:bytes([op])+struct.pack('>H',c.ref(t,cl,n,d))
field=lambda op,n,d:ref(op,9,owner,n,d)
call=lambda cl,n,d:ref(0xb6,10,cl,n,d)
init=lambda cl,d:ref(0xb7,10,cl,'<init>',d)
new=lambda cl:b'\xbb'+struct.pack('>H',c.cls(cl))+b'\x59'
ldc=lambda s:b'\x13'+struct.pack('>H',c.string(s))
get=field(0xb4,'hUE','Ljavax/swing/JPanel;')
code=b'\x2a'+new('java/util/ArrayList')+init('java/util/ArrayList','()V')+field(0xb5,'hUG','Ljava/util/ArrayList;')
code+=b'\x2a'+new('java/awt/BorderLayout')+init('java/awt/BorderLayout','()V')+call(owner,'setLayout','(Ljava/awt/LayoutManager;)V')
code+=b'\x2a'+new('javax/swing/JPanel')+init('javax/swing/JPanel','()V')+field(0xb5,'hUE','Ljavax/swing/JPanel;')
code+=b'\x2a'+get+new('java/awt/GridLayout')+b'\x05\x05\x10\x10\x10\x10'+init('java/awt/GridLayout','(IIII)V')+call('javax/swing/JPanel','setLayout','(Ljava/awt/LayoutManager;)V')
for i in range(1,5):
 code+=b'\x2a'+field(0xb4,'hVp','Lcom/amazon/kindle/home/view/ResumeGridController;')+ldc('COVER_VIEW_MODE')+bytes([3+i])+call(base+'view/ResumeGridController','r','(Ljava/lang/String;I)Lcom/amazon/kindle/apps/content/view/ContentCell;')+b'\xc0'+struct.pack('>H',c.cls(base+'view/ResumeGridCell'))+b'\x4c'
 code+=b'\x2a'+get+b'\x2b'+call('javax/swing/JPanel','add','(Ljava/awt/Component;)Ljava/awt/Component;')+b'\x57'
 code+=b'\x2a'+field(0xb4,'fLH','Ljava/util/List;')+b'\x2b'+ref(0xb9,11,'java/util/List','add','(Ljava/lang/Object;)Z')+b'\x02\x00\x57'
code+=b'\x2a'+field(0xb4,'hUG','Ljava/util/ArrayList;')+b'\x2a'+field(0xb4,'fLH','Ljava/util/List;')+call('java/util/ArrayList','addAll','(Ljava/util/Collection;)Z')+b'\x57'
code+=b'\x2a\x2a'+get+ldc('Center')+call(owner,'add','(Ljava/awt/Component;Ljava/lang/Object;)V')+b'\xb1'
ctor=b'\x2a\x2b\x07'+init(base+'view/ResumePanel','(Lcom/amazon/kindle/home/view/ResumeGridController;I)V')+b'\x2a'+ldc('ResumeSecondaryPanel')+call(owner,'setName','(Ljava/lang/String;)V')+b'\xb1'
kH=b'\x2a'+field(0xb4,'fLH','Ljava/util/List;')+b'\x1b\x04\x64'+ref(0xb9,11,'java/util/List','get','(I)Ljava/lang/Object;')+b'\x02\x00\xc0'+struct.pack('>H',c.cls('com/amazon/kindle/apps/content/view/ContentCell'))+b'\xb0'
changes[name]=c.patch({('initGUI','()V'):(10,2,code),('<init>','(Lcom/amazon/kindle/home/view/ResumeGridController;)V'):(3,2,ctor),('kH','(I)Lcom/amazon/kindle/apps/content/view/ContentCell;'):(3,2,kH)})
name=base+'view/ConsumeResumeDefaultSource$ConsumeResumeDefaultGridModel.class';b=z.read(name);assert b.count(b'\x2a\x06\xb7')==1;changes[name]=b.replace(b'\x2a\x06\xb7',b'\x2a\x05\xb7')
for p in ['ResumeConsumePanel','ResumeSecondaryPanel','ResumeSecondaryGrid','ResumeSecondaryCell']:
 name=base+'resources/'+p+'.properties';s=z.read(name).decode()
 if p=='ResumeConsumePanel':s=s.replace(', com.amazon.kindle.home.resources.ConsumePanel:', ':')
 if p=='ResumeSecondaryPanel':s=s.replace('dim.w = 41.76f','dim.w = 129.6f')
 if p=='ResumeSecondaryGrid':
  s=s.replace('grid.rows = 1, 1','grid.rows = 2, 2')
  a='com.amazon.kindle.home.resources.ResumeSecondaryCell';b='com.amazon.kindle.home.resources.ResumeSecondaryCellLarge'
  s=s.replace('cell.configs = '+a+', '+a+' : '+b+', '+b,'cell.configs = '+', '.join([a]*4)+' : '+', '.join([b]*4))
 if p=='ResumeSecondaryCell':s=s.replace('40.8f','52.8f').replace('69.36f','76.0f')
 changes[name]=s.encode()
with zipfile.ZipFile('work/kindle-home-library.jar','w',zipfile.ZIP_DEFLATED) as dst:
 for info in z.infolist():dst.writestr(info,changes.get(info.filename,z.read(info.filename)))
Path('work/ResumeSecondaryPanel-library.class').write_bytes(changes[base+'view/ResumeSecondaryPanel.class'])
print('Patched',list(changes))
