/* ============================================
   SipWise — Three.js Photorealistic Glass Carousel
   ES Module, zero local dependencies
   ============================================ */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

(function () {
  'use strict';

  // --- DOM refs ---
  const canvas = document.getElementById('glassCanvas');
  const container = document.getElementById('glassCanvasContainer');
  if (!canvas || !container) return;

  // --- WebGL detection ---
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    // No WebGL — show fallback
    const fb = document.getElementById('glassCanvasFallback');
    if (fb) fb.style.display = '';
    container.style.display = 'none';
    return;
  }
  const hasWebGL2 = !!canvas.getContext('webgl2');

  // --- Renderer ---
  // alpha: false with scene.background — transmission NEEDS a background to refract through.
  // CSS mask on the canvas container handles edge blending with the page.
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.8;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // --- Scene ---
  const scene = new THREE.Scene();
  // This background is CRITICAL for transmission glass to look clear.
  // Without it, transmission materials render white/opaque.
  scene.background = new THREE.Color(0x111630);

  // --- Procedural environment map ---
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();
  scene.environment = envMap;

  // --- Camera ---
  // Pulled back for smaller glass in the phone frame
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(0, 0.0, 7.6);
  camera.lookAt(0, -0.15, 0);

  // --- Lights (subtle studio setup — let env map do the heavy lifting) ---
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x88bbff, 0.6);
  rimLight.position.set(-3, 2, -4);
  scene.add(rimLight);

  const fillLight = new THREE.AmbientLight(0x404060, 0.3);
  scene.add(fillLight);

  // --- Reduced motion ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Materials ---

  function createGlassMaterial() {
    if (hasWebGL2) {
      return new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 1.0,
        transparent: true,
        opacity: 1.0,
        ior: 1.5,
        thickness: 0.4,
        specularIntensity: 1.0,
        specularColor: 0xffffff,
        envMapIntensity: 1.5,
        side: THREE.DoubleSide,
        depthWrite: false,
        attenuationColor: new THREE.Color(0xe8f0ff),
        attenuationDistance: 1.5,
      });
    }
    // WebGL1 fallback
    return new THREE.MeshPhongMaterial({
      color: 0xd0e0f0,
      transparent: true,
      opacity: 0.25,
      shininess: 100,
      specular: 0xffffff,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  function createLiquidMaterial(color, trans) {
    if (hasWebGL2) {
      return new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.0,
        roughness: 0.08,
        transmission: trans * 0.25,
        transparent: true,
        opacity: 0.95,
        ior: 1.36,
        thickness: 5.0,
        side: THREE.FrontSide,
        attenuationColor: new THREE.Color(color),
        attenuationDistance: 0.08,
        envMapIntensity: 0.8,
        specularIntensity: 0.4,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
      });
    }
    return new THREE.MeshPhongMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      shininess: 80,
      side: THREE.DoubleSide,
    });
  }

  const foamMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFAE6,
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.92,
  });

  // --- Glass profile definitions ---

  // Tulip pint — short foot, stem, bulbous bowl that narrows then flares at rim
  function pintProfile(inner) {
    const w = inner ? 0.025 : 0;
    const pts = [];
    // Base foot
    pts.push(new THREE.Vector2(0.00, -1.70));
    pts.push(new THREE.Vector2(0.38 - w, -1.70));
    pts.push(new THREE.Vector2(0.38 - w, -1.64));
    // Short stem
    pts.push(new THREE.Vector2(0.06 - w * 0.5, -1.64));
    pts.push(new THREE.Vector2(0.055 - w * 0.5, -1.10));
    // Bowl starts — expands into bulbous belly
    pts.push(new THREE.Vector2(0.12 - w, -0.95));
    pts.push(new THREE.Vector2(0.30 - w, -0.60));
    pts.push(new THREE.Vector2(0.46 - w, -0.15));
    pts.push(new THREE.Vector2(0.52 - w, 0.25));
    // Widest point of bowl
    pts.push(new THREE.Vector2(0.54 - w, 0.55));
    // Narrows inward
    pts.push(new THREE.Vector2(0.50 - w, 0.80));
    pts.push(new THREE.Vector2(0.46 - w, 0.95));
    // Flares out at rim
    pts.push(new THREE.Vector2(0.48 - w, 1.10));
    pts.push(new THREE.Vector2(0.52 - w, 1.30));
    return pts;
  }

  function wineProfile(inner) {
    const w = inner ? 0.025 : 0;
    const pts = [];
    // Base foot
    pts.push(new THREE.Vector2(0.00, -1.80));
    pts.push(new THREE.Vector2(0.48 - w, -1.80));
    pts.push(new THREE.Vector2(0.48 - w, -1.74));
    // Stem
    pts.push(new THREE.Vector2(0.055 - w * 0.5, -1.74));
    pts.push(new THREE.Vector2(0.045 - w * 0.5, -0.30));
    // Bowl
    pts.push(new THREE.Vector2(0.10 - w, -0.15));
    pts.push(new THREE.Vector2(0.42 - w, 0.25));
    pts.push(new THREE.Vector2(0.52 - w, 0.65));
    pts.push(new THREE.Vector2(0.50 - w, 0.95));
    pts.push(new THREE.Vector2(0.44 - w, 1.25));
    pts.push(new THREE.Vector2(0.38 - w, 1.50));
    return pts;
  }

  function cocktailProfile(inner) {
    const w = inner ? 0.025 : 0;
    const pts = [];
    // Base foot
    pts.push(new THREE.Vector2(0.00, -1.80));
    pts.push(new THREE.Vector2(0.44 - w, -1.80));
    pts.push(new THREE.Vector2(0.44 - w, -1.74));
    // Stem
    pts.push(new THREE.Vector2(0.05 - w * 0.5, -1.74));
    pts.push(new THREE.Vector2(0.05 - w * 0.5, -0.20));
    // V-cone
    pts.push(new THREE.Vector2(0.05 - w, -0.20));
    pts.push(new THREE.Vector2(0.72 - w, 1.00));
    return pts;
  }

  function champagneProfile(inner) {
    const w = inner ? 0.025 : 0;
    const pts = [];
    // Base foot
    pts.push(new THREE.Vector2(0.00, -1.80));
    pts.push(new THREE.Vector2(0.40 - w, -1.80));
    pts.push(new THREE.Vector2(0.40 - w, -1.74));
    // Stem
    pts.push(new THREE.Vector2(0.05 - w * 0.5, -1.74));
    pts.push(new THREE.Vector2(0.045 - w * 0.5, -0.50));
    // Flute bowl
    pts.push(new THREE.Vector2(0.08 - w, -0.38));
    pts.push(new THREE.Vector2(0.21 - w, 0.00));
    pts.push(new THREE.Vector2(0.24 - w, 0.50));
    pts.push(new THREE.Vector2(0.23 - w, 0.95));
    pts.push(new THREE.Vector2(0.21 - w, 1.30));
    pts.push(new THREE.Vector2(0.19 - w, 1.50));
    return pts;
  }

  // Stein profile — traditional Maßkrug: wide rounded belly, thick base, slight taper to rim
  function steinProfile(inner) {
    const w = inner ? 0.03 : 0;
    const pts = [];
    // Thick heavy base
    pts.push(new THREE.Vector2(0.00, -1.30));
    pts.push(new THREE.Vector2(0.55 - w, -1.30));
    pts.push(new THREE.Vector2(0.55 - w, -1.20));
    // Body — pronounced belly curve, widest in lower-middle
    pts.push(new THREE.Vector2(0.52 - w, -1.05));
    pts.push(new THREE.Vector2(0.56 - w, -0.70));
    pts.push(new THREE.Vector2(0.58 - w, -0.30));
    // Widest belly point
    pts.push(new THREE.Vector2(0.59 - w, 0.05));
    pts.push(new THREE.Vector2(0.58 - w, 0.35));
    // Tapers inward toward rim
    pts.push(new THREE.Vector2(0.55 - w, 0.65));
    pts.push(new THREE.Vector2(0.52 - w, 0.90));
    pts.push(new THREE.Vector2(0.50 - w, 1.05));
    // Rim flare
    pts.push(new THREE.Vector2(0.51 - w, 1.15));
    pts.push(new THREE.Vector2(0.53 - w, 1.25));
    return pts;
  }

  // --- Geometry builders ---

  function buildLiquidGeometry(innerProfile, fillFraction, segments) {
    const seg = segments || 48;
    const pts = [];
    const bowlStart = findBowlStart(innerProfile);
    const bowlPts = innerProfile.slice(bowlStart);
    if (bowlPts.length < 2) return null;

    const bowlMinY = bowlPts[0].y;
    const bowlMaxY = bowlPts[bowlPts.length - 1].y;
    const fillY = bowlMinY + (bowlMaxY - bowlMinY) * fillFraction;

    // Build liquid profile up to fill height
    pts.push(new THREE.Vector2(0, bowlMinY));
    for (let i = 0; i < bowlPts.length; i++) {
      if (bowlPts[i].y <= fillY) {
        pts.push(bowlPts[i].clone());
      } else {
        // Interpolate to exact fill height
        if (i > 0) {
          const prev = bowlPts[i - 1];
          const curr = bowlPts[i];
          const t = (fillY - prev.y) / (curr.y - prev.y);
          const x = prev.x + (curr.x - prev.x) * t;
          pts.push(new THREE.Vector2(x, fillY));
        }
        break;
      }
    }
    // Close top with center point
    pts.push(new THREE.Vector2(0, fillY));

    if (pts.length < 3) return null;
    return new THREE.LatheGeometry(pts, seg);
  }

  function findBowlStart(profile) {
    // Find the narrowest point (stem) in the profile, ignoring center (x=0) points
    let stemMinX = Infinity;
    let stemMinIdx = 0;
    for (let i = 0; i < profile.length; i++) {
      if (profile[i].x < stemMinX && profile[i].x > 0.001) {
        stemMinX = profile[i].x;
        stemMinIdx = i;
      }
    }

    // If narrowest point is wide (>0.3), it's a stein-type glass with no stem
    if (stemMinX > 0.3) return 0;

    // For stemmed glasses: from the stem minimum, walk forward to find where bowl widens
    for (let i = stemMinIdx + 1; i < profile.length; i++) {
      if (profile[i].x > stemMinX * 2.5) {
        return Math.max(stemMinIdx, i - 1);
      }
    }
    return stemMinIdx;
  }

  function buildFoamGeometry(innerProfile, fillFraction) {
    const bowlStart = findBowlStart(innerProfile);
    const bowlPts = innerProfile.slice(bowlStart);
    const bowlMinY = bowlPts[0].y;
    const bowlMaxY = bowlPts[bowlPts.length - 1].y;
    const fillY = bowlMinY + (bowlMaxY - bowlMinY) * fillFraction;

    // Find radius at fill height
    let radius = 0.3;
    for (let i = 1; i < bowlPts.length; i++) {
      if (bowlPts[i].y >= fillY) {
        const prev = bowlPts[i - 1];
        const curr = bowlPts[i];
        const t = (fillY - prev.y) / (curr.y - prev.y);
        radius = prev.x + (curr.x - prev.x) * t;
        break;
      }
    }

    const foamGeo = new THREE.CylinderGeometry(radius * 0.95, radius, 0.12, 32);
    foamGeo.translate(0, fillY + 0.06, 0);
    return foamGeo;
  }

  // --- Bubble particle system ---

  function createBubbles(innerProfile, fillFraction, count) {
    const bowlStart = findBowlStart(innerProfile);
    const bowlPts = innerProfile.slice(bowlStart);
    const bowlMinY = bowlPts[0].y;
    const bowlMaxY = bowlPts[bowlPts.length - 1].y;
    const fillY = bowlMinY + (bowlMaxY - bowlMinY) * fillFraction;
    const midRadius = 0.25;

    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * midRadius * 0.7;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = bowlMinY + Math.random() * (fillY - bowlMinY);
      positions[i * 3 + 2] = Math.sin(angle) * r;
      speeds[i] = 0.15 + Math.random() * 0.25;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { speeds, bowlMinY, fillY, midRadius };
    return points;
  }

  function updateBubbles(points, dt) {
    if (!points) return;
    const pos = points.geometry.attributes.position;
    const { speeds, bowlMinY, fillY, midRadius } = points.userData;

    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i);
      y += speeds[i] * dt;
      if (y > fillY) {
        y = bowlMinY;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * midRadius * 0.7;
        pos.setX(i, Math.cos(angle) * r);
        pos.setZ(i, Math.sin(angle) * r);
      }
      // Slight horizontal wobble
      pos.setX(i, pos.getX(i) + Math.sin(y * 10 + performance.now() * 0.001) * 0.0003);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }

  // --- Build complete glass models ---

  const GLASS_CONFIGS = [
    { name: 'pint', profile: pintProfile, liquidColor: 0xD4880A, liquidTrans: 0.3, fill: 0.75, hasFoam: true, hasBubbles: true, bubbleCount: 30 },
    { name: 'wine', profile: wineProfile, liquidColor: 0x6E0020, liquidTrans: 0.08, fill: 0.50, hasFoam: false, hasBubbles: false },
    { name: 'stein', profile: steinProfile, liquidColor: 0xB87D18, liquidTrans: 0.25, fill: 0.8, hasFoam: true, hasBubbles: true, bubbleCount: 25 },
    { name: 'cocktail', profile: cocktailProfile, liquidColor: 0x7B30C0, liquidTrans: 0.2, fill: 0.60, hasFoam: false, hasBubbles: false },
    { name: 'champagne', profile: champagneProfile, liquidColor: 0xD4B030, liquidTrans: 0.4, fill: 0.7, hasFoam: false, hasBubbles: true, bubbleCount: 40 },
  ];

  function buildSteinGroup() {
    const group = new THREE.Group();
    const glassMat = createGlassMaterial();
    const liquidMat = createLiquidMaterial(0xB87D18, 0.25);

    // Body — lathe geometry with rounded belly
    const outerPts = steinProfile(false);
    const innerPts = steinProfile(true);
    const bodyGeo = new THREE.LatheGeometry(outerPts, 48);
    const bodyMesh = new THREE.Mesh(bodyGeo, glassMat);
    group.add(bodyMesh);

    // Handle — D-shape attached to the side, bigger for the wider stein
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.53, 0.85, 0),
      new THREE.Vector3(0.85, 0.65, 0),
      new THREE.Vector3(0.95, 0.1, 0),
      new THREE.Vector3(0.85, -0.45, 0),
      new THREE.Vector3(0.53, -0.65, 0),
    ]);
    const handleGeo = new THREE.TubeGeometry(handleCurve, 24, 0.055, 8, false);
    const handleMesh = new THREE.Mesh(handleGeo, glassMat);
    group.add(handleMesh);

    // Liquid
    const liquidGeo = buildLiquidGeometry(innerPts, 0.8);
    if (liquidGeo) {
      const liqMesh = new THREE.Mesh(liquidGeo, liquidMat);
      group.add(liqMesh);
    }

    // Foam
    const foamGeo = buildFoamGeometry(innerPts, 0.8);
    if (foamGeo) {
      const foamMesh = new THREE.Mesh(foamGeo, foamMaterial);
      group.add(foamMesh);
    }

    // Bubbles
    const bubbles = createBubbles(innerPts, 0.8, 25);
    group.add(bubbles);
    group.userData.bubbles = bubbles;

    return group;
  }

  function buildGlassGroup(config) {
    if (config.name === 'stein') return buildSteinGroup();

    const group = new THREE.Group();
    const glassMat = createGlassMaterial();
    const liquidMat = createLiquidMaterial(config.liquidColor, config.liquidTrans);

    const outerPts = config.profile(false);
    const innerPts = config.profile(true);

    // Glass shell — single mesh, thickness handled by material
    const outerGeo = new THREE.LatheGeometry(outerPts, 64);
    const outerMesh = new THREE.Mesh(outerGeo, glassMat);
    group.add(outerMesh);

    // Liquid
    const liquidGeo = buildLiquidGeometry(innerPts, config.fill);
    if (liquidGeo) {
      const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
      group.add(liquidMesh);
    }

    // Foam
    if (config.hasFoam) {
      const foamGeo = buildFoamGeometry(innerPts, config.fill);
      if (foamGeo) {
        const foam = new THREE.Mesh(foamGeo, foamMaterial);
        group.add(foam);
      }
    }

    // Bubbles
    if (config.hasBubbles) {
      const bubbles = createBubbles(innerPts, config.fill, config.bubbleCount || 20);
      group.add(bubbles);
      group.userData.bubbles = bubbles;
    }

    return group;
  }

  // --- Pre-cache all 5 glass models ---
  const glassModels = [];
  for (let i = 0; i < GLASS_CONFIGS.length; i++) {
    const g = buildGlassGroup(GLASS_CONFIGS[i]);
    glassModels.push(g);
  }

  // Add first glass to scene
  let currentIndex = 0;
  scene.add(glassModels[0]);

  // Mark carousel as Three.js active (disables CSS float animation)
  const carousel = document.getElementById('glassCarousel');
  if (carousel) carousel.classList.add('threejs-active');

  // --- Swap glass model ---
  function swapGlass(newIndex) {
    if (newIndex === currentIndex) return;
    if (newIndex < 0 || newIndex >= glassModels.length) return;

    // Fade out
    canvas.classList.add('fading');

    setTimeout(function () {
      // Swap models
      scene.remove(glassModels[currentIndex]);
      scene.add(glassModels[newIndex]);
      currentIndex = newIndex;

      // Fade in
      canvas.classList.remove('fading');
    }, 250);
  }

  // --- Resize ---
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  const ro = new ResizeObserver(onResize);
  ro.observe(container);
  onResize();

  // --- Animation loop ---
  const clock = new THREE.Clock();
  let isRunning = true;

  function animate() {
    if (!isRunning) return;
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();
    const delta = clock.getDelta();
    const current = glassModels[currentIndex];

    if (current && !prefersReducedMotion) {
      // Slow Y-axis rotation only (~18s per revolution)
      current.rotation.y = elapsed * (Math.PI * 2 / 18);
    }

    // Update bubbles
    if (current && current.userData.bubbles) {
      updateBubbles(current.userData.bubbles, 0.016);
    }

    renderer.render(scene, camera);
  }

  animate();

  // --- Pause when tab hidden ---
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      isRunning = false;
      clock.stop();
    } else {
      isRunning = true;
      clock.start();
      animate();
    }
  });

  // --- Public API ---
  window.sipwiseGlass = {
    swapGlass: swapGlass,
    dispose: function () {
      isRunning = false;
      ro.disconnect();
      renderer.dispose();
      envMap.dispose();
      glassModels.forEach(function (g) {
        g.traverse(function (child) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        });
      });
    }
  };

})();
