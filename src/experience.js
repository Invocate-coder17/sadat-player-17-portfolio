import {createBallScene} from './ball-scene.js';
import {initCelebration} from './celebration-scene.js';
import {createEnergySweep,createSmokeAura} from './flow-vfx.js';
import {ENERGY_SWEEP_DURATION,getEnergyProgress,getIntroPhase} from './intro-timeline.js';

const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cinemaIntro=document.getElementById('cinemaIntro');
const introTelemetry=document.getElementById('introTelemetry');
const playerStage=document.querySelector('.player-stage');
const flowTrigger=document.getElementById('flowTrigger');
let introActive=false,introStartedAt=0,ballStartedAt=null,introFrame,flowTimer;
let ballScene,energySweep,smokeAura,ballReady=false,introRequest=0,firstIntro=true;
let flowFrame,lastFlowFrame=0;

function finishIntro(){
  introRequest++;introActive=false;
  cancelAnimationFrame(introFrame);
  cinemaIntro.classList.add('is-complete');
  cinemaIntro.classList.remove('is-prelude');
  cinemaIntro.dataset.phase='complete';
  cinemaIntro.inert=true;
  document.body.classList.remove('intro-locked');
  if(firstIntro){
    firstIntro=false;
    document.getElementById(location.hash.slice(1)||'kickoff')?.scrollIntoView({behavior:'instant',block:'start'});
  }
  document.dispatchEvent(new Event('player17:intro-complete'));
  if(!reducedMotion){
    clearTimeout(flowTimer);
    flowTimer=setTimeout(unlockFlow,500);
  }
}

function beginBall(now){
  ballStartedAt=now;
  cinemaIntro.classList.remove('is-prelude');
  cinemaIntro.dataset.phase='ball';
  const animated=cinemaIntro.querySelectorAll('.intro-shutter,.intro-hud');
  animated.forEach(element=>{element.style.animation='none';});
  void cinemaIntro.offsetWidth;
  animated.forEach(element=>{element.style.animation='';});
}

function drawIntro(now){
  if(!introActive)return;
  if(document.hidden){introFrame=requestAnimationFrame(drawIntro);return;}
  if(ballStartedAt===null){
    const seconds=(now-introStartedAt)/1000;
    energySweep?.render(getEnergyProgress(seconds));
    introTelemetry.textContent=seconds<ENERGY_SWEEP_DURATION?'FLOW STATE · AWAKENING':'THE MATCH BEGINS';
    if(getIntroPhase(seconds)==='ball'&&ballReady)beginBall(now);
  }else{
    // The flight, spin, camera, contact and net-recoil timing are unchanged.
    const seconds=(now-ballStartedAt)/1000;
    const state=ballScene.render(seconds);
    introTelemetry.textContent=state.settled?'A MOMENT TO RISE':state.contact?'IN THE BACK OF THE NET':state.crossedLine?'ACROSS THE LINE':'THE MATCH BEGINS';
    if(seconds>8)cinemaIntro.classList.add('is-reveal');
    if(seconds>=ballScene.duration){finishIntro();return;}
  }
  introFrame=requestAnimationFrame(drawIntro);
}

async function playIntro(){
  if(reducedMotion)return;
  const request=++introRequest;
  clearTimeout(flowTimer);cancelAnimationFrame(introFrame);
  ballStartedAt=null;ballReady=false;introActive=true;
  cinemaIntro.classList.remove('is-complete','is-reveal');
  cinemaIntro.classList.add('is-prelude');
  cinemaIntro.dataset.phase='energy';
  cinemaIntro.inert=false;
  document.body.classList.add('intro-locked');
  document.dispatchEvent(new Event('player17:intro-start'));
  try{
    energySweep||=createEnergySweep(document.getElementById('energySweepCanvas'));
    energySweep.resize();energySweep.render(0);
  }catch(error){
    cinemaIntro.classList.add('vfx-unavailable');
    console.warn('Energy sweep uses its CSS fallback:',error.message);
  }
  introStartedAt=performance.now();
  introFrame=requestAnimationFrame(drawIntro);
  // Paint the opening before preparing the existing 3D shot.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  if(request!==introRequest)return;
  try{
    ballScene||=createBallScene(document.getElementById('ballCamCanvas'));
    ballScene.resize();
    await ballScene.ready;
    if(request!==introRequest)return;
    ballScene.render(0);ballReady=true;
  }catch(error){
    console.warn('Cinematic ball intro unavailable on this device:',error.message);
    finishIntro();
  }
}

function fitPortrait(){
  const card=document.getElementById('playerCard');
  const portrait=card.querySelector('.player-portrait');
  const height=Math.min(card.clientHeight,card.clientWidth*1.5);
  portrait.style.height=height+'px';
  portrait.style.width=height*2/3+'px';
}
function drawFlow(now){
  flowFrame=null;
  if(document.hidden||!playerStage.classList.contains('flow-unlocked'))return;
  const bounds=playerStage.getBoundingClientRect();
  if(bounds.top>=innerHeight||bounds.bottom<=0)return;
  if(now-lastFlowFrame>=40){
    lastFlowFrame=now;smokeAura?.render(now/1000);
  }
  flowFrame=requestAnimationFrame(drawFlow);
}
function resumeFlow(){
  if(!reducedMotion&&!flowFrame&&playerStage.classList.contains('flow-unlocked'))flowFrame=requestAnimationFrame(drawFlow);
}
function unlockFlow(){
  playerStage.classList.remove('flow-unlocked');
  void playerStage.offsetWidth;
  playerStage.classList.add('flow-unlocked');
  flowTrigger.setAttribute('aria-pressed','true');
  flowTrigger.innerHTML='<span>◈</span> REIGNITE FLOW STATE';
  if(!reducedMotion&&!smokeAura){
    try{
      smokeAura=createSmokeAura(document.getElementById('auraCanvas'));
      playerStage.classList.add('has-smoke-renderer');
    }catch(error){
      console.warn('Flow state uses its static texture fallback:',error.message);
    }
  }
  resumeFlow();
}

document.getElementById('skipIntro').addEventListener('click',finishIntro);
document.getElementById('replayIntro').addEventListener('click',playIntro);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&introActive)finishIntro();});
flowTrigger.setAttribute('aria-pressed','false');
flowTrigger.addEventListener('click',unlockFlow);
addEventListener('resize',()=>{
  fitPortrait();ballScene?.resize();energySweep?.resize();smokeAura?.resize();
},{passive:true});
new IntersectionObserver(entries=>{
  if(entries.some(entry=>entry.isIntersecting))resumeFlow();
},{threshold:0}).observe(playerStage);
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)hiddenAt=performance.now();
  else{
    const gap=hiddenAt?performance.now()-hiddenAt:0;
    introStartedAt+=gap;
    if(ballStartedAt!==null)ballStartedAt+=gap;
    resumeFlow();
  }
});
fitPortrait();
initCelebration(reducedMotion);
if(!reducedMotion)playIntro();
else{cinemaIntro.classList.add('is-complete');cinemaIntro.dataset.phase='complete';cinemaIntro.inert=true;}
