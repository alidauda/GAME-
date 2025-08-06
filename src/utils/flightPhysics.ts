import * as THREE from "three";

interface FlightControls {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  pitchUp: boolean;
  pitchDown: boolean;
  yawLeft: boolean;
  yawRight: boolean;
  landingGear: boolean;
}

export class FlightPhysics {
  // Flight physics variables
  throttle: number = 0; // 0 to 1
  speed: number = 0; // Current speed
  position: THREE.Vector3; // Current position
  rotation: THREE.Euler; // Current rotation
  lift: number = 0; // Lift force
  drag: number = 0; // Drag force
  isGearDown: boolean = true; // Landing gear state
  isOnRunway: boolean = false; // Whether plane is on runway
  isStalling: boolean = false; // Whether plane is stalling
  stallSpeed: number = 0.3; // Speed below which stall occurs

  // Control smoothing variables
  pitchInput: number = 0; // Smooth pitch input (-1 to 1)
  rollInput: number = 0; // Smooth roll input (-1 to 1)
  yawInput: number = 0; // Smooth yaw input (-1 to 1)

  // Trim system - allows plane to maintain attitude when controls are neutral
  pitchTrim: number = 0; // Current pitch trim setting
  rollTrim: number = 0; // Current roll trim setting

  // Angular velocity for smoother rotation
  angularVelocity: THREE.Vector3; // Current angular velocity

  constructor() {
    // Start with wheels on ground (main wheels at -0.8, so plane center should be at 0.8)
    this.position = new THREE.Vector3(0, 0.8, -50);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
  }

