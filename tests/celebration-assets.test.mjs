import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const root=join(dirname(fileURLToPath(import.meta.url)), '..');
const html=readFileSync(join(root, 'index.html'), 'utf8');
const review=readFileSync(join(root, 'celebration-review.html'), 'utf8');
const film=html.match(/id="celebrationStage"[^>]*data-video-src="([^"]+)"/)?.[1];
assert.equal(film, 'celebration-film-v2.mp4', 'The rejected take must not be the configured film');
assert.ok(existsSync(join(root, 'public', 'assets', film)), 'Configured celebration film must be bundled');
assert.ok(review.includes('./assets/'+film), 'Review and portfolio must use the same film');
assert.ok(!review.includes('celebration-film.mp4'), 'The review must not serve the rejected take');
assert.ok(!existsSync(join(root, 'public', 'assets', 'celebration-film.mp4')), 'The rejected take must not be bundled as a public asset');
assert.ok(review.includes('NOT REAL MEETING FOOTAGE OR ENDORSEMENT'), 'Keep the fictional-tribute disclosure');
assert.ok(html.includes('muted playsinline controls'), 'Native inline playback and controls remain available');
assert.ok(!html.includes('id="celebrationCanvas"'), 'Do not restore the rejected puppet canvas');
for(const source of html.matchAll(/(?:src|poster)="([^"]+)"/g)){
  const url=source[1];
  if(!url.includes('/assets/'))continue;
  const filename=url.split('/assets/')[1].split('?')[0];
  assert.ok(existsSync(join(root, 'public', 'assets', filename)), 'Missing project asset: '+filename);
}
console.log('PASS: reviewed film is bundled, both pages agree, fictional disclosure and native controls preserved');
