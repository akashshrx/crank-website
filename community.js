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
    // 3. Murmuration Flocking System (Leader + 17 Follower Planes = 18 Total)
    //    Wide organic 3D starling cloud arrangement around the leader.
    // ----------------------------------------------------
    const FLOCK_SIZE = 18;
    const flock = [];

    // Leader Plane
    const leaderMesh = createPaperPlaneMesh(0);
    const leaderScale = 0.437;
    leaderMesh.scale.set(leaderScale, leaderScale, leaderScale);
    scene.add(leaderMesh);

    flock.push({
      mesh: leaderMesh,
      isLeader: true,
      pos: new THREE.Vector3(0.8, 0.4, 2.2),
      targetPos: new THREE.Vector3(0.8, 0.4, 2.2),
      prevPos: new THREE.Vector3(0.8, 0.4, 2.2),
      scale: leaderScale,
      offset: new THREE.Vector3(0, 0, 0),
      currentBank: 0
    });

    // Followers: Wide organic 3D spatial distribution (cloud murmuration, NOT a line)
    for (let i = 1; i < FLOCK_SIZE; i++) {
      const mesh = createPaperPlaneMesh(i);
      const scale = 0.172 + Math.random() * 0.187;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Organic wide 3D spatial distribution
      const radius = 1.8 + Math.random() * 3.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.85;

      const offsetX = Math.cos(theta) * radius * 1.7;
      const offsetY = Math.sin(phi) * radius * 1.25;
      const offsetZ = -(1.0 + Math.random() * 5.0);

      flock.push({
        mesh: mesh,
        isLeader: false,
        pos: new THREE.Vector3(offsetX, offsetY, offsetZ),
        targetPos: new THREE.Vector3(),
        prevPos: new THREE.Vector3(),
        scale: scale,
        offset: new THREE.Vector3(offsetX, offsetY, offsetZ),
        wavePhaseX: Math.random() * Math.PI * 2,
        wavePhaseY: Math.random() * Math.PI * 2,
        waveSpeedX: 1.0 + Math.random() * 1.0,
        waveSpeedY: 0.8 + Math.random() * 1.0,
        waveAmpX: 0.45 + Math.random() * 0.45,
        waveAmpY: 0.35 + Math.random() * 0.45,
        lerpRate: 0.024 + Math.random() * 0.022,
        currentBank: 0
      });
    }

    // Smoothed heading matrix (yaw-only, no pitch/roll) to prevent follower morphing
    const headingMatrix = new THREE.Matrix4();
    const smoothedHeading = new THREE.Vector3(1, 0, 0);

    // ----------------------------------------------------
    // 4. Animation Loop — Wide Graceful Orbit + Cloud Murmuration
    // ----------------------------------------------------

    // Standardized Theme Color Presets
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

    const themeObserver = new MutationObserver(() => {
      if (isSelfUpdatingClass) return;
      const isNight = document.body.classList.contains('space-night-theme');
      setThemeSmooth(isNight);
    });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const clock = new THREE.Clock();
    let time = 0;

    // Reusable vectors
    const _sepForce = new THREE.Vector3();
    const _diff = new THREE.Vector3();

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      time += delta * 0.60;

      // Sync theme colors to shaders
      skyBackground.material.uniforms.uSkyColor.value.copy(activeThemeColors.topStart);
      skyBackground.material.uniforms.uSkyColorBottom.value.copy(activeThemeColors.bottomStart);
      skyBackground.material.uniforms.uStarOpacity.value = activeThemeColors.starOpacity;
      skyBackground.material.uniforms.uTime.value = time;
      dirLight.intensity = activeThemeColors.dirIntensity;
      ambientLight.color.copy(activeThemeColors.ambientColor);

      clouds.update(delta);

      // --- LEADER FLIGHT PATH ---
      // Wide, graceful orbit using golden-ratio irrational frequencies.
      // Sweeps across the full viewport: X ∈ [-4.5, 4.5], Y ∈ [-1.8, 1.8]
      const leader = flock[0];
      leader.prevPos.copy(leader.pos);

      leader.targetPos.x = Math.sin(time * 0.618) * 4.0 + Math.sin(time * 0.214) * 0.5;
      leader.targetPos.y = Math.sin(time * 0.407) * 1.4 + Math.cos(time * 0.253) * 0.4;
      leader.targetPos.z = 2.15 + Math.cos(time * 0.309) * 0.65 + Math.sin(time * 0.171) * 0.25;

      // Silky inertia lerp
      leader.pos.lerp(leader.targetPos, 0.035);
      leader.mesh.position.copy(leader.pos);

      // Analytical velocity for smooth forward orientation
      const velX = Math.cos(time * 0.618) * (4.0 * 0.618) + Math.cos(time * 0.214) * (0.5 * 0.214);
      const velY = Math.cos(time * 0.407) * (1.4 * 0.407) - Math.sin(time * 0.253) * (0.4 * 0.253);
      const velZ = -Math.sin(time * 0.309) * (0.65 * 0.309) + Math.cos(time * 0.171) * (0.25 * 0.171);
      const smoothVel = new THREE.Vector3(velX, velY, velZ).normalize();

      // Aerodynamic banking from centripetal acceleration
      const accelX = -Math.sin(time * 0.618) * (4.0 * 0.618 * 0.618);
      const targetBank = THREE.MathUtils.clamp(-accelX * 8.0, -0.5, 0.5);

      const lookTarget = new THREE.Vector3().addVectors(leader.pos, smoothVel);
      dummyLook.position.copy(leader.pos);
      dummyLook.lookAt(lookTarget);

      leader.currentBank += (targetBank - leader.currentBank) * 0.04;
      dummyLook.rotateOnAxis(new THREE.Vector3(0, 0, 1), leader.currentBank);
      leader.mesh.quaternion.slerp(dummyLook.quaternion, 0.045);

      // --- Build a YAW-ONLY heading matrix from the leader's XZ velocity ---
      // This prevents follower offsets from flipping wildly during pitch changes,
      // which was the root cause of planes morphing through each other.
      const flatVel = new THREE.Vector3(velX, 0, velZ).normalize();
      smoothedHeading.lerp(flatVel, 0.03).normalize();
      const headingAngle = Math.atan2(smoothedHeading.x, smoothedHeading.z);
      headingMatrix.makeRotationY(headingAngle);

      // --- FOLLOWER FLOCK (Wide 3D Cloud Murmuration) ---
      for (let i = 1; i < FLOCK_SIZE; i++) {
        const boid = flock[i];
        boid.prevPos.copy(boid.pos);

        // Organic harmonic weaving per boid
        const waveX = Math.sin(time * 0.5 * boid.waveSpeedX + boid.wavePhaseX) * boid.waveAmpX;
        const waveY = Math.cos(time * 0.38 * boid.waveSpeedY + boid.wavePhaseY) * boid.waveAmpY;
        const waveZ = Math.sin(time * 0.6 + boid.wavePhaseX * 0.5) * 0.35;

        // Compute local offset with weaving
        const localOffset = new THREE.Vector3(
          boid.offset.x + waveX,
          boid.offset.y + waveY,
          boid.offset.z + waveZ
        );

        // Transform by smoothed yaw-only heading (NOT full leader rotation)
        const worldOffset = localOffset.clone().applyMatrix4(headingMatrix);

        // Target = leader position + rotated offset
        const worldTarget = new THREE.Vector3().addVectors(leader.pos, worldOffset);

        // Soft separation force to prevent overlap
        _sepForce.set(0, 0, 0);
        for (let j = 0; j < FLOCK_SIZE; j++) {
          if (j === i) continue;
          const other = flock[j];
          _diff.subVectors(boid.pos, other.pos);
          const dist = _diff.length();
          const minDist = (boid.scale + other.scale) * 2.0;
          if (dist < minDist && dist > 0.001) {
            _diff.normalize().multiplyScalar((minDist - dist) * 0.12);
            _sepForce.add(_diff);
          }
        }
        worldTarget.add(_sepForce);

        // High-inertia fluid lerp
        boid.pos.lerp(worldTarget, boid.lerpRate);
        boid.mesh.position.copy(boid.pos);

        // Smooth rotation from frame velocity
        const boidVel = new THREE.Vector3().subVectors(boid.pos, boid.prevPos);
        if (boidVel.lengthSq() > 0.000001) {
          const boidLook = new THREE.Vector3().addVectors(boid.pos, boidVel);
          dummyLook.position.copy(boid.pos);
          dummyLook.lookAt(boidLook);

          const targetRoll = Math.sin(time * 0.45 + boid.wavePhaseX) * 0.22;
          boid.currentBank += (targetRoll - boid.currentBank) * 0.035;
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

