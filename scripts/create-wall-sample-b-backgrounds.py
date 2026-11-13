from reportlab.pdfgen import canvas
from reportlab.lib.colors import CMYKColor
from pathlib import Path
import fitz,json,hashlib
root=Path(__file__).resolve().parents[1];out=root/'assets/wall-sample-b';mm=72/25.4
palettes=[[(.88,.66,0,.18),(.58,.61,0,.60),(0,.48,.24,0)],[(.90,.28,.35,.20),(.79,.44,.35,.35),(0,.27,.42,0)]]
manifest={'revision':'wall-sample-b.v1','source':'sample-d-v4/annual.pdf','documents':[]}
for i,palette in enumerate(palettes,1):
 f=out/f'background-{i}.pdf';c=canvas.Canvas(str(f),pagesize=(426*mm,600*mm));c.setTitle(f'Wall Sample B - Geometric Background {i} - A2');c.setAuthor('우리학교달력')
 def poly(points,tone):
  c.setFillColor(CMYKColor(*tone));p=c.beginPath();p.moveTo(points[0][0]*mm,(600-points[0][1])*mm)
  for x,y in points[1:]:p.lineTo(x*mm,(600-y)*mm)
  p.close();c.drawPath(p,stroke=0,fill=1)
 # Keep title and six monthly grids fully clear of the edge geometry.
 navy,shadow,accent=palette
 poly([(278,0),(426,0),(426,83)],navy)
 poly([(344,0),(426,0),(426,46)],accent)
 poly([(357,31),(426,20),(426,73)],shadow)
 poly([(0,557),(0,600),(77,600)],accent)
 poly([(0,583),(0,600),(31,600)],navy)
 # Three quiet dots echo the desk annual background without its binding-hole motif.
 for j,tone in enumerate([(.05,.08,.08,.12),accent,navy]):
  c.setFillColor(CMYKColor(*tone));c.circle((164+j*5)*mm,(600-82)*mm,1.2*mm,stroke=0,fill=1)
 c.setTrimBox((3*mm,3*mm,423*mm,597*mm));c.setBleedBox((0,0,426*mm,600*mm));c.showPage();c.save()
 from pypdf import PdfReader,PdfWriter
 from pypdf.generic import ContentStream,NameObject
 reader=PdfReader(f);pg=reader.pages[0];stream=ContentStream(pg.get_contents(),reader);assert not any(op in (b'Tj',b'TJ') for _,op in stream.operations)
 stream.operations=[(args,op) for args,op in stream.operations if op not in (b'BT',b'ET',b'Tf',b'TL')];pg[NameObject('/Contents')]=stream;pg['/Resources'].pop('/Font',None);writer=PdfWriter();writer.add_page(pg);writer.add_metadata(dict(reader.metadata));temp=f.with_suffix('.tmp.pdf');writer.write(temp);temp.replace(f)
 d=fitz.open(f);p=d[0];p.get_pixmap(matrix=fitz.Matrix(.9,.9)).save(root/f'apps/designer-studio/assets/wall-sample-b/background-{i}.png')
 t=p.get_pixmap(matrix=fitz.Matrix(.22,.22));t.save(out/f'thumbnail-{i}.png')
 b=f.read_bytes();manifest['documents'].append({'file':f.name,'sha256':hashlib.sha256(b).hexdigest(),'byteSize':len(b),'pages':[{'widthPt':p.rect.width,'heightPt':p.rect.height}],'pixelWidth':p.get_pixmap(matrix=fitz.Matrix(.9,.9)).width,'pixelHeight':p.get_pixmap(matrix=fitz.Matrix(.9,.9)).height,'sourceKind':'vector'})
 assert len(p.get_images())==0
 assert abs(p.trimbox.width/mm-420)<.01 and abs(p.trimbox.height/mm-594)<.01

(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('Two CMYK vector backgrounds; A2 trim, 3mm bleed; no raster images.')
