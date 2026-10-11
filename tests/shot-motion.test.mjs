import test from 'node:test';
import assert from 'node:assert/strict';
import {getShotState, BALL_RADIUS, CONTACT_TIME} from '../src/shot-motion.js';

test('shot is airborne, heads left first and finishes in the right corner', () => {
  const states=Array.from({length:101},(_,i)=>getShotState(.75+i*5.3/100));
  assert.ok(states.every(s=>s.y>BALL_RADIUS));
  assert.ok(Math.min(...states.map(s=>s.x)) < -1.8);
  assert.ok(states.at(-1).x > 2.7 && states.at(-1).x < 3.5);
  assert.ok(states.at(-1).y+BALL_RADIUS < 2.44);
  assert.ok(states.at(-1).crossedLine);
});
test('contact is continuous and preserves stretch, recoil and settling',()=>{
  const before=getShotState(CONTACT_TIME-.00001), contact=getShotState(CONTACT_TIME);
  assert.ok(Math.hypot(before.x-contact.x,before.y-contact.y,before.z-contact.z)<.001);
  const stretch=getShotState(CONTACT_TIME+.35), recoil=getShotState(CONTACT_TIME+1.15), settled=getShotState(9);
  assert.ok(stretch.z < contact.z && stretch.pocket>.6);
  assert.ok(recoil.z > stretch.z && recoil.z<0);
  assert.ok(Math.abs(settled.y-BALL_RADIUS)<.01);
  assert.ok(settled.settled);
});
