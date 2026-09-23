// PEC — scroll-driven Earth fly-through hero.
// Whole globe -> camera flies to Japan (36N, 138E) as the user scrolls.
// Falls back to a static hero (no pinning, no canvas) on WebGL failure,
// load timeout, or when the page has no JS at all.

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(function () {
  "use strict";

  var wrapEl = document.getElementById("hero3dWrap");
  var stickyEl = document.getElementById("hero3dSticky");
  var canvasEl = document.getElementById("hero3dCanvas");
  var loadingEl = document.getElementById("hero3dLoading");
  var textEl = document.getElementById("hero3dText");
  var cueEl = document.getElementById("hero3dCue");
  if (!wrapEl || !stickyEl || !canvasEl) return;

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var GLOBE_R = 1;
  var CLOUD_R = GLOBE_R * 1.012;
  var GLOW_R = GLOBE_R * 1.06;
  var JAPAN_LAT = 36;
  var JAPAN_LON = 138;
  var NAVY = 0x0a1524;

  var fallbackActivated = false;
  var fallbackTimer = null;
  var started = false;
  var paused = false;
  var rafId = null;
  var lastT = 0;
  var progress = 0;
  var mouseTarget = { x: 0, y: 0 };
  var mouseEased = { x: 0, y: 0 };
  var parallaxOffset = new THREE.Vector3();
  var parallaxStrength = 0.16;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function smoothstep(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function latLonToVector3(lat, lon, radius) {
    var phi = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  function slerpDir(a, b, t) {
    var qFull = new THREE.Quaternion().setFromUnitVectors(a, b);
    var qT = new THREE.Quaternion().identity().slerp(qFull, t);
    return a.clone().applyQuaternion(qT).normalize();
  }

  function activateFallback() {
    if (fallbackActivated) return;
    fallbackActivated = true;
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    wrapEl.classList.add("hero3d-fallback");
    if (loadingEl) loadingEl.classList.add("is-hidden");
    if (textEl) { textEl.style.opacity = ""; textEl.style.transform = ""; }
    try { if (renderer) renderer.dispose(); } catch (e) {}
  }

  // ---------- Scene ----------
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) {
    activateFallback();
    return;
  }
  if (!renderer) { activateFallback(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(NAVY);
  scene.fog = new THREE.Fog(NAVY, 5, 11);

  var camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  camera.position.set(0, 0, 4.6);

  var ambient = new THREE.AmbientLight(0x5a6a85, 0.6);
  var sun = new THREE.DirectionalLight(0xfff2df, 2.15);
  sun.position.set(5, 2.2, 4);
  scene.add(ambient, sun);

  var globeGroup = new THREE.Group();
  scene.add(globeGroup);

  var globeGeo = new THREE.SphereGeometry(GLOBE_R, 64, 64);
  var globeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.05 });
  var globeMesh = new THREE.Mesh(globeGeo, globeMat);
  globeGroup.add(globeMesh);

  var cloudGeo = new THREE.SphereGeometry(CLOUD_R, 48, 48);
  var cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, roughness: 1, metalness: 0
  });
  var cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  globeGroup.add(cloudMesh);

  var glowMat = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0xc9ad6e) },
      glowOpacity: { value: 0.9 }
    },
    vertexShader: [
      "varying vec3 vNormal;",
      "varying vec3 vViewDir;",
      "void main() {",
      "  vNormal = normalize(normalMatrix * normal);",
      "  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);",
      "  vViewDir = normalize(-mvPosition.xyz);",
      "  gl_Position = projectionMatrix * mvPosition;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "varying vec3 vNormal;",
      "varying vec3 vViewDir;",
      "uniform vec3 glowColor;",
      "uniform float glowOpacity;",
      "void main() {",
      "  float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.8);",
      "  gl_FragColor = vec4(glowColor, fresnel * glowOpacity);",
      "}"
    ].join("\n"),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide
  });
  var glowMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOW_R, 48, 48), glowMat);
  globeGroup.add(glowMesh);

  function buildStars() {
    var count = 1200;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var r = 18 + Math.random() * 42;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.045, sizeAttenuation: true,
      transparent: true, opacity: 0.75, fog: false, depthWrite: false
    });
    return new THREE.Points(geo, mat);
  }
  scene.add(buildStars());

  var japanLocal = latLonToVector3(JAPAN_LAT, JAPAN_LON, GLOBE_R);
  var startDir = new THREE.Vector3(0.15, 0.08, 1).normalize();

  // ---------- Responsive framing ----------
  var framing = { distStart: 4.6, distEnd: 1.85, fov: 44 };
  function computeFraming(aspect) {
    var distStart = 4.6, distEnd = 1.85, fov = 44;
    if (aspect < 1) {
      var k = Math.min(1.9, 1 + (1 - aspect) * 1.15);
      distStart = 4.6 * k;
      distEnd = 1.85 * k;
      fov = 47;
    } else if (aspect < 1.35) {
      distStart = 4.2;
      distEnd = 1.75;
      fov = 45;
    }
    return { distStart: distStart, distEnd: distEnd, fov: fov };
  }

  function resize() {
    var w = stickyEl.clientWidth, h = stickyEl.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    var aspect = w / h;
    framing = computeFraming(aspect);
    camera.aspect = aspect;
    camera.fov = framing.fov;
    camera.updateProjectionMatrix();
  }

  function updateCamera() {
    var japanWorld = japanLocal.clone().applyQuaternion(globeGroup.quaternion).normalize();
    var eased = easeInOutCubic(progress);
    var dir = slerpDir(startDir, japanWorld, eased);
    var dist = THREE.MathUtils.lerp(framing.distStart, framing.distEnd, eased);
    var target = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(0, 0, 0),
      japanWorld.clone().multiplyScalar(GLOBE_R),
      eased
    );
    camera.position.copy(dir.multiplyScalar(dist)).add(parallaxOffset);
    camera.lookAt(target);
  }

  function updateOverlay() {
    if (!textEl) return;
    var reveal = smoothstep(0.5, 0.82, progress);
    textEl.style.opacity = String(reveal);
    textEl.style.transform = "translateY(" + (18 * (1 - reveal)) + "px)";
    if (cueEl) cueEl.style.opacity = String(1 - smoothstep(0, 0.06, progress));
  }

  function computeProgress() {
    var rect = wrapEl.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
    updateOverlay();
  }

  var scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () { computeProgress(); scrollTicking = false; });
  }

  var resizeTicking = false;
  function onResize() {
    if (resizeTicking) return;
    resizeTicking = true;
    requestAnimationFrame(function () { resize(); computeProgress(); resizeTicking = false; });
  }

  function onMouseMove(e) {
    mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
  }

  var IDLE_SPEED = 0.045;
  var IDLE_CLOUD_EXTRA = 0.018;

  function animate(t) {
    var dt = clamp((t - lastT) / 1000, 0, 0.05);
    lastT = t;

    var slow = 1 - Math.min(progress, 1) * 0.85;
    globeGroup.rotation.y += IDLE_SPEED * slow * dt;
    cloudMesh.rotation.y += IDLE_CLOUD_EXTRA * dt;

    var ease = Math.min(1, dt * 3);
    mouseEased.x += (mouseTarget.x - mouseEased.x) * ease;
    mouseEased.y += (mouseTarget.y - mouseEased.y) * ease;
    parallaxOffset.set(mouseEased.x * parallaxStrength, -mouseEased.y * parallaxStrength * 0.6, 0);

    updateCamera();
    renderer.render(scene, camera);

    if (!paused) rafId = requestAnimationFrame(animate);
  }

  function onReady() {
    if (fallbackActivated) return;
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    resize();

    if (reducedMotion) {
      wrapEl.classList.add("hero3d-static");
      progress = 0.32;
      updateCamera();
      renderer.render(scene, camera);
      if (loadingEl) loadingEl.classList.add("is-hidden");
      return;
    }

    started = true;
    computeProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        paused = !entries[0].isIntersecting;
        if (!paused && !rafId) { lastT = performance.now(); rafId = requestAnimationFrame(animate); }
      }, { threshold: 0 });
      io.observe(wrapEl);
    }

    if (loadingEl) loadingEl.classList.add("is-hidden");
    lastT = performance.now();
    rafId = requestAnimationFrame(animate);
  }

  var manager = new THREE.LoadingManager();
  manager.onLoad = onReady;
  manager.onError = function () { activateFallback(); };
  var loader = new THREE.TextureLoader(manager);
  var dayTex = loader.load("assets/textures/earth-day.jpg");
  dayTex.colorSpace = THREE.SRGBColorSpace;
  var cloudTex = loader.load("assets/textures/earth-clouds.png");
  globeMat.map = dayTex;
  cloudMat.map = cloudTex;

  fallbackTimer = setTimeout(activateFallback, 9000);
})();
