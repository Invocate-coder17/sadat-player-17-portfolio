import * as THREE from 'three';
import {assetUrl} from './scene-assets.js';

const vertexShader=[
  'varying vec2 vUv;',
  'void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}'
].join('\n');
const noise=[
  'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);',
  'return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}',
  'float fbm(vec2 p){float v=0.0,a=0.5;mat2 r=mat2(0.8,-0.6,0.6,0.8);',
  'for(int i=0;i<5;i++){v+=a*n(p);p=r*p*2.03+vec2(4.1,7.3);a*=0.5;}return v;}'
].join('\n');

function createSurface(canvas,fragmentShader,uniforms,opaque=false){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:!opaque,antialias:false,powerPreference:'high-performance'});
  renderer.setClearColor(0x010308,opaque?1:0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));
  const scene=new THREE.Scene(),camera=new THREE.Camera();
  const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms,transparent:!opaque,depthWrite:false});
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);
  scene.add(quad);
  function resize(){
    const {width,height}=canvas.getBoundingClientRect();
    const cap=Math.min(1,1000/Math.max(width,height));
    renderer.setSize(Math.max(1,Math.round(width*cap)),Math.max(1,Math.round(height*cap)),false);
    uniforms.uResolution.value.set(width,height);
  }
  resize();
  return {resize,draw:()=>renderer.render(scene,camera),dispose:()=>{
    quad.geometry.dispose();material.dispose();renderer.dispose();
  }};
}

export function createEnergySweep(canvas){
  const uniforms={uTime:{value:0},uProgress:{value:0},uResolution:{value:new THREE.Vector2()}};
  const fragmentShader=[
    'precision highp float;varying vec2 vUv;uniform vec2 uResolution;uniform float uTime,uProgress;',
    noise,
    'void main(){',
    'vec2 uv=vUv;float aspect=uResolution.x/max(1.0,uResolution.y);',
    'vec2 p=vec2((uv.x-0.5)*aspect,uv.y-0.5);',
    'float t=uTime;float head=mix(-0.3,1.55,smoothstep(0.04,0.88,uProgress));',
    'float current=fbm(vec2(p.x*3.4-t*1.7,p.y*4.2+t*0.3));',
    'float curl=fbm(vec2(p.x*5.0-t*2.8,p.y*5.0)+current*2.6);',
    'float spine=0.035*sin(p.x*6.0-t*1.5)+0.10*(current-0.5);',
    'float d=abs(p.y-spine+(curl-0.5)*0.21);',
    'float body=exp(-d*d*24.0)*(0.30+curl*0.85);',
    'float filament=pow(max(0.0,1.0-abs(curl-0.54)*11.0),3.0)*exp(-d*d*63.0);',
    'float tail=smoothstep(head-1.30,head-0.16,uv.x)*(1.0-smoothstep(head-0.06,head+0.17,uv.x));',
    'float swell=exp(-pow((uv.x-head)/0.12,2.0))*exp(-d*d*18.0);',
    'float fade=smoothstep(0.0,0.10,uProgress)*(1.0-smoothstep(0.82,1.0,uProgress));',
    'vec3 violet=vec3(0.42,0.018,0.98),blue=vec3(0.015,0.24,0.95),cyan=vec3(0.12,0.72,1.0);',
    'vec3 colour=mix(violet,blue,smoothstep(-0.16,0.17,p.y+0.08*(current-0.5)));',
    'vec3 energy=(colour*body+mix(violet,cyan,uv.y)*(filament*0.85+swell*0.35))*tail*fade;',
    'float vignette=1.0-smoothstep(0.15,0.72,length(p*vec2(0.42,1.0)));',
    'gl_FragColor=vec4(vec3(0.002,0.004,0.014)+energy*vignette,1.0);',
    '}'
  ].join('\n');
  const surface=createSurface(canvas,fragmentShader,uniforms,true);
  return {...surface,render:progress=>{
    uniforms.uProgress.value=progress;uniforms.uTime.value=progress*2.25;surface.draw();
  }};
}

export function createSmokeAura(canvas){
  const texture=new THREE.TextureLoader().load(assetUrl('flow-smoke-cyan.png'));
  texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;
  const uniforms={uTime:{value:0},uResolution:{value:new THREE.Vector2()},uAura:{value:texture}};
  const fragmentShader=[
    'precision highp float;varying vec2 vUv;uniform vec2 uResolution;uniform float uTime;uniform sampler2D uAura;',
    noise,
    'void main(){',
    'float aspect=uResolution.x/max(1.0,uResolution.y);',
    'vec2 uv=(vUv-0.5)*vec2(aspect*1.5,1.0)+0.5;',
    'float t=uTime*0.12;',
    'vec2 drift=vec2(fbm(uv*5.0+vec2(t,-t*0.7)),fbm(uv*5.2+vec2(-t*0.6,t))-0.5);',
    'vec2 q=uv+vec2((drift.x-0.5)*0.035,drift.y*0.024);',
    'vec4 smoke=texture2D(uAura,clamp(q,0.001,0.999));',
    'float edge=smoothstep(0.0,0.05,q.x)*(1.0-smoothstep(0.95,1.0,q.x))*smoothstep(0.0,0.045,q.y)*(1.0-smoothstep(0.97,1.0,q.y));',
    'float breathing=0.91+0.09*sin(uTime*0.6+drift.y*3.0);',
    'gl_FragColor=vec4(smoke.rgb*breathing,smoke.a*edge*0.96);',
    '}'
  ].join('\n');
  const surface=createSurface(canvas,fragmentShader,uniforms);
  return {...surface,render:seconds=>{uniforms.uTime.value=seconds;surface.draw();},dispose:()=>{
    texture.dispose();surface.dispose();
  }};
}
