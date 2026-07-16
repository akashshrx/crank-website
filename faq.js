document.addEventListener('DOMContentLoaded', () => {
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
    
    // 2. Instanced Cloud Sprites
    const clouds = new THREE.Clouds(cloudTexture, skyBackground, camera);
    scene.add(clouds);

    // Dynamic sizing and resize listener
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      if (skyBackground && typeof skyBackground.updateViewport === 'function') {
        skyBackground.updateViewport(camera);
      }
      if (clouds && typeof clouds.resize === 'function') {
        clouds.resize(camera);
      }
    });

    // Theme Switcher Controls
    const dayBtn = document.getElementById('theme-btn-day');
    const nightBtn = document.getElementById('theme-btn-night');

    function updateTheme(isNight, transition = true) {
      const target = isNight ? themes.night : themes.day;
      window.activeTheme.isNight = isNight;

      if (transition && typeof gsap !== 'undefined') {
        gsap.to(window.activeTheme.topStart, {
          r: target.topStart.r, g: target.topStart.g, b: target.topStart.b,
          duration: 2.2, ease: "power2.out"
        });
        gsap.to(window.activeTheme.topEnd, {
          r: target.topEnd.r, g: target.topEnd.g, b: target.topEnd.b,
          duration: 2.2, ease: "power2.out"
        });
        gsap.to(window.activeTheme.bottomStart, {
          r: target.bottomStart.r, g: target.bottomStart.g, b: target.bottomStart.b,
          duration: 2.2, ease: "power2.out"
        });
        gsap.to(window.activeTheme.bottomEnd, {
          r: target.bottomEnd.r, g: target.bottomEnd.g, b: target.bottomEnd.b,
          duration: 2.2, ease: "power2.out"
        });
        gsap.to(window.activeTheme, {
          minStars: target.minStars,
          maxStars: target.maxStars,
          duration: 2.2, ease: "power2.out"
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
        if (dayBtn) dayBtn.classList.add('active');
        if (nightBtn) nightBtn.classList.remove('active');
      }
    }

    if (dayBtn) dayBtn.addEventListener('click', () => updateTheme(false));
    if (nightBtn) nightBtn.addEventListener('click', () => updateTheme(true));

    // Check system preference on load
    const userPrefersNight = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (userPrefersNight) {
      updateTheme(true, false);
    }

    // Animation Loop
    let lastTime = performance.now();
    const tick = () => {
      const time = performance.now();
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Update Sky uniforms
      if (skyBackground && skyBackground.material.uniforms) {
        skyBackground.material.uniforms.uTime.value = time * 0.001;
        skyBackground.material.uniforms.uSkyColor.value.copy(window.activeTheme.topStart);
        skyBackground.material.uniforms.uSkyColorBottom.value.copy(window.activeTheme.bottomStart);

        // Twinkling stars brightness linked to mouseY coordinates
        const starRatio = Math.max(0.1, 1.0 - (mouseY / window.innerHeight));
        const activeStars = window.activeTheme.minStars + (window.activeTheme.maxStars - window.activeTheme.minStars) * starRatio;
        skyBackground.material.uniforms.uStarOpacity.value = activeStars;
      }

      // Update Clouds physics & instances
      if (clouds && typeof clouds.update === 'function') {
        clouds.update(dt);
      }

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    tick();
  }

  // ==========================================
  // Lenis Smooth Scroll Initialization
  // ==========================================
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false
    });

    const scrollLoop = (time) => {
      lenis.raf(time);
      requestAnimationFrame(scrollLoop);
    };
    requestAnimationFrame(scrollLoop);
  }

  // ==========================================
  // Glassmorphic Accordion expanding logic (Card-Wide Click)
  // ==========================================
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(faqItem => {
    faqItem.addEventListener('click', (e) => {
      // Prevent toggling when clicking inside the content box (allows text selection)
      if (e.target.closest('.faq-content-box')) {
        return;
      }

      const trigger = faqItem.querySelector('.faq-trigger');
      const contentBox = faqItem.querySelector('.faq-content-box');
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      
      // Close other accordion items for clean UX
      faqItems.forEach(otherItem => {
        if (otherItem !== faqItem) {
          const otherTrigger = otherItem.querySelector('.faq-trigger');
          const otherContent = otherItem.querySelector('.faq-content-box');
          otherTrigger.setAttribute('aria-expanded', 'false');
          otherContent.setAttribute('aria-hidden', 'true');
          gsap.to(otherContent, { height: 0, duration: 0.35, ease: "power2.out" });
          otherItem.classList.remove('faq-active');
        }
      });

      // Toggle current item
      trigger.setAttribute('aria-expanded', !isExpanded);
      contentBox.setAttribute('aria-hidden', isExpanded);
      
      if (!isExpanded) {
        faqItem.classList.add('faq-active');
        // Animate open
        gsap.fromTo(contentBox, 
          { height: 0 }, 
          { height: "auto", duration: 0.45, ease: "power3.out" }
        );
      } else {
        faqItem.classList.remove('faq-active');
        // Animate close
        gsap.to(contentBox, { height: 0, duration: 0.35, ease: "power2.out" });
      }
    });
  });

  // Dynamic Footer Year
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }
});
