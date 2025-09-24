import { CuboidCollider, RigidBody } from "@react-three/rapier";
import type { ReactElement } from "react";
import { BLOCK_SIZE, HALF_WORLD, ROAD_WIDTH } from "../constants/world";

export default function City() {
  const roadY = 0.01;

  const prng = (ix: number, iz: number) => {
    const s = Math.sin(ix * 12.9898 + iz * 78.233) * 43758.5453123;
    return s - Math.floor(s);
  };

  const buildingColor = (ix: number, iz: number) => {
    const colors = ["#a9b2bd", "#c9cfd6", "#8f98a3", "#bfc7cf", "#9aa3ad"];
    return colors[Math.floor(prng(ix, iz) * colors.length) % colors.length];
  };

  const buildings: ReactElement[] = [];
  const roads: ReactElement[] = [];

  for (let z = -HALF_WORLD; z <= HALF_WORLD; z += BLOCK_SIZE) {
    roads.push(
      <mesh key={`road-h-${z}`} position={[0, roadY, z]} receiveShadow castShadow>
        <boxGeometry args={[HALF_WORLD * 2, 0.02, ROAD_WIDTH]} />
        <meshStandardMaterial color="#2a2f33" />
      </mesh>
    );
  }
  for (let x = -HALF_WORLD; x <= HALF_WORLD; x += BLOCK_SIZE) {
    roads.push(
      <mesh key={`road-v-${x}`} position={[x, roadY, 0]} receiveShadow castShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.02, HALF_WORLD * 2]} />
        <meshStandardMaterial color="#2a2f33" />
      </mesh>
    );
  }

  const innerWidth = BLOCK_SIZE - ROAD_WIDTH;
  const footprint = innerWidth * 0.7;

  for (let iz = -HALF_WORLD + BLOCK_SIZE / 2; iz < HALF_WORLD; iz += BLOCK_SIZE) {
    for (let ix = -HALF_WORLD + BLOCK_SIZE / 2; ix < HALF_WORLD; ix += BLOCK_SIZE) {
      if (Math.abs(ix) < 15 && Math.abs(iz) < 15) continue;

      const rnd = prng(ix, iz);
      const height = 4 + Math.floor(rnd * 16);
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
