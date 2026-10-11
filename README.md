# Player 17 Portfolio

A cinematic personal portfolio for AI engineer Sadat Junaid Akunjee, presented as a football match-night experience. The interaction design translates a centre-back's mindset - anticipate risk, control space, and deliver under pressure - into an accessible web experience.

## Highlights

- Procedural Three.js match-ball sequence with a curved flight path and responsive camera
- Custom blue-and-gold surface design generated across a complete sphere
- Continuous goal-net deformation, recoil, and ball settling
- WebGL energy and smoke effects with static fallbacks
- Responsive project, experience, skills, and résumé sections
- Skip, replay, native video controls, visibility pausing, and reduced-motion support
- Automated tests for motion, geometry, asset integrity, and intro sequencing

## Technology

HTML, CSS, modern JavaScript, Three.js, WebGL shaders, Vite, and Node.js tests.

## Run locally

```bash
npm install
npm run dev
```

## Build and verify

```bash
npm test
npm run build
npm run preview
```

The production build is written to `dist/`. The custom build copies the required Three.js modules and their MIT licence so the result can be hosted as a static site.

## Review tools

- `shot-review.html` - scrub the ball flight and inspect a complete rotation
- `flow-review.html` - preview the energy prelude independently
- `celebration-review.html` - inspect the fictional AI-generated celebration film

## Project structure

```text
public/
  assets/                 Generated project media
  Sadat_Junaid_Akunjee_Resume.pdf
scripts/
  build.mjs               Static production build
src/
  app.js                   Page behaviour and counters
  ball-design.js           Procedural ball surface
  ball-scene.js            Three.js scene and goal interaction
  celebration-scene.js     Tribute film sequence
  experience.js            Main experience orchestration
  flow-vfx.js              Smoke and energy effects
  intro-timeline.js        Opening timing model
  scene-assets.js          Runtime texture and backdrop creation
  shot-motion.js           Ball trajectory model
  styles.css / cinema.css  Responsive visual system
tests/                     Motion, geometry, timing, and asset checks
```

## Media and attribution

All media committed to this repository is either user-owned or generated specifically for this portfolio. The celebration is clearly labelled as a fictional AI-generated fan tribute; it is not real meeting footage or an endorsement. See [ASSET_NOTICE.md](ASSET_NOTICE.md) for the media terms.

## Licence

Source code is available under the [MIT License](LICENSE). Personal images, video, résumé content, and other media are excluded from that licence.
