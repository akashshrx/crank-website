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

    function createPaperPlaneMesh() {
      const group = new THREE.Group();

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
        color: 0xffffff,
        flatShading: true,
        side: THREE.BackSide,
        map: sharedPaperTexture,
        bumpMap: sharedPaperTexture,
        bumpScale: 0.015,
        shininess: 5,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });
      group.add(new THREE.Mesh(wingsGeom, topMat));

      const bottomMat = new THREE.MeshPhongMaterial({
        color: 0x9fb2e8, // Exact periwinkle shadow tone from home page
        flatShading: true,
        side: THREE.FrontSide,
        map: sharedPaperTexture,
        bumpMap: sharedPaperTexture,
        bumpScale: 0.015,
        shininess: 5,
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
        color: 0x9fb2e8,
        flatShading: true,
        side: THREE.DoubleSide,
        map: sharedPaperTexture,
        bumpMap: sharedPaperTexture,
        bumpScale: 0.015,
        shininess: 5
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
    const leaderMesh = createPaperPlaneMesh();
    const leaderScale = 0.28;
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
      wavePhase: 0
    });

    // Followers (17 Paper Planes - Bounded safely inside viewport)
    for (let i = 1; i < FLOCK_SIZE; i++) {
      const mesh = createPaperPlaneMesh();
      const scale = 0.13 + Math.random() * 0.11; // Varied sizes for depth perspective
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Distribute in a spacious, bounded 3D starling murmuration behind leader
      const layer = Math.floor(i / 3);
      const side = (i % 2 === 0 ? 1 : -1);
      const rowOffset = (i % 3);

      const offsetX = side * (0.8 + layer * 0.65 + Math.random() * 0.35);
      const offsetY = (Math.random() - 0.5) * 1.6;
      const offsetZ = - (layer * 1.1 + rowOffset * 0.4 + Math.random() * 0.4);

      flock.push({
        mesh: mesh,
        isLeader: false,
        pos: new THREE.Vector3(offsetX, offsetY, offsetZ),
        targetPos: new THREE.Vector3(),
        prevPos: new THREE.Vector3(),
        scale: scale,
        offset: new THREE.Vector3(offsetX, offsetY, offsetZ),
        wavePhase: Math.random() * Math.PI * 2,
        delayFactor: 0.04 + layer * 0.02
      });
    }

    // ----------------------------------------------------
    // 4. Animation Loop & Bounded Organic Murmuration Math
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

    const clock = new THREE.Clock();
    let time = 0;

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      time += delta * 0.75; // Smooth, relaxed speed

      // Continuously sync GSAP-animated theme colors to WebGL Shaders & Lights
      skyBackground.material.uniforms.uSkyColor.value.copy(activeThemeColors.topStart);
      skyBackground.material.uniforms.uSkyColorBottom.value.copy(activeThemeColors.bottomStart);
      skyBackground.material.uniforms.uStarOpacity.value = activeThemeColors.starOpacity;
      skyBackground.material.uniforms.uTime.value = time;
      dirLight.intensity = activeThemeColors.dirIntensity;
      ambientLight.color.copy(activeThemeColors.ambientColor);

      clouds.update(delta);

      // --- LEADER FLIGHT TRAJECTORY (Bounded On-Screen Harmonic Curves) ---
      const leader = flock[0];
      leader.prevPos.copy(leader.pos);

      // Smooth 3D flight path strictly bounded inside viewport
      const t = time * 0.32;
      leader.targetPos.x = Math.sin(t) * 3.4 + Math.sin(t * 0.5) * 0.9;
      leader.targetPos.y = Math.sin(t * 0.7) * 1.5 + Math.cos(t * 0.4) * 0.4;
      leader.targetPos.z = Math.cos(t * 0.5) * 1.0 + 2.2;

      // Position smoothing
      leader.pos.lerp(leader.targetPos, 0.05);
      leader.mesh.position.copy(leader.pos);

      // Smooth Quaternion Slerp for Leader Rotation (Eliminates snaps/hard corners)
      const leaderVel = new THREE.Vector3().subVectors(leader.pos, leader.prevPos);
      if (leaderVel.lengthSq() > 0.000001) {
        const lookTarget = new THREE.Vector3().addVectors(leader.pos, leaderVel);
        dummyLook.position.copy(leader.pos);
        dummyLook.lookAt(lookTarget);

        // Gentle banking roll
        const turnCurvature = Math.cos(t * 0.7);
        dummyLook.rotateOnAxis(new THREE.Vector3(0, 0, 1), -turnCurvature * 0.4);

        leader.mesh.quaternion.slerp(dummyLook.quaternion, 0.08);
      }

      // --- FOLLOWER FLOCK (Smooth Wave Sync & Quaternion Slerping) ---
      const leaderMatrix = leader.mesh.matrixWorld;

      for (let i = 1; i < FLOCK_SIZE; i++) {
        const boid = flock[i];
        boid.prevPos.copy(boid.pos);

        // Organic Starling Murmuration Wave Equations
        const waveX = Math.sin(t * 1.8 + boid.wavePhase) * 0.45;
        const waveY = Math.cos(t * 1.4 + boid.wavePhase * 1.3) * 0.5;
        const waveZ = Math.sin(t * 2.0 + boid.wavePhase * 0.7) * 0.4;

        // Offset relative to leader's local coordinate frame
        const localOffset = new THREE.Vector3(
          boid.offset.x + waveX,
          boid.offset.y + waveY,
          boid.offset.z + waveZ
        );

        // Transform local offset to world space aligned with leader direction
        const worldTarget = localOffset.applyMatrix4(leaderMatrix);
        
        // Fluid position lerp
        boid.pos.lerp(worldTarget, 0.05);
        boid.mesh.position.copy(boid.pos);

        // Smooth Quaternion Slerp for Follower Rotations
        const boidVel = new THREE.Vector3().subVectors(boid.pos, boid.prevPos);
        if (boidVel.lengthSq() > 0.000001) {
          const boidLook = new THREE.Vector3().addVectors(boid.pos, boidVel);
          dummyLook.position.copy(boid.pos);
          dummyLook.lookAt(boidLook);

          // Synchronized organic wing roll
          const rollAngle = Math.sin(t * 1.5 + boid.wavePhase) * 0.25;
          dummyLook.rotateOnAxis(new THREE.Vector3(0, 0, 1), rollAngle);

          boid.mesh.quaternion.slerp(dummyLook.quaternion, 0.07);
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
