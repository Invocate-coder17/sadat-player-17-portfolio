import {assetUrl} from './scene-assets.js';

// Only approved, actual video can move the people. No photo warping or arm rigs.
export function initCelebration(reducedMotion){
  const section=document.getElementById('standard');
  const stage=document.getElementById('celebrationStage');
  const video=document.getElementById('celebrationFilm');
  const photos=[...stage.querySelectorAll('.celebration-photo')];
  const caption=document.getElementById('celebrationBeat');
  const credit=stage.querySelector('.celebration-credit');
  const configured=stage.dataset.videoSrc?.trim();
  let played=false,visible=false,running=false,frame=0,elapsed=0,last=0;
  let introFinished=reducedMotion;
  if(configured){
    video.src=assetUrl(configured);
    video.load();
  }
  function stop(){
    running=false;cancelAnimationFrame(frame);video.pause();
    stage.classList.remove('is-playing','is-film');
    stage.setAttribute('aria-hidden','true');stage.inert=true;
    section.classList.remove('is-performing');
  }
  function update(now){
    if(!running)return;
    if(visible&&!document.hidden&&!document.body.classList.contains('intro-locked')){
      elapsed+=(now-last)/1000;
      const second=elapsed>=2.6;
      photos.forEach((photo,i)=>photo.classList.toggle('is-current',i===(second?1:0)));
      caption.textContent=second?'LEADERSHIP. COMPOSURE.':'THE STANDARD. THE MINDSET.';
      if(elapsed>=5.2){
        cancelAnimationFrame(frame);
        if(configured){
          stage.classList.add('is-film');
          caption.textContent='PLAYER 17 × THE CAPTAIN';
          stage.querySelector('.celebration-caption small').textContent='AI-GENERATED CELEBRATION · NOT REAL MEETING FOOTAGE';
          stage.querySelector('.celebration-caption>span').textContent='SADAT JUNAID AKUNJEE × SERGIO RAMOS GARCÍA';
          credit.textContent='Fictional celebration film';
          video.play().catch(stop);
          return;
        }
        stop();return;
      }
    }
    last=now;frame=requestAnimationFrame(update);
  }
  function start(){
    if(played||reducedMotion||!introFinished)return;
    played=true;running=true;last=performance.now();
    stage.classList.add('is-playing');stage.inert=false;
    stage.setAttribute('aria-hidden','false');section.classList.add('is-performing');
    frame=requestAnimationFrame(update);
  }
  stage.inert=true;
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible)start();
    if(stage.classList.contains('is-film')){
      if(!visible)video.pause();
      else if(running&&!document.hidden)video.play().catch(stop);
    }
  },{threshold:.35}).observe(section);
  document.addEventListener('player17:intro-complete',()=>{
    introFinished=true;if(visible)start();
    if(visible&&running&&stage.classList.contains('is-film'))video.play().catch(stop);
  });
  document.addEventListener('player17:intro-start',()=>video.pause());
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)video.pause();
    else if(visible&&running&&stage.classList.contains('is-film'))video.play().catch(stop);
  });
  video.addEventListener('ended',stop);
  video.addEventListener('error',stop);
  document.getElementById('skipCelebration').addEventListener('click',stop);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&running)stop();});
}
