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
  const isCommunityPage = document.body.classList.contains('community-page');
  
  // Only initialize FAQ's basic sky background if NOT on the community page
  if (canvas && typeof THREE !== 'undefined' && !isCommunityPage) {
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
        topStart: new THREE.Color('#0088cc'),   // Vivid sky top
        topEnd: new THREE.Color('#002d5a'),
        bottomStart: new THREE.Color('#002d5a'), // Darker blue bottom (matches home darker end)
        bottomEnd: new THREE.Color('#005099'),
        minStars: 0.0,
        maxStars: 1.0
      },
      night: {
        topStart: new THREE.Color('#040a1c'),
        topEnd: new THREE.Color('#040a1c'),
        bottomStart: new THREE.Color('#0e1b38'),
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
    // Animation Loop
    let lastTime = performance.now();
    const tick = () => {
      const time = performance.now();
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Update Sky uniforms — feed distinct top and bottom colours for proper gradient
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
  } else {
    // Global fallback for Theme Toggle Buttons when basic WebGL is skipped (e.g. Community Page)
    const dayBtn = document.getElementById('theme-btn-day');
    const nightBtn = document.getElementById('theme-btn-night');

    if (dayBtn) {
      dayBtn.addEventListener('click', () => {
        document.body.classList.remove('space-night-theme');
        dayBtn.classList.add('active');
        if (nightBtn) nightBtn.classList.remove('active');
      });
    }

    if (nightBtn) {
      nightBtn.addEventListener('click', () => {
        document.body.classList.add('space-night-theme');
        nightBtn.classList.add('active');
        if (dayBtn) dayBtn.classList.remove('active');
      });
    }
  }

  // ==========================================
  // Lenis Smooth Scroll Initialization (Desktop Only)
  // ==========================================
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;

  if (!isTouchDevice && typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      infinite: false
    });

    const scrollLoop = (time) => {
      if (lenis) lenis.raf(time);
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

  // Automatic prompt copy & helpful toast on clicking AI icon links
  const aiPromptString = "I’m researching mac apps that can automate parts of my life, making my computer work possible just by voice. I want to know how Glide does it, building personal memory while working beside me like an assistant. Summarize the highlights from Glide's website: https://www.justglide.app";
  
  // Create micro toast element
  const toast = document.createElement('div');
  toast.className = 'ai-copy-toast';
  toast.innerHTML = '<span>Prompt copied to clipboard! Press <strong>Cmd+V</strong> to paste.</span>';
  document.body.appendChild(toast);

  let toastTimer = null;

  document.querySelectorAll('.faq-ai-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const company = btn.getAttribute('data-tooltip') || 'AI';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(aiPromptString).then(() => {
          toast.innerHTML = `<span>Prompt copied for <strong>${company}</strong>! Press <strong>Cmd+V</strong> to paste.</span>`;
          toast.classList.add('show');
          if (toastTimer) clearTimeout(toastTimer);
          toastTimer = setTimeout(() => {
            toast.classList.remove('show');
          }, 3500);
        }).catch(err => {
          console.error('Failed to auto-copy prompt:', err);
        });
      }
    });
  });
});
