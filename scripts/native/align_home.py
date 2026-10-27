from pathlib import Path
import zipfile
source=zipfile.ZipFile('work/kindle-home-library.jar');patch={};base='com/amazon/kindle/home/resources/'
for name in ['HomeView','ResumeConsumePanel','ResumePrimaryPanel','ResumeSecondaryPanel','ResumePrimaryCell']:
 key=base+name+'.properties';s=source.read(key).decode()
 if name in ['HomeView','ResumeConsumePanel']:s=s.replace('dim.w = 230.4f','dim.w = 245.0f')
 if name=='ResumePrimaryPanel':s=s.replace('dim.w = 100.8f','dim.w = 140.6f').replace('insets = 0, 11.04f, 0, 4.8f','insets = 0.68f, 11.04f, 0, 4.8f')
 if name=='ResumeSecondaryPanel':s=s.replace('dim.w = 129.6f','dim.w = 104.4f')
 if name=='ResumePrimaryCell':s=s.replace('cover.dim.w = 84.96f','cover.dim.w = 117.6f').replace('cover.dim.h = 144.24f','cover.dim.h = 156.8f').replace('cell.dim.w = 84.96f','cell.dim.w = 117.6f').replace('cell.dim.h = 144.24f','cell.dim.h = 156.8f')
 patch[key]=s.encode()
with zipfile.ZipFile('work/kindle-home-aligned.jar','w',zipfile.ZIP_DEFLATED) as dst:
 for info in source.infolist():dst.writestr(info,patch.get(info.filename,source.read(info.filename)))
print('Home aligned: large app cover spans the two book rows; balanced outside margins.')
