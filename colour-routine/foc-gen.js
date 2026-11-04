/* Colour Routine — Square Rings 5×5 v1.2.0
   BigInt LCG64. Output MUST equal the SmartPy renderer byte for byte. */
(function (root) {
  const U64   = 18446744073709551616n;
  const MULT  = 6364136223846793005n;
  const INC   = 1442695040888963407n;

  function lcg64(state) {
    const s = (state * MULT + INC) % U64;
    return [s, s];
  }

  function makeRng(seed) {
    let st = BigInt(seed) % U64;
    return function next(n) {
      const r = lcg64(st);
      st = r[0];
      return Number((r[1] * BigInt(n)) / U64);
    };
  }

  function hslToRgb(h, s, l) {
    const L = l * 100, S = s * 100;
    const A = 2 * Math.min(L, 10000 - L);
    const C = Math.floor((A * S) / 10000);
    const K = h % 120;
    const Bf = Math.min(K, 120 - K);
    const X = Math.floor((C * Bf) / 60);
    const half = Math.floor(C / 2);
    const M = L > half ? L - half : 0;
    const seg = Math.floor(h / 60);
    let r1, g1, b1;
    if      (seg === 0) { r1 = C; g1 = X; b1 = 0; }
    else if (seg === 1) { r1 = X; g1 = C; b1 = 0; }
    else if (seg === 2) { r1 = 0; g1 = C; b1 = X; }
    else if (seg === 3) { r1 = 0; g1 = X; b1 = C; }
    else if (seg === 4) { r1 = X; g1 = 0; b1 = C; }
    else                { r1 = C; g1 = 0; b1 = X; }
    const f = v => Math.floor(((v + M) * 255 + 5000) / 10000);
    return [f(r1), f(g1), f(b1)];
  }

  function roleIndex(x, y) {
    const d = Math.min(x, y, 4 - x, 4 - y);
    if (d === 2) return 5;
    const corner = (x === d || x === 4 - d) && (y === d || y === 4 - d);
    if (corner) return d === 0 ? 4 : 2;
    if (d === 1) return 3;
    if (x === 2 || y === 2) return 1;
    return 0;
  }

  function renderSVG(seed) {
    const next = makeRng(seed);

    const base_h = next(360);
    const base_s = next(40);
    const base_l = next(25);

    const pal = [];
    for (let i = 0; i < 6; i++) {
      const base_idx = Math.floor(i / 2);
      const hn = next(40), sn = next(20), ln = next(16), an = next(19);
      const h = (base_h + base_idx * 120 + hn + 340) % 360;
      const s = base_s + 40 + sn;
      const l = base_l + 40 + ln;
      const [r, g, b] = hslToRgb(h, s, l);
      pal.push({ r, g, b, a: 82 + an });
    }

    const out = [];
    out.push("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 5 5' " +
             "width='250' height='250' shape-rendering='crispEdges'>");
    out.push("<path d='M0 0h5v5H0z' fill='white'/>");
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const p = pal[roleIndex(x, y)];
        const a = Math.min(p.a + next(13), 105) - 6;
        out.push(`<path d='M${x} ${y}h1v1H${x}z' ` +
                 `fill='rgba(${p.r},${p.g},${p.b},0.${a})'/>`);
      }
    }
    out.push("</svg>");
    return out.join("");
  }

  root.ColourRoutineGen = { lcg64, makeRng, hslToRgb, roleIndex, renderSVG };
})(window);
