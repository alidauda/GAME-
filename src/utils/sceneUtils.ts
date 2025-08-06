import * as THREE from "three";

export function createScene(mountElement: HTMLDivElement) {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mountElement.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  return { scene, camera, renderer };
}

export function createPlane(): THREE.Group {
  const planeGroup = new THREE.Group();

  // Create realistic airplane materials
  const fuselageMaterial = new THREE.MeshPhongMaterial({
    color: 0xf0f0f0,
    shininess: 30,
    specular: 0x222222,
  });
  const wingMaterial = new THREE.MeshPhongMaterial({
    color: 0xe0e0e0,
    shininess: 50,
    specular: 0x333333,
  });
  const metalMaterial = new THREE.MeshPhongMaterial({
    color: 0x444444,
    shininess: 100,
    specular: 0x666666,
  });
  const propMaterial = new THREE.MeshPhongMaterial({
    color: 0x222222,
    shininess: 80,
    specular: 0x555555,
  });

  // Fuselage (main body) - more realistic shape
  const fuselageGroup = new THREE.Group();

  // Main fuselage sections
  const noseConeGeometry = new THREE.ConeGeometry(0.4, 1.2, 12);
  const noseCone = new THREE.Mesh(noseConeGeometry, fuselageMaterial);
  noseCone.position.set(0, 0, 2.1);
  noseCone.rotation.x = Math.PI / 2;
  noseCone.castShadow = true;
  fuselageGroup.add(noseCone);

  const midBodyGeometry = new THREE.CylinderGeometry(0.4, 0.35, 2.5, 16);
  const midBody = new THREE.Mesh(midBodyGeometry, fuselageMaterial);
  midBody.rotation.x = Math.PI / 2;
  midBody.position.set(0, 0, 0.25);
  midBody.castShadow = true;
  fuselageGroup.add(midBody);

  const tailConeGeometry = new THREE.ConeGeometry(0.35, 1.5, 12);
  const tailCone = new THREE.Mesh(tailConeGeometry, fuselageMaterial);
  tailCone.position.set(0, 0, -2.25);
  tailCone.rotation.x = -Math.PI / 2;
  tailCone.castShadow = true;
  fuselageGroup.add(tailCone);

  planeGroup.add(fuselageGroup);

  // Cockpit/canopy
  const canopyGeometry = new THREE.SphereGeometry(
    0.35,
    12,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  const canopyMaterial = new THREE.MeshPhongMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.6,
    shininess: 100,
  });
  const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
  canopy.position.set(0, 0.2, 0.8);
  canopy.castShadow = true;
  planeGroup.add(canopy);

  // Main wings with realistic shape
  const wingGroup = new THREE.Group();
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(4, 0.5);
  wingShape.lineTo(5, 0.3);
  wingShape.lineTo(5.5, 0);
  wingShape.lineTo(5, -0.3);
  wingShape.lineTo(4, -0.5);
  wingShape.lineTo(0, -1);
  wingShape.lineTo(0, 0);

  const wingGeometry = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
  });

  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.position.set(0, 0.1, -0.2);
  leftWing.rotation.y = Math.PI;
  leftWing.castShadow = true;
  wingGroup.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.position.set(0, 0.1, -0.2);
  rightWing.castShadow = true;
  wingGroup.add(rightWing);

  planeGroup.add(wingGroup);

  // Wing struts (support structures)
  const strutGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6);
  const leftStrut = new THREE.Mesh(strutGeometry, metalMaterial);
  leftStrut.position.set(-2, -0.1, -0.2);
  leftStrut.rotation.z = Math.PI / 12;
  leftStrut.castShadow = true;
  planeGroup.add(leftStrut);

  const rightStrut = new THREE.Mesh(strutGeometry, metalMaterial);
  rightStrut.position.set(2, -0.1, -0.2);
  rightStrut.rotation.z = -Math.PI / 12;
  rightStrut.castShadow = true;
  planeGroup.add(rightStrut);

  // Horizontal stabilizer (elevator)
  const elevatorGeometry = new THREE.BoxGeometry(2.5, 0.08, 0.8);
  const elevator = new THREE.Mesh(elevatorGeometry, wingMaterial);
  elevator.position.set(0, 0.1, -2.5);
  elevator.castShadow = true;
  planeGroup.add(elevator);

  // Vertical stabilizer (rudder)
  const rudderGeometry = new THREE.BoxGeometry(0.08, 1.0, 0.8);
  const rudder = new THREE.Mesh(rudderGeometry, wingMaterial);
  rudder.position.set(0, 0.6, -2.5);
  rudder.castShadow = true;
  planeGroup.add(rudder);

  // Landing gear - more detailed
  const gearLegGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8);
  const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1);
  const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

  // Main gear (left)
  const leftGearLeg = new THREE.Mesh(gearLegGeometry, metalMaterial);
  leftGearLeg.position.set(-1.5, -0.4, 0);
  leftGearLeg.castShadow = true;
  planeGroup.add(leftGearLeg);

  const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  leftWheel.position.set(-1.5, -0.8, 0);
  leftWheel.rotation.z = Math.PI / 2;
  leftWheel.castShadow = true;
  planeGroup.add(leftWheel);

  // Main gear (right)
  const rightGearLeg = new THREE.Mesh(gearLegGeometry, metalMaterial);
  rightGearLeg.position.set(1.5, -0.4, 0);
  rightGearLeg.castShadow = true;
  planeGroup.add(rightGearLeg);

  const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rightWheel.position.set(1.5, -0.8, 0);
  rightWheel.rotation.z = Math.PI / 2;
  rightWheel.castShadow = true;
  planeGroup.add(rightWheel);

  // Tail wheel
  const tailGearGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
  const tailGear = new THREE.Mesh(tailGearGeometry, metalMaterial);
  tailGear.position.set(0, -0.2, -2.8);
  tailGear.castShadow = true;
  planeGroup.add(tailGear);

  const tailWheelGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.06);
  const tailWheel = new THREE.Mesh(tailWheelGeometry, wheelMaterial);
  tailWheel.position.set(0, -0.35, -2.8);
  tailWheel.rotation.z = Math.PI / 2;
  tailWheel.castShadow = true;
  planeGroup.add(tailWheel);

  // Engine and propeller assembly
  const engineGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.8);
  const engine = new THREE.Mesh(engineGeometry, metalMaterial);
  engine.position.set(0, 0, 2.8);
  engine.rotation.x = Math.PI / 2;
  engine.castShadow = true;
  planeGroup.add(engine);

  // Propeller hub
  const hubGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.15);
  const hub = new THREE.Mesh(hubGeometry, metalMaterial);
  hub.position.set(0, 0, 3.3);
  hub.rotation.x = Math.PI / 2;
  hub.castShadow = true;
  planeGroup.add(hub);

  // Propeller blades (2-blade prop)
  const propellerGroup = new THREE.Group();

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(0.1, 1.8);
  bladeShape.lineTo(0.05, 2.0);
  bladeShape.lineTo(-0.05, 2.0);
  bladeShape.lineTo(-0.1, 1.8);
  bladeShape.lineTo(0, 0);

  const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
  });

  const blade1 = new THREE.Mesh(bladeGeometry, propMaterial);
  blade1.position.set(0, 0, 3.35);
  blade1.rotation.x = Math.PI / 2;
  propellerGroup.add(blade1);

  const blade2 = new THREE.Mesh(bladeGeometry, propMaterial);
  blade2.position.set(0, 0, 3.35);
  blade2.rotation.x = Math.PI / 2;
  blade2.rotation.z = Math.PI;
  propellerGroup.add(blade2);

  planeGroup.add(propellerGroup);

  // Store reference to propeller for animation
  planeGroup.userData = { propeller: propellerGroup };

  return planeGroup;
}

