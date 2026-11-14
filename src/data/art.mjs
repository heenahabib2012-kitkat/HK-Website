// Animated gold line drawings for the five services.
// Rendered inline (build token {{art <slot>}}). Paths with class "d" draw on when an
// ancestor has .is-play (see .art rules in main.css); --k staggers them.
// The frame's background (royal-blue gradient + fine grid) comes from CSS (.art-frame),
// so the drawing can sit centred in any aspect ratio.

const P = (d, k, cls = 'd') => `<path class="${cls}" pathLength="1" style="--k:${k}" d="${d}"/>`;

function storefront(k0) {
  return [
    P('M150 170 H250 V280 H150 Z', k0),
    P('M140 170 L152 148 H248 L260 170', k0 + 1),
    P('M188 280 V236 H212 V280', k0 + 2),
    P('M160 188 H182 V214 H160 Z', k0 + 3),
    P('M218 188 H240 V214 H218 Z', k0 + 3),
  ].join('');
}

const arts = {
  'svc-franchise': {
    label: 'One storefront faithfully repeated into the distance, connected by a single line',
    body() {
      const copies = [[-112, 26, 0.62], [112, 26, 0.62], [-178, 44, 0.4], [178, 44, 0.4]];
      let s = P('M24 286 H376', 0, 'd faint');
      s += `<g>${storefront(1)}</g>`;
      copies.forEach(([dx, dy, sc], i) => {
        const cx = 200 + dx, cy = 214 + dy;
        s += `<g transform="translate(${cx} ${cy}) scale(${sc}) translate(-200 -214)" style="--s:${sc}">${storefront(5 + i * 2)}</g>`;
      });
      s += P('M28 222 Q200 40 372 222', 12, 'd thread');
      s += '<circle class="pulse-dot" cx="200" cy="131" r="3.5"/>';
      return s;
    },
  },
  'svc-setup': {
    label: 'A company document drawn line by line and sealed with an official stamp',
    body() {
      return [
        P('M132 92 H246 L276 122 V306 H132 Z', 0),
        P('M246 92 V122 H276', 1),
        P('M156 146 H252', 2), P('M156 168 H252', 3), P('M156 190 H230', 4), P('M156 212 H246', 5),
        P('M156 246 H206', 6, 'd faint'),
        P('M236 262 m-28 0 a28 28 0 1 0 56 0 a28 28 0 1 0 -56 0', 8, 'd seal'),
        P('M236 262 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0', 9, 'd faint'),
        P('M225 262 L233 271 L249 252', 10, 'd tick'),
      ].join('') + '<circle class="ring-pulse" cx="236" cy="262" r="28"/>';
    },
  },
  'svc-ops': {
    label: 'A continuous process cycle of four stages around a checklist of standard procedures',
    body() {
      const R = 112, c = [200, 200];
      const pts = [0, 90, 180, 270].map((a) => { const r = ((a - 90) * Math.PI) / 180; return [c[0] + R * Math.cos(r), c[1] + R * Math.sin(r)]; });
      let s = P(`M200 88 A${R} ${R} 0 1 1 199.9 88`, 0, 'd faint');
      pts.forEach(([x, y], i) => {
        s += P(`M${x} ${y} m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0`, 1 + i);
        s += `<circle class="node-dot" cx="${x}" cy="${y}" r="3"/>`;
      });
      s += P('M174 178 H232', 6) + P('M174 200 H232', 7) + P('M174 222 H218', 8);
      s += P('M160 178 l4 4 l7 -8', 9, 'd tick') + P('M160 200 l4 4 l7 -8', 10, 'd tick') + P('M160 222 l4 4 l7 -8', 11, 'd tick');
      s += '<circle class="orbit" r="4"/><circle class="orbit orbit--2" r="4"/>';
      return s;
    },
  },
  'svc-brand': {
    label: 'A brand mark being designed: construction lines, the mark, then the lettering',
    body() {
      return [
        P('M200 70 V330', 0, 'd faint'), P('M70 200 H330', 0, 'd faint'),
        P('M200 200 m-118 0 a118 118 0 1 0 236 0 a118 118 0 1 0 -236 0', 1, 'd faint'),
        P('M200 200 m-73 0 a73 73 0 1 0 146 0 a73 73 0 1 0 -146 0', 2, 'd faint'),
        P('M118 118 L282 282 M282 118 L118 282', 2, 'd faint'),
        P('M200 200 m-92 0 a92 92 0 1 0 184 0 a92 92 0 1 0 -184 0', 4),
        P('M200 118 L282 200 L200 282 L118 200 Z', 5),
      ].join('') + '<text class="art-type" x="200" y="222" text-anchor="middle">Aa</text>';
    },
  },
  'svc-startup': {
    label: 'Steps rising to a flag, with a growth line climbing alongside',
    body() {
      return [
        P('M40 318 H360', 0, 'd faint'),
        P('M70 318 V282 H122 V246 H174 V210 H226 V174 H278 V138 H318', 1),
        P('M318 138 V78', 3), P('M318 80 L352 92 L318 104', 4),
        P('M66 292 C130 280 160 236 206 214 S290 150 340 112', 6, 'd thread'),
        P('M326 106 L342 110 L336 125', 7, 'd thread'),
      ].join('') + '<circle class="climber" r="3.6"/>';
    },
  },
};

export function art(slot) {
  const a = arts[slot];
  if (!a) throw new Error(`Unknown art slot: ${slot}`);
  return `<svg class="art art--${slot}" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${a.label}">
${a.body()}
</svg>`;
}
export const artSlots = Object.keys(arts);
