// One-time script: converts .MOV files in assets/sfx to .mp3
// Run with: npm run convert-sfx

import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

ffmpeg.setFfmpegPath(ffmpegPath as string);

const sfxDir = join(__dirname, '../../client/public/assets/sfx');
const files = readdirSync(sfxDir).filter((f) => /\.mov$/i.test(f));

if (files.length === 0) {
  console.log('No .MOV files found.');
  process.exit(0);
}

console.log(`Converting ${files.length} file(s)...\n`);

let completed = 0;
files.forEach((file) => {
  const input = join(sfxDir, file);
  const outName = basename(file, extname(file)) + '.mp3';
  const output = join(sfxDir, outName);

  if (existsSync(output)) {
    console.log(`  ✓ ${outName} already exists, skipping`);
    completed++;
    if (completed === files.length) done();
    return;
  }

  ffmpeg(input)
    .noVideo()
    .audioCodec('libmp3lame')
    .audioBitrate('128k')
    .output(output)
    .on('end', () => {
      console.log(`  ✓ ${file}  →  ${outName}`);
      completed++;
      if (completed === files.length) done();
    })
    .on('error', (err) => {
      console.error(`  ✗ ${file}: ${err.message}`);
      completed++;
      if (completed === files.length) done();
    })
    .run();
});

function done() {
  console.log('\nDone! .mp3 files are in client/public/assets/sfx/');
}
