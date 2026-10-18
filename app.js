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
        topStart: new THREE.Color('#0088cc'),
        topEnd: new THREE.Color('#002d5a'),
        bottomStart: new THREE.Color('#9bcbf5'),
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
      
      const isMobile = window.innerWidth <= 1024;
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
      const isMobile = window.innerWidth <= 1024;
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

  // The build IS live now, so the click must reach the href. This used to call preventDefault()
  // and show a "we are cooking" toast instead, which swallowed every Download button on the site
  // even though the markup pointed at the real installer all along. The toast now CONFIRMS the
  // download rather than replacing it, so let the browser navigate.
  downloadLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (!downloadToast) return;
      downloadToast.classList.add('show');
      setTimeout(() => downloadToast.classList.remove('show'), 5000);
    });
  });

  // ==========================================
  // 2. Lenis Smooth Scroll Setup (Desktop Only)
  // ==========================================
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;

  if (!isTouchDevice && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 0.85, // Snappier response
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 0.8,
      infinite: false,
    });

    // Hook Lenis into GSAP ticker
    gsap.ticker.add((time) => {
      if (lenis) lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    let mm = gsap.matchMedia();

    mm.add("(min-width: 1025px)", () => {
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

    // Glassmorphic appear animation for "One more thing..." eyebrow label on scroll
    gsap.fromTo(".dictation-eyebrow", 
      {
        opacity: 0,
        y: 35,
        scale: 0.75,
        filter: "blur(10px)"
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.0,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: ".dictation-section",
          start: "top 80%",
          toggleActions: "play none none reverse",
          onEnter: () => {
            const eyebrow = document.querySelector('.dictation-eyebrow');
            if (eyebrow) eyebrow.classList.add('is-visible');
          },
          onLeaveBack: () => {
            const eyebrow = document.querySelector('.dictation-eyebrow');
            if (eyebrow) eyebrow.classList.remove('is-visible');
          }
        }
      }
    );
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


  // ==========================================
  // Demo video. The film loops, muted, inside the Watch Demo button. Clicking grows that same
  // playing video out of the button into the player, where the full-quality film carries on from
  // the same moment with sound; closing shrinks it back into the button.
  // ==========================================
  const watchDemoBtn = document.getElementById('btn-watch-demo');
  const btnVideo = document.getElementById('demo-btn-video');
  const videoModal = document.getElementById('video-modal');
  const videoModalClose = document.getElementById('video-modal-close-btn');
  const videoPlayer = document.getElementById('demo-video-player');
  const videoContent = videoModal ? videoModal.querySelector('.video-modal-content') : null;

  if (watchDemoBtn && videoModal && videoModalClose && videoPlayer && videoContent) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    const canAnimate = typeof Element.prototype.animate === 'function';
    const quietPlay = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    let btnVideoStarted = false;
    let morphing = false;
    let startAt = 0;   // where in the film the popup opened
    let wrapped = false;

    // 1. Start the small muted copy once the page has finished loading, so it never competes
    //    with the first paint. With reduced motion or data saver on, the still poster stays.
    if (btnVideo && !reduceMotion && !saveData) {
      const startBtnVideo = () => {
        btnVideo.src = btnVideo.dataset.src;
        quietPlay(btnVideo);
        btnVideoStarted = true;
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(([entry]) => {
            if (videoModal.classList.contains('active') || morphing) return;
            if (entry.isIntersecting) quietPlay(btnVideo); else btnVideo.pause();
          }).observe(watchDemoBtn);
        }
      };
      const later = () => (window.requestIdleCallback
        ? requestIdleCallback(startBtnVideo, { timeout: 2000 })
        : setTimeout(startBtnVideo, 300));
      if (document.readyState === 'complete') later();
      else window.addEventListener('load', later, { once: true });
    }

    // 2. Geometry. The player is centred at its CSS size. The button shows the film scaled to
    //    cover it, which is the player scaled down evenly plus a clip to the band the button shows,
    //    so the animation never stretches the picture.
    const playerRect = () => {
      const w = videoContent.offsetWidth, h = videoContent.offsetHeight;
      return { left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2, width: w, height: h };
    };
    const buttonPose = (btn, to) => {
      const s = Math.max(btn.width / to.width, btn.height / to.height);
      const visW = btn.width / s, visH = btn.height / s;
      const dx = (btn.left + btn.width / 2) - (to.left + to.width / 2);
      const dy = (btn.top + btn.height / 2) - (to.top + to.height / 2);
      const radius = (parseFloat(getComputedStyle(watchDemoBtn).borderTopLeftRadius) || 8) / s;
      return {
        transform: `translate(${dx}px, ${dy}px) scale(${s})`,
        clipPath: `inset(${(to.height - visH) / 2}px ${(to.width - visW) / 2}px round ${radius}px)`,
      };
    };
    const playerPose = { transform: 'translate(0px, 0px) scale(1)', clipPath: 'inset(0px 0px round 16px)' };
    const morphLayer = (to) => {
      const layer = document.createElement('div');
      layer.className = 'video-morph';
      Object.assign(layer.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` });
      document.body.appendChild(layer);
      layer.appendChild(btnVideo); // the same playing element, moved, so it never reloads
      const shade = document.createElement('div');
      shade.className = 'video-morph-shade';
      layer.appendChild(shade);
      return layer;
    };
    const returnBtnVideo = () => watchDemoBtn.insertBefore(btnVideo, watchDemoBtn.firstChild);
    const morphReady = () => btnVideo && btnVideoStarted && !reduceMotion && canAnimate && btnVideo.readyState >= 2;

    // 3. Open.
    const openDemo = () => {
      if (morphing || videoModal.classList.contains('active')) return;
      const grow = morphReady();
      const from = watchDemoBtn.getBoundingClientRect();
      startAt = grow ? btnVideo.currentTime : 0;
      wrapped = false;

      if (grow) videoModal.classList.add('is-morphing'); // before display, so the player never shows
      videoModal.style.display = 'flex';
      videoModal.offsetHeight; // force reflow
      videoModal.classList.add('active');
      if (lenis) lenis.stop(); // lenis stays null on touch devices, where smooth scroll is off

      // The full film, with sound, from the moment the button was showing. This runs inside the
      // click, which is what lets browsers allow audible playback.
      videoPlayer.currentTime = startAt;
      quietPlay(videoPlayer);
      videoModalClose.focus({ preventScroll: true });
      if (!grow) return;

      morphing = true;
      const to = playerRect();
      const layer = morphLayer(to);
      const grown = layer.animate([buttonPose(from, to), playerPose],
        { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }).finished;
      layer.lastChild.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-out', fill: 'forwards' });
      const hdPlaying = new Promise((resolve) => {
        const done = () => { videoPlayer.removeEventListener('playing', done); resolve(); };
        videoPlayer.addEventListener('playing', done);
        setTimeout(done, 2500); // never let the small copy stand in for long
      });
      hdPlaying.then(() => { if (!videoPlayer.paused) btnVideo.currentTime = videoPlayer.currentTime; });
      Promise.all([grown, hdPlaying]).then(() => {
        videoModal.classList.remove('is-morphing');
        layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished.then(() => {
          returnBtnVideo();
          btnVideo.pause();
          layer.remove();
          morphing = false;
        });
      });
    };

    // 4. Close.
    const closeDemo = () => {
      if (!videoModal.classList.contains('active') || morphing) return;
      const shrink = morphReady() || (btnVideo && btnVideoStarted && !reduceMotion && canAnimate);
      const t = videoPlayer.currentTime;
      videoPlayer.pause();
      const finish = () => {
        videoModal.style.display = 'none';
        videoModal.classList.remove('is-morphing');
        videoPlayer.currentTime = 0;
        if (lenis) lenis.start();
      };

      if (shrink) {
        morphing = true;
        const to = playerRect();
        const layer = morphLayer(to);
        btnVideo.currentTime = t; // the button picks up where the film was
        quietPlay(btnVideo);
        videoModal.classList.add('is-morphing');
        videoModal.classList.remove('active');
        const from = watchDemoBtn.getBoundingClientRect();
        layer.lastChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: 'ease-in', fill: 'forwards' });
        layer.animate([playerPose, buttonPose(from, to)],
          { duration: 480, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }).finished.then(() => {
          returnBtnVideo();
          layer.remove();
          finish();
          morphing = false;
        });
      } else {
        videoModal.classList.remove('active');
        setTimeout(finish, 350);
      }
      watchDemoBtn.focus({ preventScroll: true });
    };

    // 5. Opened partway through? Carry on to the end, then once round from the start up to where
    //    it began, so everyone sees the whole film once.
    videoPlayer.addEventListener('ended', () => {
      if (startAt > 1 && !wrapped && videoModal.classList.contains('active')) {
        wrapped = true;
        videoPlayer.currentTime = 0;
        quietPlay(videoPlayer);
      }
    });
    videoPlayer.addEventListener('timeupdate', () => {
      if (wrapped && videoPlayer.currentTime >= startAt) {
        videoPlayer.pause();
        wrapped = false;
        startAt = 0;
      }
    });

    watchDemoBtn.addEventListener('click', openDemo);
    videoModalClose.addEventListener('click', closeDemo);
    const backdrop = videoModal.querySelector('.video-modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeDemo);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDemo();
    });
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

    const headerLogoImg = document.querySelector('#header-logo img, .logo img');
    if (isNight) {
      document.body.classList.add('space-night-theme');
      if (headerLogoImg) headerLogoImg.src = 'logo_white.png?v=59';
      if (dayBtn) dayBtn.classList.remove('active');
      if (nightBtn) nightBtn.classList.add('active');
    } else {
      document.body.classList.remove('space-night-theme');
      if (headerLogoImg) headerLogoImg.src = 'logo_dark.png?v=59';
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

  // Dictation Fn Key Click Listener
  const dictationFnKey = document.getElementById('dictation-fn-key');
  if (dictationFnKey) {
    const triggerFnPress = () => {
      dictationFnKey.classList.add('key-pressed');
      setTimeout(() => dictationFnKey.classList.remove('key-pressed'), 150);
    };
    dictationFnKey.addEventListener('click', triggerFnPress);
    dictationFnKey.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerFnPress();
      }
    });
  }

  // Mobile Navigation Menu Toggle Listener
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('mobile-open');
      const hamburger = mobileMenuBtn.querySelector('.hamburger-icon');
      const closeIcon = mobileMenuBtn.querySelector('.close-icon');
      if (hamburger && closeIcon) {
        hamburger.style.display = isOpen ? 'none' : 'block';
        closeIcon.style.display = isOpen ? 'block' : 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.site-header')) {
        navLinks.classList.remove('mobile-open');
        const hamburger = mobileMenuBtn.querySelector('.hamburger-icon');
        const closeIcon = mobileMenuBtn.querySelector('.close-icon');
        if (hamburger && closeIcon) {
          hamburger.style.display = 'block';
          closeIcon.style.display = 'none';
        }
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        const hamburger = mobileMenuBtn.querySelector('.hamburger-icon');
        const closeIcon = mobileMenuBtn.querySelector('.close-icon');
        if (hamburger && closeIcon) {
          hamburger.style.display = 'block';
          closeIcon.style.display = 'none';
        }
      });
    });
  }
});
