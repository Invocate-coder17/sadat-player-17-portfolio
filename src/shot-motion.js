// A single smooth airborne curve, directed left first and then into the right
// corner. Cinematic timing is slowed down; this is not a physics simulation.
export const BALL_RADIUS = .16;
export const CONTACT_TIME = 6.05;
const clamp = value => Math.max(0, Math.min(1, value));
const bezier = (a, b, c, d, u) => a * (1-u)**3 + 3*b*(1-u)**2*u + 3*c*(1-u)*u*u + d*u**3;

export function getShotState(seconds) {
  const u = clamp((seconds - .75) / 5.3);
  const impact = Math.max(0, seconds - CONTACT_TIME);
  let x = bezier(-.7, -5.4, 2.75, 2.85, u);
  let y = .25 + 6.2*u*(1-u) + .92*u;
  let z = 31.6 - 33.84*u;
  let pocket = 0;
  if (seconds >= CONTACT_TIME) {
    if (impact < .35) {
      pocket = Math.sin(impact/.35*Math.PI/2)*.63;
      z = -2.24 - pocket;
      y = 1.17 + .07*Math.sin(impact/.35*Math.PI);
    } else {
      const recoil = impact - .35;
      pocket = .63*Math.exp(-recoil*2.8)*Math.cos(recoil*9);
      z = -2.87 + clamp(recoil/.8)*1.12;
      const touchdown = Math.sqrt(2*(1.17-BALL_RADIUS)/4.5);
      if (recoil < touchdown) y = 1.17 - 2.25*recoil*recoil;
      else {
        const bounce = recoil - touchdown;
        y = BALL_RADIUS + .17*Math.abs(Math.sin(bounce*7))*Math.exp(-bounce*4);
      }
    }
  }
  const dx = 3*(-5.4+.7)*(1-u)**2 + 6*(2.75+5.4)*(1-u)*u + 3*(2.85-2.75)*u*u;
  return { x, y, z, u, impact, pocket, headingX:dx/33.84,
    crossedLine:z < -BALL_RADIUS, contact:seconds >= CONTACT_TIME, settled:impact > 1.65 };
}