  update(controls: FlightControls, deltaTime: number): void {
    // Handle throttle controls
    if (controls.throttle) {
      this.throttle = Math.min(this.throttle + 0.5 * deltaTime, 1.0);
    }
    if (controls.brake) {
      this.throttle = Math.max(this.throttle - 0.5 * deltaTime, 0.0);
    }

    // Calculate speed based on throttle and physics
    const maxSpeed = 3.5; // Higher max speed for better performance
    const acceleration = this.throttle * maxSpeed * 1.0; // More acceleration power
    const deceleration = 0.12;

    if (this.throttle > 0) {
      this.speed = Math.min(
        this.speed + acceleration * deltaTime,
        maxSpeed * this.throttle
      );
    } else {
      this.speed = Math.max(this.speed - deceleration * deltaTime, 0);
    }

    // Apply drag to speed
    this.speed = Math.max(this.speed - this.drag * deltaTime, 0);

    // Check if on runway (for takeoff mechanics) - much more precise
    const runwayZ =
      Math.abs(this.position.z) < 100 && Math.abs(this.position.x) < 25; // Wider runway detection
    const groundHeight = 0.8; // Height when wheels touch ground (main wheels at -0.8)
    this.isOnRunway = runwayZ && this.position.y <= groundHeight + 0.1; // Small tolerance for ground contact

    // Check for stall condition (more realistic)
    this.isStalling =
      this.speed < this.stallSpeed && !this.isOnRunway && this.position.y > 2;

    // Calculate lift and drag
    const liftCoefficient = 0.3; // Increased lift coefficient
    const dragCoefficient = 0.08;

    // Calculate drag first (needed for speed calculation)
    this.drag = this.speed * this.speed * dragCoefficient;

    // Calculate angle of attack effect on lift (more realistic)
    const angleOfAttack = this.rotation.x; // Pitch angle in radians
    const speedFactor = this.speed * this.speed;

    // Realistic angle of attack vs lift curve
    // Most efficient at small positive angles, stalls at high angles
    let angleOfAttackEffect;
    if (angleOfAttack < -0.3) {
      // Negative angle of attack reduces lift significantly
      angleOfAttackEffect = 0.2;
    } else if (angleOfAttack <= 0.35) {
      // Normal flight envelope - linear increase in lift
      angleOfAttackEffect = 1.0 + angleOfAttack * 3.0;
    } else {
      // High angle of attack - approaching stall
      angleOfAttackEffect = 2.0 - (angleOfAttack - 0.35) * 2.0;
    }

    // Base lift calculation with more realistic physics
    const baseLift =
      speedFactor * liftCoefficient * Math.max(0.1, angleOfAttackEffect);

    // Reduce lift when stalling
    if (this.isStalling) {
      this.lift = baseLift * 0.2; // Severely reduced lift during stall
    } else {
      this.lift = baseLift;
    }

    // Apply lift when speed is sufficient for takeoff
    const takeoffSpeed = 0.8; // More realistic takeoff speed
    if (this.speed > takeoffSpeed) {
      // Apply lift as vertical velocity based on angle of attack
      const liftForce = this.lift * deltaTime;
      this.position.y += liftForce;
    } else if (this.speed > 0.4) {
      // Partial lift at medium speeds
      const partialLift = this.lift * deltaTime * (this.speed / takeoffSpeed);
      this.position.y += partialLift;
    }

    // Apply gravity when not on runway (increased during stall)
    if (!this.isOnRunway) {
      const gravityMultiplier = this.isStalling ? 2.5 : 1.0; // Increased gravity during stall
      const baseGravity = 0.3; // Slightly increased base gravity
      this.position.y -= baseGravity * deltaTime * gravityMultiplier;
    }

    // Prevent ground collision and improve ground physics
    const minimumHeight = 0.5; // Absolute minimum to prevent clipping through ground

    if (this.position.y < groundHeight) {
      this.position.y = Math.max(groundHeight, minimumHeight);

      // Ground friction and physics
      if (this.isOnRunway) {
        // Runway friction - good for acceleration but creates drag
        this.speed = Math.max(this.speed - 0.2 * deltaTime, 0); // Reduced friction for easier taxi

        // Prevent bouncing on runway
        this.angularVelocity.x *= 0.92; // Dampen pitch oscillations
        this.angularVelocity.z *= 0.92; // Dampen roll oscillations

        // Slight nose-up attitude when on ground (tail-dragger aircraft)
        if (this.speed < 0.3) {
          const groundAttitude = 0.08; // Slight nose-up angle on ground
          const attitudeForce =
            (groundAttitude - this.rotation.x) * 0.5 * deltaTime;
          this.angularVelocity.x += attitudeForce;
        }
      } else {
        // Rough ground - more friction
        this.speed = Math.max(this.speed - 0.8 * deltaTime, 0);
      }
    }

    // Handle flight controls with smooth input processing
    const controlSmoothingFactor = 15.0; // Even faster response for better control
    const controlSensitivity = 1.0; // Better sensitivity for more responsive feel
    const minControlSpeed = 0.1; // Lower threshold for control effectiveness

    // Calculate speed-based control effectiveness
    const speedEffectiveness = Math.min(1.0, Math.max(0.1, this.speed / 0.6));

    // Smooth control input processing
    const targetPitchInput = controls.pitchUp
      ? -1.0 // TEST: Try negative for pitch up
      : controls.pitchDown
      ? 1.0 // TEST: Try positive for pitch down
      : 0.0;
    const targetRollInput = controls.right ? 1.0 : controls.left ? -1.0 : 0.0;
    const targetYawInput = controls.yawRight
      ? 1.0
      : controls.yawLeft
      ? -1.0
      : 0.0;

    // Apply smooth transitions to control inputs
    this.pitchInput +=
      (targetPitchInput - this.pitchInput) * controlSmoothingFactor * deltaTime;
    this.rollInput +=
      (targetRollInput - this.rollInput) * controlSmoothingFactor * deltaTime;
    this.yawInput +=
      (targetYawInput - this.yawInput) * controlSmoothingFactor * deltaTime;

    // Auto-trim system: gradually adjust trim to reduce control forces needed
    if (Math.abs(this.pitchInput) < 0.1 && this.speed > 0.4) {
      // When controls are nearly neutral, slowly trim to current attitude
      const trimRate = 0.3 * deltaTime;
      this.pitchTrim += this.rotation.x * trimRate;
      this.pitchTrim = Math.max(-0.3, Math.min(0.3, this.pitchTrim)); // Limit trim range
    }

    if (Math.abs(this.rollInput) < 0.1 && this.speed > 0.4) {
      const trimRate = 0.5 * deltaTime;
      this.rollTrim += this.rotation.z * trimRate;
      this.rollTrim = Math.max(-0.2, Math.min(0.2, this.rollTrim)); // Limit trim range
    }

    // Calculate control forces based on airspeed
    if (this.speed > minControlSpeed) {
      // Pitch control (elevator) - responsive and effective
      const pitchForce =
        this.pitchInput * controlSensitivity * speedEffectiveness * 1.0;
      this.angularVelocity.x += pitchForce * deltaTime;

      // Roll control (ailerons) - most effective control surface
      const rollForce =
        this.rollInput * controlSensitivity * speedEffectiveness * 1.4;
      this.angularVelocity.z += rollForce * deltaTime;

      // Yaw control (rudder) - effective for coordination
      const yawForce =
        this.yawInput * controlSensitivity * speedEffectiveness * 0.8;
      this.angularVelocity.y += yawForce * deltaTime;
    }

    // Apply aerodynamic stability forces (aircraft naturally wants to return to trimmed flight)
    if (this.speed > minControlSpeed) {
      const stabilityStrength = speedEffectiveness * 0.6; // Moderate stability strength

      // Pitch stability - aircraft wants to return to trimmed pitch attitude
      const targetPitch = this.pitchTrim; // Trim sets the "neutral" pitch attitude
      const pitchStabilityForce =
        -(this.rotation.x - targetPitch) * stabilityStrength * 1.2;
      this.angularVelocity.x += pitchStabilityForce * deltaTime;

      // Roll stability - aircraft wants to return to trimmed roll (usually wings level)
      const targetRoll = this.rollTrim; // Trim sets the "neutral" roll attitude
      const rollStabilityForce =
        -(this.rotation.z - targetRoll) * stabilityStrength * 1.8;
      this.angularVelocity.z += rollStabilityForce * deltaTime;

      // Yaw stability - less aggressive, allows for coordinated turns
      const yawStabilityForce = -this.rotation.y * stabilityStrength * 0.5;
      this.angularVelocity.y += yawStabilityForce * deltaTime;
    }

    // Apply angular damping for realistic flight behavior
    const dampingFactor = 2.8; // Reduced damping for more responsive feel
    this.angularVelocity.x *= Math.max(0, 1 - dampingFactor * deltaTime);
    this.angularVelocity.y *= Math.max(0, 1 - dampingFactor * deltaTime);
    this.angularVelocity.z *= Math.max(0, 1 - dampingFactor * deltaTime);

    // Apply angular velocity to rotation
    this.rotation.x += this.angularVelocity.x * deltaTime;
    this.rotation.y += this.angularVelocity.y * deltaTime;
    this.rotation.z += this.angularVelocity.z * deltaTime;

    // Limit extreme attitudes for realistic flight
    this.rotation.x = Math.max(
      -Math.PI / 3,
      Math.min(Math.PI / 3, this.rotation.x)
    ); // ±60° pitch
    this.rotation.z = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, this.rotation.z)
    ); // ±90° roll

    // Landing gear toggle
    if (controls.landingGear) {
      this.isGearDown = !this.isGearDown;
      controls.landingGear = false; // Reset to prevent continuous toggling
    }

    // Move plane forward based on speed and direction
    const forwardVector = new THREE.Vector3(0, 0, 1);
    forwardVector.applyEuler(this.rotation);
    this.position.x += forwardVector.x * this.speed;
    this.position.z += forwardVector.z * this.speed;

    // Keep plane within bounds
    if (this.position.z > 800) this.position.z = -800;
    if (this.position.z < -800) this.position.z = 800;
    if (this.position.x > 800) this.position.x = -800;
    if (this.position.x < -800) this.position.x = 800;
    if (this.position.y > 200) this.position.y = 200;
  }
}
