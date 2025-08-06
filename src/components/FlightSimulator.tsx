'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FlightUI } from './FlightUI';
import { createScene, createPlane, createEnvironment } from '../utils/sceneUtils';
import { FlightPhysics } from '../utils/flightPhysics';

export default function FlightSimulator() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planeRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Flight controls state
  const controlsRef = useRef({
    throttle: false,    // W key - increase throttle
    brake: false,       // S key - decrease throttle/brake
    left: false,        // A key - roll left
    right: false,       // D key - roll right
    pitchUp: false,     // R key - pitch up
    pitchDown: false,   // F key - pitch down
    yawLeft: false,     // Z key - yaw left
    yawRight: false,    // C key - yaw right
    landingGear: false  // L key - toggle landing gear
  });

  // Camera controls
  const cameraControlsRef = useRef({
    mouseX: 0,
    mouseY: 0,
    isMouseDown: false,
    cameraDistance: 15,
    cameraHeight: 8,
    cameraAngle: 0
  });

  // Audio context and sounds
  const audioContextRef = useRef<AudioContext | null>(null);
  const engineSoundRef = useRef<OscillatorNode | null>(null);
  const propSoundRef = useRef<OscillatorNode | null>(null);
  const engineRumbleRef = useRef<OscillatorNode | null>(null);
  const windSoundRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const propGainRef = useRef<GainNode | null>(null);
  const rumbleGainRef = useRef<GainNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);

  // Position tracking for UI
  const positionRef = useRef({ x: 0, y: 0.8, z: -50 });
  const flightStatusRef = useRef({ 
    speed: 0, 
    throttle: 0, 
    isGearDown: true, 
    isOnRunway: false,
    isStalling: false
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize scene, camera, and renderer
    const { scene, camera, renderer } = createScene(mountRef.current);
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Create environment
    createEnvironment(scene);

    // Create plane
    const plane = createPlane();
    plane.position.set(0, 0.8, -50); // Position so wheels touch ground (wheels at -0.8)
    scene.add(plane);
    planeRef.current = plane;

    // Initialize flight physics
    const physics = new FlightPhysics();

    // Initialize audio
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        
        // Create realistic airplane engine sound layers
        
        // 1. Main Engine Sound (sawtooth wave for engine harshness)
        engineSoundRef.current = audioContextRef.current.createOscillator();
        engineGainRef.current = audioContextRef.current.createGain();
        engineSoundRef.current.connect(engineGainRef.current);
        engineGainRef.current.connect(audioContextRef.current.destination);
        engineSoundRef.current.frequency.setValueAtTime(120, audioContextRef.current.currentTime);
        engineSoundRef.current.type = 'sawtooth';
        engineGainRef.current.gain.setValueAtTime(0.08, audioContextRef.current.currentTime);
        engineSoundRef.current.start();

        // 2. Propeller Blade Sound (square wave for choppy prop sound)
        propSoundRef.current = audioContextRef.current.createOscillator();
        propGainRef.current = audioContextRef.current.createGain();
        propSoundRef.current.connect(propGainRef.current);
        propGainRef.current.connect(audioContextRef.current.destination);
        propSoundRef.current.frequency.setValueAtTime(40, audioContextRef.current.currentTime);
        propSoundRef.current.type = 'square';
        propGainRef.current.gain.setValueAtTime(0.04, audioContextRef.current.currentTime);
        propSoundRef.current.start();

        // 3. Engine Rumble (triangle wave for low frequency rumble)
        engineRumbleRef.current = audioContextRef.current.createOscillator();
        rumbleGainRef.current = audioContextRef.current.createGain();
        engineRumbleRef.current.connect(rumbleGainRef.current);
        rumbleGainRef.current.connect(audioContextRef.current.destination);
        engineRumbleRef.current.frequency.setValueAtTime(25, audioContextRef.current.currentTime);
        engineRumbleRef.current.type = 'triangle';
        rumbleGainRef.current.gain.setValueAtTime(0.06, audioContextRef.current.currentTime);
        engineRumbleRef.current.start();

        // 4. Wind/Air Sound (filtered noise simulation)
        windSoundRef.current = audioContextRef.current.createOscillator();
        windGainRef.current = audioContextRef.current.createGain();
        windSoundRef.current.connect(windGainRef.current);
        windGainRef.current.connect(audioContextRef.current.destination);
        windSoundRef.current.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
        windSoundRef.current.type = 'sine';
        windGainRef.current.gain.setValueAtTime(0.02, audioContextRef.current.currentTime);
        windSoundRef.current.start();
      } catch (error) {
        console.log('Audio not supported or user interaction required');
      }
    };

    // Start audio on first user interaction
    const startAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      } else if (!audioContextRef.current) {
        initAudio();
      }
    };

    // Mouse controls
    const handleMouseDown = (event: MouseEvent) => {
      cameraControlsRef.current.isMouseDown = true;
    };

    const handleMouseUp = () => {
      cameraControlsRef.current.isMouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (cameraControlsRef.current.isMouseDown) {
        cameraControlsRef.current.mouseX += event.movementX * 0.01;
        cameraControlsRef.current.mouseY += event.movementY * 0.01;
        
        // Clamp vertical mouse movement
        cameraControlsRef.current.mouseY = Math.max(-1, Math.min(1, cameraControlsRef.current.mouseY));
      }
    };

    // Mouse wheel for camera distance
    const handleWheel = (event: WheelEvent) => {
      cameraControlsRef.current.cameraDistance += event.deltaY * 0.01;
      cameraControlsRef.current.cameraDistance = Math.max(5, Math.min(30, cameraControlsRef.current.cameraDistance));
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (planeRef.current) {
        const controls = controlsRef.current;
        const deltaTime = 0.016; // 60 FPS approximation

        // Update flight physics
        physics.update(controls, deltaTime);

        // Update plane position and rotation
        planeRef.current.position.set(physics.position.x, physics.position.y, physics.position.z);
        
        // Apply aircraft-style rotations manually
        // In aircraft terms: pitch=X, yaw=Y, roll=Z
        // But we need to be careful about the coordinate system
        const pitch = physics.rotation.x;  // Pitch around X-axis
        const yaw = physics.rotation.y;    // Yaw around Y-axis  
        const roll = physics.rotation.z;   // Roll around Z-axis
        
        // Create proper aircraft rotation matrix
        planeRef.current.rotation.order = 'YXZ'; // Yaw, Pitch, Roll order
        planeRef.current.rotation.set(pitch, yaw, roll);
        
        // Update position for UI
        positionRef.current = { x: physics.position.x, y: physics.position.y, z: physics.position.z };
        flightStatusRef.current = { 
          speed: physics.speed, 
          throttle: physics.throttle, 
          isGearDown: physics.isGearDown, 
          isOnRunway: physics.isOnRunway,
          isStalling: physics.isStalling
        };

        // Rotate propeller based on throttle
        if (planeRef.current.userData?.propeller) {
          const propellerSpeed = physics.throttle * 0.8 + (physics.speed * 0.2); // Realistic prop speed
          planeRef.current.userData.propeller.rotation.z += propellerSpeed;
        }

        // Update realistic engine sounds based on throttle and RPM
        if (audioContextRef.current) {
          const currentTime = audioContextRef.current.currentTime;
          const throttleLevel = physics.throttle;
          const speedLevel = physics.speed / 3.0; // Normalize speed
          
          // 1. Main Engine Sound - varies with throttle (like real engine RPM)
          if (engineSoundRef.current && engineGainRef.current) {
            const engineRPM = 120 + (throttleLevel * 280); // 120-400 Hz range
            const engineVolume = 0.03 + (throttleLevel * 0.12); // Volume scales with throttle
            engineSoundRef.current.frequency.setValueAtTime(engineRPM, currentTime);
            engineGainRef.current.gain.setValueAtTime(engineVolume, currentTime);
          }

          // 2. Propeller Sound - related to engine speed but distinct
          if (propSoundRef.current && propGainRef.current) {
            const propRPM = 30 + (throttleLevel * 80); // Lower frequency for prop blades
            const propVolume = 0.02 + (throttleLevel * 0.08);
            propSoundRef.current.frequency.setValueAtTime(propRPM, currentTime);
            propGainRef.current.gain.setValueAtTime(propVolume, currentTime);
          }

          // 3. Engine Rumble - deep bass that increases with power
          if (engineRumbleRef.current && rumbleGainRef.current) {
            const rumbleFreq = 15 + (throttleLevel * 40); // Very low frequency
            const rumbleVolume = 0.02 + (throttleLevel * 0.10);
            engineRumbleRef.current.frequency.setValueAtTime(rumbleFreq, currentTime);
            rumbleGainRef.current.gain.setValueAtTime(rumbleVolume, currentTime);
          }

          // 4. Wind Sound - increases with speed and altitude
          if (windSoundRef.current && windGainRef.current) {
            const windIntensity = Math.min((physics.position.y / 50 + speedLevel) / 2, 1);
            const windFreq = 600 + (windIntensity * 800); // Higher pitched wind at speed
            const windVolume = Math.min(windIntensity * 0.08, 0.06); // Cap wind volume
            windSoundRef.current.frequency.setValueAtTime(windFreq, currentTime);
            windGainRef.current.gain.setValueAtTime(windVolume, currentTime);
          }
        }

        // Advanced camera system
        const cameraControls = cameraControlsRef.current;
        
        // Calculate camera position based on plane orientation and mouse input
        const cameraOffset = new THREE.Vector3(
          Math.sin(cameraControls.mouseX) * cameraControls.cameraDistance,
          cameraControls.cameraHeight + cameraControls.mouseY * 10,
          Math.cos(cameraControls.mouseX) * cameraControls.cameraDistance
        );
        
        // Apply plane rotation to camera offset
        cameraOffset.applyEuler(new THREE.Euler(physics.rotation.x, physics.rotation.y, physics.rotation.z));
        
        camera.position.set(
          physics.position.x + cameraOffset.x,
          physics.position.y + cameraOffset.y,
          physics.position.z + cameraOffset.z
        );
        
        // Look at plane with slight offset for better view
        const lookAtOffset = new THREE.Vector3(0, 2, 0);
        lookAtOffset.applyEuler(new THREE.Euler(physics.rotation.x, physics.rotation.y, physics.rotation.z));
        camera.lookAt(
          physics.position.x + lookAtOffset.x,
          physics.position.y + lookAtOffset.y,
          physics.position.z + lookAtOffset.z
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    // Handle keyboard controls
    const handleKeyDown = (event: KeyboardEvent) => {
      // Start audio on first key press
      startAudio();
      
      const controls = controlsRef.current;
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          controls.throttle = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          controls.brake = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          controls.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          controls.right = true;
          break;
        case 'KeyR':
          controls.pitchUp = true;
          break;
        case 'KeyF':
          controls.pitchDown = true;
          break;
        case 'KeyZ':
          controls.yawLeft = true;
          break;
        case 'KeyC':
          controls.yawRight = true;
          break;
        case 'KeyL':
          controls.landingGear = true;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const controls = controlsRef.current;
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          controls.throttle = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          controls.brake = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          controls.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          controls.right = false;
          break;
        case 'KeyR':
          controls.pitchUp = false;
          break;
        case 'KeyF':
          controls.pitchDown = false;
          break;
        case 'KeyZ':
          controls.yawLeft = false;
          break;
        case 'KeyC':
          controls.yawRight = false;
          break;
      }
    };

    // Add mouse event listeners
    mountRef.current.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    mountRef.current.addEventListener('wheel', handleWheel);
    
    // Request pointer lock for mouse controls
    mountRef.current.addEventListener('click', () => {
      mountRef.current?.requestPointerLock();
    });

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      mountRef.current?.removeEventListener('mousedown', handleMouseDown);
      mountRef.current?.removeEventListener('wheel', handleWheel);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="w-full h-screen">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <FlightUI positionRef={positionRef} flightStatusRef={flightStatusRef} />
    </div>
  );
} 