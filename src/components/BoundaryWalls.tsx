import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { HALF_WORLD } from "../constants/world";

export default function BoundaryWalls() {
  const wallHeight = 8;
  const wallThickness = 2;

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, wallHeight / 2, HALF_WORLD]} receiveShadow castShadow>
          <boxGeometry args={[HALF_WORLD * 2, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#545b66" />
        </mesh>
        <CuboidCollider
          args={[HALF_WORLD, wallHeight / 2, wallThickness / 2]}
          position={[0, wallHeight / 2, HALF_WORLD]}
        />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, wallHeight / 2, -HALF_WORLD]} receiveShadow castShadow>
          <boxGeometry args={[HALF_WORLD * 2, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#545b66" />
        </mesh>
        <CuboidCollider
          args={[HALF_WORLD, wallHeight / 2, wallThickness / 2]}
          position={[0, wallHeight / 2, -HALF_WORLD]}
        />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[HALF_WORLD, wallHeight / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, HALF_WORLD * 2]} />
          <meshStandardMaterial color="#545b66" />
        </mesh>
        <CuboidCollider
          args={[wallThickness / 2, wallHeight / 2, HALF_WORLD]}
          position={[HALF_WORLD, wallHeight / 2, 0]}
        />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[-HALF_WORLD, wallHeight / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, HALF_WORLD * 2]} />
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
