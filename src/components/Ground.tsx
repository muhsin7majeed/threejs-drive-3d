import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { HALF_WORLD, WORLD_SIZE } from "../constants/world";

export default function Ground() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh position={[0, -1, 0]} receiveShadow castShadow>
        <boxGeometry args={[WORLD_SIZE, 2, WORLD_SIZE]} />
        <meshStandardMaterial color="#7a8a99" />
      </mesh>
      <CuboidCollider args={[HALF_WORLD, 1, HALF_WORLD]} position={[0, -1, 0]} />
    </RigidBody>
  );
}
