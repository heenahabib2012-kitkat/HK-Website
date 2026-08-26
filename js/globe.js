(() => {
  "use strict";
  const canvas = document.getElementById("globeCanvas");
  const fallback = document.getElementById("globeFallback");
  const section = document.getElementById("expertise");
  if (!canvas || !section) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const showFallback = () => {
    canvas.remove();
    if (fallback) fallback.hidden = false;
  };

  if (typeof window.THREE === "undefined") { showFallback(); return; }

  let gl;
  try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  } catch (e) { gl = null; }
  if (!gl) { showFallback(); return; }

  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  const RADIUS = 2.1;

  // Base sphere: faint dotted lattice
  const dotsGeom = new THREE.IcosahedronGeometry(RADIUS, 5);
  const dotsMat = new THREE.PointsMaterial({
    color: 0x6b6459,
    size: 0.014,
    transparent: true,
    opacity: 0.55,
  });
  globeGroup.add(new THREE.Points(dotsGeom, dotsMat));

  // Thin wireframe shell for structure
  const shellGeom = new THREE.IcosahedronGeometry(RADIUS, 2);
  const shellMat = new THREE.MeshBasicMaterial({
    color: 0x26241f,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });
  globeGroup.add(new THREE.Mesh(shellGeom, shellMat));

  // 43 markers — a seeded, evenly distributed set of points on the sphere.
  // These represent the scale of his reach (43 countries), NOT a claim
  // about which specific countries they are.
  const MARKER_COUNT = 43;
  function seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  const rand = seededRandom(4207);
  const markerPositions = [];
  for (let i = 0; i < MARKER_COUNT; i++) {
    const u = rand(), v = rand();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = RADIUS * 1.012;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    markerPositions.push(new THREE.Vector3(x, y, z));
  }

  const markerGeom = new THREE.BufferGeometry().setFromPoints(markerPositions);
  const markerMat = new THREE.PointsMaterial({
    color: 0xc9a86a,
    size: 0.05,
    transparent: true,
    opacity: 0.95,
  });
  globeGroup.add(new THREE.Points(markerGeom, markerMat));

  // Great-circle arcs between a handful of marker pairs — a network, not a map claim.
  const arcGroup = new THREE.Group();
  globeGroup.add(arcGroup);
  const arcMat = new THREE.LineBasicMaterial({ color: 0xe6cf9c, transparent: true, opacity: 0.35 });

  function greatCircleArc(a, b, segments = 48) {
    const points = [];
    const start = a.clone().normalize();
    const end = b.clone().normalize();
    const angle = start.angleTo(end);
    const lift = 0.35;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const sinTotal = Math.sin(angle) || 1e-6;
      const w1 = Math.sin((1 - t) * angle) / sinTotal;
      const w2 = Math.sin(t * angle) / sinTotal;
      const p = start.clone().multiplyScalar(w1).add(end.clone().multiplyScalar(w2));
      const h = 1 + Math.sin(t * Math.PI) * lift * 0.15;
      p.multiplyScalar((RADIUS * 1.02 * h) / p.length());
      points.push(p);
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  const arcRand = seededRandom(918);
  const ARC_COUNT = 16;
  for (let i = 0; i < ARC_COUNT; i++) {
    const a = markerPositions[Math.floor(arcRand() * MARKER_COUNT)];
    const b = markerPositions[Math.floor(arcRand() * MARKER_COUNT)];
    if (a === b) continue;
    const line = new THREE.Line(greatCircleArc(a, b), arcMat);
    arcGroup.add(line);
  }

  globeGroup.rotation.x = 0.32;

  function resize() {
    const size = canvas.clientWidth || canvas.parentElement.clientWidth;
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // Drag to rotate (manual — no OrbitControls dependency)
  let isDragging = false, lastX = 0, lastY = 0;
  let autoRotate = !reduceMotion;
  const onDown = (x, y) => { isDragging = true; lastX = x; lastY = y; autoRotate = false; };
  const onMove = (x, y) => {
    if (!isDragging) return;
    const dx = x - lastX, dy = y - lastY;
    globeGroup.rotation.y += dx * 0.005;
    globeGroup.rotation.x = Math.max(-1.1, Math.min(1.1, globeGroup.rotation.x + dy * 0.005));
    lastX = x; lastY = y;
  };
  const onUp = () => { isDragging = false; };

  canvas.addEventListener("mousedown", (e) => onDown(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0]; onDown(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    const t = e.touches[0]; onMove(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchend", onUp);

  let inView = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { inView = e.isIntersecting; });
    }, { threshold: 0.05 }).observe(section);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!inView) return;
    if (autoRotate) globeGroup.rotation.y += 0.0016;
    renderer.render(scene, camera);
  }
  animate();
})();
