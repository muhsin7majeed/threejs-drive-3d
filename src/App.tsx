import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useRef } from "react";
import HondaAce from "./models/honda-ace";
// import ChaseCamera from "./components/ChaseCamera";
import type { RapierRigidBody } from "@react-three/rapier";
import ChaseCamera from "./components/ChaseCamera";
import { controlsMap } from "./controls";
import Ground from "./components/Ground";
import City from "./components/City";
import BoundaryWalls from "./components/BoundaryWalls";

function App() {
  const carRef = useRef<RapierRigidBody>(null);

  return (
    <>
      <KeyboardControls map={[...controlsMap]}>
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
              <Ground />

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
