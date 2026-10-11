import * as THREE from 'three';
import {sampleBallSurface, surfaceColour} from './ball-design.js';
export const assetUrl=filename=>new URL(`../assets/${filename}`,import.meta.url).href;
export function loadImage(filename){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error(`Unable to load ${filename}`));
    image.src=assetUrl(filename);
  });
}
export async function createMatchBallTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=2048;canvas.height=1024;
  const context=canvas.getContext('2d');
  const output=context.createImageData(canvas.width,canvas.height);
  for(let py=0;py<canvas.height;py++){
    const theta=(py+.5)/canvas.height*Math.PI;
    const y=Math.cos(theta),ring=Math.sin(theta);
    for(let px=0;px<canvas.width;px++){
      const phi=(px+.5)/canvas.width*Math.PI*2;
      const s=sampleBallSurface(-Math.cos(phi)*ring,y,Math.sin(phi)*ring);
      const colour=surfaceColour(s),i=(py*canvas.width+px)*4;
      for(let c=0;c<3;c++)output.data[i+c]=colour[c];
      output.data[i+3]=255;
    }
  }
  context.putImageData(output,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.RepeatWrapping;
  return texture;
}
export async function addBernabeuBackdrop(scene){
  const canvas=document.createElement('canvas');
  canvas.width=1500;canvas.height=300;
  const context=canvas.getContext('2d');
  const gradient=context.createLinearGradient(0,0,0,300);
  gradient.addColorStop(0,'#07182c');
  gradient.addColorStop(.48,'#132a42');
  gradient.addColorStop(1,'#02070c');
  context.fillStyle=gradient;
  context.fillRect(0,0,canvas.width,canvas.height);
  context.fillStyle='#d8e6ff';
  for(let x=18;x<canvas.width;x+=32){
    const height=12+((x*17)%24);
    context.globalAlpha=.18+((x%5)*.025);
    context.fillRect(x,210-height,5,height);
  }
  context.globalAlpha=1;
  context.strokeStyle='#5d7da0';
  context.lineWidth=6;
  context.beginPath();
  context.moveTo(0,56);
  context.quadraticCurveTo(canvas.width/2,8,canvas.width,56);
  context.stroke();
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(126,25.2),new THREE.MeshBasicMaterial({map:texture,color:'#b5c2d2',fog:false}));
  backdrop.position.set(0,12.6,-35);
  scene.add(backdrop);
  return backdrop;
}
export async function addPhotographicCrowd(scene){
  const image=await loadImage('player-17-supporters.png');
  const texture=new THREE.Texture(image);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;
  // Keep people at believable scale, using a varied coherent photographic tier.
  // The repeated panoramic texture extends the tier beyond the camera's view.
  texture.wrapS=THREE.RepeatWrapping;
  texture.repeat.set(8,1);
  const standHeight=(62/8)*image.height/image.width;
  const stand=new THREE.Mesh(new THREE.PlaneGeometry(62,standHeight),new THREE.MeshBasicMaterial({map:texture,color:'#c5cbd4',fog:false}));
  stand.position.set(0,.65+standHeight/2,-12);
  scene.add(stand);
  const barrier=new THREE.Mesh(new THREE.BoxGeometry(64,.65,.35),new THREE.MeshStandardMaterial({color:'#142437',roughness:1}));
  barrier.position.set(0,.325,-11.75);
  scene.add(barrier);
  return stand;
}
