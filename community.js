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

    // Subtle Color Variations for Paper Plane Flock
    const TOP_TINTS = [
      0xffffff, // Pure white
      0xf2f7ff, // Soft ice white
      0xeaf3fe, // Faint sky pearl
      0xf7f9ff, // Clean paper white
      0xebf1fa, // Soft platinum blue
      0xf5f5fa  // Warm paper white
    ];

    const BOTTOM_TINTS = [
      0x9fb2e8, // Periwinkle base
      0x93a7e0, // Soft dusk blue
      0x8b9ed8, // Lavender-slate
      0xa5b7ee, // Bright sky shadow
      0x889cd4  // Deep periwinkle
    ];

    function createPaperPlaneMesh(index = 0) {
      const group = new THREE.Group();

      const topColor = TOP_TINTS[index % TOP_TINTS.length];
      const bottomColor = BOTTOM_TINTS[index % BOTTOM_TINTS.length];

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
    // ----------------------------------------------------
    const FLOCK_SIZE = 18;
    const flock = [];

    // Leader Plane
    const leaderMesh = createPaperPlaneMesh(0);
    const leaderScale = 0.364; // 30% larger (0.28 * 1.30)
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

    // Followers (17 Paper Planes - 30% larger, organic wide 3D starling cloud with subtle tints)
    for (let i = 1; i < FLOCK_SIZE; i++) {
      const mesh = createPaperPlaneMesh(i);
      const scale = 0.143 + Math.random() * 0.156; // 30% larger scale range for depth perspective
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Organic wide 3D spatial distribution (No rigid V-shape grid!)
      const radius = 1.8 + Math.random() * 3.2; // Spacious 3D radius spread
      const theta = Math.random() * Math.PI * 2; // Random angle around flight axis
      const phi = (Math.random() - 0.5) * Math.PI * 0.85; // Random vertical inclination

      const offsetX = Math.cos(theta) * radius * 1.7; // Wide lateral spread across screen
      const offsetY = Math.sin(phi) * radius * 1.25;  // Wide vertical spread
      const offsetZ = - (1.0 + Math.random() * 5.0); // Spacious trailing ribbon behind leader

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
        waveSpeedX: 0.8 + Math.random() * 0.8,
        waveSpeedY: 0.6 + Math.random() * 0.8,
        waveAmpX: 0.45 + Math.random() * 0.45,
        waveAmpY: 0.35 + Math.random() * 0.45,
        lerpRate: 0.018 + Math.random() * 0.018,
        currentBank: 0
      });
    }

    // ----------------------------------------------------
    // 4. Animation Loop & Gradual Bezier Motion Math
    // ----------------------------------------------------
    
    // Standardized Theme Color Presets (Matching app.js & faq.js)
    const themes = {
      day: {
        topStart: new THREE.Color('#70c4ff'),
        bottomStart: new THREE.Color('#bce3ff'),
        starOpacity: 0.0,
        dirIntensity: 1.3,
        ambientColor: new THREE.Color('#dbeafe')
      },
      night: {
        topStart: new THREE.Color('#09122c'),
        bottomStart: new THREE.Color('#1a295c'),
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

    // Standardized 2.2s GSAP Color Interpolation (Identical to Home Screen)
    function updateTheme(isNight, transition = true) {
      const target = isNight ? themes.night : themes.day;

      if (transition && typeof gsap !== 'undefined') {
        gsap.to(activeThemeColors.topStart, {
          r: target.topStart.r, g: target.topStart.g, b: target.topStart.b,
          duration: 2.2, ease: "power2.out"
        });
        gsap.to(activeThemeColors.bottomStart, {
          r: target.bottomStart.r, g: target.bottomStart.g, b: target.bottomStart.b,
          duration: 2.2, ease: "power2.out"
        });
        gsap.to(activeThemeColors, {
          starOpacity: target.starOpacity,
          dirIntensity: target.dirIntensity,
          duration: 2.2, ease: "power2.out"
        });
        gsap.to(activeThemeColors.ambientColor, {
          r: target.ambientColor.r, g: target.ambientColor.g, b: target.ambientColor.b,
          duration: 2.2, ease: "power2.out"
        });
      } else {
        activeThemeColors.topStart.copy(target.topStart);
        activeThemeColors.bottomStart.copy(target.bottomStart);
        activeThemeColors.starOpacity = target.starOpacity;
        activeThemeColors.dirIntensity = target.dirIntensity;
        activeThemeColors.ambientColor.copy(target.ambientColor);
      }

      const currentlyNight = document.body.classList.contains('space-night-theme');
      if (isNight !== currentlyNight) {
        isSelfUpdatingClass = true;
        if (isNight) {
          document.body.classList.add('space-night-theme');
        } else {
          document.body.classList.remove('space-night-theme');
        }
        setTimeout(() => { isSelfUpdatingClass = false; }, 50);
      }

      if (dayBtn) dayBtn.classList.toggle('active', !isNight);
      if (nightBtn) nightBtn.classList.toggle('active', isNight);
    }

    if (dayBtn) {
      dayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        updateTheme(false, true);
      });
    }

    if (nightBtn) {
      nightBtn.addEventListener('click', (e) => {
        e.preventDefault();
        updateTheme(true, true);
      });
    }

    // Initialize initial state based on current body class
    const initialNight = document.body.classList.contains('space-night-theme');
    updateTheme(initialNight, false);

    const themeObserver = new MutationObserver(() => {
      if (isSelfUpdatingClass) return;
      const isNight = document.body.classList.contains('space-night-theme');
      updateTheme(isNight, true);
    });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // ----------------------------------------------------
    // Silky Smooth, Gradual 3D Catmull-Rom Bezier Path Setup
    // ----------------------------------------------------
    const flightControlPoints = [
      new THREE.Vector3( -2.6,   0.4,  2.2 ),
      new THREE.Vector3( -1.5,   1.2,  2.6 ),
      new THREE.Vector3(  0.8,   1.4,  2.4 ),
      new THREE.Vector3(  2.6,   0.6,  2.0 ),
      new THREE.Vector3(  2.2,  -0.8,  2.2 ),
      new THREE.Vector3(  0.2,  -1.3,  2.6 ),
      new THREE.Vector3( -1.8,  -0.9,  2.5 ),
      new THREE.Vector3( -2.8,  -0.2,  2.1 )
    ];

    const leaderSpline = new THREE.CatmullRomCurve3(flightControlPoints, true, 'centripetal');

    const clock = new THREE.Clock();
    let time = 0;

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      time += delta * 0.45; // Relaxed, silky-smooth speed

      // Continuously sync GSAP-animated theme colors to WebGL Shaders & Lights
      skyBackground.material.uniforms.uSkyColor.value.copy(activeThemeColors.topStart);
      skyBackground.material.uniforms.uSkyColorBottom.value.copy(activeThemeColors.bottomStart);
      skyBackground.material.uniforms.uStarOpacity.value = activeThemeColors.starOpacity;
      skyBackground.material.uniforms.uTime.value = time;
      dirLight.intensity = activeThemeColors.dirIntensity;
      ambientLight.color.copy(activeThemeColors.ambientColor);

      clouds.update(delta);

      // --- LEADER FLIGHT TRAJECTORY (Ultra-Gradual 3D Catmull-Rom Bezier Path) ---
      const leader = flock[0];
      leader.prevPos.copy(leader.pos);

      // Loop progress along continuous closed Bezier curve (0.016 loopSpeed for sweeping majestic motion)
      const loopSpeed = 0.016;
      const pathProgress = (time * loopSpeed) % 1.0;

      // Sample position and forward tangent along the Bezier curve
      const splinePoint = leaderSpline.getPointAt(pathProgress);
      const splineTangent = leaderSpline.getTangentAt(pathProgress).normalize();

      leader.targetPos.copy(splinePoint);
      leader.pos.lerp(leader.targetPos, 0.025); // Heavy inertia smoothing (eliminates sudden speed jumps)
      leader.mesh.position.copy(leader.pos);

      // Orient leader along the smooth Bezier tangent vector
      const lookTarget = new THREE.Vector3().addVectors(leader.pos, splineTangent);
      dummyLook.position.copy(leader.pos);
      dummyLook.lookAt(lookTarget);

      // Calculate smooth aerodynamic banking roll based on curve curvature
      const nextProgress = (pathProgress + 0.008) % 1.0;
      const nextTangent = leaderSpline.getTangentAt(nextProgress).normalize();
      const crossBank = new THREE.Vector3().crossVectors(splineTangent, nextTangent);
      const targetBank = THREE.MathUtils.clamp(crossBank.y * 28.0, -0.55, 0.55);

      leader.currentBank += (targetBank - leader.currentBank) * 0.04;
      dummyLook.rotateOnAxis(new THREE.Vector3(0, 0, 1), leader.currentBank);
      leader.mesh.quaternion.slerp(dummyLook.quaternion, 0.04);

      // --- FOLLOWER FLOCK (Gradual Organic Weaving & High-Inertia Lerping) ---
      const leaderMatrix = leader.mesh.matrixWorld;

      for (let i = 1; i < FLOCK_SIZE; i++) {
        const boid = flock[i];
        boid.prevPos.copy(boid.pos);

        // Individualized 3D Organic Weaving Equations along Bezier path
        const waveX = Math.sin(pathProgress * 8.0 * boid.waveSpeedX + boid.wavePhaseX) * boid.waveAmpX;
        const waveY = Math.cos(pathProgress * 6.0 * boid.waveSpeedY + boid.wavePhaseY) * boid.waveAmpY;
        const waveZ = Math.sin(pathProgress * 9.0 + boid.wavePhaseX * 0.5) * 0.35;

        // Offset relative to leader's local coordinate frame
        const localOffset = new THREE.Vector3(
          boid.offset.x + waveX,
          boid.offset.y + waveY,
          boid.offset.z + waveZ
        );

        // Transform local offset to world space aligned with leader direction
        const worldTarget = localOffset.applyMatrix4(leaderMatrix);
        
        // High-inertia fluid position lerp (creates gradual, silky-smooth murmuration wave propagation)
        boid.pos.lerp(worldTarget, boid.lerpRate);
        boid.mesh.position.copy(boid.pos);

        // Smooth Quaternion Slerp for Follower Rotations
        const boidVel = new THREE.Vector3().subVectors(boid.pos, boid.prevPos);
        if (boidVel.lengthSq() > 0.000001) {
          const boidLook = new THREE.Vector3().addVectors(boid.pos, boidVel);
          dummyLook.position.copy(boid.pos);
          dummyLook.lookAt(boidLook);

          // Synchronized organic wing roll per boid
          const targetRoll = Math.sin(pathProgress * 6.0 + boid.wavePhaseX) * 0.22;
          boid.currentBank += (targetRoll - boid.currentBank) * 0.04;
          dummyLook.rotateOnAxis(new THREE.Vector3(0, 0, 1), boid.currentBank);

          boid.mesh.quaternion.slerp(dummyLook.quaternion, 0.035);
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    // ----------------------------------------------------
    // 5. Window Resize & Standardized GSAP Theme Integration
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
