import * as THREE from 'three';
import {getShotState, BALL_RADIUS} from './shot-motion.js';
import {createMatchBallTexture, addBernabeuBackdrop, addPhotographicCrowd} from './scene-assets.js';

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = value => value * value * (3 - 2 * value);

// A single world-space goal and a camera rig that travels with the football.
// Net contact is local, followed by a damped recoil and the ball settling on turf.
export function createBallScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .96;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050e19');
  scene.fog = new THREE.FogExp2('#06111c', .013);
  const camera = new THREE.PerspectiveCamera(62, 1, .05, 180);
  const target = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();

  scene.add(new THREE.HemisphereLight('#d5eaff', '#0c1a12', .95));
  const key = new THREE.DirectionalLight('#e7f6ff', 2.1);
  key.position.set(-12, 19, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -14;
  key.shadow.camera.right = 14;
  key.shadow.camera.top = 38;
  key.shadow.camera.bottom = -10;
  key.shadow.camera.far = 80;
  key.shadow.normalBias = .018;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#78caff', 1.25);
  rim.position.set(10, 12, -10);
  scene.add(rim);

  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = grassCanvas.height = 512;
  const grassContext = grassCanvas.getContext('2d');
  grassContext.fillStyle = '#173d2a';
  grassContext.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 37000; i += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    grassContext.strokeStyle = i % 3 ? 'rgba(78,126,58,.32)' : 'rgba(3,28,20,.5)';
    grassContext.lineWidth = .45;
    grassContext.beginPath();
    grassContext.moveTo(x, y);
    grassContext.lineTo(x + Math.random() * 2 - 1, y - 2 - Math.random() * 4);
    grassContext.stroke();
  }
  const grass = new THREE.CanvasTexture(grassCanvas);
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(18, 28);
  grass.colorSpace = THREE.SRGBColorSpace;
  grass.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(100, 145), new THREE.MeshStandardMaterial({ map: grass, roughness: .96 }));
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.z = 43;
  pitch.receiveShadow = true;
  scene.add(pitch);

  const stripMaterial = new THREE.MeshBasicMaterial({ color: '#9de5b1', transparent: true, opacity: .045, depthWrite: false });
  for (let z = -12; z < 112; z += 12) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(68, 6), stripMaterial);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, .007, z);
    scene.add(strip);
  }

  function turfLine(x1, z1, x2, z2, width = .085) {
    const length = Math.hypot(x2 - x1, z2 - z1);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, length), new THREE.MeshBasicMaterial({ color: '#dbe8d4', transparent: true, opacity: .83 }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -Math.atan2(x2 - x1, z2 - z1);
    mesh.position.set((x1 + x2) / 2, .012, (z1 + z2) / 2);
    scene.add(mesh);
  }
  turfLine(-34, 0, 34, 0, .12);
  turfLine(-20.16, 0, -20.16, 16.5);
  turfLine(20.16, 0, 20.16, 16.5);
  turfLine(-20.16, 16.5, 20.16, 16.5);
  turfLine(-9.16, 0, -9.16, 5.5);
  turfLine(9.16, 0, 9.16, 5.5);
  turfLine(-9.16, 5.5, 9.16, 5.5);
  turfLine(-34, 0, -34, 105);
  turfLine(34, 0, 34, 105);

  const readyBackdrop = addBernabeuBackdrop(scene);
  const readyCrowd = addPhotographicCrowd(scene);

  const goal = new THREE.Group();
  scene.add(goal);
  const postMaterial = new THREE.MeshStandardMaterial({ color: '#f4f5ed', metalness: .18, roughness: .32 });
  function post(from, to, radius = .06) {
    const direction = new THREE.Vector3().subVectors(to, from);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 16), postMaterial);
    tube.position.copy(from).add(to).multiplyScalar(.5);
    tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    tube.castShadow = true;
    goal.add(tube);
  }
  const halfWidth = 3.66;
  const goalHeight = 2.44;
  const netDepth = 2.4;
  post(new THREE.Vector3(-halfWidth, 0, 0), new THREE.Vector3(-halfWidth, goalHeight, 0));
  post(new THREE.Vector3(halfWidth, 0, 0), new THREE.Vector3(halfWidth, goalHeight, 0));
  post(new THREE.Vector3(-halfWidth, goalHeight, 0), new THREE.Vector3(halfWidth, goalHeight, 0));
  for (const side of [-1, 1]) {
    post(new THREE.Vector3(side * halfWidth, 0, 0), new THREE.Vector3(side * halfWidth, .03, -netDepth), .025);
    post(new THREE.Vector3(side * halfWidth, .03, -netDepth), new THREE.Vector3(side * halfWidth, goalHeight, -netDepth), .025);
    post(new THREE.Vector3(side * halfWidth, goalHeight, 0), new THREE.Vector3(side * halfWidth, goalHeight, -netDepth), .025);
  }

  const netSegments = [];
  function netLine(from, to, points = 18, deform = false) {
    for (let i = 0; i < points; i += 1) {
      netSegments.push({ p: new THREE.Vector3().lerpVectors(from, to, i / points), deform });
      netSegments.push({ p: new THREE.Vector3().lerpVectors(from, to, (i + 1) / points), deform });
    }
  }
  const grid = .17;
  for (let x = -halfWidth; x <= halfWidth + .01; x += grid) {
    netLine(new THREE.Vector3(x, .02, -netDepth), new THREE.Vector3(x, goalHeight, -netDepth), 18, true);
    netLine(new THREE.Vector3(x, goalHeight, 0), new THREE.Vector3(x, goalHeight, -netDepth));
  }
  for (let y = .02; y <= goalHeight; y += grid) {
    netLine(new THREE.Vector3(-halfWidth, y, -netDepth), new THREE.Vector3(halfWidth, y, -netDepth), 42, true);
    for (const side of [-1, 1]) netLine(new THREE.Vector3(side * halfWidth, y, 0), new THREE.Vector3(side * halfWidth, y, -netDepth));
  }
  for (let z = -netDepth; z <= 0; z += grid) {
    netLine(new THREE.Vector3(-halfWidth, goalHeight, z), new THREE.Vector3(halfWidth, goalHeight, z), 42);
    for (const side of [-1, 1]) netLine(new THREE.Vector3(side * halfWidth, .02, z), new THREE.Vector3(side * halfWidth, goalHeight, z));
  }
  const netArray = new Float32Array(netSegments.length * 3);
  const netGeometry = new THREE.BufferGeometry();
  netGeometry.setAttribute('position', new THREE.BufferAttribute(netArray, 3).setUsage(THREE.DynamicDrawUsage));
  const net = new THREE.LineSegments(netGeometry, new THREE.LineBasicMaterial({ color: '#e2eee4', transparent: true, opacity: .54 }));
  net.frustumCulled = false;
  goal.add(net);

  const radius = BALL_RADIUS;
  const ballMaterial = new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.52,metalness:0});
  const football = new THREE.Mesh(new THREE.SphereGeometry(radius,64,48),ballMaterial);
  football.castShadow = true;
  scene.add(football);
  const readyBall = createMatchBallTexture().then(texture => { texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8); ballMaterial.map=texture; ballMaterial.needsUpdate=true; });

  const contactShadow = new THREE.Mesh(new THREE.CircleGeometry(.31, 32), new THREE.MeshBasicMaterial({ color: '#000708', transparent: true, opacity: .36, depthWrite: false }));
  contactShadow.rotation.x = -Math.PI / 2;
  scene.add(contactShadow);

  function resize() {
    const width = canvas.clientWidth || innerWidth;
    const height = canvas.clientHeight || innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render(seconds, inspectionAngle = null) {
    const state = getShotState(seconds);
    const {x:ballX,y:ballY,z:ballZ,u,impact:impactTime,pocket} = state;
    football.position.set(ballX,ballY,ballZ);
    // Sidespin drives the curl; slight backspin creates a natural tumbling look.
    football.rotation.set(u*12, u*35, u*.7);
    contactShadow.position.set(ballX,.014,ballZ);
    contactShadow.scale.setScalar(1+(ballY-radius)*.55);
    contactShadow.material.opacity=.32/(1+(ballY-radius)*1.8);
    for (let i=0;i<netSegments.length;i++) {
      const {p,deform}=netSegments[i]; const offset=i*3;
      const dx=p.x-2.85, dy=p.y-1.17;
      const falloff=Math.exp(-(dx*dx*1.7+dy*dy*3.4));
      const boundary=Math.sin((p.x+halfWidth)/(halfWidth*2)*Math.PI)*Math.sin(p.y/goalHeight*Math.PI);
      const anchorAtImpact=Math.sin((2.85+halfWidth)/(halfWidth*2)*Math.PI)*Math.sin(1.17/goalHeight*Math.PI);
      const ripple=impactTime>.35?Math.sin(Math.hypot(dx,dy)*8-impactTime*11)*Math.exp(-impactTime*2.4)*.075:0;
      netArray[offset]=p.x; netArray[offset+1]=p.y;
      netArray[offset+2]=p.z-(deform?(pocket*falloff+ripple)*clamp(boundary/anchorAtImpact):0);
    }
    netGeometry.attributes.position.needsUpdate=true;
    // A closer, ball-following gimbal. No turf bobbing or horizon spins.
    const heading=new THREE.Vector3(state.headingX,0,-1).normalize();
    cameraPosition.copy(football.position).addScaledVector(heading,-1.35);
    cameraPosition.y=ballY+.52;
    target.copy(football.position).addScaledVector(heading,2.5);
    target.y=ballY+.02;
    if (impactTime>.35) {
      const settle=smooth(clamp((impactTime-.35)/1.6));
      cameraPosition.lerp(new THREE.Vector3(ballX+.78,1.27,ballZ+1.55),settle);
      target.lerp(new THREE.Vector3(ballX,.36,ballZ-.1),settle);
    }
    if (Number.isFinite(inspectionAngle)) {
      football.rotation.set(.22,inspectionAngle,.12);
      cameraPosition.copy(football.position).add(new THREE.Vector3(0,.22,.7));
      target.copy(football.position);
    }
    camera.position.copy(cameraPosition); camera.lookAt(target);
    camera.rotateZ(-state.headingX*.045+Math.sin(impactTime*53)*.015*Math.exp(-impactTime*5)*(impactTime>0?1:0));
    renderer.render(scene,camera);
    return state;
  }
  resize();
  return {render,resize,duration:10.8,ready:Promise.all([readyBackdrop,readyCrowd,readyBall])};
}
