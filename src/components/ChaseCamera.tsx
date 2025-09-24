import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import type { RapierRigidBody } from "@react-three/rapier";

interface ChaseCameraProps {
  target: React.RefObject<RapierRigidBody | null>;
  distance?: number;
  height?: number;
  smoothness?: number;
  lookAhead?: number;
  mouseSensitivity?: number;
}

export const ChaseCamera = ({
  target,
  distance = 8,
  height = 3,
  smoothness = 1.5,
  lookAhead = 0,
  mouseSensitivity = 0.002,
}: ChaseCameraProps) => {
  const { camera, gl } = useThree();

  // Mouse look state (only horizontal rotation)
  const mouseX = useRef(0);
  const isPointerLocked = useRef(false);

  // Camera position and target references for smooth interpolation
  const cameraPosition = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());
  const currentVelocity = useRef(new THREE.Vector3());

  // Temp vectors for calculations
  const tempCarPos = useRef(new THREE.Vector3());
  const tempCarQuat = useRef(new THREE.Quaternion());
  const tempForward = useRef(new THREE.Vector3());
  const tempRight = useRef(new THREE.Vector3());
  const tempCameraOffset = useRef(new THREE.Vector3());
  const tempLookAtTarget = useRef(new THREE.Vector3());

  // Mouse event handlers
  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.current) return;

      // Only track horizontal mouse movement
      mouseX.current += event.movementX * mouseSensitivity;
    };

    const handleClick = () => {
      if (!isPointerLocked.current) {
        canvas.requestPointerLock();
      }
    };

    // Add event listeners
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [gl.domElement, mouseSensitivity]);

  useFrame((_, delta) => {
    if (!target.current) return;

    // Get car's current position and rotation
    const carTranslation = target.current.translation();
    const carRotation = target.current.rotation();
    const carVelocity = target.current.linvel();

    tempCarPos.current.set(carTranslation.x, carTranslation.y, carTranslation.z);
    tempCarQuat.current.set(carRotation.x, carRotation.y, carRotation.z, carRotation.w);
    currentVelocity.current.set(carVelocity.x, carVelocity.y, carVelocity.z);

    // Calculate car's forward and right directions (assuming +Z is forward)
    tempForward.current.set(0, 0, 1).applyQuaternion(tempCarQuat.current);
    tempForward.current.y = 0; // Keep forward direction horizontal
    tempForward.current.normalize();

    tempRight.current.set(1, 0, 0).applyQuaternion(tempCarQuat.current);
    tempRight.current.y = 0; // Keep right direction horizontal
    tempRight.current.normalize();

    // Apply horizontal mouse rotation to the base chase camera direction
    const mouseInfluencedForward = tempForward.current.clone();

    // Horizontal rotation (yaw) from mouse X
    const yawRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -mouseX.current);
    mouseInfluencedForward.applyQuaternion(yawRotation);

    // Calculate camera position with mouse influence (fixed height)
    tempCameraOffset.current
      .copy(mouseInfluencedForward)
      .multiplyScalar(-distance) // Behind the car
      .add(tempCarPos.current)
      .add(new THREE.Vector3(0, height, 0)); // Fixed height above the car

    // Calculate look-at target with mouse influence
    const speed = currentVelocity.current.length();
    const velocityLookAhead = Math.min(speed * lookAhead, 10);

    tempLookAtTarget.current
      .copy(mouseInfluencedForward)
      .multiplyScalar(velocityLookAhead + distance * 0.3) // Look ahead of car
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
