/* Glide Landing Page JS */

document.addEventListener('DOMContentLoaded', () => {
  // Global reference to Lenis smooth scroll
  let lenis = null;

  // Global mouse coordinates
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // ==========================================
  // Three.js WebGL Interactive Background Atmosphere (Skybox & Clouds)
  // ==========================================
  const canvas = document.getElementById('webgl-canvas');
  if (canvas && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 10);
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // Load dynamic textures
    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load('cloud.png');
    
    // 1. Gradient Sky Background (Linear Mix)
    const skyBackground = new THREE.SkyBackground();
    scene.add(skyBackground);
    skyBackground.updateViewport(camera);
    
    // 2. Instanced Cloud Sprites (sunny-day scattered layout)
    const clouds = new THREE.Clouds(cloudTexture, skyBackground, camera);
    scene.add(clouds);

    // ==========================================
    // 3D Paper Plane & Lighting Setup
    // ==========================================
    // HemisphereLight for soft sky light and blue periwinkle bounce light from below
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8ea2e8, 0.75);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(5, 12, 8);
    scene.add(dirLight);

    // Define 3D CatmullRomCurve3 flight path for the paper plane
    const flightPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.8, 0.8, 3.5),
      new THREE.Vector3(1.5, 1.2, 3.2),
      new THREE.Vector3(1.0, 1.3, 3.0),  // Crest point of the first climb
      new THREE.Vector3(0.2, 1.0, 2.8),  // Gradual swoop down-left
      new THREE.Vector3(-0.8, 0.4, 2.7),
      new THREE.Vector3(-1.8, -0.4, 2.6),
      new THREE.Vector3(-2.4, 0.5, 3.5),
      new THREE.Vector3(0.0, 1.5, 4.0),
      new THREE.Vector3(2.0, -1.2, 3.0),
      new THREE.Vector3(-0.5, -2.2, 3.5)
    ]);

    // Generate a procedural noise paper texture for a realistic matte paper feel
    function createPaperTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // Base off-white color
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 256);
      
      // Draw very subtle fine noise grain
      const imgData = ctx.getImageData(0, 0, 256, 256);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 12; // subtle grain
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 3); // repeat across faces
      return texture;
    }

    // Create 3D paper plane mesh
    function createPaperPlane() {
      const group = new THREE.Group();
      
      const nose = [0, 0, 2];
      const tail = [0, 0.15, -1.5];
      const leftTip = [-1.8, 0.4, -1.2];
      const rightTip = [1.8, 0.4, -1.2];
      const keel = [0, -0.6, -0.8];
      
      const paperTexture = createPaperTexture();

      // Wings Geometry
      const wingsGeom = new THREE.BufferGeometry();
      const wingsVertices = new Float32Array([
        ...nose, ...leftTip, ...tail,
        ...nose, ...tail, ...rightTip
      ]);
      wingsGeom.setAttribute('position', new THREE.BufferAttribute(wingsVertices, 3));
      wingsGeom.computeVertexNormals();
      
      // Top Wing Surface (Faces upwards - BackSide because of normals direction)
      const topMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: true,
        side: THREE.BackSide,
        map: paperTexture,
        bumpMap: paperTexture,
        bumpScale: 0.015,
        shininess: 5,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });
      const topMesh = new THREE.Mesh(wingsGeom, topMat);
      group.add(topMesh);
      
      // Bottom Wing Surface (Faces downwards - FrontSide)
      const bottomMat = new THREE.MeshPhongMaterial({
        color: 0x9fb2e8, // slightly more saturated periwinkle to show up clearly
        flatShading: true,
        side: THREE.FrontSide,
        map: paperTexture,
        bumpMap: paperTexture,
        bumpScale: 0.015,
        shininess: 5,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      });
      const bottomMesh = new THREE.Mesh(wingsGeom, bottomMat);
      group.add(bottomMesh);
      
      // Keel Geometry (Vertical sheet)
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
        map: paperTexture,
        bumpMap: paperTexture,
        bumpScale: 0.015,
        shininess: 5
      });
      const keelMesh = new THREE.Mesh(keelGeom, keelMat);
      group.add(keelMesh);
      
      const isMobile = window.innerWidth < 768;
      const initialScale = isMobile ? 0.12 : 0.22;
      group.scale.set(initialScale, initialScale, initialScale);
      return group;
    }

    const paperPlane = createPaperPlane();
    scene.add(paperPlane);

    // Create dynamic depth shadow (Toggled off by default)
    const shadowGeometry = new THREE.BufferGeometry();
    if (paperPlane.children && paperPlane.children[0]) {
      shadowGeometry.copy(paperPlane.children[0].geometry);
    }
    const paperPlaneShadow = new THREE.Mesh(
      shadowGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x001326,
        transparent: true,
        opacity: 0.2,
        depthWrite: false
      })
    );
    paperPlaneShadow.scale.copy(paperPlane.scale);
    paperPlaneShadow.visible = false; // Toggled off as per user request
    scene.add(paperPlaneShadow);

    // Dummy references to avoid console/GSAP errors if there's any third-party code
    window.webglOrb = {
      baseX: 0.0, baseX: 0.0, baseY: 0.0, baseZ: 0.0,
      scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0
    };
    window.webglOrbMaterial = { roughness: 0.15, thickness: 1.5, transmission: 0.9 };
    window.webglOrbLook = { x: 0, y: 0, blinkScaleY: 1.0 };
    
    // Window Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      // Update plane scale responsively
      const isMobile = window.innerWidth < 768;
      const currentScale = isMobile ? 0.12 : 0.22;
      paperPlane.scale.set(currentScale, currentScale, currentScale);
      
      // Keep background screen-aligned geometry filled
      skyBackground.updateViewport(camera);

      // Regenerate cloud geometry & instances for new viewport bounds
      clouds.resize(camera);
    });
    
    let targetScrollY = window.scrollY || window.pageYOffset;
    let currentScrollY = targetScrollY;
    let currentScrollFrac = 0;

    window.addEventListener('scroll', () => {
      targetScrollY = window.scrollY || window.pageYOffset;
    });

    const clock = new THREE.Clock();
    
    // Render loop
    function animateWebgl() {
      requestAnimationFrame(animateWebgl);
      
      const dt = Math.min(clock.getDelta(), 0.1);
      
      camera.lookAt(0, 0, 0);

      // Smoothly interpolate scroll position
      currentScrollY += (targetScrollY - currentScrollY) * 0.1;
      
      // Map scroll pixels to world units
      const fovRad = (camera.fov * Math.PI) / 180;
      const vpHeight = 2 * Math.tan(fovRad / 2) * 7.4;
      const pxToWorld = vpHeight / window.innerHeight;

      // Map scroll progress (fraction)
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const targetScrollFrac = maxScroll > 0 ? targetScrollY / maxScroll : 0;
      currentScrollFrac += (targetScrollFrac - currentScrollFrac) * 0.08;

      // Parallax scroll direction: clouds move down as you scroll down
      // making the user feel like they are ascending up the sky.
      clouds.position.y = -currentScrollY * pxToWorld * 0.5;
      
      // Interpolate background sky gradient colors to become darker blue at maximum scroll
      const topColorStart = new THREE.Color('#0099e6');
      const topColorEnd = new THREE.Color('#002d5a');
      skyBackground.material.uniforms.uSkyColor.value.copy(topColorStart).lerp(topColorEnd, currentScrollFrac);

      const bottomColorStart = new THREE.Color('#b8dffa');
      const bottomColorEnd = new THREE.Color('#005099');
      skyBackground.material.uniforms.uSkyColorBottom.value.copy(bottomColorStart).lerp(bottomColorEnd, currentScrollFrac);

      // Update star animation progress uniforms
      if (skyBackground.material.uniforms.uTime) {
        skyBackground.material.uniforms.uTime.value = clock.getElapsedTime();
      }
      if (skyBackground.material.uniforms.uStarOpacity) {
        const starOpacity = Math.max(0, Math.min(1, (currentScrollFrac - 0.4) / 0.5));
        skyBackground.material.uniforms.uStarOpacity.value = starOpacity;
      }

      // ------------------------------------------
      // Animate Paper Plane Along Flight Path Curve
      // ------------------------------------------
      const pathPoint = flightPath.getPointAt(currentScrollFrac);
      const tangent = flightPath.getTangentAt(currentScrollFrac).normalize();
      
      paperPlane.position.copy(pathPoint);
      
      // Orient the plane to face along the tangent
      const targetLook = new THREE.Vector3().copy(pathPoint).add(tangent);
      paperPlane.lookAt(targetLook);
      
      // Apply swooping, barrel rolls, and banks relative to scroll
      let rollAngle = 0;
      if (currentScrollFrac > 0.1 && currentScrollFrac <= 0.4) {
        const p = (currentScrollFrac - 0.1) / 0.3;
        rollAngle = -Math.sin(p * Math.PI) * 0.7; // bank left
      } else if (currentScrollFrac > 0.4 && currentScrollFrac < 0.7) {
        const p = (currentScrollFrac - 0.4) / 0.3;
        rollAngle = p * Math.PI * 2; // complete barrel roll
      } else if (currentScrollFrac >= 0.7 && currentScrollFrac < 0.95) {
        const p = (currentScrollFrac - 0.7) / 0.25;
        rollAngle = Math.sin(p * Math.PI) * 0.6; // bank right
      }
      
      paperPlane.rotateOnAxis(new THREE.Vector3(0, 0, 1), rollAngle);

      // Add dynamic idle breathing bobbing
      const time = clock.getElapsedTime();
      const idleOffset = new THREE.Vector3(
        Math.cos(time * 1.5) * 0.03,
        Math.sin(time * 2.0) * 0.05,
        Math.sin(time * 1.0) * 0.02
      );
      paperPlane.position.add(idleOffset);

      // Position depth shadow underneath
      paperPlaneShadow.position.copy(paperPlane.position);
      paperPlaneShadow.position.z = paperPlane.position.z - 1.5;
      paperPlaneShadow.position.x += 0.4;
      paperPlaneShadow.position.y -= 0.4;
      paperPlaneShadow.rotation.copy(paperPlane.rotation);
      paperPlaneShadow.scale.copy(paperPlane.scale).multiplyScalar(0.9);

      // Run cloud drift, rotation, and Z-depth sorting
      clouds.update(dt);
      
      renderer.render(scene, camera);
    }
    
    // Start animation loop
    animateWebgl();
  }

  // ==========================================
  // 1. Download Trigger & Notification
  // ==========================================
  const downloadLinks = document.querySelectorAll('.btn-download');
  const downloadToast = document.getElementById('download-toast');

  downloadLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Show download started toast
      downloadToast.classList.add('show');
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        downloadToast.classList.remove('show');
      }, 5000);
    });
  });

  // ==========================================
  // 2. Lenis Smooth Scroll Setup
  // ==========================================
  lenis = new Lenis({
    duration: 0.85, // Snappier response
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 0.8,
    smoothTouch: false,
    touchMultiplier: 1.5,
    infinite: false,
  });

  // Hook Lenis into GSAP ticker
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // GSAP ScrollTrigger for horizontal questions grid scroll
    const questionsTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".questions-section",
        start: "top top",
        end: "+=360%",
        scrub: 1,
        pin: true,
        anticipatePin: 1
      }
    });

    questionsTimeline.fromTo(".questions-title-side h2",
      { opacity: 0.05, y: 40 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );

    questionsTimeline.fromTo(".questions-grid", 
      { x: "100vw" }, 
      { x: "-100vw", ease: "none" },
      "<"
    );

    gsap.timeline({
      scrollTrigger: {
        trigger: ".scroll-reveal-section",
        start: "top top",
        end: "+=220%",
        scrub: 0.8,
        pin: true,
        anticipatePin: 1
      }
    })
    .fromTo(".reveal-line.line-1", 
      { y: "50px", opacity: 0.05 }, 
      { y: "0px", opacity: 1, duration: 1, ease: "power2.out" }
    )
    .fromTo(".reveal-line.line-2", 
      { y: "50px", opacity: 0.05 }, 
      { y: "0px", opacity: 1, duration: 1, ease: "power2.out" }, 
      "+=0.3"
    )
    .fromTo(".reveal-line.line-3", 
      { y: "50px", opacity: 0.05 }, 
      { y: "0px", opacity: 1, duration: 1, ease: "power2.out" }, 
      "+=0.3"
    )
    .fromTo(".reveal-line.line-4", 
      { y: "50px", opacity: 0.05 }, 
      { y: "0px", opacity: 1, duration: 1, ease: "power2.out" }, 
      "+=0.3"
    )
    .to({}, { duration: 0.4 }); // Hold state
  }

  // Smooth scroll for nav links using Lenis
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = this.getAttribute('href');
      if (target && target !== '#') {
        lenis.scrollTo(target);
      }
    });
  });

  // ==========================================
  // 3. Eyeball Blink Animation Controller
  // ==========================================
  function triggerBlinks() {
    const eyeballs = document.querySelectorAll('.eyeball-group');
    eyeballs.forEach(eye => {
      eye.classList.add('blink');
      setTimeout(() => {
        eye.classList.remove('blink');
      }, 250); // Match animation duration
    });
    
    // Blink the 3D WebGL eyeball in sync (canvas texture)
    if (window.webglOrbLook && typeof gsap !== 'undefined') {
      gsap.to(window.webglOrbLook, {
        blinkScaleY: 0.05,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut"
      });
    }
    
    // Schedule next blink between 7 and 12 seconds
    const randomDelay = Math.random() * (12000 - 7000) + 7000;
    setTimeout(triggerBlinks, randomDelay);
  }
  // Start the blink scheduler
  setTimeout(triggerBlinks, 4000);

  // ==========================================
  // 4. Interactive Hotkey Demo Controller
  // ==========================================
  const keyCtrl = document.getElementById('key-ctrl');
  const keyOpt = document.getElementById('key-opt');
  const keyDemoBtn = document.getElementById('keyboard-trigger-btn');
  const audiogramCard = document.getElementById('audiogram-card');
  const notchText = document.getElementById('interactive-notch-text');
  
  let ctrlPressed = false;
  let optPressed = false;
  let simulatedListening = false;
  let releaseTimeout = null;

  function startListening() {
    if (releaseTimeout) clearTimeout(releaseTimeout);
    if (audiogramCard) audiogramCard.classList.add('listening');
    if (notchText) notchText.innerText = "Listening...";
  }

  function stopListening() {
    if (releaseTimeout) clearTimeout(releaseTimeout);
    releaseTimeout = setTimeout(() => {
      if (audiogramCard) audiogramCard.classList.remove('listening');
      if (notchText) notchText.innerText = "Hold Hotkey to Summon";
      if (keyCtrl) keyCtrl.classList.remove('active');
      if (keyOpt) keyOpt.classList.remove('active');
      
      ctrlPressed = false;
      optPressed = false;
      simulatedListening = false;
    }, 1200);
  }

  // Keyboard Event Listeners
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Control') {
      ctrlPressed = true;
      if (keyCtrl) keyCtrl.classList.add('active');
    }
    if (e.key === 'Alt') { // Option key on Mac
      optPressed = true;
      if (keyOpt) keyOpt.classList.add('active');
    }

    if (ctrlPressed && optPressed) {
      startListening();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'Control') {
      ctrlPressed = false;
      if (keyCtrl) keyCtrl.classList.remove('active');
    }
    if (e.key === 'Alt') {
      optPressed = false;
      if (keyOpt) keyOpt.classList.remove('active');
    }

    if (!ctrlPressed || !optPressed) {
      if (!simulatedListening) {
        stopListening();
      }
    }
  });

  // Tap/Click fallback triggers simulation for keycaps (individual clicks!)
  if (keyCtrl) {
    keyCtrl.addEventListener('click', (e) => {
      e.stopPropagation();
      ctrlPressed = !ctrlPressed;
      if (ctrlPressed) {
        keyCtrl.classList.add('active');
      } else {
        keyCtrl.classList.remove('active');
      }
      checkListeningState();
    });
  }

  if (keyOpt) {
    keyOpt.addEventListener('click', (e) => {
      e.stopPropagation();
      optPressed = !optPressed;
      if (optPressed) {
        keyOpt.classList.add('active');
      } else {
        keyOpt.classList.remove('active');
      }
      checkListeningState();
    });
  }

  function checkListeningState() {
    if (ctrlPressed && optPressed) {
      simulatedListening = true;
      startListening();
    } else {
      simulatedListening = false;
      // Immediately stop listening if click toggles them off
      if (releaseTimeout) clearTimeout(releaseTimeout);
      if (audiogramCard) audiogramCard.classList.remove('listening');
      if (notchText) notchText.innerText = "Hold Hotkey to Summon";
    }
  }

  // Clicking the wrapper triggers toggle of both
  if (keyDemoBtn) {
    keyDemoBtn.addEventListener('click', () => {
      simulatedListening = !simulatedListening;
      if (simulatedListening) {
        ctrlPressed = true;
        optPressed = true;
        if (keyCtrl) keyCtrl.classList.add('active');
        if (keyOpt) keyOpt.classList.add('active');
        startListening();
      } else {
        ctrlPressed = false;
        optPressed = false;
        if (keyCtrl) keyCtrl.classList.remove('active');
        if (keyOpt) keyOpt.classList.remove('active');
        if (releaseTimeout) clearTimeout(releaseTimeout);
        if (audiogramCard) audiogramCard.classList.remove('listening');
        if (notchText) notchText.innerText = "Hold Hotkey to Summon";
      }
    });
  }
  // Video modal controller
  const watchDemoBtn = document.getElementById('btn-watch-demo');
  const videoModal = document.getElementById('video-modal');
  const videoModalClose = document.getElementById('video-modal-close-btn');
  const videoPlayer = document.getElementById('demo-video-player');

  if (watchDemoBtn && videoModal && videoModalClose) {
    watchDemoBtn.addEventListener('click', () => {
      videoModal.style.display = 'flex';
      videoModal.offsetHeight; // force reflow
      videoModal.classList.add('active');
      if (typeof lenis !== 'undefined') lenis.stop();
    });

    const closeModal = () => {
      videoModal.classList.remove('active');
      if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
      }
      setTimeout(() => {
        videoModal.style.display = 'none';
        if (typeof lenis !== 'undefined') lenis.start();
      }, 350);
    };

    videoModalClose.addEventListener('click', closeModal);
    const backdrop = videoModal.querySelector('.video-modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeModal);
  }

  // Dynamic Footer Year
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }
});
