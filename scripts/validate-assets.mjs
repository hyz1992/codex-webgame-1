import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assetPaths = [
  '/assets/game/player-hover-bike.png',
  '/assets/game/player-hover-bike-sheet.png',
  '/assets/game/bg-sunset-sky.png',
  '/assets/game/bg-city-silhouette.png',
  '/assets/game/track-edge-glow.png',
  '/assets/game/track-speed-grid.png',
  '/assets/game/item-energy.png',
  '/assets/game/item-shield.png',
  '/assets/game/item-boost.png',
  '/assets/game/obstacle-barrier.png',
  '/assets/game/obstacle-low-fence.png',
  '/assets/game/obstacle-beam.png',
  '/assets/game/obstacle-hazard.png',
];
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const missing = [];
const invalid = [];

for (const assetPath of assetPaths) {
  const absolutePath = join(root, 'public', assetPath.replace('/assets/', 'assets/'));
  if (!existsSync(absolutePath)) {
    missing.push(assetPath);
    continue;
  }

  const header = readFileSync(absolutePath).subarray(0, 8);
  if (!header.equals(pngSignature)) {
    invalid.push(assetPath);
  }
}

if (missing.length > 0 || invalid.length > 0) {
  if (missing.length > 0) {
    console.error(`Missing assets:\n${missing.map((path) => `- ${path}`).join('\n')}`);
  }
  if (invalid.length > 0) {
    console.error(`Invalid PNG assets:\n${invalid.map((path) => `- ${path}`).join('\n')}`);
  }
  process.exit(1);
}

console.log(`Validated ${assetPaths.length} runtime PNG assets.`);
