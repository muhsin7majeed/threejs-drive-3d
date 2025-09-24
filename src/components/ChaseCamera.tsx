import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RapierRigidBody } from "@react-three/rapier";

interface ChaseCameraProps {
  target: React.RefObject<RapierRigidBody | null>;
  distance?: number;
  height?: number;
  smoothness?: number;
  lookAhead?: number;
}

export const ChaseCamera = ({ 
  target, 
  distance = 8, 
  height = 4, 
  smoothness = 2.5,
  lookAhead = 2
}: ChaseCameraProps) => {
  const { camera } = useThree();
  
  // Camera position and target references for smooth interpolation
  const cameraPosition = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());
  const currentVelocity = useRef(new THREE.Vector3());
  
  // Temp vectors for calculations
  const tempCarPos = useRef(new THREE.Vector3());
  const tempCarQuat = useRef(new THREE.Quaternion());
  const tempForward = useRef(new THREE.Vector3());
  const tempCameraOffset = useRef(new THREE.Vector3());
  const tempLookAtTarget = useRef(new THREE.Vector3());
  
  useFrame((_, delta) => {
    if (!target.current) return;
    
    // Get car's current position and rotation
    const carTranslation = target.current.translation();
    const carRotation = target.current.rotation();
    const carVelocity = target.current.linvel();
    
    tempCarPos.current.set(carTranslation.x, carTranslation.y, carTranslation.z);
    tempCarQuat.current.set(carRotation.x, carRotation.y, carRotation.z, carRotation.w);
    currentVelocity.current.set(carVelocity.x, carVelocity.y, carVelocity.z);
    
    // Calculate car's forward direction (assuming +Z is forward)
    tempForward.current.set(0, 0, 1).applyQuaternion(tempCarQuat.current);
    tempForward.current.y = 0; // Keep forward direction horizontal
    tempForward.current.normalize();
    
    // Calculate desired camera position (behind and above the car)
    tempCameraOffset.current
      .copy(tempForward.current)
      .multiplyScalar(-distance) // Behind the car
      .add(tempCarPos.current)
      .add(new THREE.Vector3(0, height, 0)); // Above the car
    
    // Calculate look-at target (ahead of the car based on velocity)
    const speed = currentVelocity.current.length();
    const velocityLookAhead = Math.min(speed * lookAhead, 10); // Cap the look-ahead distance
    
    tempLookAtTarget.current
      .copy(tempForward.current)
      .multiplyScalar(velocityLookAhead)
      .add(tempCarPos.current)
      .add(new THREE.Vector3(0, 1, 0)); // Slightly above car center
    
    // Smooth camera movement using lerp
    const lerpFactor = Math.min(1, smoothness * delta);
    
    cameraPosition.current.lerp(tempCameraOffset.current, lerpFactor);
    cameraTarget.current.lerp(tempLookAtTarget.current, lerpFactor);
    
    // Apply camera position and look-at
    camera.position.copy(cameraPosition.current);
    camera.lookAt(cameraTarget.current);
  });
  
  return null;
};

export default ChaseCamera;
