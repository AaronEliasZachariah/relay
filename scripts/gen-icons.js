/**
 * Generates Relay's launcher / splash / favicon assets from inline SVG.
 *   node scripts/gen-icons.js
 *
 * The mark: a geometric "send" plane, tilted, in white on the brand
 * indigo→violet gradient. Re-run after tweaking the constants below.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets');
const C1 = '#5B5BF0';
const C2 = '#8B5CF6';

// Material "send" plane in a 24×24 box.
const PLANE = 'M2.01 21 L23 12 L2.01 3 L2 10 L17 12 L2 14 Z';
const GRAD = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C1}"/><stop offset="1" stop-color="${C2}"/></linearGradient>`;

/** Centered, tilted plane glyph. `frac` scales it relative to the canvas. */
function glyph(size, frac, fill) {
  const s = size * 0.019 * frac;
  const tx = size * 0.5 - 12 * s;
  const ty = size * 0.5 - 12 * s;
  // Nudge up a touch so the tilted plane reads optically centered.
  return `<g transform="translate(${tx} ${ty - size * 0.01}) scale(${s}) rotate(-38 12 12)" fill="${fill}"><path d="${PLANE}"/></g>`;
}

const squareGradient = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><defs>${GRAD}</defs><rect width="${size}" height="${size}" fill="url(#g)"/></svg>`;

const fullIcon = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><defs>${GRAD}</defs><rect width="${size}" height="${size}" fill="url(#g)"/>${glyph(size, 1, '#FFFFFF')}</svg>`;

const tile = (size) => {
  const r = size * 0.225;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><defs>${GRAD}</defs><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#g)"/>${glyph(size, 1, '#FFFFFF')}</svg>`;
};

const glyphOnly = (size, frac) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${glyph(size, frac, '#FFFFFF')}</svg>`;

async function png(svg, file, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT, file));
  console.log('✓', file);
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  await png(fullIcon(1024), 'icon.png', 1024); // iOS + general (opaque square)
  await png(tile(1024), 'splash-icon.png', 1024); // splash logo (rounded tile)
  await png(tile(256), 'favicon.png', 48); // web favicon
  await png(squareGradient(1024), 'android-icon-background.png', 1024);
  await png(glyphOnly(1024, 0.82), 'android-icon-foreground.png', 1024); // safe-zone glyph
  await png(glyphOnly(1024, 0.82), 'android-icon-monochrome.png', 1024);
  console.log('Done.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
