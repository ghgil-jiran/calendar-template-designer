"""Rewrap only the glyphs already embedded in the supplied reference PDFs.
The original outlines stay unchanged; other characters use the normal fallback.
"""
from pathlib import Path
import fitz,io,re
from fontTools.cffLib import CFFFontSet
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.basePen import NullPen
root=Path(__file__).resolve().parents[2]
over=fitz.open(root/'assets/sample-c/reference-overview.pdf')
front=fitz.open(stream=b''.join((root/'assets/sample-c'/f'reference-calendar.{i:02d}.part').read_bytes()for i in range(1,4)),filetype='pdf')
for pdf,target,label in [(over,'Cafe24OhsquareOTF','SchoolName'),(over,'KoPubWorldDotumPL','Dotum'),(over,'KoPubWorldDotumPB','DotumBold'),(front,'THEFACESHOP','Slogan')]:
 f=next(f for p in pdf for f in p.get_fonts() if f[3].split('+')[-1]==target)
 raw=pdf.extract_font(f[0])[3];cff=CFFFontSet();cff.decompile(io.BytesIO(raw),None);top=cff.topDictIndex[0]
 tu=int(pdf.xref_get_key(f[0],'ToUnicode')[1].split()[0]);data=pdf.xref_stream(tu).decode();cmap={}
 for block in re.findall(r'beginbfchar(.*?)endbfchar',data,re.S):
  for a,b in re.findall(r'<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>',block):
   txt=bytes.fromhex(b).decode('utf-16-be');name='cid'+str(int(a,16)).zfill(5)
   if len(txt)==1 and name in top.charset:cmap[ord(txt)]=name
 glyphs={};metrics={}
 for name in top.charset:
  cs=top.CharStrings[name];cs.draw(NullPen());width=round(cs.width);pen=T2CharStringPen(width,None);cs.draw(pen);glyphs[name]=pen.getCharString();metrics[name]=(width,0)
 fb=FontBuilder(1000,isTTF=False);fb.setupGlyphOrder(top.charset);fb.setupCharacterMap(cmap);family='SampleC '+label
 fb.setupCFF('SampleC'+label,{'FullName':family,'FamilyName':family,'Weight':'Regular'},glyphs,{})
 fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=880,descent=-220);fb.setupNameTable({'familyName':family,'styleName':'Regular','uniqueFontIdentifier':family+' supplied reference subset','fullName':family,'psName':'SampleC'+label});fb.setupOS2(sTypoAscender=880,sTypoDescender=-220,usWinAscent=1000,usWinDescent=250);fb.setupPost();fb.save(root/f'apps/designer-studio/assets/fonts/sample-c/{label}.otf');print(label,len(cmap),'glyphs')
