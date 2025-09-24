import { KeyboardControls, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Suspense, useRef, type ReactElement } from "react";
import HondaAce from "./models/honda-ace";
// import ChaseCamera from "./components/ChaseCamera";
import type { RapierRigidBody } from "@react-three/rapier";
import ChaseCamera from "./components/ChaseCamera";

// Define the control map
const controlsMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
];

const WORLD_SIZE = 200; // matches the ground size
const HALF_WORLD = WORLD_SIZE / 2;
const BLOCK_SIZE = 20; // distance between road centerlines
const ROAD_WIDTH = 6; // width of each road stripe

function BoundaryWalls() {
  const wallHeight = 8;
  const wallThickness = 2;

  return (
    <>
      {/* North wall (runs along X at +Z edge) */}
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, wallHeight / 2, HALF_WORLD]} receiveShadow castShadow>
          <boxGeometry args={[WORLD_SIZE, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#545b66" />
        </mesh>
        <CuboidCollider
          args={[HALF_WORLD, wallHeight / 2, wallThickness / 2]}
          position={[0, wallHeight / 2, HALF_WORLD]}
        />
      </RigidBody>

      {/* South wall (runs along X at -Z edge) */}
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, wallHeight / 2, -HALF_WORLD]} receiveShadow castShadow>
          <boxGeometry args={[WORLD_SIZE, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#545b66" />
        </mesh>
        <CuboidCollider
          args={[HALF_WORLD, wallHeight / 2, wallThickness / 2]}
          position={[0, wallHeight / 2, -HALF_WORLD]}
        />
      </RigidBody>

      {/* East wall (runs along Z at +X edge) */}
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[HALF_WORLD, wallHeight / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, WORLD_SIZE]} />
          <meshStandardMaterial color="#545b66" />
        </mesh>
        <CuboidCollider
          args={[wallThickness / 2, wallHeight / 2, HALF_WORLD]}
          position={[HALF_WORLD, wallHeight / 2, 0]}
        />
      </RigidBody>

      {/* West wall (runs along Z at -X edge) */}
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[-HALF_WORLD, wallHeight / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, WORLD_SIZE]} />
          <meshStandardMaterial color="#545b66" />
        </mesh>
        <CuboidCollider
          args={[wallThickness / 2, wallHeight / 2, HALF_WORLD]}
          position={[-HALF_WORLD, wallHeight / 2, 0]}
        />
      </RigidBody>
    </>
  );
}

function City() {
  const roadY = 0.01; // slightly above ground to avoid z-fighting

  // Simple deterministic pseudo-random based on grid indices
  const prng = (ix: number, iz: number) => {
    const s = Math.sin(ix * 12.9898 + iz * 78.233) * 43758.5453123;
    return s - Math.floor(s);
  };

  const buildingColor = (ix: number, iz: number) => {
    const colors = ["#a9b2bd", "#c9cfd6", "#8f98a3", "#bfc7cf", "#9aa3ad"]; // muted city palette
    return colors[Math.floor(prng(ix, iz) * colors.length) % colors.length];
  };

  const buildings: ReactElement[] = [];
  const roads: ReactElement[] = [];

  // Roads: horizontal and vertical stripes
  for (let z = -HALF_WORLD; z <= HALF_WORLD; z += BLOCK_SIZE) {
    roads.push(
      <mesh key={`road-h-${z}`} position={[0, roadY, z]} receiveShadow castShadow>
        <boxGeometry args={[WORLD_SIZE, 0.02, ROAD_WIDTH]} />
        <meshStandardMaterial color="#2a2f33" />
      </mesh>
    );
  }
  for (let x = -HALF_WORLD; x <= HALF_WORLD; x += BLOCK_SIZE) {
    roads.push(
      <mesh key={`road-v-${x}`} position={[x, roadY, 0]} receiveShadow castShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.02, WORLD_SIZE]} />
        <meshStandardMaterial color="#2a2f33" />
      </mesh>
    );
  }

  // Buildings: one per block cell, skipping a central spawn area
  const innerWidth = BLOCK_SIZE - ROAD_WIDTH; // available block interior between roads
  const footprint = innerWidth * 0.7; // leave sidewalk margin

  for (let iz = -HALF_WORLD + BLOCK_SIZE / 2; iz < HALF_WORLD; iz += BLOCK_SIZE) {
    for (let ix = -HALF_WORLD + BLOCK_SIZE / 2; ix < HALF_WORLD; ix += BLOCK_SIZE) {
      // Keep a clear spawn/plaza near the origin
      if (Math.abs(ix) < 15 && Math.abs(iz) < 15) continue;

      const rnd = prng(ix, iz);
      const height = 4 + Math.floor(rnd * 16); // between 4 and ~20
      const halfX = footprint / 2;
      const halfZ = footprint / 2;

      buildings.push(
        <RigidBody key={`b-${ix}-${iz}`} type="fixed" colliders={false}>
          <mesh position={[ix, height / 2, iz]} receiveShadow castShadow>
            <boxGeometry args={[footprint, height, footprint]} />
            <meshStandardMaterial color={buildingColor(ix, iz)} />
          </mesh>
          <CuboidCollider args={[halfX, height / 2, halfZ]} position={[ix, height / 2, iz]} />
        </RigidBody>
      );
    }
  }

  return (
    <group>
      {roads}
      {buildings}
    </group>
  );
}

function App() {
  const carRef = useRef<RapierRigidBody>(null);

  return (
    <>
      <KeyboardControls map={controlsMap}>
        <Canvas shadows camera={{ position: [0, 8, 20], fov: 50 }} style={{ height: "100vh", width: "100vw" }}>
          <Suspense>
            {/* Lights */}
            <hemisphereLight intensity={0.6} groundColor={0x223344} />

            <directionalLight
              castShadow
              position={[10, 20, 10]}
              intensity={1.1}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />

            {/* Physics world */}
            <Physics gravity={[0, -9.81, 0]} debug>
              {/* Ground: thick box so height is visually clear */}
              <RigidBody type="fixed" colliders={false}>
                {/* Box height 2, positioned so top sits at y=0 */}
                <mesh position={[0, -1, 0]} receiveShadow castShadow>
                  <boxGeometry args={[WORLD_SIZE, 2, WORLD_SIZE]} />
                  <meshStandardMaterial color="#7a8a99" />
                </mesh>
                {/* Collider half-extents must match box: 100, 1, 100 at same center */}
                <CuboidCollider args={[HALF_WORLD, 1, HALF_WORLD]} position={[0, -1, 0]} />
              </RigidBody>

              {/* City grid: roads and buildings */}
              <City />

              {/* Boundary walls to keep the car in-bounds */}
              <BoundaryWalls />

              {/* GLTF model with proper physics */}
              <HondaAce ref={carRef} />
            </Physics>

            {/* Chase camera that follows the car */}
            <ChaseCamera target={carRef} />
            {/* <OrbitControls /> */}
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </>
  );
}

export default App;
