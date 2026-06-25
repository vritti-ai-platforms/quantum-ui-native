// Generates the Material Symbols `name -> codepoint` map consumed by DynamicIcon.android.tsx,
// derived DIRECTLY from the bundled font so the map can never drift from the glyphs we ship.
//
// Source data: Google Material Symbols (the bundled MaterialSymbols_400Regular.ttf) — Apache-2.0.
// The map is parsed from that font; no third-party icon-data file is copied.
//
// How: the Material Symbols font encodes each icon two ways —
//   - a GSUB ligature whose component glyphs spell the icon name (e.g. a c c o u n t _ c i r c l e)
//     and whose result is the icon glyph, and
//   - a cmap entry mapping a private-use codepoint to that same icon glyph.
// We read the GSUB ligatures (name -> icon glyph) and the cmap (icon glyph -> codepoint),
// join them, and emit { name: codepoint }. DynamicIcon renders String.fromCharCode(codepoint).
//
// Run manually:  node scripts/generate-material-symbols-codepoints.mjs
// (Not wired into install hooks.)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FONT = path.join(__dirname, '..', 'lib', 'assets', 'fonts', 'MaterialSymbols_400Regular.ttf');
const OUT = path.join(__dirname, '..', 'lib', 'components', 'DynamicIcon', 'materialSymbols.codepoints.json');

const buf = fs.readFileSync(FONT);
const u16 = (o) => buf.readUInt16BE(o);
const u32 = (o) => buf.readUInt32BE(o);

// --- table directory ---
function findTable(tag) {
  const num = u16(4);
  for (let i = 0; i < num; i++) {
    const r = 12 + i * 16;
    if (buf.toString('ascii', r, r + 4) === tag) return { offset: u32(r + 8), length: u32(r + 12) };
  }
  return null;
}

// --- cmap: codepoint -> glyphId (formats 4 and 12) ---
function parseCmap() {
  const { offset: cm } = findTable('cmap');
  const n = u16(cm + 2);
  let best = null;
  let bestScore = -1;
  for (let i = 0; i < n; i++) {
    const r = cm + 4 + i * 8;
    const plat = u16(r);
    const enc = u16(r + 2);
    const sub = cm + u32(r + 4);
    const fmt = u16(sub);
    // prefer Unicode full (3,10 fmt12), then BMP (3,1 fmt4 / 0,3)
    const score = plat === 3 && enc === 10 ? 4 : plat === 3 && enc === 1 ? 3 : plat === 0 ? 2 : 1;
    if ((fmt === 4 || fmt === 12) && score > bestScore) {
      best = { sub, fmt };
      bestScore = score;
    }
  }
  const map = new Map(); // codepoint -> glyph
  if (!best) return map;
  const { sub, fmt } = best;
  if (fmt === 12) {
    const groups = u32(sub + 12);
    for (let g = 0; g < groups; g++) {
      const r = sub + 16 + g * 12;
      const start = u32(r);
      const end = u32(r + 4);
      const startGid = u32(r + 8);
      for (let c = start; c <= end; c++) map.set(c, startGid + (c - start));
    }
  } else {
    const segX2 = u16(sub + 6);
    const segCount = segX2 / 2;
    const endO = sub + 14;
    const startO = endO + segX2 + 2;
    const deltaO = startO + segX2;
    const rangeO = deltaO + segX2;
    for (let s = 0; s < segCount; s++) {
      const end = u16(endO + s * 2);
      const start = u16(startO + s * 2);
      const delta = u16(deltaO + s * 2);
      const rangeOff = u16(rangeO + s * 2);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let gid;
        if (rangeOff === 0) gid = (c + delta) & 0xffff;
        else {
          const gi = rangeO + s * 2 + rangeOff + (c - start) * 2;
          gid = u16(gi);
          if (gid !== 0) gid = (gid + delta) & 0xffff;
        }
        if (gid !== 0) map.set(c, gid);
      }
    }
  }
  return map;
}

// --- Coverage table -> ordered list of covered glyphIds ---
function parseCoverage(o) {
  const fmt = u16(o);
  const out = [];
  if (fmt === 1) {
    const count = u16(o + 2);
    for (let i = 0; i < count; i++) out.push(u16(o + 4 + i * 2));
  } else {
    const count = u16(o + 2);
    for (let i = 0; i < count; i++) {
      const r = o + 4 + i * 6;
      const start = u16(r);
      const end = u16(r + 2);
      for (let g = start; g <= end; g++) out.push(g);
    }
  }
  return out;
}

// --- GSUB: collect every ligature as { components:[glyphIds], result: glyphId } ---
function parseLigatures() {
  const { offset: gsub } = findTable('GSUB');
  const lookupListOff = gsub + u16(gsub + 8);
  const lookupCount = u16(lookupListOff);
  const ligatures = [];

  function readLigatureSubtable(sub) {
    // substFormat(2)=1, coverageOffset(2), ligSetCount(2), ligSetOffsets[]
    const covGlyphs = parseCoverage(sub + u16(sub + 2));
    const setCount = u16(sub + 4);
    for (let i = 0; i < setCount; i++) {
      const firstGlyph = covGlyphs[i];
      const setOff = sub + u16(sub + 6 + i * 2);
      const ligCount = u16(setOff);
      for (let j = 0; j < ligCount; j++) {
        const lig = setOff + u16(setOff + 2 + j * 2);
        const resultGlyph = u16(lig);
        const compCount = u16(lig + 2);
        const components = [firstGlyph];
        for (let k = 0; k < compCount - 1; k++) components.push(u16(lig + 4 + k * 2));
        ligatures.push({ components, result: resultGlyph });
      }
    }
  }

  for (let l = 0; l < lookupCount; l++) {
    const lookup = lookupListOff + u16(lookupListOff + 2 + l * 2);
    const type = u16(lookup);
    const subCount = u16(lookup + 4);
    for (let s = 0; s < subCount; s++) {
      let sub = lookup + u16(lookup + 6 + s * 2);
      if (type === 7) {
        // extension: substFormat(2)=1, extType(2), extOffset(4) rel to this subtable
        const extType = u16(sub + 2);
        const ext = sub + u32(sub + 4);
        if (extType === 4) readLigatureSubtable(ext);
      } else if (type === 4) {
        readLigatureSubtable(sub);
      }
    }
  }
  return ligatures;
}

// --- build the map ---
const cmap = parseCmap();
const glyphToCodepoint = new Map(); // icon glyph -> PUA codepoint
const glyphToChar = new Map(); // ascii glyph -> char (for spelling names)
for (const [cp, gid] of cmap) {
  if (cp >= 0xe000) {
    // private-use icon glyphs; keep the lowest codepoint per glyph for determinism
    if (!glyphToCodepoint.has(gid) || cp < glyphToCodepoint.get(gid)) glyphToCodepoint.set(gid, cp);
  } else if (cp < 0x3000) {
    glyphToChar.set(gid, String.fromCodePoint(cp));
  }
}

const result = {};
for (const { components, result: g } of parseLigatures()) {
  const cp = glyphToCodepoint.get(g);
  if (cp == null) continue;
  let name = '';
  let ok = true;
  for (const comp of components) {
    const ch = glyphToChar.get(comp);
    if (ch == null) {
      ok = false;
      break;
    }
    name += ch;
  }
  if (ok && name) result[name] = cp;
}

const sorted = Object.fromEntries(Object.keys(result).sort().map((k) => [k, result[k]]));
fs.writeFileSync(OUT, `${JSON.stringify(sorted, null, 0)}\n`);
console.log(`wrote ${Object.keys(sorted).length} Material Symbols codepoints → ${OUT}`);
