"""Check every committed background, including nested Forms and image ICC profiles."""
import hashlib
import json
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import ContentStream, IndirectObject, NameObject

root = Path(__file__).resolve().parents[2]
folder = root / 'assets/sample-d-cmyk'
manifest = json.loads((folder / 'manifest.json').read_text())
pages = 0
for entry in manifest['documents']:
    data = (folder / entry['file']).read_bytes()
    assert len(data) == entry['byteSize']
    assert hashlib.sha256(data).hexdigest() == entry['sha256']
    reader = PdfReader(folder / entry['file'])
    assert len(reader.pages) == len(entry['pages'])
    visited = set()
    def check(value):
        if isinstance(value, IndirectObject):
            key = (value.idnum, value.generation)
            if key in visited:
                return
            visited.add(key)
            value = value.get_object()
        if isinstance(value, NameObject):
            assert value not in ['/DeviceRGB', '/CalRGB', '/DefaultRGB', '/Indexed', '/Separation', '/DeviceN', '/Lab', '/Pattern'], (entry['file'], value)
        elif isinstance(value, dict):
            assert value.get('/Type') not in ['/Font', '/FontDescriptor'], (entry['file'], 'font object')
            assert not value.get('/Font'), (entry['file'], 'font resource')
            for item in value.values():
                check(item)
            if hasattr(value, 'get_data'):
                raw = value.get_data()
                if len(raw) > 128 and raw[36:40] == b'acsp':
                    assert raw[16:20] in [b'CMYK', b'GRAY'], (entry['file'], 'RGB ICC')
                if value.get('/Subtype') == '/Form':
                    for operands, operator in ContentStream(value, reader).operations:
                        assert operator not in [b'rg', b'RG'], (entry['file'], 'RGB Form paint')
                        assert operator not in [b'BT', b'Tf', b'Tj', b'TJ', b"'", b'"'], (entry['file'], 'unoutlined Form text')
        elif isinstance(value, (list, tuple)):
            for item in value:
                check(item)
    for page, size in zip(reader.pages, entry['pages']):
        check(page)
        assert abs(float(page.mediabox.width) - size['widthPt']) < .002
        assert abs(float(page.mediabox.height) - size['heightPt']) < .002
        for operands, operator in page.get_contents().operations:
            assert operator not in [b'rg', b'RG'], (entry['file'], 'RGB page paint')
            assert operator not in [b'BT', b'Tf', b'Tj', b'TJ', b"'", b'"'], (entry['file'], 'unoutlined page text')
    for number in reader.xref.get(0, {}):
        check(IndirectObject(number, 0, reader))
    pages += len(reader.pages)
    print(entry['file'], len(reader.pages), 'pages: fonts 0; CMYK/Gray only; hashes and page boxes verified')
assert pages == 28
print('PASS: all 28 background pages')
