// Animated contribution graph telling a 3-frame story:
//   PROBLEM? (red, glitchy)  ->  IBOHAMID10 (green)  ->  SOLVED ✓ (green)
// Usage: node gen-graph.mjs <outDir>
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2];
const COLS = 53, ROWS = 7, CELL = 13, PITCH = 16;
const LEFT = 40, TOP = 28;
const W = LEFT + COLS * PITCH + 12, H = TOP + ROWS * PITCH + 38;
const LOOP = 18; // seconds
const CAPTION = 'you bring the problem, I build the fix  ·  Vienna, Austria';

// ---------- 5-row pixel font ----------
const FONT = {
  A: ['.##.', '#..#', '####', '#..#', '#..#'],
  B: ['###.', '#..#', '###.', '#..#', '###.'],
  D: ['###.', '#..#', '#..#', '#..#', '###.'],
  E: ['###', '#..', '##.', '#..', '###'],
  H: ['#..#', '#..#', '####', '#..#', '#..#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  O: ['.##.', '#..#', '#..#', '#..#', '.##.'],
  P: ['###.', '#..#', '###.', '#...', '#...'],
  R: ['###.', '#..#', '###.', '#.#.', '#..#'],
  S: ['.###', '#...', '.##.', '...#', '###.'],
  V: ['#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '?': ['###', '..#', '.##', '...', '.#.'],
  '✓': ['....#', '...##', '#.##.', '###..', '.#...'],
  ' ': ['..', '..', '..', '..', '..'],
};

function frame(text) {
  const glyphs = [...text].map(ch => { if (!FONT[ch]) throw new Error(`no glyph: ${ch}`); return FONT[ch]; });
  const w = glyphs.reduce((s, g) => s + g[0].length, 0) + glyphs.length - 1;
  if (w > COLS) throw new Error(`"${text}" too wide: ${w}`);
  const cells = [];
  let x0 = Math.floor((COLS - w) / 2);
  for (const g of glyphs) {
    g.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') cells.push({ c: x0 + c, r: r + 1 }); }));
    x0 += g[0].length + 1;
  }
  return cells.sort((a, b) => a.c - b.c || a.r - b.r);
}

const FRAMES = [frame('PROBLEM?'), frame('IBOHAMID10'), frame('SOLVED ✓')];
const N = Math.max(...FRAMES.map(f => f.length));

// Particle i sits at cell floor(i*K/N) of each frame (left-to-right order, so moves stay local).
// Only the first particle on a cell is visible in that frame; extras ride along invisibly.
const particles = Array.from({ length: N }, (_, i) => FRAMES.map(f => {
  const k = Math.floor(i * f.length / N);
  const prev = i === 0 ? -1 : Math.floor((i - 1) * f.length / N);
  return { ...f[k], on: k !== prev ? 1 : 0 };
}));

// ---------- Deterministic background noise ----------
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const bgCells = [];
for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
  const bg = rand() < 0.2 ? 1 : 0;
  const twinkle = bg === 0 && rand() < 0.07;
  bgCells.push({ c, r, bg, twinkle, delay: rand() * LOOP });
}

const THEMES = {
  dark:  { l: ['#151b23', '#033a16', '#196c2e', '#2ea043', '#56d364'], red: '#f85149', text: '#9198a1' },
  light: { l: ['#eff2f5', '#aceebb', '#4ac26b', '#2da44e', '#116329'], red: '#cf222e', text: '#59636e' },
};
const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const px = c => LEFT + c * PITCH, py = r => TOP + r * PITCH;
const EASE = 'cubic-bezier(.65,0,.35,1)';

function build(name) {
  const { l: L, red, text } = THEMES[name];
  const o = [];
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Animated contribution graph: PROBLEM? in red turns into ibohamid10, which turns into SOLVED with a check mark">`);
  o.push(`<style>
text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif;font-size:12px;fill:${text}}
.t{animation:tw ${LOOP}s infinite both}
@keyframes tw{0%,100%{fill:var(--b)}4%{fill:${L[2]}}10%{fill:var(--b)}}
.q{animation:quiet ${LOOP}s infinite both}
@keyframes quiet{0%,28%{fill:${L[0]}}36%,56%{fill:${L[1]}}64%,100%{fill:${L[0]}}}
.p{opacity:0;animation:story ${LOOP}s infinite both}
@keyframes story{
  0%{opacity:0;transform:translate(0,0);fill:${red}}
  4%{opacity:var(--a);transform:translate(0,0)}
  12%{transform:translate(0,0)}
  12.5%{transform:translate(2px,0)}
  13%{transform:translate(-2px,0)}
  13.5%{transform:translate(1px,0)}
  14%{transform:translate(0,0)}
  20%{transform:translate(0,0)}
  20.5%{transform:translate(-2px,0)}
  21%{transform:translate(2px,0)}
  21.5%{transform:translate(0,0)}
  26%{opacity:var(--a);transform:translate(0,0);fill:${red};animation-timing-function:${EASE}}
  34%{opacity:var(--b);transform:translate(var(--bx),var(--by));fill:${L[4]}}
  56%{opacity:var(--b);transform:translate(var(--bx),var(--by));fill:${L[4]};animation-timing-function:${EASE}}
  64%{opacity:var(--c);transform:translate(var(--cx),var(--cy));fill:${L[4]}}
  86%{opacity:var(--c);transform:translate(var(--cx),var(--cy));fill:${L[4]}}
  92%,100%{opacity:0;transform:translate(var(--cx),var(--cy));fill:${L[4]}}
}
@media (prefers-reduced-motion:reduce){
  .t,.q,.p{animation:none}
  .p{opacity:var(--b);transform:translate(var(--bx),var(--by));fill:${L[4]}}
}
</style>`);

  months.forEach((m, i) => o.push(`<text x="${px(Math.round(i * COLS / 12))}" y="${TOP - 10}">${m}</text>`));
  [['Mon', 1], ['Wed', 3], ['Fri', 5]].forEach(([d, r]) => o.push(`<text x="0" y="${py(r) + 10}">${d}</text>`));

  for (const b of bgCells) {
    const st = b.twinkle ? ` class="t" style="--b:${L[0]};animation-delay:${b.delay.toFixed(2)}s"`
      : b.bg === 1 ? ' class="q"' : '';
    o.push(`<rect x="${px(b.c)}" y="${py(b.r)}" width="${CELL}" height="${CELL}" rx="2" fill="${L[b.bg]}"${st}/>`);
  }

  for (const [a, b, c] of particles) {
    const vars = `--a:${a.on};--b:${b.on};--c:${c.on};` +
      `--bx:${(b.c - a.c) * PITCH}px;--by:${(b.r - a.r) * PITCH}px;` +
      `--cx:${(c.c - a.c) * PITCH}px;--cy:${(c.r - a.r) * PITCH}px;` +
      `animation-delay:${(a.c * 0.03).toFixed(2)}s`;
    o.push(`<rect class="p" x="${px(a.c)}" y="${py(a.r)}" width="${CELL}" height="${CELL}" rx="2" fill="${L[4]}" style="${vars}"/>`);
  }

  const fy = TOP + ROWS * PITCH + 24;
  o.push(`<text x="${LEFT}" y="${fy}" xml:space="preserve">${CAPTION}</text>`);
  const lx = W - 12 - 5 * PITCH - 34;
  o.push(`<text x="${lx - 34}" y="${fy}">Less</text>`);
  L.forEach((col, i) => o.push(`<rect x="${lx + i * PITCH}" y="${fy - 11}" width="${CELL}" height="${CELL}" rx="2" fill="${col}"/>`));
  o.push(`<text x="${lx + 5 * PITCH + 4}" y="${fy}">More</text>`);
  o.push('</svg>');
  return o.join('\n');
}

for (const name of Object.keys(THEMES)) writeFileSync(join(outDir, `graph-${name}.svg`), build(name));
console.log(`ok: frames ${FRAMES.map(f => f.length).join(' / ')} cells, ${N} particles`);
