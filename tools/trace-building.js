// Traces assets/building.png into assets/building.svg with potrace (brew install potrace).
// The house and each plant region (tools/detail-regions.json) are traced separately,
// so plants can be hidden and drawn in on their own. Long straight runs of ink inside
// a plant region (window frames, fence, railings) are kept with the house.
//
//   node tools/trace-building.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets/building.png');
const OUT = path.join(ROOT, 'assets/building.svg');
const { regions } = JSON.parse(fs.readFileSync(path.join(__dirname, 'detail-regions.json'), 'utf8'));

const SIZE = 2048; // trace at 2× for smoother curves
const SCALE = SIZE / 1024;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-'));

// sips writes a 24-bit top-down BMP: 54-byte header, rows of SIZE*3 bytes (no padding at this width)
const bmpPath = path.join(tmp, 'src.bmp');
execFileSync('sips', ['-z', SIZE, SIZE, SRC, '-s', 'format', 'bmp', '--out', bmpPath], { stdio: 'ignore' });
const bmp = fs.readFileSync(bmpPath);
const HEADER = bmp.readUInt32LE(10);
const ROW = SIZE * 3;

const inRect = (x, y, [rx, ry, rw, rh]) =>
  x >= rx * SCALE && x < (rx + rw) * SCALE && y >= ry * SCALE && y < (ry + rh) * SCALE;

// Mark pixels that sit in a long straight run of ink — architecture, not leaves.
// Runs are followed along a fan of slopes so slightly slanted railings count too.
const MIN_RUN = 44; // px at SIZE
const MAX_SLOPE = 0.35;
const SLOPE_STEP = 0.025;
const ink = new Uint8Array(SIZE * SIZE);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const o = HEADER + y * ROW + x * 3;
    ink[y * SIZE + x] = bmp[o] + bmp[o + 1] + bmp[o + 2] < 3 * 255 * 0.55 ? 1 : 0;
  }
}
const hLine = new Uint8Array(SIZE * SIZE);
const vLine = new Uint8Array(SIZE * SIZE);
function markRuns(out, horizontal, slope) {
  // Walk lines `minor = offset + slope * major`; mark every run of ink ≥ MIN_RUN long
  const span = Math.ceil(Math.abs(slope) * SIZE);
  for (let offset = -span; offset < SIZE + span; offset++) {
    let run = [];
    for (let major = 0; major <= SIZE; major++) {
      const minor = Math.round(offset + slope * major);
      const inside = major < SIZE && minor >= 0 && minor < SIZE;
      const i = inside ? (horizontal ? minor * SIZE + major : major * SIZE + minor) : -1;
      if (inside && ink[i]) {
        run.push(i);
      } else {
        if (run.length >= MIN_RUN) run.forEach((j) => (out[j] = 1));
        run = [];
      }
    }
  }
}
for (let s = -MAX_SLOPE; s <= MAX_SLOPE + 1e-9; s += SLOPE_STEP) {
  markRuns(hLine, true, s);
  markRuns(vLine, false, s);
}

const regionAt = (x, y) => regions.find((r) => inRect(x, y, r.rect));
const isLine = (x, y, r) =>
  (r.except || []).some((e) => inRect(x, y, e)) ||
  hLine[y * SIZE + x] === 1 ||
  ((r.keepLines || 'both') === 'both' && vLine[y * SIZE + x] === 1);

// Copy of the bitmap with every pixel outside `keep` painted white
function masked(keep) {
  const out = Buffer.from(bmp);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!keep(x, y)) out.fill(255, HEADER + y * ROW + x * 3, HEADER + y * ROW + x * 3 + 3);
    }
  }
  return out;
}

// Returns the <path d> strings potrace produces (one per connected shape)
function trace(buffer, name) {
  const inFile = path.join(tmp, `${name}.bmp`);
  const outFile = path.join(tmp, `${name}.svg`);
  fs.writeFileSync(inFile, buffer);
  execFileSync('potrace', [inFile, '-b', 'svg', '-k', '0.55', '-t', '6', '-a', '1', '-O', '0.5', '-o', outFile]);
  const svg = fs.readFileSync(outFile, 'utf8');
  return [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1].replace(/\s+/g, ' '));
}

const structure = trace(
  masked((x, y) => {
    const r = regionAt(x, y);
    return !r || isLine(x, y, r);
  }),
  'structure'
);

const details = regions.map((r) => ({
  ...r,
  paths: trace(masked((x, y) => regionAt(x, y) === r && !isLine(x, y, r)), r.id),
}));

// The whole drawing again, cut into horizontal bands (band 0 = bottom), so the
// "lines" effect can draw it from the ground up
const BAND = 32; // building px
const bands = [];
for (let top = 1024 - BAND, k = 0; top >= 0; top -= BAND, k++) {
  const y0 = top * SCALE;
  const y1 = (top + BAND) * SCALE;
  bands.push(trace(masked((x, y) => y >= y0 && y < y1), `band-${k}`));
}

// potrace coords are 10× and y-up in a SIZE box → map to a 1024 viewBox
const T = `translate(0 1024) scale(${0.1 / SCALE} ${-0.1 / SCALE})`;
const p = (d) => `<path pathLength="1" d="${d}"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<g id="b-art" transform="${T}">
<g class="b-structure">${structure.map(p).join('')}</g>
<g class="b-details">
${details.map((r) => `<g class="detail" data-region="${r.id}">${r.paths.map(p).join('')}</g>`).join('\n')}
</g>
</g>
<g id="b-lines" class="b-lines" transform="${T}">
${bands.map((b, k) => `<g class="band" data-band="${k}">${b.map(p).join('')}</g>`).join('\n')}
</g>
</svg>
`;

fs.writeFileSync(OUT, svg);
fs.rmSync(tmp, { recursive: true });

// The hero inlines the drawing (CSS has to reach the paths), so refresh it in index.html too
const HTML = path.join(ROOT, 'index.html');
const START = /<!-- building:start[^>]*-->/;
const END = '<!-- building:end -->';
const html = fs.readFileSync(HTML, 'utf8');
const art = svg.slice(svg.indexOf('<g id="b-art"'), svg.lastIndexOf('</svg>')).trim();
const startMatch = html.match(START);
if (startMatch && html.includes(END)) {
  const from = startMatch.index + startMatch[0].length;
  fs.writeFileSync(HTML, html.slice(0, from) + '\n' + art + '\n' + html.slice(html.indexOf(END)));
  console.log('updated index.html');
}
console.log(`structure: ${structure.length} paths`);
details.forEach((r) => console.log(`${r.id}: ${r.paths.length} paths`));
console.log(`line bands: ${bands.length} (${bands.reduce((n, b) => n + b.length, 0)} paths)`);
console.log(`wrote ${path.relative(ROOT, OUT)} (${(svg.length / 1024).toFixed(0)} KB)`);
