/* Neon Weather: deterministic browser mirror of the SmartPy SVG renderer. */
(function (root) {
  "use strict";

  const SIZE = 9;
  const U64 = 18446744073709551616n;
  const MULT = 6364136223846793005n;
  const INC = 1442695040888963407n;
  const MOODS = {
    storm:   [202, 190, 168,  44, 350, 265],
    sunset:  [278, 330, 350,  18,  42,  58],
    acid:    [145,  85,  65, 285,  45, 190],
    glacier: [205, 194, 178, 160, 280, 225]
  };
  const MOOD_NAMES = Object.keys(MOODS);
  const TEMPOS = [6, 8, 10];

  function seedValue(seed) {
    const text = String(seed);
    if (!/^\d+$/.test(text)) throw new TypeError("Neon Weather seeds must be decimal integers.");
    return BigInt(text) % U64;
  }

  function draw(state, n) {
    const next = (state * MULT + INC) % U64;
    return { state: next, value: Number((next * BigInt(n)) / U64) };
  }

  function hslToHex(h, s, l) {
    const bigL = l * 100;
    const bigS = s * 100;
    const chroma = Math.floor((2 * Math.min(bigL, 10000 - bigL) * bigS) / 10000);
    const hueOffset = h % 120;
    const triangle = Math.min(hueOffset, 120 - hueOffset);
    const x = Math.floor((chroma * triangle) / 60);
    const half = Math.floor(chroma / 2);
    const m = bigL > half ? bigL - half : 0;
    const segment = Math.floor(h / 60);
    let r = 0, g = 0, b = 0;
    if (segment === 0) { r = chroma; g = x; }
    if (segment === 1) { r = x; g = chroma; }
    if (segment === 2) { g = chroma; b = x; }
    if (segment === 3) { g = x; b = chroma; }
    if (segment === 4) { r = x; b = chroma; }
    if (segment === 5) { r = chroma; b = x; }
    const channel = value => Math.floor(((value + m) * 255 + 5000) / 10000);
    return "#" + [channel(r), channel(g), channel(b)]
      .map(value => value.toString(16).padStart(2, "0")).join("");
  }

  function buildPalette(seed, mood) {
    const seedNat = seedValue(seed);
    let state = seedNat === 0n ? 1831565813n : seedNat;
    const moodDraw = draw(state, 4); state = moodDraw.state;
    const moodName = mood || MOOD_NAMES[moodDraw.value];
    const bases = MOODS[moodName] || MOODS[MOOD_NAMES[moodDraw.value]];
    const hueDraw = draw(state, 49); state = hueDraw.state;
    const lightDraw = draw(state, 15); state = lightDraw.state;
    const hueShift = hueDraw.value;
    const lightShift = lightDraw.value;
    const order = [0, 1, 2, 3, 4, 5];
    for (let i = 5; i > 0; i--) {
      const pick = draw(state, i + 1); state = pick.state;
      [order[i], order[pick.value]] = [order[pick.value], order[i]];
    }
    return order.map(index => {
      const hueNoise = draw(state, 21); state = hueNoise.state;
      const satNoise = draw(state, 40); state = satNoise.state;
      const lightNoise = draw(state, 17); state = lightNoise.state;
      const h = (bases[index] + hueShift + hueNoise.value + 326) % 360;
      const s = 52 + satNoise.value;
      const l = 33 + lightShift + lightNoise.value;
      return hslToHex(h, s, l);
    });
  }

  function roleAt(x, y) {
    if (x === 0 || x === 8 || y === 0 || y === 8) return 0;
    if (x === 2 || x === 6 || y === 2 || y === 6) return 1;
    if (x === 3 || x === 5 || y === 3 || y === 5) return 2;
    if (x === 4 || y === 4) return 3;
    return 4;
  }

  function phaseForStep(step, seed) {
    const offset = Number(seedValue(seed) % 997n);
    const milli = (step * 110 + Math.floor(offset * 1000 / 997)) % 1000;
    return "0." + String(milli).padStart(3, "0");
  }

  function propertiesFor(seed) {
    const seedNat = seedValue(seed);
    const normalized = seedNat === 0n ? 1831565813n : seedNat;
    const moodDraw = draw(normalized, 4);
    return {
      palette: MOOD_NAMES[moodDraw.value],
      seconds: TEMPOS[Number(seedNat % 3n)],
      state: seedNat
    };
  }

  function renderSVG(seed) {
    const seedNat = seedValue(seed);
    const properties = propertiesFor(seedNat.toString());
    const colors = buildPalette(seedNat.toString(), properties.palette);
    const rotation = Number(seedNat % BigInt(colors.length));
    const rotated = colors.slice(rotation).concat(colors.slice(0, rotation));
    const styles = [];
    const stops = ["16.667", "33.333", "50", "66.667", "83.333"];
    for (let role = 0; role < 5; role++) {
      const sequence = Array.from({length:6}, (_, i) => rotated[(role + i) % 6]);
      let keyframes = `@keyframes p${role}{0%,100%{fill:${sequence[0]}}`;
      for (let i = 1; i < 6; i++) keyframes += `${stops[i - 1]}%{fill:${sequence[i]}}`;
      keyframes += `}.p${role}{animation:p${role} ${properties.seconds}s linear infinite}`;
      styles.push(keyframes);
    }
    styles.push("@media(prefers-reduced-motion:reduce){.p0,.p1,.p2,.p3,.p4{animation:none!important}}");
    const nodes = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" role="img" aria-label="Neon Weather animated cross bands" shape-rendering="crispEdges">`,
      `<rect width="9" height="9" fill="${colors[0]}"/>`,
      `<style>${styles.join("")}</style>`
    ];
    const groups = new Map();
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const role = roleAt(x, y);
        const step = Math.min(x, y, 8 - x, 8 - y) + Math.abs(x - y);
        const key = `${role}:${step}`;
        const group = groups.get(key) || { role, step, path: "" };
        group.path += `M${x} ${y}h1v1h-1z`;
        groups.set(key, group);
      }
    }
    for (let role = 0; role < 5; role++) {
      for (let step = 0; step < 9; step++) {
        const group = groups.get(`${role}:${step}`);
        if (!group) continue;
        const phase = phaseForStep(step, seedNat.toString());
        nodes.push(`<path class="p${role}" fill="${rotated[role]}" style="animation-delay:-${phase}s" d="${group.path}"/>`);
      }
    }
    nodes.push("</svg>");
    return nodes.join("");
  }

  root.NeonWeatherGen = { renderSVG, roleAt, buildPalette, propertiesFor, palettes: MOODS, tempos: TEMPOS };
})(window);
