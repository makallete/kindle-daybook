#!/usr/bin/env python3
import contextlib,io,json,pathlib,runpy,shutil,subprocess,sys,tarfile,tempfile,unittest,xml.etree.ElementTree as ET
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
class InstallerTests(unittest.TestCase):
 def run_installer(self,install=False,version='5.12.2.2'):
  with tempfile.TemporaryDirectory() as temp:
   root=pathlib.Path(temp);shutil.copytree(ROOT/'kindle',root/'kindle',ignore=shutil.ignore_patterns('tools'));(root/'scripts').mkdir();shutil.copy(ROOT/'scripts/install.py',root/'scripts/install.py')
   (root/'kindle/tools').mkdir();(root/'kindle/tools/wmctrl').write_bytes(b'test-only-tool');key=root/'identity';key.write_text('test-only-identity');calls=[]
   def fake_run(args,**kw):
    calls.append((args,kw.get('input')));return subprocess.CompletedProcess(args,0,('DAYBOOK_CHECK\n90D4\nKindle '+version+'\n0\n').encode(),b'')
   class Head:
    status=200
    def __enter__(self):return self
    def __exit__(self,*args):pass
   argv=['install.py','--host','example.test','--identity',str(key)]
   if install:argv+=['--install','--name','My <Day>','--url','https://example.test/d/'+'x'*64]
   else:argv+=['--check']
   with patch.object(sys,'argv',argv),patch('subprocess.run',side_effect=fake_run),patch('urllib.request.urlopen',return_value=Head()),contextlib.redirect_stdout(io.StringIO()):
    try:runpy.run_path(str(root/'scripts/install.py'),run_name='__main__')
    except SystemExit as e:
     if e.code not in (None,0):raise
   return calls
 def test_check_does_not_upload_or_install(self):
  calls=self.run_installer();self.assertEqual(len(calls),1);self.assertIsNone(calls[0][1]);self.assertTrue(calls[0][0][-1].startswith('set -e;'))
 def test_unsupported_firmware_stops_before_upload(self):
  with self.assertRaises(SystemExit):self.run_installer(install=True,version='5.18.1')
 def test_install_archive_has_custom_name_and_only_own_paths(self):
  calls=self.run_installer(install=True);self.assertEqual(len(calls),3)
  with tarfile.open(fileobj=io.BytesIO(calls[1][1]),mode='r:gz') as tar:
   self.assertTrue(all(not p.startswith('/') and '..' not in pathlib.PurePosixPath(p).parts for p in tar.getnames()))
   xml=ET.fromstring(tar.extractfile(tar.getmembers()[-2]).read());self.assertEqual(xml.find('{http://www.w3.org/ns/widgets}name').text,'My <Day>')
   config=tar.extractfile('screen-config.js').read().decode();self.assertIn('https://example.test/d/',config)
   self.assertIn('# Name: My <Day>',tar.extractfile(tar.getmembers()[-1]).read().decode())
if __name__=='__main__':unittest.main()
