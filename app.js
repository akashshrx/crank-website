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
    const cloudTexture = textureLoader.load(window.CLOUD_TEXTURE_BASE64 || 'cloud.png');
    
    // 1. Gradient Sky Background (Linear Mix)
    const skyBackground = new THREE.SkyBackground();
    scene.add(skyBackground);
    skyBackground.updateViewport(camera);
    window.skyBackground = skyBackground;

    // Define theme color presets
    const themes = {
      day: {
        topStart: new THREE.Color('#0099e6'),
        topEnd: new THREE.Color('#002d5a'),
        bottomStart: new THREE.Color('#b8dffa'),
        bottomEnd: new THREE.Color('#005099'),
        minStars: 0.0,
        maxStars: 1.0
      },
      night: {
        topStart: new THREE.Color('#09122c'),
        topEnd: new THREE.Color('#040a1c'),
        bottomStart: new THREE.Color('#1c3260'),
        bottomEnd: new THREE.Color('#0e1b38'),
        minStars: 0.85,
        maxStars: 1.0
      }
    };

    window.themes = themes;
    window.activeTheme = {
      topStart: themes.day.topStart.clone(),
      topEnd: themes.day.topEnd.clone(),
      bottomStart: themes.day.bottomStart.clone(),
      bottomEnd: themes.day.bottomEnd.clone(),
      minStars: themes.day.minStars,
      maxStars: themes.day.maxStars,
      isNight: false
    };
    
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
      const initialScale = isMobile ? 0.139 : 0.254;
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
      const currentScale = isMobile ? 0.139 : 0.254;
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
      
      // Interpolate background sky gradient colors dynamically based on active theme
      if (window.activeTheme) {
        skyBackground.material.uniforms.uSkyColor.value.copy(window.activeTheme.topStart).lerp(window.activeTheme.topEnd, currentScrollFrac);
        skyBackground.material.uniforms.uSkyColorBottom.value.copy(window.activeTheme.bottomStart).lerp(window.activeTheme.bottomEnd, currentScrollFrac);
        
        if (skyBackground.material.uniforms.uStarOpacity) {
          const scrollStarOpacity = Math.max(0, Math.min(1, (currentScrollFrac - 0.4) / 0.5));
          const currentStars = window.activeTheme.minStars + (window.activeTheme.maxStars - window.activeTheme.minStars) * scrollStarOpacity;
          skyBackground.material.uniforms.uStarOpacity.value = currentStars;
        }
      }

      // Update star animation progress uniforms
      if (skyBackground.material.uniforms.uTime) {
        skyBackground.material.uniforms.uTime.value = clock.getElapsedTime();
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
  const downloadLinks = document.querySelectorAll('.btn-download, .conversion-download-btn');
  const downloadToast = document.getElementById('download-toast');

  downloadLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
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
    ScrollTrigger.config({ ignoreMobileResize: true });

    let mm = gsap.matchMedia();

    mm.add("(min-width: 769px)", () => {
      // GSAP ScrollTrigger for horizontal questions grid scroll
      const questionsTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".questions-section",
          start: "top top",
          end: "+=520%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: () => {
            document.querySelectorAll('.shimmer-target').forEach(el => {
              if (!el.classList.contains('shimmer-active')) {
                const rect = el.getBoundingClientRect();
                // Trigger when the element enters the visible area (left edge is < 80% of window width and it hasn't passed left edge yet)
                if (rect.left < window.innerWidth * 0.8 && rect.right > 0) {
                  el.classList.add('shimmer-active', 'shimmer-play');
                  // Remove the play class after the animation finishes (1.5s) so hover can cleanly re-trigger it
                  setTimeout(() => {
                    el.classList.remove('shimmer-play');
                  }, 1500);
                }
              }
            });
          }
        }
      });

      // Translate grid across the full scroll timeline
      questionsTimeline.fromTo(".questions-grid", 
        { x: "100vw" }, 
        { x: "-380vw", ease: "none", duration: 1.0 },
        0
      );

      // Fade out the entire left title side container as questions approach (starts at ~22% scroll progress, done by ~32%)
      questionsTimeline.to(".questions-title-side",
        { opacity: 0, y: -30, duration: 0.10, ease: "power2.inOut" },
        0.22
      );
    });

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
      { y: "50px", scaleY: 1.35, transformOrigin: "left bottom", opacity: 0.05 }, 
      { y: "0px", scaleY: 1.35, transformOrigin: "left bottom", opacity: 1, duration: 1, ease: "power2.out" }
    )
    .fromTo(".reveal-line.line-2", 
      { y: "50px", scaleY: 1.35, transformOrigin: "left bottom", opacity: 0.05 }, 
      { y: "0px", scaleY: 1.35, transformOrigin: "left bottom", opacity: 1, duration: 1, ease: "power2.out" }, 
      "+=0.3"
    )
    .fromTo(".reveal-line.line-3", 
      { y: "50px", scaleY: 1.35, transformOrigin: "left bottom", opacity: 0.05 }, 
      { y: "0px", scaleY: 1.35, transformOrigin: "left bottom", opacity: 1, duration: 1, ease: "power2.out" }, 
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
        lenis.scrollTo(target, { duration: 1.6 });
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

  // Floating Theme Switcher Controller
  const dayBtn = document.getElementById('theme-btn-day');
  const nightBtn = document.getElementById('theme-btn-night');

  function updateTheme(isNight, transition = true) {
    if (!window.skyBackground || !window.activeTheme || !window.themes) return;

    const target = isNight ? window.themes.night : window.themes.day;
    window.activeTheme.isNight = isNight;

    if (transition && typeof gsap !== 'undefined') {
      gsap.to(window.activeTheme.topStart, {
        r: target.topStart.r,
        g: target.topStart.g,
        b: target.topStart.b,
        duration: 2.2,
        ease: "power2.out"
      });
      gsap.to(window.activeTheme.topEnd, {
        r: target.topEnd.r,
        g: target.topEnd.g,
        b: target.topEnd.b,
        duration: 2.2,
        ease: "power2.out"
      });
      gsap.to(window.activeTheme.bottomStart, {
        r: target.bottomStart.r,
        g: target.bottomStart.g,
        b: target.bottomStart.b,
        duration: 2.2,
        ease: "power2.out"
      });
      gsap.to(window.activeTheme.bottomEnd, {
        r: target.bottomEnd.r,
        g: target.bottomEnd.g,
        b: target.bottomEnd.b,
        duration: 2.2,
        ease: "power2.out"
      });
      gsap.to(window.activeTheme, {
        minStars: target.minStars,
        maxStars: target.maxStars,
        duration: 2.2,
        ease: "power2.out"
      });
    } else {
      window.activeTheme.topStart.copy(target.topStart);
      window.activeTheme.topEnd.copy(target.topEnd);
      window.activeTheme.bottomStart.copy(target.bottomStart);
      window.activeTheme.bottomEnd.copy(target.bottomEnd);
      window.activeTheme.minStars = target.minStars;
      window.activeTheme.maxStars = target.maxStars;
    }

    if (isNight) {
      document.body.classList.add('space-night-theme');
      if (dayBtn) dayBtn.classList.remove('active');
      if (nightBtn) nightBtn.classList.add('active');
    } else {
      document.body.classList.remove('space-night-theme');
      if (nightBtn) nightBtn.classList.remove('active');
      if (dayBtn) dayBtn.classList.add('active');
    }
  }

  if (dayBtn && nightBtn) {
    dayBtn.addEventListener('click', () => updateTheme(false));
    nightBtn.addEventListener('click', () => updateTheme(true));

    // Boot theme detection (After 6 PM or before 6 AM is Night)
    const hour = new Date().getHours();
    const isNightBoot = hour >= 18 || hour < 6;
    
    // Slight timeout to ensure three.js meshes have initialized fully
    setTimeout(() => {
      updateTheme(isNightBoot, false);
    }, 100);
  }
});
