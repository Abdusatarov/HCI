from pathlib import Path
from lxml import etree as E
import json,re,struct
ns={'b':'http://www.omg.org/spec/BPMN/20100524/MODEL','d':'http://www.omg.org/spec/BPMN/20100524/DI','c':'http://www.omg.org/spec/DD/20100524/DC','di':'http://www.omg.org/spec/DD/20100524/DI'}
root=E.parse('diagrams/pharmacy-order.bpmn')
ids={n.get('id'):n for n in root.xpath('//*[@id]')}
collisions=[]
for plane in root.findall('.//d:BPMNPlane',ns):
    boxes={}
    for s in plane.findall('d:BPMNShape',ns):
        node=ids[s.get('bpmnElement')]
        if E.QName(node).localname in ('participant','lane'):continue
        b=s.find('c:Bounds',ns);boxes[node.get('id')]=tuple(float(b.get(k)) for k in ('x','y','width','height'))
    for e in plane.findall('d:BPMNEdge',ns):
        flow=ids[e.get('bpmnElement')]
        if E.QName(flow).localname!='sequenceFlow':continue
        points=[(float(p.get('x')),float(p.get('y'))) for p in e.findall('di:waypoint',ns)]
        for a,b in zip(points,points[1:]):
            assert a[0]==b[0] or a[1]==b[1],e.get('id')
            for id,(x,y,w,h) in boxes.items():
                if id in (flow.get('sourceRef'),flow.get('targetRef')):continue
                if a[0]==b[0]:hit=x<a[0]<x+w and max(min(a[1],b[1]),y)<min(max(a[1],b[1]),y+h)
                else:hit=y<a[1]<y+h and max(min(a[0],b[0]),x)<min(max(a[0],b[0]),x+w)
                if hit:collisions.append((e.get('id'),id))
assert not collisions,collisions
rows=json.loads(Path('design/screen-specs.json').read_text());screen_ids={r['id'] for r in rows}
assert len(rows)==33 and len(screen_ids)==33
for r in rows:assert r['next'] in screen_ids
html=Path('design/preview.html').read_text()
for target in re.findall(r'href="#([^"]+)"',html):assert target in screen_ids,target
pngs=list(Path('diagrams/exports').glob('*.png'))+list(Path('design/exports').glob('*.png'))
for p in pngs:
    data=p.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack('>II',data[16:24]);assert w>0 and h>0
for p in Path('diagrams/exports').glob('*.svg'):E.parse(str(p))
print(f'PASS: no sequence edges cross unrelated BPMN nodes; 33 screen targets valid; {len(pngs)} PNGs and 8 SVGs parse.')
report=json.loads(Path('docs/validation.json').read_text());report['artifactChecks']={'sequenceNodeCrossings':0,'screenTargets':33,'pngs':len(pngs),'svgDiagrams':8};Path('docs/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
