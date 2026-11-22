import * as THREE from 'three';
    export function startRingEffects(containerEl, ringEl, canvasEl) {
      'use strict';

      // =========================================================================
      // SHARED CONFIGURATION
      // =========================================================================
      const RING_CONFIG = {
        // Very slow, ultra-smooth, seamless breathing cycle duration (in seconds)
        breathPeriodSeconds: 11.0,
        // Sleek circular LED ring geometry (no stand, no mount, empty center)
        ringRadius: 1.45,
        ringTubeRadius: 0.085,
        // Glow plane dimensions (wide enough so optical falloff hits 0 before edges)
        glowPlaneSize: 7.6,
        // Fixed front-facing camera settings tuned for a 9:16 vertical frame
        fov: 38,
        baseCameraZ: 6.8
      };

      // DOM References
      let container = null;
      let ringLayer = null;
      let canvas = null;
      let ctx = null;

      // Three.js state
      let renderer = null;
      let scene = null;
      let camera = null;
      let diffuserMaterial = null;
      let glowMaterial = null;

      // Dynamic container metrics
      let viewWidth = 0;
      let viewHeight = 0;
      let dpr = 1;

      // Animation loop timing
      let animationFrameId = null;
      let startTime = null;
      let lastFrameTime = null;

      // =========================================================================
      // MATH & HELPER UTILITIES
      // =========================================================================

      /**
       * Quintic smoothstep for ultra-fluid entry and exit curves through frame edges.
       */
      function smootherstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * t * (t * (t * 6 - 15) + 10);
      }

      /**
       * Random float helper in [min, max).
       */
      function randRange(min, max) {
        return min + Math.random() * (max - min);
      }

      // =========================================================================
      // PART 1: 3D LED RING LIGHT (THREE.JS)
      // =========================================================================

      function initRingScene() {
        if (!ringLayer || typeof THREE === 'undefined') {
          return false;
        }

        // Pure solid black studio background
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        // Fixed front-facing perspective camera
        camera = new THREE.PerspectiveCamera(
          RING_CONFIG.fov,
          9 / 16,
          0.1,
          100
        );

        // High-precision WebGL renderer with ACES Filmic tone mapping
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        });
        renderer.setClearColor(0x000000, 1);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;

        ringLayer.innerHTML = '';
        ringLayer.appendChild(renderer.domElement);

        // 1. Multi-layer optical bloom / halo behind the ring
        const glowGeometry = new THREE.PlaneGeometry(
          RING_CONFIG.glowPlaneSize,
          RING_CONFIG.glowPlaneSize
        );
        glowMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uBrightness: { value: 0.5 },
            uRingRadius: { value: RING_CONFIG.ringRadius },
            uTubeRadius: { value: RING_CONFIG.ringTubeRadius },
            uPlaneHalfSize: { value: RING_CONFIG.glowPlaneSize * 0.5 }
          },
          vertexShader: `
            varying vec2 vWorldPos;
            void main() {
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPos = worldPosition.xy;
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `,
          fragmentShader: `
            uniform float uBrightness;
            uniform float uRingRadius;
            uniform float uTubeRadius;
            uniform float uPlaneHalfSize;
            varying vec2 vWorldPos;

            void main() {
              float radialDist = length(vWorldPos);
              // Signed distance from the circular LED tube centerline
              float distFromRing = abs(radialDist - uRingRadius);
              float distOutsideTube = max(distFromRing - uTubeRadius * 0.65, 0.0);

              // Three smooth optical bloom layers for photorealistic lens halation
              float innerCorona = exp(-distOutsideTube * 10.5) * 0.90;
              float midBloom    = exp(-distOutsideTube * 3.0) * 0.38;
              float outerAura   = exp(-distOutsideTube * 1.1) * 0.12;

              // Ensure smooth fade to absolute zero well before the quad boundary
              float edgeFade = 1.0 - smoothstep(uPlaneHalfSize * 0.58, uPlaneHalfSize * 0.96, radialDist);

              // Subtle, luminous breathing range for the optical halo
              float glowScale = mix(0.72, 1.30, uBrightness);
              float intensity = (innerCorona + midBloom + outerAura) * edgeFade * glowScale;

              // Pure luminous studio white with ultra-clean crisp tone
              vec3 glowColor = mix(vec3(0.95, 0.98, 1.0), vec3(1.0, 1.0, 1.0), uBrightness);

              gl_FragColor = vec4(glowColor * intensity, intensity);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.set(0, 0, -0.04);
        scene.add(glowMesh);

        // 2. Seamless circular LED ring diffuser (zero dark edges or rims)
        const ringGeometry = new THREE.TorusGeometry(
          RING_CONFIG.ringRadius,
          RING_CONFIG.ringTubeRadius,
          64,
          180
        );

        diffuserMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uBrightness: { value: 0.5 }
          },
          vertexShader: `
            varying vec3 vNormalView;
            varying vec3 vViewDir;
            varying vec2 vUv;

            void main() {
              vUv = uv;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vNormalView = normalize(normalMatrix * normal);
              vViewDir = normalize(-mvPosition.xyz);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform float uBrightness;
            varying vec3 vNormalView;
            varying vec3 vViewDir;
            varying vec2 vUv;

            void main() {
              // Viewing angle across the rounded polycarbonate tube
              float ndotv = clamp(dot(normalize(vNormalView), normalize(vViewDir)), 0.0, 1.0);

              // Keep edges completely luminous with gentle volumetric cylindrical depth
              float volumetricProfile = mix(0.93, 1.08, pow(ndotv, 0.45));

              // Subtle frosted polycarbonate micro-diffusion
              float microDiffuser = 0.985 + 0.015 * sin(vUv.x * 420.0) * cos(vUv.y * 48.0);

              // Breathing emission curve: stays bright and crisp even at the lowest point
              float emissionStrength = mix(0.84, 1.35, uBrightness);

              // Crisp, bright studio white color
              vec3 baseWhite = mix(vec3(0.97, 0.985, 1.0), vec3(1.0, 1.0, 1.0), uBrightness);
              vec3 finalColor = baseWhite * volumetricProfile * microDiffuser * emissionStrength;

              gl_FragColor = vec4(finalColor, 1.0);
            }
          `,
          transparent: false
        });

        const ringMesh = new THREE.Mesh(ringGeometry, diffuserMaterial);
        ringMesh.position.set(0, 0, 0);
        scene.add(ringMesh);

        return true;
      }

      // =========================================================================
      // PART 2: ICY-BLUE SERPENTINE RIBBONS (2D CANVAS OVERLAY)
      // =========================================================================

      // Pre-allocated typed arrays to avoid per-frame garbage collection
      const SEGMENTS = 140;
      const spineX = new Float32Array(SEGMENTS + 1);
      const spineY = new Float32Array(SEGMENTS + 1);
      const normX = new Float32Array(SEGMENTS + 1);
      const normY = new Float32Array(SEGMENTS + 1);
      const halfW = new Float32Array(SEGMENTS + 1);

      /**
       * Computes unit normals along the sampled serpentine spine.
       */
      function computeSpineNormals() {
        for (let i = 0; i <= SEGMENTS; i++) {
          const prev = i > 0 ? i - 1 : 0;
          const next = i < SEGMENTS ? i + 1 : SEGMENTS;
          const dx = spineX[next] - spineX[prev];
          const dy = spineY[next] - spineY[prev];
          const len = Math.hypot(dx, dy) || 1;
          normX[i] = -dy / len;
          normY[i] = dx / len;
        }
      }

      /**
       * Builds a closed, smoothly tapered headless ribbon polygon around the current spine.
       */
      function buildRibbonPath(widthScale) {
        ctx.beginPath();
        // Forward along one side of the ribbon
        for (let i = 0; i <= SEGMENTS; i++) {
          const w = halfW[i] * widthScale;
          const x = spineX[i] + normX[i] * w;
          const y = spineY[i] + normY[i] * w;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        // Backward along the opposite side of the ribbon
        for (let i = SEGMENTS; i >= 0; i--) {
          const w = halfW[i] * widthScale;
          const x = spineX[i] - normX[i] * w;
          const y = spineY[i] - normY[i] * w;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
      }

      /**
       * Renders layered icy-blue (#8EDFFF) neon glow passes for a premium futuristic look.
       */
      function renderRibbonLayers(brightness) {
        // Outer soft neon atmospheric halo
        buildRibbonPath(3.6);
        ctx.fillStyle = `rgba(142, 223, 255, ${(0.065 * brightness).toFixed(4)})`;
        ctx.fill();

        // Mid neon edge bloom
        buildRibbonPath(2.05);
        ctx.fillStyle = `rgba(142, 223, 255, ${(0.18 * brightness).toFixed(4)})`;
        ctx.fill();

        // Primary icy-blue glowing ribbon body (#8EDFFF)
        buildRibbonPath(1.0);
        ctx.fillStyle = `rgba(142, 223, 255, ${(0.88 * brightness).toFixed(4)})`;
        ctx.fill();

        // Crisp luminous inner filament
        buildRibbonPath(0.42);
        ctx.fillStyle = `rgba(225, 248, 255, ${(0.95 * brightness).toFixed(4)})`;
        ctx.fill();
      }

      /**
       * Creates or resets one of the two edge snakes ('left' or 'right') with a
       * brand-new random entry/exit zone along its border so it never repeats the same spot.
       */
      function resetEdgeSnake(sn, staggerStart) {
        const prevMid = sn.lastMidNorm !== undefined ? sn.lastMidNorm : -1;

        // Pick a fresh random vertical span along the edge, avoiding repeating the previous spot
        const spanFraction = randRange(0.28, 0.54);
        let spanStart = randRange(0.04, 0.96 - spanFraction);
        if (prevMid >= 0) {
          for (let tries = 0; tries < 5; tries++) {
            const candidateMid = spanStart + spanFraction * 0.5;
            if (Math.abs(candidateMid - prevMid) > 0.22) {
              break;
            }
            spanStart = randRange(0.04, 0.96 - spanFraction);
          }
        }

        sn.spanStart = spanStart;
        sn.spanEnd = spanStart + spanFraction;
        sn.lastMidNorm = spanStart + spanFraction * 0.5;
        sn.dir = Math.random() < 0.5 ? 1 : -1;
        sn.lengthNorm = randRange(0.72, 0.98);
        sn.speedNorm = randRange(0.42, 0.58);
        sn.pauseNorm = randRange(0.14, 0.36);
        sn.widthNorm = randRange(0.0095, 0.0125);
        sn.depthNorm = randRange(0.042, 0.062);
        sn.amp1Norm = randRange(0.022, 0.032);
        sn.amp2Norm = randRange(0.006, 0.010);
        sn.freq1 = randRange(1.6, 2.15);
        sn.freq2 = randRange(3.0, 3.9);
        sn.phase1 = randRange(0, Math.PI * 2);
        sn.phase2 = randRange(0, Math.PI * 2);
        sn.waveSpeed1 = (Math.random() < 0.5 ? 1 : -1) * randRange(2.1, 3.1);
        sn.waveSpeed2 = -Math.sign(sn.waveSpeed1) * randRange(2.8, 3.9);
        sn.brightness = randRange(0.88, 1.0);
        sn.age = 0;

        // Normalized travel progress along the pass [0, 1]
        sn.travelProgress = staggerStart !== undefined ? staggerStart : 0;
      }

      // Exactly 2 independent edge snakes: 1 on the left border, 1 on the right border
      const edgeSnakes = [
        { edge: 'left' },
        { edge: 'right' }
      ];
      resetEdgeSnake(edgeSnakes[0], 0.34);
      resetEdgeSnake(edgeSnakes[1], 0.52);

      // Interactive motion state (phone rocking speed-up & swipe-up center cascade)
      let speedMultiplier = 1.0;
      let targetSpeedBoost = 0.0;
      let lastCenterTriggerTime = 0;
      const centerSnakes = [];

      /**
       * Updates and renders a single left/right edge serpentine ribbon.
       */
      function updateAndDrawEdgeSnake(sn, dt) {
        const W = viewWidth;
        const H = viewHeight;
        const TWO_PI = Math.PI * 2;

        const sA = sn.spanStart * H;
        const sB = sn.spanEnd * H;
        const spanLen = sB - sA;
        const transLen = 0.24 * W;
        const bodyLen = sn.lengthNorm * W;
        const pauseDist = sn.pauseNorm * W;
        const travelDist = spanLen + 2 * transLen + bodyLen + pauseDist;

        // Advance smoothly with current speedMultiplier (reacts to phone rocking)
        const stepDist = sn.speedNorm * W * dt * speedMultiplier;
        sn.travelProgress += stepDist / travelDist;
        sn.age += dt * speedMultiplier;

        // Re-randomize entry location & direction once the ribbon finishes its off-screen pause
        if (sn.travelProgress >= 1.0) {
          resetEdgeSnake(sn, 0);
          return;
        }

        const headS = sn.dir === 1
          ? (sA - transLen) + sn.travelProgress * travelDist
          : (sB + transLen) - sn.travelProgress * travelDist;

        // Skip drawing while resting off-screen between passes
        const minS = sn.dir === 1 ? headS - bodyLen : headS;
        const maxS = sn.dir === 1 ? headS : headS + bodyLen;
        if (maxS <= sA - transLen || minS >= sB + transLen) {
          return;
        }

        const offscreenDepth = -0.14 * W;
        const baseDepth = sn.depthNorm * W;
        const amp1 = sn.amp1Norm * W;
        const amp2 = sn.amp2Norm * W;
        const baseHalfWidth = (sn.widthNorm * W) * 0.5;

        const k1 = (TWO_PI * sn.freq1) / W;
        const k2 = (TWO_PI * sn.freq2) / W;

        for (let i = 0; i <= SEGMENTS; i++) {
          const p = i / SEGMENTS;
          const s = headS - sn.dir * p * bodyLen;

          // Smoothly curve inward from outside the frame and back out at the span ends
          const enter = smootherstep(sA - transLen, sA + transLen * 0.65, s);
          const exit = 1.0 - smootherstep(sB - transLen * 0.65, sB + transLen, s);
          const env = enter * exit;

          const wave =
            amp1 * Math.sin(k1 * s - sn.age * sn.waveSpeed1 + sn.phase1) +
            amp2 * Math.sin(k2 * s - sn.age * sn.waveSpeed2 + sn.phase2);

          const depth =
            offscreenDepth +
            env * (baseDepth - offscreenDepth) +
            wave * (0.25 + 0.75 * env);

          if (sn.edge === 'left') {
            spineX[i] = depth;
            spineY[i] = s;
          } else {
            spineX[i] = W - depth;
            spineY[i] = s;
          }

          const taper = Math.pow(Math.sin(Math.PI * p), 0.58);
          const microSwell = 1.0 + 0.06 * Math.sin(Math.PI * 3 * p + sn.age * sn.waveSpeed1);
          halfW[i] = baseHalfWidth * taper * microSwell;
        }

        computeSpineNormals();
        renderRibbonLayers(sn.brightness);
      }

      /**
       * Spawns a staggered group of icy-blue serpentine ribbons that emerge from
       * varied positions along the top edge and freely meander downward across the frame.
       */
      function spawnCenterSnakes() {
        const now = performance.now();
        if (now - lastCenterTriggerTime < 450) {
          return;
        }
        lastCenterTriggerTime = now;

        // Cap active free-roaming downward ribbons to keep motion clean and silky smooth
        if (centerSnakes.length > 12) {
          return;
        }

        const count = 3 + (Math.random() < 0.4 ? 1 : 0);
        const startZones = [0.18, 0.40, 0.62, 0.82];
        for (let i = startZones.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = startZones[i];
          startZones[i] = startZones[j];
          startZones[j] = tmp;
        }

        for (let i = 0; i < count; i++) {
          const startXNorm = Math.max(0.12, Math.min(0.88, startZones[i] + randRange(-0.08, 0.08)));
          const endXNorm = randRange(0.12, 0.88);
          const curveDir = Math.random() < 0.5 ? 1 : -1;

          centerSnakes.push({
            startXNorm: startXNorm,
            endXNorm: endXNorm,
            curveAmpNorm: curveDir * randRange(0.12, 0.28),
            curveFreq: randRange(0.75, 1.55),
            curvePhase: randRange(0, Math.PI * 2),
            headYNorm: -0.04 - i * randRange(0.24, 0.38) - Math.random() * 0.1,
            lengthNorm: randRange(0.72, 1.04),
            speedNorm: randRange(0.58, 0.80),
            widthNorm: randRange(0.009, 0.0122),
            amp1Norm: randRange(0.032, 0.052),
            amp2Norm: randRange(0.010, 0.018),
            freq1: randRange(1.45, 2.0),
            freq2: randRange(2.8, 3.8),
            phase1: randRange(0, Math.PI * 2),
            phase2: randRange(0, Math.PI * 2),
            waveSpeed1: (Math.random() < 0.5 ? 1 : -1) * randRange(2.4, 3.6),
            waveSpeed2: (Math.random() < 0.5 ? 1 : -1) * randRange(3.0, 4.3),
            age: 0,
            brightness: randRange(0.88, 1.0)
          });
        }
      }

      /**
       * Updates and draws all active free-roaming top-to-bottom serpentine ribbons.
       */
      function updateAndDrawCenterSnakes(dt) {
        const W = viewWidth;
        const H = viewHeight;
        const TWO_PI = Math.PI * 2;
        const exitLimitNorm = (H / W) + 0.14;

        for (let sIdx = centerSnakes.length - 1; sIdx >= 0; sIdx--) {
          const sn = centerSnakes[sIdx];
          sn.age += dt * speedMultiplier;
          sn.headYNorm += sn.speedNorm * dt * speedMultiplier;

          // Remove once the entire tail has smoothly exited below the bottom edge
          if (sn.headYNorm - sn.lengthNorm > exitLimitNorm) {
            centerSnakes.splice(sIdx, 1);
            continue;
          }

          const headY = sn.headYNorm * W;
          const bodyLen = sn.lengthNorm * W;
          const amp1 = sn.amp1Norm * W;
          const amp2 = sn.amp2Norm * W;
          const baseHalfWidth = (sn.widthNorm * W) * 0.5;
          const k1 = (TWO_PI * sn.freq1) / W;
          const k2 = (TWO_PI * sn.freq2) / W;

          for (let i = 0; i <= SEGMENTS; i++) {
            const p = i / SEGMENTS;
            const y = headY - p * bodyLen;
            const v = y / H;

            // Free-flowing macro trajectory: diagonal drift + wide sweeping organic curve
            const rawXNorm =
              sn.startXNorm +
              (sn.endXNorm - sn.startXNorm) * v +
              sn.curveAmpNorm * Math.sin(v * Math.PI * sn.curveFreq + sn.curvePhase);

            // Smoothly keep the macro path within horizontal bounds without sharp bounces
            const maxOffset = 0.42;
            const softXNorm = 0.5 + maxOffset * Math.tanh((rawXNorm - 0.5) / maxOffset);

            // Realistic serpentine S-wave undulation along the free downward path
            const wave =
              amp1 * Math.sin(k1 * y - sn.age * sn.waveSpeed1 + sn.phase1) +
              amp2 * Math.sin(k2 * y - sn.age * sn.waveSpeed2 + sn.phase2);

            spineX[i] = softXNorm * W + wave;
            spineY[i] = y;

            const taper = Math.pow(Math.sin(Math.PI * p), 0.58);
            const microSwell = 1.0 + 0.06 * Math.sin(Math.PI * 3 * p + sn.age * sn.waveSpeed1);
            halfW[i] = baseHalfWidth * taper * microSwell;
          }

          computeSpineNormals();
          renderRibbonLayers(sn.brightness);
        }
      }

      // =========================================================================
      // PART 3: INTERACTIVE CONTROLS (MOTION SENSORS, TOUCH SWIPE, MOUSE/WHEEL)
      // =========================================================================

      /**
       * Boosts animation speed smoothly when the phone is rocked or shaken.
       */
      function addMotionBoost(amount) {
        targetSpeedBoost = Math.min(2.2, targetSpeedBoost + amount);
      }

      let lastAccX = null;
      let lastAccY = null;
      let lastAccZ = null;
      let lastBeta = null;
      let lastGamma = null;
      let motionListenersAttached = false;

      function handleDeviceMotion(e) {
        const acc = e.acceleration;
        const accG = e.accelerationIncludingGravity;

        if (acc && (acc.x !== null || acc.y !== null || acc.z !== null)) {
          const ax = acc.x || 0;
          const ay = acc.y || 0;
          const az = acc.z || 0;
          const mag = Math.hypot(ax, ay, az);
          if (mag > 0.85) {
            addMotionBoost(Math.min(0.45, (mag - 0.85) * 0.14));
          }
        } else if (accG && accG.x !== null) {
          if (lastAccX !== null) {
            const dx = (accG.x || 0) - lastAccX;
            const dy = (accG.y || 0) - lastAccY;
            const dz = (accG.z || 0) - lastAccZ;
            const deltaMag = Math.hypot(dx, dy, dz);
            if (deltaMag > 1.1) {
              addMotionBoost(Math.min(0.45, (deltaMag - 1.1) * 0.12));
            }
          }
          lastAccX = accG.x || 0;
          lastAccY = accG.y || 0;
          lastAccZ = accG.z || 0;
        }
      }

      function handleDeviceOrientation(e) {
        if (e.beta === null || e.gamma === null) {
          return;
        }
        if (lastBeta !== null && lastGamma !== null) {
          const dBeta = e.beta - lastBeta;
          const dGamma = e.gamma - lastGamma;
          const tiltDelta = Math.hypot(dBeta, dGamma);

          // Gentle phone rocking ("укачка") increases snake speed
          if (tiltDelta > 1.2 && tiltDelta < 45) {
            addMotionBoost(Math.min(0.35, tiltDelta * 0.045));
          }
        }
        lastBeta = e.beta;
        lastGamma = e.gamma;
      }

      function attachMotionSensors() {
        if (motionListenersAttached) {
          return;
        }
        motionListenersAttached = true;
        window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
        window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
      }

      // Silent permission request on first user interaction for iOS 13+ devices
      let sensorPermissionRequested = false;
      function requestMotionPermissionIfNeeded() {
        if (sensorPermissionRequested) {
          return;
        }
        sensorPermissionRequested = true;

        if (
          typeof DeviceMotionEvent !== 'undefined' &&
          typeof DeviceMotionEvent.requestPermission === 'function'
        ) {
          DeviceMotionEvent.requestPermission()
            .then(function (state) {
              if (state === 'granted') {
                attachMotionSensors();
              }
            })
            .catch(function () {});
        } else {
          attachMotionSensors();
        }

        if (
          typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function'
        ) {
          DeviceOrientationEvent.requestPermission()
            .then(function (state) {
              if (state === 'granted') {
                attachMotionSensors();
              }
            })
            .catch(function () {});
        }
      }

      function setupInteractions() {
        // Attach sensors immediately on non-iOS browsers
        if (
          typeof DeviceMotionEvent === 'undefined' ||
          typeof DeviceMotionEvent.requestPermission !== 'function'
        ) {
          attachMotionSensors();
        }

        // Touch swipe-up (like scrolling Reels) to launch the downward serpentine cascade
        let touchStartY = null;
        let touchTriggered = false;

        window.addEventListener('touchstart', function (e) {
          requestMotionPermissionIfNeeded();
          if (e.touches && e.touches.length > 0) {
            touchStartY = e.touches[0].clientY;
            touchTriggered = false;
          }
        }, { passive: true });

        window.addEventListener('touchmove', function (e) {
          if (touchStartY === null || touchTriggered || !e.touches || e.touches.length === 0) {
            return;
          }
          const deltaY = touchStartY - e.touches[0].clientY;
          if (deltaY > 42) {
            touchTriggered = true;
            spawnCenterSnakes();
          }
        }, { passive: true });

        window.addEventListener('touchend', function () {
          touchStartY = null;
          touchTriggered = false;
        }, { passive: true });

        // Mouse drag-up support for desktop testing
        let mouseDownY = null;
        let mouseTriggered = false;

        window.addEventListener('mousedown', function (e) {
          requestMotionPermissionIfNeeded();
          mouseDownY = e.clientY;
          mouseTriggered = false;
        });

        window.addEventListener('mousemove', function (e) {
          if (mouseDownY === null || mouseTriggered) {
            return;
          }
          const deltaY = mouseDownY - e.clientY;
          if (deltaY > 48) {
            mouseTriggered = true;
            spawnCenterSnakes();
          }
        });

        window.addEventListener('mouseup', function () {
          mouseDownY = null;
          mouseTriggered = false;
        });

        // Mouse wheel scroll-down / swipe gesture support
        window.addEventListener('wheel', function (e) {
          if (Math.abs(e.deltaY) > 18) {
            spawnCenterSnakes();
          }
        }, { passive: true });
      }

      // =========================================================================
      // PART 4: UNIFIED RESIZE & SYNCHRONIZED ANIMATION LOOP
      // =========================================================================

      function updateLayout() {
        if (!container || !canvas || !ctx) {
          return;
        }

        const rect = container.getBoundingClientRect();
        viewWidth = Math.max(1, rect.width);
        viewHeight = Math.max(1, rect.height);
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Resize 2D serpentine overlay canvas to exact 9:16 container dimensions
        canvas.width = Math.round(viewWidth * dpr);
        canvas.height = Math.round(viewHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Resize Three.js 3D LED Ring renderer & camera to the same 9:16 container
        if (renderer && camera) {
          const aspect = viewWidth / viewHeight;
          camera.aspect = aspect;
          // Frame the glowing LED ring cleanly in the center of the 9:16 canvas
          camera.position.set(0, 0, 0.85 * RING_CONFIG.baseCameraZ / Math.min(Math.max(aspect, 0.52), 1));
          camera.lookAt(0, 0, 0);
          camera.updateProjectionMatrix();

          renderer.setPixelRatio(dpr);
          renderer.setSize(viewWidth, viewHeight, false);
        }
      }

      function animate(timestamp) {
        animationFrameId = window.requestAnimationFrame(animate);

        if (startTime === null) {
          startTime = timestamp;
          lastFrameTime = timestamp;
        }

        const dt = Math.min(0.05, Math.max(0.001, (timestamp - lastFrameTime) * 0.001));
        lastFrameTime = timestamp;
        const elapsedSeconds = (timestamp - startTime) * 0.001;

        // Smoothly interpolate speedMultiplier toward motion boost and decay back to 1.0
        targetSpeedBoost *= Math.exp(-dt * 1.45);
        const desiredSpeed = 1.0 + targetSpeedBoost;
        speedMultiplier += (desiredSpeed - speedMultiplier) * Math.min(1, dt * 6.5);

        // --- 1. Update & Render 3D LED Ring Light ---
        if (renderer && scene && camera && diffuserMaterial && glowMaterial) {
          const phase = (elapsedSeconds / RING_CONFIG.breathPeriodSeconds) * Math.PI * 2.0;
          // Ultra-smooth sinusoidal breathing [0..1] + gentle subtle response to motion energy
          const baseBreath = 0.5 - 0.5 * Math.cos(phase);
          const motionGlowLift = Math.min(0.18, targetSpeedBoost * 0.08);
          const unifiedBrightness = Math.min(1.0, baseBreath + motionGlowLift);

          diffuserMaterial.uniforms.uBrightness.value = unifiedBrightness;
          glowMaterial.uniforms.uBrightness.value = unifiedBrightness;
          renderer.render(scene, camera);
        }

        // --- 2. Update & Render Icy-Blue Serpentine Ribbons ---
        if (ctx && viewWidth > 0 && viewHeight > 0) {
          ctx.clearRect(0, 0, viewWidth, viewHeight);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';

          for (let i = 0; i < edgeSnakes.length; i++) {
            updateAndDrawEdgeSnake(edgeSnakes[i], dt);
          }

          if (centerSnakes.length > 0) {
            updateAndDrawCenterSnakes(dt);
          }

          ctx.restore();
        }
      }

      // =========================================================================
      // INITIALIZATION ON WINDOW LOAD
      // =========================================================================
      const boot = function () {
        try {
          container = containerEl;
          ringLayer = ringEl;
          canvas = canvasEl;

          if (!container || !ringLayer || !canvas) {
            throw new Error('Required DOM containers could not be found.');
          }

          ctx = canvas.getContext('2d', { alpha: true });
          if (!ctx) {
            throw new Error('2D rendering context could not be initialized.');
          }

          initRingScene();
          updateLayout();
          setupInteractions();

          window.addEventListener('resize', updateLayout);
          animationFrameId = window.requestAnimationFrame(animate);
        } catch (err) {
          console.error('Unified visual scene failed to initialize:', err);
        }
      };
  boot();
      return function () {
        if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', updateLayout);
        if (renderer) { renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); }
      };
    }
