import struct
u2=lambda b,p:struct.unpack_from('>H',b,p)[0]
u4=lambda b,p:struct.unpack_from('>I',b,p)[0]
class ClassFile:
 def __init__(self,b):
  self.b=b;self.pool=[None];p=10
  while len(self.pool)<u2(b,8):
   tag=b[p];start=p;p+=1
   if tag==1:n=u2(b,p);p+=2;v=b[p:p+n];p+=n
   else:
    n={3:4,4:4,5:8,6:8,7:2,8:2,9:4,10:4,11:4,12:4,15:3,16:2,17:4,18:4,19:2,20:2}[tag];v=b[p:p+n];p+=n
   self.pool.append((tag,v,b[start:p]))
   if tag in (5,6):self.pool.append(None)
  self.end=p
 def utf(self,i):return self.pool[i][1].decode('utf8',errors='replace')
 def val(self,i):
  t,v,_=self.pool[i]
  if t==1:return v.decode('utf8',errors='replace')
  if t in [7,8]:return self.val(u2(v,0))
  if t in [9,10,11,12]:return tuple(self.val(u2(v,p)) for p in [0,2])
  return v.hex()
 def add(self,t,v):
  for i,x in enumerate(self.pool):
   if x and x[0]==t and x[1]==v:return i
  self.pool.append((t,v,bytes([t])+(struct.pack('>H',len(v)) if t==1 else b'')+v));return len(self.pool)-1
 def text(self,s):return self.add(1,s.encode('utf8'))
 def cls(self,s):return self.add(7,struct.pack('>H',self.text(s)))
 def string(self,s):return self.add(8,struct.pack('>H',self.text(s)))
 def ref(self,t,c,n,d):return self.add(t,struct.pack('>HH',self.cls(c),self.add(12,struct.pack('>HH',self.text(n),self.text(d)))))
 def patch(self,methods):
  b=self.b;p=self.end+6;p+=2+2*u2(b,p);fields=u2(b,p);p+=2
  for _ in range(fields):
   attrs=u2(b,p+6);p+=8
   for _ in range(attrs):p+=6+u4(b,p+2)
  count=u2(b,p);p+=2;start=p;out=bytearray(b[self.end:p]);seen=[]
  for _ in range(count):
   access,name,desc,attrs=struct.unpack_from('>HHHH',b,p);out+=b[p:p+8];p+=8
   key=(self.utf(name),self.utf(desc))
   for _ in range(attrs):
    an=u2(b,p);n=u4(b,p+2);data=b[p+6:p+6+n];p+=6+n
    if key in methods and self.utf(an)=='Code':
     stack,locals_,code=methods[key];data=struct.pack('>HHI',stack,locals_,len(code))+code+struct.pack('>HH',0,0);seen.append(key)
    out+=struct.pack('>HI',an,len(data))+data
  assert set(seen)==set(methods),seen
  out+=b[p:];return b[:8]+struct.pack('>H',len(self.pool))+b''.join(x[2] for x in self.pool if x)+out
