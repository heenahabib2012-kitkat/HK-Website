/* Shared geometry helpers: turned (lathe) solids, boxes, spheres and bevelled extrusions.
   A Mesh carries positions, normals and any extra per-vertex attributes, whose current
   values are set with mesh.set(name, value) before adding triangles. */
export class Mesh {
  constructor(attrs = []) { this.pos = []; this.nrm = []; this.attrs = {}; this.state = {}; for (const a of attrs) { this.attrs[a] = []; this.state[a] = 0; } }
  set(name, value) { this.state[name] = value; return this; }
  v(p, n) {
    this.pos.push(p[0], p[1], p[2]); this.nrm.push(n[0], n[1], n[2]);
    for (const k in this.attrs) this.attrs[k].push(this.state[k]);
  }
  tri(a, b, c, na, nb, nc) { this.v(a, na); this.v(b, nb || na); this.v(c, nc || na); }
  get count() { return this.pos.length / 3; }
  /** Apply a matrix to every vertex added since index `from` (positions and normals). */
  transform(from, m) {
    for (let i = from; i < this.count; i++) {
      const p = this.pos, n = this.nrm, k = i * 3;
      const x = p[k], y = p[k + 1], z = p[k + 2];
      p[k] = m[0] * x + m[4] * y + m[8] * z + m[12];
      p[k + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
      p[k + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
      const a = n[k], b = n[k + 1], c = n[k + 2];
      n[k] = m[0] * a + m[4] * b + m[8] * c;
      n[k + 1] = m[1] * a + m[5] * b + m[9] * c;
      n[k + 2] = m[2] * a + m[6] * b + m[10] * c;
    }
    return this;
  }
}

export function arc(cx, cy, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

export function lathe(m, prof, { seg = 72, a0 = 0, a1 = Math.PI * 2, ox = 0, oy = 0, oz = 0 } = {}) {
  const sn = [];
  for (let i = 0; i < prof.length - 1; i++) {
    const dr = prof[i + 1][0] - prof[i][0], dy = prof[i + 1][1] - prof[i][1], l = Math.hypot(dr, dy) || 1;
    sn.push([dy / l, -dr / l]);
  }
  const endN = (i, k) => {
    const own = sn[i], other = sn[k === 0 ? i - 1 : i + 1];
    if (!other || own[0] * other[0] + own[1] * other[1] < 0.8) return own;
    const r = own[0] + other[0], y = own[1] + other[1], l = Math.hypot(r, y);
    return [r / l, y / l];
  };
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1], n0 = endN(i, 0), n1 = endN(i, 1);
    for (let s = 0; s < seg; s++) {
      const a = a0 + (s / seg) * (a1 - a0), b = a0 + ((s + 1) / seg) * (a1 - a0);
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const P = (r, y, c, s2) => [ox + r * c, oy + y, oz + r * s2];
      const Nn = (n, c, s2) => [n[0] * c, n[1], n[0] * s2];
      m.tri(P(r0, y0, ca, sa), P(r1, y1, ca, sa), P(r1, y1, cb, sb), Nn(n0, ca, sa), Nn(n1, ca, sa), Nn(n1, cb, sb));
      m.tri(P(r0, y0, ca, sa), P(r1, y1, cb, sb), P(r0, y0, cb, sb), Nn(n0, ca, sa), Nn(n1, cb, sb), Nn(n0, cb, sb));
    }
  }
}

export function sphere(m, cx, cy, cz, r) {
  lathe(m, arc(0, 0, r, -Math.PI / 2, Math.PI / 2, 10), { seg: 18, ox: cx, oy: cy, oz: cz });
}

export function box(m, x0, y0, z0, x1, y1, z1) {
  const f = (a, b, c, d, n) => { m.tri(a, b, c, n); m.tri(a, c, d, n); };
  f([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0]);
  f([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
  f([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
  f([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
  f([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
}

export function earClip(poly) {
  const idx = poly.map((_, i) => i), tris = [];
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const inside = (p, a, b, c) => cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
  let guard = 0;
  while (idx.length > 3 && guard++ < 800) {
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k - 1 + idx.length) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
      const a = poly[i0], b = poly[i1], c = poly[i2];
      if (cross(a, b, c) <= 0) continue;
      if (idx.some((j) => j !== i0 && j !== i1 && j !== i2 && inside(poly[j], a, b, c))) continue;
      tris.push([i0, i1, i2]); idx.splice(k, 1); break;
    }
  }
  tris.push(idx);
  return tris;
}

/** Extrusion of a CCW profile in the xy plane with a rounded (two-step) chamfer on both faces. */
export function extrudeProfile(m, poly, depth, bevel, zc = 0) {
  const n = poly.length;
  // inset each vertex along its averaged inward normal
  const inset = (d) => poly.map((p, i) => {
    const a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n];
    const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]];
    const l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [-e1[1] / l1, e1[0] / l1], n2 = [-e2[1] / l2, e2[0] / l2];
    let nx = n1[0] + n2[0], ny = n1[1] + n2[1]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const k = Math.min(2.2, 1 / Math.max(0.35, nx * n1[0] + ny * n1[1]));
    return [p[0] + nx * d * k, p[1] + ny * d * k];
  });
  const rings = [
    { pts: poly, z: depth / 2, t: 0 },
    { pts: inset(bevel * 0.45), z: depth / 2 + bevel * 0.75, t: 0.6 },
    { pts: inset(bevel), z: depth / 2 + bevel, t: 1 },
  ];
  const cap = rings[2].pts;
  for (const [a, b, c] of earClip(cap)) {
    m.tri([cap[a][0], cap[a][1], zc + rings[2].z], [cap[b][0], cap[b][1], zc + rings[2].z], [cap[c][0], cap[c][1], zc + rings[2].z], [0, 0, 1]);
    m.tri([cap[a][0], cap[a][1], zc - rings[2].z], [cap[c][0], cap[c][1], zc - rings[2].z], [cap[b][0], cap[b][1], zc - rings[2].z], [0, 0, -1]);
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a = poly[i], b = poly[j];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const out = [dy / l, -dx / l];
    m.tri([a[0], a[1], zc - depth / 2], [b[0], b[1], zc - depth / 2], [b[0], b[1], zc + depth / 2], [out[0], out[1], 0]);
    m.tri([a[0], a[1], zc - depth / 2], [b[0], b[1], zc + depth / 2], [a[0], a[1], zc + depth / 2], [out[0], out[1], 0]);
    for (let r = 0; r < 2; r++) {
      const A = rings[r], B = rings[r + 1];
      const tz = (A.t + B.t) / 2, nn = [out[0] * (1 - tz * 0.8), out[1] * (1 - tz * 0.8), 0.3 + tz * 0.7];
      const ln = Math.hypot(...nn), N = nn.map((v) => v / ln), Nb = [N[0], N[1], -N[2]];
      for (const s of [1, -1]) {
        const q = (P, k) => [P.pts[k][0], P.pts[k][1], zc + s * P.z];
        if (s > 0) { m.tri(q(A, i), q(A, j), q(B, j), N); m.tri(q(A, i), q(B, j), q(B, i), N); }
        else { m.tri(q(A, j), q(A, i), q(B, i), Nb); m.tri(q(A, j), q(B, i), q(B, j), Nb); }
      }
    }
  }
}
