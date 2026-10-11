import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');

mkdirSync(join(output, 'assets'), { recursive: true });
cpSync(join(root, 'public'), output, { recursive: true });
cpSync(join(root, 'src', 'styles.css'), join(output, 'assets', 'styles.css'));
cpSync(join(root, 'src', 'cinema.css'), join(output, 'assets', 'cinema.css'));
cpSync(join(root, 'src', 'app.js'), join(output, 'assets', 'app.js'));
cpSync(join(root, 'src', 'experience.js'), join(output, 'assets', 'experience.js'));
for (const filename of ['ball-scene.js', 'ball-design.js', 'scene-assets.js', 'shot-motion.js', 'celebration-scene.js', 'flow-vfx.js', 'intro-timeline.js']) {
  writeFileSync(join(output, 'assets', filename), readFileSync(join(root, 'src', filename), 'utf8').replace("from 'three'", "from '../vendor/three/three.module.js'"));
}
mkdirSync(join(output, 'vendor', 'three'), { recursive: true });
for (const filename of ['three.module.js', 'three.core.js']) {
  cpSync(join(root, 'node_modules', 'three', 'build', filename), join(output, 'vendor', 'three', filename));
}
cpSync(join(root, 'node_modules', 'three', 'LICENSE'), join(output, 'vendor', 'three', 'LICENSE'));

const html = readFileSync(join(root, 'index.html'), 'utf8')
  .replace('/src/styles.css', './assets/styles.css')
  .replace('/src/app.js', './assets/app.js')
  .replaceAll('src="/assets/', 'src="./assets/')
  .replace('href="/Sadat_Junaid_Akunjee_Resume.pdf"', 'href="./Sadat_Junaid_Akunjee_Resume.pdf"');

writeFileSync(join(output, 'index.html'), html);
writeFileSync(join(output, 'shot-review.html'), readFileSync(join(root, 'shot-review.html'), 'utf8').replace('./src/ball-scene.js','./assets/ball-scene.js'));
cpSync(join(root, 'celebration-review.html'),join(output, 'celebration-review.html'));
writeFileSync(join(output,'flow-review.html'),readFileSync(join(root,'flow-review.html'),'utf8').replaceAll('./src/','./assets/'));
console.log('Built production site in dist/');
