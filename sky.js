(function () {

  // ==========================================
  // Gradient Sky Background Plane
  // Fixed sunny-day colors: bright blue top, light sky-blue bottom
  // ==========================================
  class SkyBackground extends THREE.Mesh {
    constructor() {
      const geometry = new THREE.PlaneGeometry(1, 1);
      
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uSkyColor:       { value: new THREE.Color('#0099e6') },
          uSkyColorBottom: { value: new THREE.Color('#b8dffa') },
          uTime:           { value: 0 },
          uStarOpacity:    { value: 0 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform vec3 uSkyColor;
          uniform vec3 uSkyColorBottom;
          uniform float uTime;
          uniform float uStarOpacity;

          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          void main() {
            vec3 skyColor = mix(uSkyColorBottom, uSkyColor, vUv.y);
            
            // Add subtle twinkling stars in the darker portions of the sky
            if (uStarOpacity > 0.01 && vUv.y > 0.15) {
              vec2 starGrid = vUv * vec2(280.0, 140.0);
              vec2 ipos = floor(starGrid);
              vec2 fpos = fract(starGrid);
              
              float r = hash(ipos);
              
              if (r > 0.988) { // 1.2% density of grid cells contain a star
                float starType = fract(r * 10.0);
                float twinkle = 1.0;
                
                if (starType < 0.4) {
                  // Steady star (constant soft shine, slight random intensity offset)
                  twinkle = 0.8 + 0.2 * r;
                } else if (starType < 0.8) {
                  // Slow, organic shimmer
                  float speed = 0.8 + fract(r * 100.0) * 1.2;
                  twinkle = 0.55 + 0.45 * sin(uTime * speed + r * 62.8);
                } else {
                  // Sharp, flickering shimmer (scintillation)
                  float speed = 3.5 + fract(r * 1000.0) * 4.0;
                  float wave = 0.5 + 0.5 * sin(uTime * speed + r * 62.8);
                  twinkle = 0.15 + 0.85 * pow(wave, 3.0); // sharp peaks
                }

                float dist = length(fpos - 0.5);
                // Randomize star sizes slightly based on cell seed
                float starSize = 0.08 + fract(r * 15.0) * 0.07;
                float star = smoothstep(starSize, 0.0, dist);
                
                // Add soft star glow
                skyColor += vec3(star * twinkle * uStarOpacity * 0.95);
              }
            }

            gl_FragColor = vec4(skyColor, 1.0);
          }
        `,
        depthWrite: false,
        depthTest: true
      });

      super(geometry, material);
      this.position.set(0, 0, -100);
    }

    updateViewport(camera) {
      const depth = Math.abs(this.position.z - camera.position.z);
      const fovRad = (camera.fov * Math.PI) / 180;
      const height = 2 * Math.tan(fovRad / 2) * depth;
      const width = height * camera.aspect;
      this.scale.set(width, height, 1);
    }
  }

  // ==========================================
  // Instanced Cloud Sprites
  // Matching air.inc "clouds" theme: scattered softly across the upper area
  // ==========================================


  class Clouds extends THREE.InstancedMesh {
    constructor(cloudTexture, skyBackground, camera) {
      // Exactly 60 sprite instances
      const count = 60;
      
      const fovRad = (camera.fov * Math.PI) / 180;
      const distance = 7.4;
      const vpHeight = 2 * Math.tan(fovRad / 2) * distance;
      const vpWidth  = vpHeight * camera.aspect;
      
      // Base sprite size (square since cloud.png is a square cloud)
      const h = Math.max(vpWidth / 9, 6);
      const geometry = new THREE.PlaneGeometry(h, h);

      // Re-use the high-performance shader with the photo texture
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uCloud:          { value: cloudTexture },
          uDepth:          { value: new THREE.Vector2(-4, 9.2) },
          uSkyColor:       { value: skyBackground.material.uniforms.uSkyColor.value },
          uSkyColorBottom: { value: skyBackground.material.uniforms.uSkyColorBottom.value }
        },
        vertexShader: `
          uniform vec2 uDepth;
          varying vec2 vUv;
          varying float vDepth;
          varying vec2 vFlatUv;
          varying vec2 vViewportUV;

          void main() {
              vUv = uv;

              vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
              vec4 viewPosition  = viewMatrix  * worldPosition;
              gl_Position = projectionMatrix * viewPosition;

              vec3 ndc = gl_Position.xyz / gl_Position.w;
              vViewportUV = ndc.xy * 0.5 + 0.5;

              float cosR = instanceMatrix[0][0];
              float sinR = instanceMatrix[1][0];

              vec2 centeredUv = uv - 0.5;
              vec2 unrotatedUv = vec2(
                  centeredUv.x * cosR + centeredUv.y * sinR,
                  -centeredUv.x * sinR + centeredUv.y * cosR
              ) + 0.5;

              vFlatUv = unrotatedUv;

              float d = (worldPosition.z - uDepth.x) / (uDepth.y - uDepth.x);
              vDepth = clamp(d, 0.0, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uCloud;
          varying vec2 vUv;
          varying float vDepth;
          varying vec2 vFlatUv;
          uniform vec3 uSkyColor;
          uniform vec3 uSkyColorBottom;
          varying vec2 vViewportUV;

          void main() {
              vec4 tex = texture2D(uCloud, vUv);
              float fade = vDepth;

              // Depth-based alpha fading
              float invFade = 1.0 - pow(fade, 10.0);
              tex.a *= 1.0 - pow(1.0 - fade, 1.5);
              tex.a *= invFade;

              vec3 averageSkyColour = (uSkyColor + uSkyColorBottom) / 2.0;
              float skyBrightness = dot(averageSkyColour, vec3(0.2126, 0.7152, 0.0722));

              vec3 cloudColour = mix(averageSkyColour, tex.rgb * clamp(skyBrightness * 3.0, 0.0, 1.0), clamp(skyBrightness * 2.0, 0.0, 1.0));
              vec3 skyColor = mix(uSkyColor, uSkyColorBottom, 1.0 - vViewportUV.y);

              vec3 greyGradient = mix(cloudColour * 0.5, cloudColour, smoothstep(0.2, 0.6, vFlatUv.y));
              vec3 color = mix(greyGradient, mix(skyColor, cloudColour, 0.1), 1.0 - smoothstep(0.1, 0.6, vFlatUv.y));

              gl_FragColor = vec4(color, tex.a);
          }
        `,
        transparent: true,
        depthWrite: false
      });

      super(geometry, material, count);
      this.frustumCulled = false;
      this.h = h;
      this.cloudData = [];
      this._viewport = { width: vpWidth, height: vpHeight };

      this._initClouds();
    }

    _initClouds() {
      const vp = this._viewport;

      // Seeded random for deterministic layouts
      let seed = 23;
      const rand = () => {
        let x = 10000 * Math.sin(seed++);
        return x - Math.floor(x);
      };

      this.cloudData = [];
      const targetCount = 60;
      let instanceIdx = 0;
      const scrollWorldHeight = vp.height * 4; 

      while (instanceIdx < targetCount) {
        const xSpread = vp.width * 1.5;
        const baseX = (rand() - 0.5) * xSpread;
        const baseY = (vp.height / 2) - rand() * (scrollWorldHeight + vp.height);
        const baseZ = -4 + (rand() * 13.2);

        // Group size: 1 to 3 overlapping sprites to create diverse fluffy formations
        const groupSize = rand() < 0.35 ? 1 : (rand() < 0.75 ? 2 : 3);
        const subSprites = [];

        for (let s = 0; s < groupSize; s++) {
          // Offsets within the cluster
          const dx = s === 0 ? 0 : (rand() - 0.5) * 5.0;
          const dy = s === 0 ? 0 : (rand() - 0.5) * 1.8;
          const dz = s === 0 ? 0 : (rand() - 0.5) * 0.4;

          // Scale variation (relative to the base cloud scale)
          const scale = (0.22 + rand() * 0.45) * (s === 0 ? 1.0 : 0.7 + rand() * 0.4);
          
          // Subtle aspect ratio variation (from 0.9 to 1.25) to stretch ever so slightly, keeping it very round and fluffy
          const aspect = 0.9 + rand() * 0.35;

          const rotation = rand() * Math.PI * 2;
          const direction = rand() < 0.5 ? 1 : -1;
          const speed = 0.15 + rand() * 0.4;

          subSprites.push({
            dx, dy, dz,
            scale,
            aspect,
            rotation,
            direction,
            speed
          });
          
          instanceIdx++;
          if (instanceIdx >= targetCount) break;
        }

        this.cloudData.push({
          x: baseX,
          y: baseY,
          z: baseZ,
          subSprites
        });
      }

      this._updateInstances();
    }

    _updateInstances() {
      // Sort clusters by depth (back to front) to ensure perfect alpha blending
      this.cloudData.sort((a, b) => a.z - b.z);

      const dummy = new THREE.Object3D();
      let currentIdx = 0;

      this.cloudData.forEach((cloud) => {
        cloud.subSprites.forEach((sprite) => {
          // air.inc breathing animation scale multiplier
          const breathing = 0.08 * Math.sin(10 * sprite.rotation);
          const currentScale = sprite.scale + breathing;

          dummy.position.set(
            cloud.x + sprite.dx,
            cloud.y + sprite.dy,
            cloud.z + sprite.dz
          );
          dummy.scale.set(currentScale * sprite.aspect, currentScale, currentScale);
          dummy.rotation.set(0, 0, sprite.rotation);
          dummy.updateMatrix();

          this.setMatrixAt(currentIdx++, dummy.matrix);
        });
      });

      this.instanceMatrix.needsUpdate = true;
    }

    // Rebuild on window resize
    resize(camera) {
      const fovRad = (camera.fov * Math.PI) / 180;
      const distance = 7.4;
      const vpHeight = 2 * Math.tan(fovRad / 2) * distance;
      const vpWidth  = vpHeight * camera.aspect;
      this._viewport = { width: vpWidth, height: vpHeight };

      const h = Math.max(vpWidth / 9, 6);
      this.h = h;

      this.geometry.dispose();
      this.geometry = new THREE.PlaneGeometry(h, h);

      this._initClouds();
    }

    // Per-frame physics/drift update
    update(dt) {
      this.cloudData.forEach((cloud) => {
        // Slow drift along Z depth plane
        cloud.z += dt * 0.5;
        // Wrap back when passing the foreground clip boundary
        if (cloud.z > 9.2) {
          cloud.z = -4;
        }

        // Infinite vertical wrapping
        const margin = this.h * 1.0; 
        const absY = cloud.y + this.position.y;
        if (absY < -this._viewport.height / 2 - margin) {
          // Wrapped off the bottom, move it to the top
          cloud.y += this._viewport.height + margin * 2;
        } else if (absY > this._viewport.height / 2 + margin) {
          // Wrapped off the top, move it to the bottom
          cloud.y -= this._viewport.height + margin * 2;
        }

        // Slow spin for realistic fluid rotation
        cloud.subSprites.forEach((sprite) => {
          sprite.rotation += dt * sprite.speed * sprite.direction * 0.05;
        });
      });

      this._updateInstances();
    }
  }

  // Export to THREE namespace
  THREE.SkyBackground = SkyBackground;
  THREE.Clouds = Clouds;

})();
