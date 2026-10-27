#!/usr/bin/env python3
import hashlib,pathlib,struct,sys,tempfile,unittest,zlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent/'native'))
from build import build,calendar_png
class NativeBuilderTests(unittest.TestCase):
 def test_unknown_original_is_rejected_before_output_patch(self):
  with tempfile.TemporaryDirectory() as d:
   path=pathlib.Path(d);(path/'home.jar').write_bytes(b'not supported')
   with self.assertRaisesRegex(ValueError,'Unsupported'):build(path,path/'out','home')
   self.assertFalse((path/'out/home.jar').exists())
 def test_untrusted_label_is_rejected(self):
  with self.assertRaisesRegex(ValueError,'Toolbar label'):build('.',tempfile.gettempdir(),'store',"bad'$(x)")
 def test_authored_calendar_icon_retains_dimensions_and_png_integrity(self):
  original=b'\x89PNG\r\n\x1a\n'+b'\0'*8+struct.pack('>II',35,35)
  image=calendar_png(original);self.assertEqual(struct.unpack('>II',image[16:24]),(35,35));pos=8
  while pos<len(image):
   size=struct.unpack('>I',image[pos:pos+4])[0];data=image[pos+4:pos+8+size];crc=struct.unpack('>I',image[pos+8+size:pos+12+size])[0];self.assertEqual(zlib.crc32(data)&0xffffffff,crc);pos+=12+size
if __name__=='__main__':unittest.main()
