/**
 * community.js
 * Specialized 3D WebGL Background for the Glide Community Page.
 * Renders a breathtaking starling murmuration of 3D paper planes flying in fluid,
 * synchronized waves across the sky.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    canvas.style.opacity = '1';

    // ----------------------------------------------------
    // 1. Scene, Camera, Renderer & Lighting Setup
    // ----------------------------------------------------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Sky Background & Clouds (reused from sky.js)
    const skyBackground = new THREE.SkyBackground();
    scene.add(skyBackground);
    skyBackground.updateViewport(camera);

    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load(window.CLOUD_TEXTURE_BASE64 || 'cloud.png');
    const clouds = new THREE.Clouds(cloudTexture, skyBackground, camera);
    scene.add(clouds);

    // Dynamic 3D Lights
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(12, 20, 15);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.75);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.45);
    scene.add(hemiLight);

    // ----------------------------------------------------
    // 2. Paper Plane Factory (Reused Exact Home Page Model)
    // ----------------------------------------------------
    function createPaperTexture() {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 128;
      texCanvas.height = 128;
      const ctx = texCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        const alpha = Math.random() * 0.04;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(x, y, 1, 1);
      }
      const texture = new THREE.CanvasTexture(texCanvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
      return texture;
    }

    const sharedPaperTexture = createPaperTexture();

    // Palette of 18 Distinct Coordinated Color Pairs (Top Wing Tint, Bottom/Keel Shadow Tint)
    const PLANE_PALETTES = [
      { top: 0xffffff, bottom: 0x9fb2e8 }, // 0: Pure White / Periwinkle (Leader)
      { top: 0xe0f2fe, bottom: 0x7dd3fc }, // 1: Soft Sky Blue / Cyan Mist
      { top: 0xf3e8ff, bottom: 0xc084fc }, // 2: Pastel Lavender / Purple Shadow
      { top: 0xdcfce7, bottom: 0x86efac }, // 3: Soft Mint Ice / Emerald Shadow
      { top: 0xffedd5, bottom: 0xfdba74 }, // 4: Sunset Warm / Coral Amber
      { top: 0xfae8ff, bottom: 0xe879f9 }, // 5: Lilac Blush / Magenta Shadow
      { top: 0xe0e7ff, bottom: 0xa5b4fc }, // 6: Soft Indigo / Periwinkle Deep
      { top: 0xfef9c3, bottom: 0xfde047 }, // 7: Champagne Gold / Faint Sun
      { top: 0xccfbf1, bottom: 0x5eead4 }, // 8: Arctic Teal / Soft Aquamarine
      { top: 0xffe4e6, bottom: 0xf43f5e }, // 9: Coral Rose / Soft Pink Shadow
      { top: 0xf1f5f9, bottom: 0x94a3b8 }, // 10: Slate Pearl / Dusk Steel
      { top: 0xecfeff, bottom: 0x67e8f9 }, // 11: Electric Cyan / Lagoon Mist
      { top: 0xfdf4ff, bottom: 0xf5d0fe }, // 12: Orchid Mist / Faint Violet
      { top: 0xfff7ed, bottom: 0xffbed1 }, // 13: Peach Puff / Sunset Shadow
      { top: 0xede9fe, bottom: 0x8b5cf6 }, // 14: Royal Violet / Deep Amethyst
      { top: 0xf0fdf4, bottom: 0x4ade80 }, // 15: Spring Meadow / Soft Jade
      { top: 0xfef2f2, bottom: 0xfca5a5 }, // 16: Rose Quartz / Faint Red Shadow
      { top: 0xe0f2fe, bottom: 0x38bdf8 }  // 17: Deep Azure / Oceanic Shadow
    ];

    function createPaperPlaneMesh(index = 0) {
      const group = new THREE.Group();

      const palette = PLANE_PALETTES[index % PLANE_PALETTES.length];
      const topColor = palette.top;
      const bottomColor = palette.bottom;

      const nose = [0, 0, 2];
      const tail = [0, 0.15, -1.5];
      const leftTip = [-1.8, 0.4, -1.2];
      const rightTip = [1.8, 0.4, -1.2];
      const keel = [0, -0.6, -0.8];

      // Wings Geometry
      const wingsGeom = new THREE.BufferGeometry();
      const wingsVertices = new Float32Array([
        ...nose, ...leftTip, ...tail,
        ...nose, ...tail, ...rightTip
      ]);
      wingsGeom.setAttribute('position', new THREE.BufferAttribute(wingsVertices, 3));
      wingsGeom.computeVertexNormals();

      const topMat = new THREE.MeshPhongMaterial({
        color: topColor,
        flatShading: true,
        side: THREE.BackSide,
        map: sharedPaperTexture,
        bumpMap: sharedPaperTexture,
        bumpScale: 0.015,
        shininess: 6,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });
      group.add(new THREE.Mesh(wingsGeom, topMat));

      const bottomMat = new THREE.MeshPhongMaterial({
        color: bottomColor,
        flatShading: true,
        side: THREE.FrontSide,
        map: sharedPaperTexture,
        bumpMap: sharedPaperTexture,
        bumpScale: 0.015,
        shininess: 6,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      });
      group.add(new THREE.Mesh(wingsGeom, bottomMat));

      // Keel Geometry
      const keelGeom = new THREE.BufferGeometry();
      const keelVertices = new Float32Array([
        ...nose, ...tail, ...keel,
        ...nose, ...keel, ...tail
      ]);
      keelGeom.setAttribute('position', new THREE.BufferAttribute(keelVertices, 3));
      keelGeom.computeVertexNormals();

      const keelMat = new THREE.MeshPhongMaterial({
        color: bottomColor,
        flatShading: true,
        side: THREE.DoubleSide,
        map: sharedPaperTexture,
        bumpMap: sharedPaperTexture,
        bumpScale: 0.015,
        shininess: 6
      });
      group.add(new THREE.Mesh(keelGeom, keelMat));

      return group;
    }

    // Helper Object for Smooth Quaternion Slerp Rotations
    const dummyLook = new THREE.Object3D();

    // ----------------------------------------------------
    // 3. Serene Murmuration Flock (18 Planes — Time-Staggered Trail)
    // ----------------------------------------------------
    const FLOCK_SIZE = 18;
    const flock = [];

    // --- Gentle Lazy-8 Orbit Curve Function ---
    // Uses irrational frequency ratios (golden-ratio-related) so the path
    // never exactly repeats, creating an endlessly fresh, organic trajectory.
    // All values are bounded: X ∈ [-2.8, 2.8], Y ∈ [-1.1, 1.1], Z ∈ [1.4, 2.9]
    function orbitPosition(t) {
      const x = Math.sin(t * 0.618) * 2.4 + Math.sin(t * 0.214) * 0.35;
      const y = Math.sin(t * 0.407) * 0.85 + Math.cos(t * 0.253) * 0.25;
      const z = 2.15 + Math.cos(t * 0.309) * 0.55 + Math.sin(t * 0.171) * 0.2;
      return new THREE.Vector3(x, y, z);
    }

    // Analytical velocity (1st derivative) for smooth forward orientation
    function orbitVelocity(t) {
      const vx = Math.cos(t * 0.618) * (2.4 * 0.618) + Math.cos(t * 0.214) * (0.35 * 0.214);
      const vy = Math.cos(t * 0.407) * (0.85 * 0.407) - Math.sin(t * 0.253) * (0.25 * 0.253);
      const vz = -Math.sin(t * 0.309) * (0.55 * 0.309) + Math.cos(t * 0.171) * (0.2 * 0.171);
      return new THREE.Vector3(vx, vy, vz);
    }

    // Leader Plane
    const leaderMesh = createPaperPlaneMesh(0);
    const leaderScale = 0.437;
    leaderMesh.scale.set(leaderScale, leaderScale, leaderScale);
    scene.add(leaderMesh);

    flock.push({
      mesh: leaderMesh,
      isLeader: true,
      pos: orbitPosition(0).clone(),
      smoothPos: orbitPosition(0).clone(),
      prevPos: orbitPosition(0).clone(),
      scale: leaderScale,
      timeOffset: 0,
      lateralOffset: new THREE.Vector3(0, 0, 0),
      currentBank: 0
    });

    // Followers: each follows the SAME orbit curve but at a time delay,
    // plus a small unique lateral/vertical offset. This naturally prevents
    // collision because they trace the leader's historical path.
    for (let i = 1; i < FLOCK_SIZE; i++) {
      const mesh = createPaperPlaneMesh(i);
      const scale = 0.172 + Math.random() * 0.187;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Time delay: each follower trails behind
      const timeDelay = -(0.8 + (i * 0.35) + Math.random() * 0.6);

      // Small lateral offset perpendicular to the flight path
      const angle = (i / (FLOCK_SIZE - 1)) * Math.PI * 2 + Math.random() * 0.5;
      const lateralRadius = 0.15 + Math.random() * 0.35;
      const lateralOffset = new THREE.Vector3(
        Math.cos(angle) * lateralRadius,
        Math.sin(angle) * lateralRadius * 0.7,
        0
      );

      const startPos = orbitPosition(timeDelay);

      flock.push({
        mesh: mesh,
        isLeader: false,
        pos: startPos.clone(),
        smoothPos: startPos.clone(),
        prevPos: startPos.clone(),
        scale: scale,
        timeOffset: timeDelay,
        lateralOffset: lateralOffset,
        wavePhaseX: Math.random() * Math.PI * 2,
        wavePhaseY: Math.random() * Math.PI * 2,
        waveSpeed: 0.3 + Math.random() * 0.25,
        currentBank: 0
      });
    }

    // ----------------------------------------------------
    // 4. Animation Loop — Serene Orbit + Gentle Murmuration
    // ----------------------------------------------------
    
    // Standardized Theme Color Presets (Darker gradient end colors from home screen)
    const themes = {
      day: {
        topStart: new THREE.Color('#002d5a'),
        bottomStart: new THREE.Color('#005099'),
        starOpacity: 0.0,
        dirIntensity: 1.3,
        ambientColor: new THREE.Color('#dbeafe')
      },
      night: {
        topStart: new THREE.Color('#040a1c'),
        bottomStart: new THREE.Color('#0e1b38'),
        starOpacity: 1.0,
        dirIntensity: 0.8,
        ambientColor: new THREE.Color('#1e293b')
      }
    };

    const activeThemeColors = {
      topStart: themes.day.topStart.clone(),
      bottomStart: themes.day.bottomStart.clone(),
      starOpacity: 0.0,
      dirIntensity: 1.3,
      ambientColor: themes.day.ambientColor.clone()
    };

    const dayBtn = document.getElementById('theme-btn-day');
    const nightBtn = document.getElementById('theme-btn-night');

    let isSelfUpdatingClass = false;

    function setThemeSmooth(isNight) {
      const target = isNight ? themes.night : themes.day;
      if (typeof gsap !== 'undefined') {
        gsap.to(activeThemeColors.topStart, { r: target.topStart.r, g: target.topStart.g, b: target.topStart.b, duration: 2.2, ease: 'power2.out' });
        gsap.to(activeThemeColors.bottomStart, { r: target.bottomStart.r, g: target.bottomStart.g, b: target.bottomStart.b, duration: 2.2, ease: 'power2.out' });
        gsap.to(activeThemeColors, { starOpacity: target.starOpacity, dirIntensity: target.dirIntensity, duration: 2.2, ease: 'power2.out' });
        gsap.to(activeThemeColors.ambientColor, { r: target.ambientColor.r, g: target.ambientColor.g, b: target.ambientColor.b, duration: 2.2, ease: 'power2.out' });
      }
      isSelfUpdatingClass = true;
      if (isNight) {
        document.body.classList.add('space-night-theme');
        if (dayBtn) dayBtn.classList.remove('active');
        if (nightBtn) nightBtn.classList.add('active');
      } else {
        document.body.classList.remove('space-night-theme');
        if (dayBtn) dayBtn.classList.add('active');
        if (nightBtn) nightBtn.classList.remove('active');
      }
      requestAnimationFrame(() => { isSelfUpdatingClass = false; });
    }

    if (dayBtn) dayBtn.addEventListener('click', () => setThemeSmooth(false));
    if (nightBtn) nightBtn.addEventListener('click', () => setThemeSmooth(true));

    // Observe body class changes from external theme toggling (faq.js, etc.)
    const themeObserver = new MutationObserver(() => {
      if (isSelfUpdatingClass) return;
      const isNight = document.body.classList.contains('space-night-theme');
      setThemeSmooth(isNight);
    });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const clock = new THREE.Clock();
    let time = 0;

    // Reusable vectors to avoid per-frame allocations
    const _sepForce = new THREE.Vector3();
    const _diff = new THREE.Vector3();

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      time += delta * 0.55;

      // Sync theme colors to WebGL shaders & lights
      skyBackground.material.uniforms.uSkyColor.value.copy(activeThemeColors.topStart);
      skyBackground.material.uniforms.uSkyColorBottom.value.copy(activeThemeColors.bottomStart);
      skyBackground.material.uniforms.uStarOpacity.value = activeThemeColors.starOpacity;
      skyBackground.material.uniforms.uTime.value = time;
      dirLight.intensity = activeThemeColors.dirIntensity;
      ambientLight.color.copy(activeThemeColors.ambientColor);

      clouds.update(delta);

      // --- LEADER: Glide along the gentle orbit ---
      const leader = flock[0];
      leader.prevPos.copy(leader.smoothPos);

      const leaderTarget = orbitPosition(time);
      leader.smoothPos.lerp(leaderTarget, 0.04);
      leader.mesh.position.copy(leader.smoothPos);

      // Smooth forward orientation from analytical velocity
      const vel = orbitVelocity(time);
      const lookAt = new THREE.Vector3().addVectors(leader.smoothPos, vel.normalize());
      dummyLook.position.copy(leader.smoothPos);
      dummyLook.lookAt(lookAt);

      // Gentle aerodynamic banking proportional to lateral acceleration
      const accelX = -Math.sin(time * 0.618) * (2.4 * 0.618 * 0.618);
      const targetBank = THREE.MathUtils.clamp(-accelX * 12.0, -0.45, 0.45);
      leader.currentBank += (targetBank - leader.currentBank) * 0.03;
      dummyLook.rotateOnAxis(new THREE.Vector3(0, 0, 1), leader.currentBank);
      leader.mesh.quaternion.slerp(dummyLook.quaternion, 0.04);

      // --- FOLLOWERS: Time-staggered trail along same curve ---
      for (let i = 1; i < FLOCK_SIZE; i++) {
        const boid = flock[i];
        boid.prevPos.copy(boid.smoothPos);

        // Sample the orbit at the boid's personal time delay
        const boidTime = time + boid.timeOffset;
        const basePos = orbitPosition(boidTime);

        // Add gentle breathing micro-motion (subtle, personal wavering)
        const breathX = Math.sin(time * boid.waveSpeed + boid.wavePhaseX) * 0.12;
        const breathY = Math.cos(time * boid.waveSpeed * 0.7 + boid.wavePhaseY) * 0.08;

        // Compute flight-path-aligned lateral offset using local perpendicular frame
        const boidVel = orbitVelocity(boidTime).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(boidVel, worldUp).normalize();
        const up = new THREE.Vector3().crossVectors(right, boidVel).normalize();

        const targetPos = basePos.clone();
        targetPos.addScaledVector(right, boid.lateralOffset.x + breathX);
        targetPos.addScaledVector(up, boid.lateralOffset.y + breathY);

        // Soft separation force: gently push apart any boids that get too close
        _sepForce.set(0, 0, 0);
        for (let j = 0; j < FLOCK_SIZE; j++) {
          if (j === i) continue;
          const other = flock[j];
          _diff.subVectors(boid.smoothPos, other.smoothPos);
          const dist = _diff.length();
          const minDist = (boid.scale + other.scale) * 1.8;
          if (dist < minDist && dist > 0.001) {
            _diff.normalize().multiplyScalar((minDist - dist) * 0.15);
            _sepForce.add(_diff);
          }
        }
        targetPos.add(_sepForce);

        // Silky smooth inertia lerp
        boid.smoothPos.lerp(targetPos, 0.035);
        boid.mesh.position.copy(boid.smoothPos);

        // Smooth forward orientation from frame-to-frame velocity
        const boidFrameVel = new THREE.Vector3().subVectors(boid.smoothPos, boid.prevPos);
        if (boidFrameVel.lengthSq() > 0.0000001) {
          const boidLookAt = new THREE.Vector3().addVectors(boid.smoothPos, boidFrameVel.normalize());
          dummyLook.position.copy(boid.smoothPos);
          dummyLook.lookAt(boidLookAt);

          // Gentle personal banking
          const roll = Math.sin(time * 0.35 + boid.wavePhaseX) * 0.18;
          boid.currentBank += (roll - boid.currentBank) * 0.03;
          dummyLook.rotateOnAxis(new THREE.Vector3(0, 0, 1), boid.currentBank);

          boid.mesh.quaternion.slerp(dummyLook.quaternion, 0.04);
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    // ----------------------------------------------------
    // 5. Window Resize
    // ----------------------------------------------------
    function onResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      skyBackground.updateViewport(camera);
      clouds.resize(camera);
    }
    window.addEventListener('resize', onResize);
  });
})();

