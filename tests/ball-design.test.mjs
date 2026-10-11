import assert from 'node:assert/strict';
import {STAR_CENTRES,sampleBallSurface,surfaceColour} from '../src/ball-design.js';

for(const [i,p] of STAR_CENTRES.entries()){
  const sample=sampleBallSurface(...p);
  assert.equal(sample.panel,i);
  assert.equal(sample.inside,true,'Every panel centre is painted');
  assert.ok(surfaceColour(sample)[2]>surfaceColour(sample)[0],'Star centres are navy');
}
const hemispheres=Array.from({length:6},()=>({all:0,painted:0}));
const panels=Array(12).fill(0);
for(let i=0;i<24000;i++){
  const y=1-2*(i+.5)/24000;
  const angle=i*Math.PI*(3-Math.sqrt(5)),ring=Math.sqrt(1-y*y);
  const p=[Math.cos(angle)*ring,y,Math.sin(angle)*ring];
  const sample=sampleBallSurface(...p);
  assert.ok(Number.isFinite(sample.distance));
  if(sample.inside)panels[sample.panel]++;
  p.forEach((value,axis)=>{
    const h=hemispheres[axis*2+(value>0?0:1)];
    h.all++;if(sample.inside)h.painted++;
  });
}
for(const h of hemispheres){
  const coverage=h.painted/h.all;
  assert.ok(coverage>.27&&coverage<.7,'No blank or solid-painted hemisphere: '+coverage);
}
assert.ok(Math.max(...panels)/Math.min(...panels)<1.1,'All 12 panels have consistent area');
for(let latitude=0;latitude<Math.PI;latitude+=.05){
  const y=Math.cos(latitude),r=Math.sin(latitude);
  const a=surfaceColour(sampleBallSurface(-r,y,1e-9));
  const b=surfaceColour(sampleBallSurface(-r,y,-1e-9));
  assert.deepEqual(a,b,'No texture seam at the longitude wrap');
}
console.log('PASS: 12 uniform star panels, all hemispheres painted, seamless longitude wrap');
