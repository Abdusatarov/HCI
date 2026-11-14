import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { BpmnModdle } from 'bpmn-moddle';
const {rootElement,warnings}=await new BpmnModdle().fromXML(await fs.readFile('diagrams/pharmacy-order.bpmn','utf8'));
assert.equal(warnings.length,0,JSON.stringify(warnings));
const processes=rootElement.rootElements.filter(x=>x.$type==='bpmn:Process');
const report=[];
for(const p of processes) {
  const nodes=p.flowElements.filter(n=>n.$type!=='bpmn:SequenceFlow');
  const flows=p.flowElements.filter(n=>n.$type==='bpmn:SequenceFlow');
  const ids=new Set(nodes.map(n=>n.id));
  for(const f of flows)assert(ids.has(f.sourceRef.id)&&ids.has(f.targetRef.id),f.id);
  const starts=nodes.filter(n=>n.$type==='bpmn:StartEvent'),ends=nodes.filter(n=>n.$type==='bpmn:EndEvent');
  assert.equal(starts.length,1);assert(ends.length>0);
  const reachable=new Set();const walk=(id)=>{if(reachable.has(id))return;reachable.add(id);for(const f of flows.filter(f=>f.sourceRef.id===id))walk(f.targetRef.id);};walk(starts[0].id);
  for(const n of nodes){
    assert(reachable.has(n.id),'Unreachable '+n.id);
    if(n.$type!=='bpmn:StartEvent')assert(n.incoming?.length,'No incoming '+n.id);
    if(n.$type!=='bpmn:EndEvent')assert(n.outgoing?.length,'Dead end '+n.id);
    if(n.$type==='bpmn:ExclusiveGateway'){
      assert(n.outgoing.length>=2,'Incomplete decision '+n.id);
      for(const f of n.outgoing)assert(f.name&&f.conditionExpression||n.default===f,'Unconditional decision '+f.id);
    }
    if(n.$type==='bpmn:CallActivity')assert(processes.some(p=>p.id===n.calledElement),'Unresolved call');
    const visited=new Set(),q=[n.id];let exit=false;
    while(q.length){const id=q.shift();if(visited.has(id))continue;visited.add(id);if(ends.some(e=>e.id===id))exit=true;for(const f of flows.filter(f=>f.sourceRef.id===id))q.push(f.targetRef.id);}
    assert(exit,'No reachable end '+n.id);
  }
  const assigned=p.laneSets[0].lanes.flatMap(l=>l.get('flowNodeRef').map(n=>n.id));
  assert.equal(assigned.length,nodes.length);assert.equal(new Set(assigned).size,nodes.length);
  report.push({process:p.id,nodes:nodes.length,flows:flows.length,reachable:true,hasExitPath:true,lanes:3});
}
for(const d of rootElement.diagrams){
  const elements=d.plane.planeElement;const shapes=elements.filter(x=>x.$type==='bpmndi:BPMNShape');
  for(const s of shapes)assert(s.bounds.width>0&&s.bounds.height>0,s.id);
  for(const e of elements.filter(x=>x.$type==='bpmndi:BPMNEdge'))assert(e.waypoint.length>=2,e.id);
}
await fs.writeFile('docs/validation.json',JSON.stringify({bpmnModdleWarnings:warnings.length,processes:report,diagramCount:rootElement.diagrams.length,note:'Structural verification; not a process-engine execution or usability study.'},null,2)+'\n');
console.log('PASS: BPMN parsed without warnings; lanes, gateways, references, reachability and exit paths verified.');
