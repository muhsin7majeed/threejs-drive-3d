import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Suspense, useRef } from "react";
import HondaAce from "./models/honda-ace";
import ChaseCamera from "./components/ChaseCamera";
import type { RapierRigidBody } from "@react-three/rapier";

// Define the control map
const controlsMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
];

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
            <Physics gravity={[0, -9.81, 0]}>
              {/* Ground: visual plane + fixed collider */}
              <RigidBody type="fixed" colliders={false}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[200, 200]} />
                  <meshStandardMaterial color="#7a8a99" />
                </mesh>
                <CuboidCollider args={[100, 0.1, 100]} />
              </RigidBody>

              {/* GLTF model with proper physics */}
              <HondaAce ref={carRef} />
            </Physics>

            {/* Chase camera that follows the car */}
            <ChaseCamera target={carRef} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </>
  );
}

export default App;