export function createEnvironment(scene: THREE.Scene): void {
  // Create runway - much longer and more realistic
  const runwayGeometry = new THREE.PlaneGeometry(50, 400); // Made longer (200 -> 400)
  const runwayMaterial = new THREE.MeshPhongMaterial({
    color: 0x2a2a2a, // Darker, more realistic asphalt color
    shininess: 10,
    specular: 0x111111,
  });
  const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
  runway.rotation.x = -Math.PI / 2;
  runway.position.y = 0; // Ensure runway is at ground level (y=0)
  runway.receiveShadow = true;
  scene.add(runway);

  // Runway centerline markings
  const centerlineGeometry = new THREE.PlaneGeometry(1, 400);
  const centerlineMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
  });
  const centerline = new THREE.Mesh(centerlineGeometry, centerlineMaterial);
  centerline.rotation.x = -Math.PI / 2;
  centerline.position.y = 0.002; // Slightly above runway
  scene.add(centerline);

  // Runway edge markings
  const edgeMarkingGeometry = new THREE.PlaneGeometry(0.5, 400);
  const edgeMarkingMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
  });

  const leftEdgeMarking = new THREE.Mesh(
    edgeMarkingGeometry,
    edgeMarkingMaterial
  );
  leftEdgeMarking.rotation.x = -Math.PI / 2;
  leftEdgeMarking.position.set(-24, 0.002, 0);
  scene.add(leftEdgeMarking);

  const rightEdgeMarking = new THREE.Mesh(
    edgeMarkingGeometry,
    edgeMarkingMaterial
  );
  rightEdgeMarking.rotation.x = -Math.PI / 2;
  rightEdgeMarking.position.set(24, 0.002, 0);
  scene.add(rightEdgeMarking);

  // Ground
  const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x5d8a3a }); // More realistic grass color
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01; // Just below runway level for seamless transition
  ground.receiveShadow = true;
  scene.add(ground);

  // Add mountains - properly positioned on ground
  for (let i = 0; i < 12; i++) {
    const mountainHeight = Math.random() * 60 + 40;
    const mountainRadius = Math.random() * 25 + 15;
    const mountainGeometry = new THREE.ConeGeometry(
      mountainRadius,
      mountainHeight,
      8
    );
    const mountainMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(0.08, 0.4, 0.25 + Math.random() * 0.15),
    });
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);

    // Position mountains away from runway area and on ground
    let x, z;
    do {
      x = (Math.random() - 0.5) * 1200;
      z = (Math.random() - 0.5) * 1200;
    } while (Math.abs(x) < 200 || Math.abs(z) < 300); // Keep away from runway area

    mountain.position.set(x, mountainHeight / 2, z); // Base at ground level
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    scene.add(mountain);
  }

  // Add buildings/city - properly positioned on ground
  for (let i = 0; i < 20; i++) {
    const buildingWidth = Math.random() * 15 + 8;
    const buildingHeight = Math.random() * 50 + 15;
    const buildingDepth = Math.random() * 15 + 8;

    const buildingGeometry = new THREE.BoxGeometry(
      buildingWidth,
      buildingHeight,
      buildingDepth
    );
    const buildingMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(0.6, 0.15, 0.4 + Math.random() * 0.3),
      shininess: 30,
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);

    // Position buildings away from runway and on ground
    let x, z;
    do {
      x = (Math.random() - 0.5) * 800;
      z = (Math.random() - 0.5) * 800;
    } while (Math.abs(x) < 100 || Math.abs(z) < 250); // Keep away from runway area

    building.position.set(x, buildingHeight / 2, z); // Base at ground level
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
  }

  // Add clouds
  for (let i = 0; i < 30; i++) {
    const cloudGeometry = new THREE.SphereGeometry(
      Math.random() * 15 + 10,
      8,
      6
    );
    const cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(
      (Math.random() - 0.5) * 1000,
      Math.random() * 100 + 50,
      (Math.random() - 0.5) * 1000
    );
    scene.add(cloud);
  }

  // Add trees - properly positioned on ground and away from runway
  for (let i = 0; i < 35; i++) {
    const trunkHeight = Math.random() * 2 + 3;
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.6, trunkHeight);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

    const leavesRadius = Math.random() * 1 + 1.5;
    const leavesGeometry = new THREE.SphereGeometry(leavesRadius);
    const leavesMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(0.3, 0.8, 0.3 + Math.random() * 0.2),
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = trunkHeight / 2 + leavesRadius * 0.7;

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(leaves);

    // Position trees away from runway area and on ground
    let x, z;
    do {
      x = (Math.random() - 0.5) * 900;
      z = (Math.random() - 0.5) * 900;
    } while (Math.abs(x) < 80 || Math.abs(z) < 220); // Keep away from runway area

    tree.position.set(x, 0, z); // Base at ground level
    tree.castShadow = true;
    tree.receiveShadow = true;
    scene.add(tree);
  }
}
