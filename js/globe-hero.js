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
  var wordmarkEl = document.getElementById("hero3dWordmark");
  if (!wrapEl || !stickyEl || !canvasEl) return;

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var GLOBE_R = 1;
  var CLOUD_R = GLOBE_R * 1.012;
  var JAPAN_LAT = 36;
  var JAPAN_LON = 138;
  var GLOBE_BG = 0xf4f4f1; // Tender White — kept in sync with --tender-white in css/style.css

  // Where Japan lands on screen once the camera arrives (see
  // applyScreenOffset): desktop/tablet pushes it into the right half of the
  // viewport so the title/text can sit directly on the page background on
  // the left, with no card behind it; mobile instead pushes it up so the
  // text can sit below it. MOBILE_BP matches the .hero3d-text breakpoint in
  // css/style.css.
  var JAPAN_SCREEN_X = 0.68;
  var JAPAN_SCREEN_Y_MOBILE = 0.22;
  var MOBILE_BP = 640;
  // Shifting fracY only crops *which* part of the (always same-size) sphere
  // is visible — it doesn't shrink it. On mobile the sphere's own apparent
  // diameter is otherwise large enough that pushing it up still leaves its
  // bottom edge overlapping the text below, so it's additionally pulled
  // back as the camera arrives (eased -> 1), mobile only, rest-state
  // framing untouched.
  var MOBILE_ARRIVAL_PULLBACK = 1.55;

  var fallbackActivated = false;
  var fallbackTimer = null;
  var ready = false;
  var started = false;
  var paused = false;
  var rafId = null;
  var sizeObserver = null;
  var io = null;
  var lastT = 0;
  var progress = 0;
  var targetProgress = 0;
  var PROGRESS_DAMPING = 6;
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
  var maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(GLOBE_BG);
  scene.fog = new THREE.Fog(GLOBE_BG, 5, 11);

  var camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  camera.position.set(0, 0, 4.6);

  // Lifted from the old dark-hero values: on a light (Tender White) backdrop,
  // shadowed ocean needs more fill or it reads as a harsh dark silhouette
  // edge against the white page instead of a shaded sphere.
  var ambient = new THREE.AmbientLight(0x8a94aa, 1.15);
  var sun = new THREE.DirectionalLight(0xfff2df, 2.1);
  scene.add(ambient, sun);

  var globeGroup = new THREE.Group();
  scene.add(globeGroup);

  var globeGeo = new THREE.SphereGeometry(GLOBE_R, 96, 96);
  var globeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0 });
  var globeMesh = new THREE.Mesh(globeGeo, globeMat);
  globeGroup.add(globeMesh);

  var cloudGeo = new THREE.SphereGeometry(CLOUD_R, 48, 48);
  var cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.68, depthWrite: false, roughness: 1, metalness: 0
  });
  var cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  globeGroup.add(cloudMesh);

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
  // distEnd is deliberately not as tight as it could be: any real web
  // texture starts looking soft once the camera is close enough to fill
  // the frame with a very small angular slice of the globe, so backing off
  // a bit keeps the final "arrival" close-up readable/crisp rather than
  // chasing a magnification level no reasonably-sized texture can satisfy.
  var framing = { distStart: 4.6, distEnd: 2.15, fov: 44 };
  function computeFraming(aspect) {
    var distStart = 4.6, distEnd = 2.15, fov = 44;
    if (aspect < 1) {
      var k = Math.min(1.9, 1 + (1 - aspect) * 1.15);
      distStart = 4.6 * k;
      distEnd = 2.15 * k;
      fov = 47;
    } else if (aspect < 1.35) {
      distStart = 4.2;
      distEnd = 2.05;
      fov = 45;
    }
    return { distStart: distStart, distEnd: distEnd, fov: fov };
  }

  var viewW = 0, viewH = 0;
  function resize() {
    var w = stickyEl.clientWidth, h = stickyEl.clientHeight;
    if (!w || !h) return;
    viewW = w; viewH = h;
    renderer.setSize(w, h, false);
    var aspect = w / h;
    framing = computeFraming(aspect);
    camera.aspect = aspect;
    camera.fov = framing.fov;
    camera.updateProjectionMatrix();
  }

  // One axis (full virtual size + offset within it) of an off-center
  // setViewOffset crop that lands the lookAt point at `frac` (0..1) along
  // that axis of the displayed viewport. For frac >= 0.5 the crop is
  // flush with the start of an enlarged virtual frame (offset 0); for
  // frac < 0.5 it has to be flush with the END instead, or the "virtual
  // frame" would need to be smaller than the real viewport, which
  // setViewOffset can't express.
  function offsetAxis(frac, dim) {
    if (frac >= 0.5) return { full: 2 * frac * dim, offset: 0 };
    return { full: 2 * (1 - frac) * dim, offset: dim * (1 - 2 * frac) };
  }

  // Shifts the rendered frame off-center (an asymmetric view frustum, the
  // same mechanism tiled/cinematic renderers use) instead of rotating the
  // camera or the lookAt target — rotating would throw off the lighting and
  // the great-circle fly-through itself. fracX/fracY are where the lookAt
  // point (Japan, once eased===1) should land as a fraction of the
  // viewport; 0.5/0.5 is dead center, i.e. today's unshifted framing.
  function applyScreenOffset(eased) {
    if (!viewW || !viewH) return;
    var isMobile = viewW <= MOBILE_BP;
    var fracX = isMobile ? 0.5 : THREE.MathUtils.lerp(0.5, JAPAN_SCREEN_X, eased);
    var fracY = isMobile ? THREE.MathUtils.lerp(0.5, JAPAN_SCREEN_Y_MOBILE, eased) : 0.5;
    var ax = offsetAxis(fracX, viewW);
    var ay = offsetAxis(fracY, viewH);
    camera.setViewOffset(ax.full, ay.full, ax.offset, ay.offset, viewW, viewH);
    camera.updateProjectionMatrix();
  }

  // The sun tracks this same direction (see updateSunDirection) rather than
  // sitting fixed in world space or parented to the camera at a fixed
  // offset. At progress 0, `dir` is always exactly `startDir` regardless of
  // how much the globe has idly spun (slerpDir(a, b, 0) === a), so the
  // at-rest lighting stays consistent; at progress 1, `dir` is exactly
  // `japanWorld`, so Japan is guaranteed to be the best-lit point on the
  // globe right as the camera arrives — without lighting the whole sphere
  // uniformly, since points away from `dir` still fall into shadow.
  var sunDir = new THREE.Vector3();

  function updateCamera() {
    var japanWorld = japanLocal.clone().applyQuaternion(globeGroup.quaternion).normalize();
    var eased = easeInOutCubic(progress);
    var dir = slerpDir(startDir, japanWorld, eased);
    updateSunDirection(dir);
    var dist = THREE.MathUtils.lerp(framing.distStart, framing.distEnd, eased);
    if (viewW && viewW <= MOBILE_BP) {
      dist *= THREE.MathUtils.lerp(1, MOBILE_ARRIVAL_PULLBACK, eased);
    }
    var target = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(0, 0, 0),
      japanWorld.clone().multiplyScalar(GLOBE_R),
      eased
    );
    camera.position.copy(dir.clone().multiplyScalar(dist)).add(parallaxOffset);
    camera.lookAt(target);
    applyScreenOffset(eased);
  }

  var sunUpRef = new THREE.Vector3(0, 1, 0);
  function updateSunDirection(dir) {
    // A modest fixed tilt off `dir` keeps natural-looking shading/terminator
    // variation elsewhere on the globe instead of a flat, uniformly-lit
    // look — small enough that the point `dir` itself stays comfortably lit.
    var right = new THREE.Vector3().crossVectors(sunUpRef, dir);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0); else right.normalize();
    var up = new THREE.Vector3().crossVectors(dir, right).normalize();
    sunDir.copy(dir).addScaledVector(right, 0.34).addScaledVector(up, 0.22).normalize();
    sun.position.copy(sunDir).multiplyScalar(6);
  }

  function updateOverlay() {
    if (!textEl) return;
    var reveal = smoothstep(0.5, 0.82, progress);
    textEl.style.opacity = String(reveal);
    textEl.style.transform = "translateY(" + (18 * (1 - reveal)) + "px)";
    if (cueEl) cueEl.style.opacity = String(1 - smoothstep(0, 0.06, progress));
    // Branding wordmark: fully visible at rest, faded out well before the
    // headline starts revealing (reveal starts at progress 0.5) so the two
    // never overlap or compete for attention.
    if (wordmarkEl) wordmarkEl.style.opacity = String(1 - smoothstep(0, 0.13, progress));
  }

  // Only updates the raw scroll-derived target — the visible `progress` is
  // eased toward it once per animation frame (see animate()) so camera
  // motion stays smooth regardless of how choppy the underlying scroll
  // events are (mouse-wheel steps vs. trackpad deltas).
  function computeProgress() {
    var rect = wrapEl.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    targetProgress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
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

  // Self-healing sizing: fires once as soon as the sticky container has a
  // settled layout (independent of when textures finish loading), and again
  // on any later box-size change — a font swap shifting layout, or a mobile
  // browser's address bar collapsing on first scroll (which changes 100vh
  // without necessarily firing a plain window "resize"). Without this, the
  // camera framing computed too early can silently go stale until something
  // else happens to trigger a resize.
  if ("ResizeObserver" in window) {
    sizeObserver = new ResizeObserver(function () {
      resize();
      if (!ready) return;
      if (reducedMotion) {
        // No render loop in this path — reframe immediately.
        updateCamera();
        renderer.render(scene, camera);
      } else {
        computeProgress();
      }
    });
    sizeObserver.observe(stickyEl);
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

    // Ease the visible scroll progress toward the raw target every frame
    // (framerate-independent damping) instead of snapping straight to
    // whatever the last scroll event reported — this is what keeps the
    // camera fly-through fluid on both bursty wheel ticks and continuous
    // trackpad deltas.
    progress = THREE.MathUtils.damp(progress, targetProgress, PROGRESS_DAMPING, dt);

    var slow = 1 - Math.min(progress, 1) * 0.85;
    globeGroup.rotation.y += IDLE_SPEED * slow * dt;
    cloudMesh.rotation.y += IDLE_CLOUD_EXTRA * dt;

    var ease = Math.min(1, dt * 3);
    mouseEased.x += (mouseTarget.x - mouseEased.x) * ease;
    mouseEased.y += (mouseTarget.y - mouseEased.y) * ease;
    parallaxOffset.set(mouseEased.x * parallaxStrength, -mouseEased.y * parallaxStrength * 0.6, 0);

    updateCamera();
    updateOverlay();
    renderer.render(scene, camera);

    // Clearing rafId here (rather than leaving it holding a stale,
    // already-fired id) is what lets the IntersectionObserver below
    // correctly detect "the loop isn't running" and restart it when the
    // hero scrolls back into view — otherwise scrolling back up after the
    // hero had scrolled fully out of view left the canvas frozen forever.
    if (!paused) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  }

  function finalizeReady() {
    if (fallbackActivated) return;
    resize();
    ready = true;
    // Hidden as early as possible: nothing past this point should be able
    // to leave the loading overlay stuck in front of a working scene, even
    // if something later in this function throws.
    if (loadingEl) loadingEl.classList.add("is-hidden");

    if (reducedMotion) {
      wrapEl.classList.add("hero3d-static");
      progress = 0.32;
      updateCamera();
      renderer.render(scene, camera);
      return;
    }

    started = true;
    computeProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (entries) {
        paused = !entries[0].isIntersecting;
        if (!paused && !rafId) { lastT = performance.now(); rafId = requestAnimationFrame(animate); }
      }, { threshold: 0 });
      io.observe(wrapEl);
    }

    lastT = performance.now();
    rafId = requestAnimationFrame(animate);
  }

  function onReady() {
    if (fallbackActivated) return;
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    // Defer past the current layout/paint pass before taking the first
    // authoritative size measurement and render. Textures can finish
    // decoding before the browser has settled the page's first layout on a
    // hard refresh, which previously left the camera framed for a stale
    // size (globe off-center, scroll cue not yet reflecting progress) until
    // an unrelated resize happened to fix it.
    requestAnimationFrame(function () {
      requestAnimationFrame(finalizeReady);
    });
  }

  var manager = new THREE.LoadingManager();
  manager.onLoad = onReady;
  manager.onError = function () { activateFallback(); };
  var loader = new THREE.TextureLoader(manager);
  // Single high-resolution day map (native 5400x2700) loaded up front and
  // used for the whole fly-through: swapping in a sharper texture mid-scroll
  // (the previous behavior) left the globe visibly blurry from the first
  // frame until the swap fired, and the swap itself caused a visible pop.
  // The loading bar already gates first paint on this finishing, so there's
  // no soft/blurry period to begin with.
  var dayTex = loader.load("assets/textures/earth-day-hires.jpg");
  dayTex.colorSpace = THREE.SRGBColorSpace;
  dayTex.anisotropy = maxAnisotropy;
  var cloudTex = loader.load("assets/textures/earth-clouds.png");
  cloudTex.anisotropy = maxAnisotropy;
  globeMat.map = dayTex;
  cloudMat.map = cloudTex;

  fallbackTimer = setTimeout(activateFallback, 9000);

  // ---------- #japan deep link ----------
  // The hero has no real anchor target (it's one pinned element the whole
  // way through), so a normal <a href="index.html#japan"> can't jump to
  // "the Japan moment" on its own. Instead, on that hash we compute the
  // scroll position that corresponds to a progress value deep into the
  // reveal (text fully shown, wordmark long faded) and scroll there
  // directly; the camera then eases to match via the normal animate()
  // loop. In reduced-motion/fallback modes the text is already shown at
  // rest with no scroll-driven camera, so this just scrolls the hero into
  // view instead of computing a progress-based offset.
  var JAPAN_STAGE_PROGRESS = 0.88;
  function scrollToJapanStage() {
    if (fallbackActivated || reducedMotion) {
      wrapEl.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    var wrapTop = wrapEl.getBoundingClientRect().top + window.scrollY;
    var total = wrapEl.offsetHeight - window.innerHeight;
    if (total <= 0) { wrapEl.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    window.scrollTo({ top: wrapTop + JAPAN_STAGE_PROGRESS * total, behavior: "smooth" });
  }
  function maybeScrollToJapanStage() {
    if (location.hash !== "#japan") return;
    if (ready || fallbackActivated) { scrollToJapanStage(); return; }
    setTimeout(maybeScrollToJapanStage, 150);
  }
  maybeScrollToJapanStage();
  window.addEventListener("hashchange", function () {
    if (location.hash === "#japan") scrollToJapanStage();
  });

  // ---------- Cleanup on navigation ----------
  // The JS realm is discarded on a real full-page navigation, but the
  // GPU-side WebGL context it holds isn't guaranteed to be reclaimed at
  // the same moment — browsers cap the number of live WebGL contexts per
  // process, and on fast repeat navigation (reload-testing, clicking
  // between pages quickly) a context that hasn't been explicitly released
  // yet can make the *next* page's renderer fail to initialize or stall.
  // forceContextLoss() releases the GPU resources synchronously instead of
  // waiting on garbage collection. pagehide (not beforeunload/unload, both
  // unreliable and bfcache-hostile) fires on every way of leaving the page.
  function disposeThreeResources() {
    if (rafId) { try { cancelAnimationFrame(rafId); } catch (e) {} rafId = null; }
    if (fallbackTimer) { try { clearTimeout(fallbackTimer); } catch (e) {} fallbackTimer = null; }
    try { window.removeEventListener("scroll", onScroll); } catch (e) {}
    try { window.removeEventListener("resize", onResize); } catch (e) {}
    try { window.removeEventListener("mousemove", onMouseMove); } catch (e) {}
    try { if (sizeObserver) sizeObserver.disconnect(); } catch (e) {}
    try { if (io) io.disconnect(); } catch (e) {}
    try { globeGeo.dispose(); globeMat.dispose(); } catch (e) {}
    try { cloudGeo.dispose(); cloudMat.dispose(); } catch (e) {}
    try { if (dayTex) dayTex.dispose(); } catch (e) {}
    try { if (cloudTex) cloudTex.dispose(); } catch (e) {}
    try { renderer.dispose(); } catch (e) {}
    try { if (renderer.forceContextLoss) renderer.forceContextLoss(); } catch (e) {}
  }
  window.addEventListener("pagehide", disposeThreeResources);
})();
