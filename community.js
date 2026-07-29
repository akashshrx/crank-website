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
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, 0, 14);

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
    clouds.position.set(0, 0, -15);
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

    // ----------------------------------------------------
    // 3. Murmuration Flocking System (Leader + 35 Follower Planes)
    // ----------------------------------------------------
    const FLOCK_SIZE = 36;
    const flock = [];

    // Leader Plane
    const leaderMesh = createPaperPlaneMesh();
    const leaderScale = 0.32;
    leaderMesh.scale.set(leaderScale, leaderScale, leaderScale);
    scene.add(leaderMesh);

    flock.push({
      mesh: leaderMesh,
      isLeader: true,
      pos: new THREE.Vector3(1.5, 0.8, 3.5),
      targetPos: new THREE.Vector3(),
      prevPos: new THREE.Vector3(),
      scale: leaderScale,
      offset: new THREE.Vector3(0, 0, 0),
      wavePhase: 0
    });

    // Followers (35 Paper Planes)
    for (let i = 1; i < FLOCK_SIZE; i++) {
      const mesh = createPaperPlaneMesh();
      const scale = 0.16 + Math.random() * 0.14; // Varied sizes for depth perspective
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Distribute in an organic V-formation / flock cluster behind leader
      const layer = Math.floor(i / 4);
      const side = (i % 2 === 0 ? 1 : -1);
      const rowOffset = (i % 4);

      const offsetX = side * (0.65 + layer * 0.55 + Math.random() * 0.3);
      const offsetY = (Math.random() - 0.5) * 1.2;
      const offsetZ = - (layer * 0.85 + rowOffset * 0.35 + Math.random() * 0.4);

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

    // Interactive Mouse Tilt Effect
    let mouseX = 0;
    let mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // ----------------------------------------------------
    // 4. Animation Loop & Murmuration Math
    // ----------------------------------------------------
    const clock = new THREE.Clock();
    let time = 0;

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      time += delta * 0.85;

      // Update Sky & Cloud shaders
      clouds.update(delta);

      // --- LEADER FLIGHT TRAJECTORY (Sweeping 3D Path in Front of Clouds) ---
      const leader = flock[0];
      leader.prevPos.copy(leader.pos);

      // Fluid 3D trajectory positioned in front of cloud layer (Z: 2.0 to 4.5)
      const radiusX = 6.2;
      const radiusY = 2.8;
      const radiusZ = 1.2;

      leader.pos.x = Math.sin(time * 0.48) * radiusX + Math.cos(time * 0.22) * 1.4 + mouseX * 1.2;
      leader.pos.y = Math.sin(time * 0.68 + 0.3) * radiusY + Math.sin(time * 0.32) * 0.9 - mouseY * 1.0;
      leader.pos.z = Math.cos(time * 0.38) * radiusZ + 3.2; // Keep in front of cloud rendering layer

      leader.mesh.position.copy(leader.pos);

      // Compute velocity vector & orientation for Leader
      const leaderVel = new THREE.Vector3().subVectors(leader.pos, leader.prevPos);
      if (leaderVel.lengthSq() > 0.00001) {
        const lookTarget = new THREE.Vector3().addVectors(leader.pos, leaderVel);
        leader.mesh.lookAt(lookTarget);

        // Banking / Roll angle proportional to lateral turn curvature
        const turnCurvature = Math.cos(time * 0.45);
        leader.mesh.rotateOnAxis(new THREE.Vector3(0, 0, 1), -turnCurvature * 0.45);
      }

      // --- FOLLOWER FLOCK (Murmuration Wave Sync) ---
      // Transform local offsets based on Leader's orientation matrix
      const leaderMatrix = leader.mesh.matrixWorld;

      for (let i = 1; i < FLOCK_SIZE; i++) {
        const boid = flock[i];
        boid.prevPos.copy(boid.pos);

        // Dynamic 3D Starling Murmuration Wave Equations
        const waveX = Math.sin(time * 2.2 + boid.wavePhase) * 0.45;
        const waveY = Math.cos(time * 1.8 + boid.wavePhase * 1.3) * 0.55;
        const waveZ = Math.sin(time * 2.6 + boid.wavePhase * 0.7) * 0.35;

        // Offset relative to leader's local coordinate frame
        const localOffset = new THREE.Vector3(
          boid.offset.x + waveX,
          boid.offset.y + waveY,
          boid.offset.z + waveZ
        );

        // Transform local offset to world space aligned with leader direction
        const worldTarget = localOffset.applyMatrix4(leaderMatrix);
        
        // Fluid exponential interpolation (boid smoothing)
        const lerpSpeed = 0.08 + Math.sin(time + i) * 0.02;
        boid.pos.lerp(worldTarget, lerpSpeed);
        boid.mesh.position.copy(boid.pos);

        // Orientation alignment with velocity vector
        const boidVel = new THREE.Vector3().subVectors(boid.pos, boid.prevPos);
        if (boidVel.lengthSq() > 0.000005) {
          const boidLook = new THREE.Vector3().addVectors(boid.pos, boidVel);
          boid.mesh.lookAt(boidLook);

          // Synchronized flock wing roll
          const rollAngle = Math.sin(time * 2.0 + boid.wavePhase) * 0.3;
          boid.mesh.rotateOnAxis(new THREE.Vector3(0, 0, 1), rollAngle);
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    // ----------------------------------------------------
    // 5. Window Resize & Theme Integration
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

    // Theme Switcher Sync (Day / Space Night Mode)
    function applyThemeSettings() {
      const isNight = document.body.classList.contains('space-night-theme');
      if (isNight) {
        skyBackground.material.uniforms.uSkyColor.value.copy(new THREE.Color('#09122c'));
        skyBackground.material.uniforms.uSkyColorBottom.value.copy(new THREE.Color('#1a295c'));
        skyBackground.material.uniforms.uStarOpacity.value = 1.0;
        dirLight.intensity = 0.8;
        ambientLight.color.setHex(0x1e293b);
      } else {
        skyBackground.material.uniforms.uSkyColor.value.copy(new THREE.Color('#70c4ff'));
        skyBackground.material.uniforms.uSkyColorBottom.value.copy(new THREE.Color('#bce3ff'));
        skyBackground.material.uniforms.uStarOpacity.value = 0.0;
        dirLight.intensity = 1.3;
        ambientLight.color.setHex(0xdbeafe);
      }
    }

    applyThemeSettings();

    const themeObserver = new MutationObserver(() => {
      applyThemeSettings();
    });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  });
})();
