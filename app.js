/* Crank Landing Page JS */

document.addEventListener('DOMContentLoaded', () => {
  // Global reference to Lenis smooth scroll
  let lenis = null;

  // ==========================================
  // Three.js WebGL Interactive Background Orb
  // ==========================================
  const canvas = document.getElementById('webgl-canvas');
  if (canvas && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Geometry & Material (Glassmorphic Physical Material)
    const geometry = new THREE.IcosahedronGeometry(2, 28);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.05,
      transmission: 0.9,
      thickness: 1.5,
      ior: 1.5,
      reflectivity: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // Copy original vertices for displacement calculations
    const positionAttribute = geometry.attributes.position;
    const originalPositions = positionAttribute.array.slice();
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 10, 5);
    scene.add(dirLight);
    
    const light1 = new THREE.PointLight(0x2a7f76, 3, 20); // Emerald green
    light1.position.set(5, 5, 5);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0xa87920, 2.5, 20); // Ochre gold
    light2.position.set(-5, -5, 5);
    scene.add(light2);
    
    // Global properties that we animate via GSAP on transitions
    window.webglOrb = {
      baseX: 2.0,
      baseY: 0.2,
      baseZ: 0.0,
      scaleX: 1.0,
      scaleY: 1.0,
      scaleZ: 1.0,
      waveAmplitude: 0.25,
      waveSpeed: 0.6,
      waveFrequency: 1.5
    };
    window.webglOrbMaterial = material;
    
    // Position tracking (baseline + mouse attraction offset)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    window.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetX = normX * 1.5;
      targetY = normY * 1.5;
    });
    
    // Window Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
    
    // Render loop
    function animateWebgl() {
      requestAnimationFrame(animateWebgl);
      
      const time = Date.now() * 0.001;
      
      // Interpolate mouse coordinates (smooth attraction lag)
      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;
      
      // Apply base position (GSAP animated) + cursor offset
      mesh.position.x = window.webglOrb.baseX + mouseX;
      mesh.position.y = window.webglOrb.baseY + mouseY;
      mesh.position.z = window.webglOrb.baseZ;
      
      // Apply base scale (GSAP animated)
      mesh.scale.set(window.webglOrb.scaleX, window.webglOrb.scaleY, window.webglOrb.scaleZ);
      
      // Rotate mesh gently
      mesh.rotation.y = time * 0.05;
      mesh.rotation.x = time * 0.03;
      
      // Orbit point lights to cast moving highlights
      light1.position.x = Math.sin(time * 0.4) * 6;
      light1.position.y = Math.cos(time * 0.5) * 6;
      light1.position.z = Math.sin(time * 0.3) * 6;
      
      light2.position.x = Math.cos(time * 0.3) * 6;
      light2.position.y = Math.sin(time * 0.4) * 6;
      light2.position.z = Math.cos(time * 0.5) * 6;
      
      // Deform mesh vertices (fluid ripple morph)
      const speed = window.webglOrb.waveSpeed;
      const freq = window.webglOrb.waveFrequency;
      const amp = window.webglOrb.waveAmplitude;
      
      for (let i = 0; i < positionAttribute.count; i++) {
        const vx = originalPositions[i * 3];
        const vy = originalPositions[i * 3 + 1];
        const vz = originalPositions[i * 3 + 2];
        
        const len = Math.sqrt(vx*vx + vy*vy + vz*vz);
        
        // Simulating organic blob displacement using overlapping sin/cos coordinates
        const offset = Math.sin(vx * freq + time * speed) * 
                       Math.cos(vy * freq + time * speed) * 
                       Math.sin(vz * freq + time * speed) * amp;
                       
        const ratio = (len + offset) / len;
        positionAttribute.setXYZ(i, vx * ratio, vy * ratio, vz * ratio);
      }
      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
      
      renderer.render(scene, camera);
    }
    
    // Start animation loop
    animateWebgl();
  }

  // ==========================================
  // 1. Custom Cursor Tracking (with physics lag)
  // ==========================================
  const cursor = document.getElementById('custom-cursor');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let isSimulating = false;
  let targetSimX = 0;
  let targetSimY = 0;

  // Move custom cursor to start position immediately
  cursor.style.left = `${cursorX}px`;
  cursor.style.top = `${cursorY}px`;

  // Track real mouse movements
  window.addEventListener('mousemove', (e) => {
    if (!isSimulating) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
  });

  // Cursor interpolation logic (ease-out)
  const interpolationFactor = 0.15; // Smooth lag factor
  function animateCursor() {
    if (isSimulating) {
      cursorX += (targetSimX - cursorX) * interpolationFactor;
      cursorY += (targetSimY - cursorY) * interpolationFactor;
    } else {
      cursorX += (mouseX - cursorX) * interpolationFactor;
      cursorY += (mouseY - cursorY) * interpolationFactor;
    }

    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    requestAnimationFrame(animateCursor);
  }
  requestAnimationFrame(animateCursor);

  // Handle clicking events during simulation (pulse cursor effect)
  function triggerCursorPulse() {
    cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
    setTimeout(() => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 150);
  }

  // ==========================================
  // 2. Theme Pointer Color Swapper
  // ==========================================
  const themeDots = document.querySelectorAll('.dot-btn');
  themeDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      // Remove active classes
      themeDots.forEach(d => d.classList.remove('active'));
      // Set active to clicked
      dot.classList.add('active');
      
      const selectedColor = dot.getAttribute('data-color');
      document.body.setAttribute('data-cursor-color', selectedColor);
    });
  });

  // ==========================================
  // 3. Interactive Simulator Engine
  // ==========================================
  const notch = document.getElementById('mac-notch');
  const notchStatus = document.getElementById('notch-status');
  const screenContent = document.getElementById('screen-content');
  const appWindow = document.getElementById('app-window');
  const appTitle = document.getElementById('app-window-title');
  const appBody = document.getElementById('app-window-body');
  const agentWindow = document.getElementById('agent-window');
  const agentEmptyState = document.getElementById('agent-empty-state');
  const agentCardsContainer = document.getElementById('agent-cards-container');
  const finderWindow = document.getElementById('finder-window');
  const screenIndicator = document.getElementById('screen-indicator');
  const speechOverlay = document.getElementById('speech-overlay');
  const speechText = document.getElementById('speech-text');
  const demoCards = document.querySelectorAll('.sim-tab');

  let simulatorTimeoutId = null;

  // Simulator database of layouts and animations
  const demos = {
    influencers: {
      title: "Browser - LinkedIn Search",
      initHTML: `
        <div class="browser-mock">
          <div class="browser-url-bar">https://www.linkedin.com/search</div>
          <div class="mock-search-results" id="search-results-box">
            <div style="color: var(--text-muted); font-size: 0.75rem; text-align: center; margin-top: 1.5rem;">
              LinkedIn Search Field (Inactive)
            </div>
          </div>
        </div>
      `,
      steps: [
        {
          text: "Let's find tech influencers in San Francisco. Hold Control + Option to summon Crank...",
          notchState: "Listening...",
          notchActive: true,
          duration: 2500,
          action: (resolve) => {
            screenIndicator.classList.add('active');
            resolve();
          }
        },
        {
          text: '"Crank, find me 10 micro-influencers in tech on LinkedIn and summarize them."',
          notchState: "Thinking...",
          duration: 3000,
          action: (resolve) => {
            isSimulating = true;
            const searchBox = document.querySelector('.browser-url-bar');
            if (searchBox) {
              const rect = searchBox.getBoundingClientRect();
              targetSimX = rect.left + 50;
              targetSimY = rect.top + 15;
            }
            resolve();
          }
        },
        {
          text: "Spawning background Agent to scan profiles...",
          notchState: "Acting...",
          duration: 3500,
          action: (resolve) => {
            triggerCursorPulse();
            agentEmptyState.style.display = 'none';
            agentCardsContainer.innerHTML = `
              <div class="agent-card-item">
                <div class="agent-card-top">
                  <span class="agent-card-title">Search & List</span>
                  <span class="agent-card-status" id="sim-agent-status">Connecting to LinkedIn...</span>
                </div>
                <div class="agent-progress-bar">
                  <div class="agent-progress-fill" id="sim-progress" style="width: 15%"></div>
                </div>
              </div>
            `;
            const resultsBox = document.getElementById('search-results-box');
            if (resultsBox) {
              resultsBox.innerHTML = `<div style="font-family: var(--font-mono); color: var(--color-primary); font-size: 0.75rem;">Searching: "tech micro-influencer SF"...</div>`;
            }
            resolve();
          }
        },
        {
          text: "Agent is driving the LinkedIn page to extract results in the background...",
          notchState: "Acting...",
          duration: 4000,
          action: (resolve) => {
            const agentStatus = document.getElementById('sim-agent-status');
            const progress = document.getElementById('sim-progress');
            if (agentStatus) agentStatus.innerText = "Extracting profiles (4/10)...";
            if (progress) progress.style.width = "50%";

            const resultsBox = document.getElementById('search-results-box');
            if (resultsBox) {
              resultsBox.innerHTML = `
                <div class="mock-search-results">
                  <div class="mock-search-item highlighted">
                    <h5>Alex Chen • Founder & Tech Writer</h5>
                    <p>12K followers • Focus: NextJS, WebDev</p>
                  </div>
                  <div class="mock-search-item">
                    <h5>Sarah Jenkins • AI Researcher</h5>
                    <p>18K followers • Focus: PyTorch, ML Ops</p>
                  </div>
                </div>
              `;
            }

            setTimeout(() => {
              const item = document.querySelector('.mock-search-item');
              if (item) {
                const rect = item.getBoundingClientRect();
                targetSimX = rect.left + 80;
                targetSimY = rect.top + 20;
              }
            }, 500);
            resolve();
          }
        },
        {
          text: "Task complete. Saving results as Markdown to your local Agent Folder.",
          notchState: "Idle",
          duration: 3500,
          action: (resolve) => {
            const agentStatus = document.getElementById('sim-agent-status');
            const progress = document.getElementById('sim-progress');
            if (agentStatus) {
              agentStatus.innerText = "Completed";
              agentStatus.style.color = "var(--primary-green)";
            }
            if (progress) progress.style.width = "100%";

            const agentCard = document.querySelector('.agent-card-item');
            if (agentCard) {
              const artifact = document.createElement('div');
              artifact.className = 'agent-artifact-pill';
              artifact.innerHTML = `
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                 influencers_tech.md
              `;
              agentCard.appendChild(artifact);
            }

            isSimulating = false;
            screenIndicator.classList.remove('active');
            resolve();
          }
        }
      ]
    },

    error: {
      title: "Terminal - Node App Build",
      initHTML: `
        <div class="terminal-mock">
          <div class="terminal-line"><span style="color: #888;">akashs@macbook project %</span> npm run build</div>
          <div class="terminal-line terminal-error-red">Failed to compile with 1 error:</div>
          <div class="terminal-line terminal-error-red">./src/app.js Line 45: Cannot read property 'map' of undefined.</div>
          <div class="terminal-line" style="color: #888;">akashs@macbook project % <span class="terminal-cursor">█</span></div>
        </div>
      `,
      steps: [
        {
          text: "You see an error in the terminal. Let's ask Crank to look at the screen.",
          notchState: "Listening...",
          notchActive: true,
          duration: 2500,
          action: (resolve) => {
            screenIndicator.classList.add('active');
            resolve();
          }
        },
        {
          text: '"Crank, explain this build error and help me fix it in my editor."',
          notchState: "Thinking...",
          duration: 3500,
          action: (resolve) => {
            isSimulating = true;
            const errorLine = document.querySelector('.terminal-error-red');
            if (errorLine) {
              const rect = errorLine.getBoundingClientRect();
              targetSimX = rect.left + 100;
              targetSimY = rect.top + 8;
            }
            resolve();
          }
        },
        {
          text: "Analyzing compilation error and generating fixes...",
          notchState: "Acting...",
          duration: 4000,
          action: (resolve) => {
            triggerCursorPulse();
            agentEmptyState.style.display = 'none';
            agentCardsContainer.innerHTML = `
              <div class="agent-card-item">
                <div class="agent-card-top">
                  <span class="agent-card-title">Explain Error</span>
                  <span class="agent-card-status" id="sim-agent-status">Reading src/app.js...</span>
                </div>
                <div class="agent-progress-bar">
                  <div class="agent-progress-fill" id="sim-progress" style="width: 30%"></div>
                </div>
              </div>
            `;

            setTimeout(() => {
              appTitle.innerText = "VS Code - src/app.js";
              appBody.innerHTML = `
                <div class="terminal-mock" style="color: #bbb;">
                  <div class="terminal-line"><span style="color: #666;">43 |</span> const renderList = (data) => {</div>
                  <div class="terminal-line terminal-error-red"><span style="color: #666;">44 |</span>   return data.items.map(item => {</div>
                  <div class="terminal-line"><span style="color: #666;">45 |</span>     return \`<li>\${item.name}</li>\`;</div>
                  <div class="terminal-line"><span style="color: #666;">46 |</span>   });</div>
                  <div class="terminal-line"><span style="color: #666;">47 |</span> };</div>
                </div>
              `;
            }, 1000);
            resolve();
          }
        },
        {
          text: '"The data object is undefined when loading. I am inserting an optional chain fallback."',
          notchState: "Acting...",
          duration: 3500,
          action: (resolve) => {
            const agentStatus = document.getElementById('sim-agent-status');
            const progress = document.getElementById('sim-progress');
            if (agentStatus) agentStatus.innerText = "Applying safe fallback code...";
            if (progress) progress.style.width = "75%";

            setTimeout(() => {
              const errorLine = document.querySelector('.terminal-error-red');
              if (errorLine) {
                const rect = errorLine.getBoundingClientRect();
                targetSimX = rect.left + 150;
                targetSimY = rect.top + 8;
              }
            }, 500);

            setTimeout(() => {
              appBody.innerHTML = `
                <div class="terminal-mock" style="color: #bbb;">
                  <div class="terminal-line"><span style="color: #666;">43 |</span> const renderList = (data) => {</div>
                  <div class="terminal-line" style="color: #4ade80;"><span style="color: #666;">44 |</span>   return (data?.items || []).map(item => {</div>
                  <div class="terminal-line"><span style="color: #666;">45 |</span>     return \`<li>\${item.name}</li>\`;</div>
                  <div class="terminal-line"><span style="color: #666;">46 |</span>   });</div>
                  <div class="terminal-line"><span style="color: #666;">47 |</span> };</div>
                </div>
              `;
              triggerCursorPulse();
            }, 1500);
            resolve();
          }
        },
        {
          text: "Compilation issues resolved. Error analysis report saved.",
          notchState: "Idle",
          duration: 3500,
          action: (resolve) => {
            const agentStatus = document.getElementById('sim-agent-status');
            const progress = document.getElementById('sim-progress');
            if (agentStatus) {
              agentStatus.innerText = "Completed";
              agentStatus.style.color = "var(--primary-green)";
            }
            if (progress) progress.style.width = "100%";

            const agentCard = document.querySelector('.agent-card-item');
            if (agentCard) {
              const artifact = document.createElement('div');
              artifact.className = 'agent-artifact-pill';
              artifact.innerHTML = `
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                 error_fix_report.md
              `;
              agentCard.appendChild(artifact);
            }

            setTimeout(() => {
              appTitle.innerText = "Terminal - Build success";
              appBody.innerHTML = `
                <div class="terminal-mock">
                  <div class="terminal-line"><span style="color: #888;">akashs@macbook project %</span> npm run build</div>
                  <div class="terminal-line" style="color: #4ade80;">✔ Compiled successfully in 410ms.</div>
                  <div class="terminal-line" style="color: #888;">akashs@macbook project % <span class="terminal-cursor">█</span></div>
                </div>
              `;
            }, 1000);

            isSimulating = false;
            screenIndicator.classList.remove('active');
            resolve();
          }
        }
      ]
    },

    calendar: {
      title: "Calendar.app - Tomorrow",
      initHTML: `
        <div class="calendar-mock">
          <div class="calendar-day-header">Friday, June 26, 2026</div>
          <div class="calendar-event" id="meeting-block">
            <div style="font-weight: 600;">10:00 AM — Sync with Thomas</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Composio Integration Review</div>
          </div>
          <div class="calendar-event">
            <div style="font-weight: 600;">1:00 PM — Design Review</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Crank Webpage Wireframes</div>
          </div>
        </div>
      `,
      steps: [
        {
          text: "Need to clear your morning? Let's voice reschedule.",
          notchState: "Listening...",
          notchActive: true,
          duration: 2500,
          action: (resolve) => {
            screenIndicator.classList.add('active');
            resolve();
          }
        },
        {
          text: '"Crank, look at my day tomorrow and reschedule the 10am to 3pm."',
          notchState: "Thinking...",
          duration: 3000,
          action: (resolve) => {
            isSimulating = true;
            const meeting = document.getElementById('meeting-block');
            if (meeting) {
              const rect = meeting.getBoundingClientRect();
              targetSimX = rect.left + 80;
              targetSimY = rect.top + 20;
            }
            resolve();
          }
        },
        {
          text: "Checking EventKit availability and drafting updates...",
          notchState: "Acting...",
          duration: 3500,
          action: (resolve) => {
            triggerCursorPulse();
            agentEmptyState.style.display = 'none';
            agentCardsContainer.innerHTML = `
              <div class="agent-card-item">
                <div class="agent-card-top">
                  <span class="agent-card-title">Reschedule Sync</span>
                  <span class="agent-card-status" id="sim-agent-status">Writing to AppleScript/EventKit...</span>
                </div>
                <div class="agent-progress-bar">
                  <div class="agent-progress-fill" id="sim-progress" style="width: 40%"></div>
                </div>
              </div>
            `;
            resolve();
          }
        },
        {
          text: "Modifying meeting details and verifying conflicts at 3:00 PM...",
          notchState: "Acting...",
          duration: 3500,
          action: (resolve) => {
            const agentStatus = document.getElementById('sim-agent-status');
            const progress = document.getElementById('sim-progress');
            if (agentStatus) agentStatus.innerText = "Moving event to 15:00...";
            if (progress) progress.style.width = "80%";

            appBody.innerHTML = `
              <div class="calendar-mock">
                <div class="calendar-day-header">Friday, June 26, 2026</div>
                <div class="calendar-event" style="opacity: 0.3;">
                  <div style="font-weight: 600; text-decoration: line-through;">10:00 AM — Sync with Thomas</div>
                </div>
                <div class="calendar-event">
                  <div style="font-weight: 600;">1:00 PM — Design Review</div>
                </div>
                <div class="calendar-event modified">
                  <div style="font-weight: 600;">3:00 PM — Sync with Thomas</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Moved via Crank</div>
                </div>
              </div>
            `;

            setTimeout(() => {
              const newMeeting = document.querySelector('.modified');
              if (newMeeting) {
                const rect = newMeeting.getBoundingClientRect();
                targetSimX = rect.left + 80;
                targetSimY = rect.top + 20;
              }
            }, 500);
            resolve();
          }
        },
        {
          text: "Meeting moved successfully. Notification sent to Thomas.",
          notchState: "Idle",
          duration: 3000,
          action: (resolve) => {
            const agentStatus = document.getElementById('sim-agent-status');
            const progress = document.getElementById('sim-progress');
            if (agentStatus) {
              agentStatus.innerText = "Completed";
              agentStatus.style.color = "var(--primary-green)";
            }
            if (progress) progress.style.width = "100%";

            const agentCard = document.querySelector('.agent-card-item');
            if (agentCard) {
              const artifact = document.createElement('div');
              artifact.className = 'agent-artifact-pill';
              artifact.innerHTML = `
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                 calendar-resched.md
              `;
              agentCard.appendChild(artifact);
            }

            isSimulating = false;
            screenIndicator.classList.remove('active');
            resolve();
          }
        }
      ]
    },

    email: {
      title: "Mail client - Inbox",
      initHTML: `
        <div class="browser-mock">
          <div class="browser-url-bar">Inbox (2 unread)</div>
          <div class="mock-search-results">
            <div class="mock-search-item highlighted" id="mail-item-1">
              <h5>Priya • Comments on Notch spec</h5>
              <p>Hey, I looked at the Figma designs for the Notch, can you update...</p>
            </div>
            <div class="mock-search-item" id="mail-item-2">
              <h5>Dan • Build pipeline failure on M2</h5>
              <p>The turn_detector script crashed with exit status 1...</p>
            </div>
          </div>
        </div>
      `,
      steps: [
        {
          text: "Summoning Crank to summarize and write response drafts...",
          notchState: "Listening...",
          notchActive: true,
          duration: 2500,
          action: (resolve) => {
            screenIndicator.classList.add('active');
            resolve();
          }
        },
        {
          text: '"Crank, summarize my unread email from Priya and draft replies."',
          notchState: "Thinking...",
          duration: 3000,
          action: (resolve) => {
            isSimulating = true;
            const mail = document.getElementById('mail-item-1');
            if (mail) {
              const rect = mail.getBoundingClientRect();
              targetSimX = rect.left + 50;
              targetSimY = rect.top + 15;
            }
            resolve();
          }
        },
        {
          text: "Retrieving thread and matching context against Slack/Notion databases...",
          notchState: "Acting...",
          duration: 3500,
          action: (resolve) => {
            triggerCursorPulse();
            agentEmptyState.style.display = 'none';
            agentCardsContainer.innerHTML = `
              <div class="agent-card-item">
                <div class="agent-card-top">
                  <span class="agent-card-title">Triage Inbox</span>
                  <span class="agent-card-status" id="sim-agent-status">Reading Notion &amp; Drive...</span>
                </div>
                <div class="agent-progress-bar">
                  <div class="agent-progress-fill" id="sim-progress" style="width: 25%"></div>
                </div>
              </div>
            `;
            resolve();
          }
        },
        {
          text: "Composing email draft matching your voice style rules...",
          notchState: "Acting...",
          duration: 4000,
          action: (resolve) => {
            const agentStatus = document.getElementById('sim-agent-status');
            const progress = document.getElementById('sim-progress');
            if (agentStatus) agentStatus.innerText = "Drafting Gmail response...";
            if (progress) progress.style.width = "70%";

            appBody.innerHTML = `
              <div class="browser-mock">
                <div class="browser-url-bar">Gmail Draft (To: Priya)</div>
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; font-size: 0.75rem;">
                  <strong style="color: var(--color-primary);">Draft:</strong> Hey Priya, I saw the comments. I'll update the notch visual curves to squircle and sync with Dee tomorrow morning.
                </div>
              </div>
            `;
            resolve();
          }
        },
        {
          text: "Draft saved in Gmail successfully. Summary report exported.",
          notchState: "Idle",
          duration: 3500,
          action: (resolve) => {
            const agentStatus = document.getElementById('sim-agent-status');
            const progress = document.getElementById('sim-progress');
            if (agentStatus) {
              agentStatus.innerText = "Completed";
              agentStatus.style.color = "var(--primary-green)";
            }
            if (progress) progress.style.width = "100%";

            const agentCard = document.querySelector('.agent-card-item');
            if (agentCard) {
              const artifact = document.createElement('div');
              artifact.className = 'agent-artifact-pill';
              artifact.innerHTML = `
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                 email_triage.md
              `;
              agentCard.appendChild(artifact);
            }

            isSimulating = false;
            screenIndicator.classList.remove('active');
            resolve();
          }
        }
      ]
    }
  };

  // Run a specified demo timeline
  function runDemo(demoKey) {
    if (simulatorTimeoutId) {
      clearTimeout(simulatorTimeoutId);
    }
    isSimulating = false;
    notch.classList.remove('active');
    notchStatus.innerText = "Idle";
    screenIndicator.classList.remove('active');
    speechOverlay.classList.remove('active');

    const demo = demos[demoKey];
    if (!demo) return;

    // Reset UI states
    appTitle.innerText = demo.title;
    appBody.innerHTML = demo.initHTML;
    agentEmptyState.style.display = 'flex';
    agentCardsContainer.innerHTML = '';

    let stepIndex = 0;
    function executeNextStep() {
      if (stepIndex >= demo.steps.length) {
        isSimulating = false;
        notch.classList.remove('active');
        notchStatus.innerText = "Idle";
        speechText.innerText = "Feel free to try another query!";
        return;
      }

      const step = demo.steps[stepIndex];
      notchStatus.innerText = step.notchState;
      if (step.notchState !== "Idle") {
        notch.classList.add('active');
      } else {
        notch.classList.remove('active');
      }

      speechText.innerText = step.text;
      speechOverlay.classList.add('active');

      new Promise((resolve) => {
        step.action(resolve);
      }).then(() => {
        stepIndex++;
        simulatorTimeoutId = setTimeout(executeNextStep, step.duration);
      });
    }

    executeNextStep();
  }

  // Bind showcase tabs deck clicks to smoothly scroll via Lenis
  demoCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const stepName = card.getAttribute('data-step');
      const targetStepElement = document.querySelector(`.scrolly-step[data-step="${stepName}"]`);
      if (targetStepElement) {
        lenis.scrollTo(targetStepElement);
      }
    });
  });

  // ==========================================
  // 4. On-Device Redaction Demo
  // ==========================================
  const btnRedact = document.getElementById('btn-toggle-redact');
  const redactStateText = document.getElementById('redact-state');
  const redactableFields = document.querySelectorAll('.redactable');

  redactableFields.forEach(el => el.classList.add('redacted'));

  function setRedactionState(enabled) {
    if (enabled) {
      redactableFields.forEach(el => el.classList.add('redacted'));
      if (redactStateText) redactStateText.innerText = "ON";
      if (btnRedact) btnRedact.classList.add('active');
    } else {
      redactableFields.forEach(el => el.classList.remove('redacted'));
      if (redactStateText) redactStateText.innerText = "OFF";
      if (btnRedact) btnRedact.classList.remove('active');
    }
  }

  if (btnRedact) {
    btnRedact.addEventListener('click', () => {
      const isRedacted = redactStateText.innerText === "ON";
      setRedactionState(!isRedacted);
    });
  }

  // ==========================================
  // 5. Simulated Memory Database Lookup
  // ==========================================
  const searchInput = document.getElementById('memory-search-input');
  const searchBtn = document.getElementById('btn-search-memory');
  const resultsContainer = document.getElementById('memory-results');

  const memoryDatabase = [
    {
      keywords: ['thomas', 'composio', 'oauth', 'slack'],
      meta: "Found 2 days ago in Slack",
      content: "Thomas is the engineering lead for Composio. We need to ping him about calendar OAuth tokens."
    },
    {
      keywords: ['project', 'crank', 'spec', 'version'],
      meta: "Found yesterday in local directory",
      content: "Project Crank spec version 0.1 draft completed. Needs marketing landing page."
    },
    {
      keywords: ['clicky', 'competitor', 'pricing'],
      meta: "Found 4 days ago in Web research",
      content: "Clicky pricing tightened. Standard is $20, Max is $40. Overage charges are soft-capped."
    },
    {
      keywords: ['akash', 'author', 'contact'],
      meta: "Found 1 week ago in Contacts",
      content: "Akash is the product lead for Crank app. Contact him at akash@crank.ai."
    }
  ];

  function queryMemory(customVal) {
    const query = (customVal || searchInput.value || "").toLowerCase().trim();
    if (!query) {
      resultsContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">Type a query to search local SQLite database memory...</div>`;
      return;
    }

    const matches = memoryDatabase.filter(item => {
      return item.keywords.some(keyword => query.includes(keyword) || keyword.includes(query));
    });

    if (matches.length > 0) {
      resultsContainer.innerHTML = matches.map(item => `
        <div class="memory-item">
          <span class="memory-meta">${item.meta}</span>
          <p>"${item.content}"</p>
        </div>
      `).join('');
    } else {
      resultsContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">0 matches found for "${query}"</div>`;
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => queryMemory());
  }

  // ==========================================
  // 6. SCROLL-LINKED NARRATIVE CONTROLLER (GSAP + Lenis)
  // ==========================================
  // Register GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Initialize Lenis smooth scroll
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  // Link Lenis scroll to ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  // Hook Lenis into GSAP ticker
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // Turn off GSAP lag smoothing to keep scrolling locked
  gsap.ticker.lagSmoothing(0);

  const steps = document.querySelectorAll('.scrolly-step');
  
  let activeStep = 'hero';
  let redactionInterval = null;
  let installerInterval = null;

  // Transition mock screen content to reflect current scroll step
  function transitionSimulatorTo(stepName) {
    // Clear any timers
    if (simulatorTimeoutId) clearTimeout(simulatorTimeoutId);
    clearInterval(redactionInterval);
    clearInterval(installerInterval);
    isSimulating = false;
    notch.classList.remove('active');
    notchStatus.innerText = "Idle";
    screenIndicator.classList.remove('active');
    speechOverlay.classList.remove('active');

    // Default window visibility resets
    appWindow.style.opacity = '1';
    agentWindow.style.opacity = '1';
    finderWindow.classList.remove('active');

    // Trigger WebGL Orb transition state
    if (window.webglOrb && window.webglOrbMaterial && typeof gsap !== 'undefined') {
      let targetX = 2.0, targetY = 0.2, targetZ = 0.0;
      let targetScale = 1.0;
      let targetAmp = 0.25;
      let targetRoughness = 0.15;
      let targetThickness = 1.5;
      let targetTransmission = 0.9;
      
      if (stepName === 'hero') {
        targetX = 2.0; targetY = 0.2; targetZ = 0.0;
        targetScale = 1.0;
        targetAmp = 0.25;
        targetRoughness = 0.15; targetThickness = 1.5; targetTransmission = 0.9;
      } else if (stepName === 'notch-wave') {
        targetX = 0.0; targetY = 3.2; targetZ = 0.0;
        targetScale = 0.45;
        targetAmp = 0.20;
        targetRoughness = 0.1; targetThickness = 0.8; targetTransmission = 0.8;
      } else if (stepName === 'memory-ledger') {
        targetX = -2.2; targetY = -0.5; targetZ = 0.0;
        targetScale = 0.9;
        targetAmp = 0.35;
        targetRoughness = 0.25; targetThickness = 2.0; targetTransmission = 0.8;
      } else if (stepName === 'privacy-filter') {
        targetX = 0.0; targetY = 0.0; targetZ = -1.0;
        targetScale = 1.8;
        targetAmp = 0.10;
        targetRoughness = 0.65; targetThickness = 5.0; targetTransmission = 0.95;
      } else if (stepName === 'setup-guide') {
        targetX = 2.0; targetY = -1.2; targetZ = 0.0;
        targetScale = 1.1;
        targetAmp = 0.20;
        targetRoughness = 0.2; targetThickness = 1.2; targetTransmission = 0.9;
      }
      
      gsap.to(window.webglOrb, {
        baseX: targetX,
        baseY: targetY,
        baseZ: targetZ,
        scaleX: targetScale,
        scaleY: targetScale,
        scaleZ: targetScale,
        waveAmplitude: targetAmp,
        duration: 1.5,
        ease: "power2.out",
        overwrite: "auto"
      });
      
      gsap.to(window.webglOrbMaterial, {
        roughness: targetRoughness,
        thickness: targetThickness,
        transmission: targetTransmission,
        duration: 1.5,
        ease: "power2.out",
        overwrite: "auto"
      });
    }

    if (stepName === 'hero') {
      // Clean home state
      appTitle.innerText = "Browser - Crank Guide";
      appBody.innerHTML = `
        <div style="font-size: 0.8rem; text-align: center; color: var(--text-muted); padding-top: 1.5rem;">
          Welcome to Crank Desktop.<br>Scroll to begin your workspace agent story.
        </div>
      `;
      agentEmptyState.style.display = 'flex';
      agentCardsContainer.innerHTML = '';
      
    } else if (stepName === 'notch-wave') {
      // Autoplay the influencers demo
      runDemo('influencers');
      
    } else if (stepName === 'memory-ledger') {
      // Simulate memory search query
      appTitle.innerText = "Browser - localdb.sqlite";
      appBody.innerHTML = `
        <div class="browser-mock">
          <div class="browser-url-bar">SQLite Console - Local Memory Query</div>
          <div id="sqlite-status" style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-primary); padding: 5px;">
            sqlite> SELECT content FROM ledger WHERE query LIKE '%thomas%';
          </div>
          <div id="sqlite-results" style="font-size: 0.65rem; padding: 2px 5px; opacity: 0;">
            <div style="border-left: 2px solid var(--color-primary); padding-left: 4px; background: rgba(var(--color-primary-rgb), 0.03);">
              <strong>Slack context:</strong> Thomas is lead for calendar oauth tokens.
            </div>
          </div>
        </div>
      `;
      agentEmptyState.style.display = 'none';
      agentCardsContainer.innerHTML = `
        <div class="agent-card-item">
          <span class="agent-card-title">Memory Resolution</span>
          <span class="agent-card-status" style="color: var(--primary-green);">Resolved slack-oauth-token</span>
        </div>
      `;

      isSimulating = true;
      
      // Move cursor to SQLite search input inside text column
      setTimeout(() => {
        if (searchInput) {
          searchInput.value = '';
          let text = 'Thomas';
          let i = 0;
          const typing = setInterval(() => {
            searchInput.value += text[i];
            i++;
            if (i >= text.length) {
              clearInterval(typing);
              
              // Move cursor to Query button
              const rect = searchBtn.getBoundingClientRect();
              targetSimX = rect.left + 25;
              targetSimY = rect.top + 10;

              setTimeout(() => {
                triggerCursorPulse();
                queryMemory('Thomas');
                
                // Show result on simulator screen too
                const sqResults = document.getElementById('sqlite-results');
                if (sqResults) sqResults.style.opacity = '1';
                
              }, 800);
            }
          }, 150);
        }
      }, 1000);

    } else if (stepName === 'privacy-filter') {
      // Toggle blur demo in loop
      appTitle.innerText = "VS Code - config.json";
      appBody.innerHTML = `
        <div class="terminal-mock" style="color: #bbb;">
          <div>"DB_PASSWORD": "<span class="redactable">super_secret_pwd</span>"</div>
          <div>"API_SECRET": "<span class="redactable">sk_live_51M39fNsL27...</span>"</div>
          <div>"PUBLIC_PROJECT": "Crank website release"</div>
        </div>
      `;
      agentEmptyState.style.display = 'none';
      agentCardsContainer.innerHTML = `
        <div class="agent-card-item">
          <span class="agent-card-title">Redaction Engine</span>
          <span class="agent-card-status" style="color: var(--primary-green);">Classified password &amp; secret key</span>
        </div>
      `;

      isSimulating = true;
      const rect = btnRedact.getBoundingClientRect();
      targetSimX = rect.left + 50;
      targetSimY = rect.top + 15;

      let redactToggleState = true;
      setRedactionState(true);

      redactionInterval = setInterval(() => {
        redactToggleState = !redactToggleState;
        setRedactionState(redactToggleState);
        triggerCursorPulse();
        
        // Re-read redactables inside editor
        const appRedactables = appBody.querySelectorAll('.redactable');
        appRedactables.forEach(el => {
          if (redactToggleState) {
            el.style.filter = 'blur(4px)';
            el.style.color = 'transparent';
            el.style.background = 'rgba(201, 59, 85, 0.08)';
          } else {
            el.style.filter = 'none';
            el.style.color = '#ff5f56';
            el.style.background = 'none';
          }
        });
      }, 2500);

    } else if (stepName === 'setup-guide') {
      // Show Finder setup window and hide other windows
      appWindow.style.opacity = '0';
      agentWindow.style.opacity = '0';
      finderWindow.classList.add('active');

      isSimulating = true;
      
      const dragAppNode = document.getElementById('drag-app-node');
      
      function runInstallerLoop() {
        if (!dragAppNode) return;
        dragAppNode.style.transform = 'none';
        
        // Get start coordinates
        const appRect = dragAppNode.getBoundingClientRect();
        targetSimX = appRect.left + appRect.width / 2;
        targetSimY = appRect.top + appRect.height / 2;

        setTimeout(() => {
          triggerCursorPulse();
          
          // Drag app icon visual translation to Applications folder
          dragAppNode.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
          dragAppNode.style.transform = 'translate(180px, 0px)';
          
          // Move cursor alongside icon translation
          targetSimX += 180;
          
          setTimeout(() => {
            triggerCursorPulse();
            dragAppNode.style.transition = 'none';
            dragAppNode.style.transform = 'none';
            
            // Loop back
            runInstallerLoop();
          }, 2000);
        }, 1000);
      }

      runInstallerLoop();
    }
  }

  // Setup GSAP ScrollTrigger for each scrolly step
  steps.forEach((stepElement) => {
    const stepName = stepElement.getAttribute('data-step');
    
    ScrollTrigger.create({
      trigger: stepElement,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => {
        activateStep(stepName, stepElement);
      },
      onEnterBack: () => {
        activateStep(stepName, stepElement);
      }
    });
  });

  function activateStep(stepName, stepElement) {
    steps.forEach(s => s.classList.remove('active'));
    stepElement.classList.add('active');
    
    // Sync the tabs deck active state
    const tabs = document.querySelectorAll('.showcase-tabs-deck .sim-tab');
    if (stepName === 'hero') {
      tabs.forEach(t => t.classList.remove('active'));
    } else {
      tabs.forEach(tab => {
        if (tab.getAttribute('data-step') === stepName) {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        }
      });
    }

    if (activeStep !== stepName) {
      activeStep = stepName;
      transitionSimulatorTo(stepName);
    }
  }

  // ==========================================
  // 7. Download Trigger & Scroll Setup Guide
  // ==========================================
  const downloadLinks = document.querySelectorAll('.btn-download');
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

      // Smoothly scroll to the setup step section using Lenis
      setTimeout(() => {
        lenis.scrollTo('#setup');
      }, 300);
    });
  });

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
  // 8. Eyeball Blink Animation Controller
  // ==========================================
  function triggerBlinks() {
    const eyeballs = document.querySelectorAll('.eyeball-group');
    eyeballs.forEach(eye => {
      eye.classList.add('blink');
      setTimeout(() => {
        eye.classList.remove('blink');
      }, 250); // Match animation duration
    });
    
    // Schedule next blink between 7 and 12 seconds
    const randomDelay = Math.random() * (12000 - 7000) + 7000;
    setTimeout(triggerBlinks, randomDelay);
  }
  // Start the blink scheduler
  setTimeout(triggerBlinks, 4000);
});
