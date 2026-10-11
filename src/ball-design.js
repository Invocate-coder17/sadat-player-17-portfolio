// Twelve star panels defined on the sphere, not pasted product photographs.
// Original blue/gold starball treatment, not a licensed Adidas UV map.
const PHI=(1+Math.sqrt(5))/2;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const normalize=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const STAR_CENTRES=[
  [-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],
  [0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],
  [PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]
].map(normalize);
const frames=STAR_CENTRES.map(c=>{
  const neighbor=STAR_CENTRES.find(n=>dot(c,n)>.4&&dot(c,n)<.5);
  const u=normalize(neighbor.map((v,i)=>v-dot(c,neighbor)*c[i]));
  return {c,u,v:cross(c,u)};
});
const corners=Array.from({length:11},(_,i)=>{
  const angle=i*Math.PI/5,radius=i%2?.245:.61;
  return [Math.cos(angle)*radius,Math.sin(angle)*radius];
});
export function sampleBallSurface(x,y,z){
  let selected=0,alignment=-Infinity,runnerUp=-Infinity;
  for(let i=0;i<frames.length;i++){
    const d=x*frames[i].c[0]+y*frames[i].c[1]+z*frames[i].c[2];
    if(d>alignment){runnerUp=alignment;alignment=d;selected=i;}
    else if(d>runnerUp)runnerUp=d;
  }
  const {u,v}=frames[selected];
  const tx=(x*u[0]+y*u[1]+z*u[2])/alignment,ty=(x*v[0]+y*v[1]+z*v[2])/alignment;
  const angle=(Math.atan2(ty,tx)+Math.PI*2)%(Math.PI*2);
  const edge=Math.min(9,Math.floor(angle/(Math.PI/5))),a=corners[edge],b=corners[edge+1];
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const boundary=(a[0]*b[1]-a[1]*b[0])/(Math.cos(angle)*dy-Math.sin(angle)*dx);
  const distance=boundary-Math.hypot(tx,ty);
  return {panel:selected,tx,ty,distance,inside:distance>0,seam:alignment-runnerUp};
}
export function surfaceColour(s){
  if(s.distance>0&&s.distance<.014)return [179,144,77];
  if(s.distance>=.014){
    const r=Math.hypot(s.tx,s.ty),angle=Math.atan2(s.ty,s.tx);
    const engraving=Math.abs(Math.sin(r*68+Math.sin(angle*3)*.5))<.09&&r>.055;
    if(engraving)return [135,149,159];
    const glint=Math.max(0,1-r/.62)*10;
    return [13+glint,43+glint,83+glint];
  }
  if(s.distance>-.007)return [172,180,182];
  if(s.seam<.006)return [193,198,198];
  return [237,240,235];
}
