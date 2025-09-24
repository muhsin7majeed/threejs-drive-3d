import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { useEffect, useRef, forwardRef } from "react";
import type { Object3D } from "three";
import { useKeyboardControls } from "@react-three/drei";
import { RigidBody, CuboidCollider, BallCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

const HondaAce = forwardRef<RapierRigidBody>((_props, ref) => {
  const url = new URL("../assets/models/honda-ace/scene.gltf", import.meta.url).href;
  const gltf = useLoader(GLTFLoader, url);

  // Physics refs - use forwarded ref or create internal ref
  const internalRef = useRef<RapierRigidBody>(null);

  // Refs to wheel objects in the GLTF scene
  const wheelFLRef = useRef<Object3D | null>(null);
  const wheelFRRef = useRef<Object3D | null>(null);
  const wheelRLRef = useRef<Object3D | null>(null);
  const wheelRRRef = useRef<Object3D | null>(null);

  // Vehicle physics constants
  const CAR_CONFIG = {
    engineForce: 140,
    brakeForce: 100,
    maxSpeed: 28,
    maxSteerDegrees: 30,
    steerLerpSpeed: 7,
    lateralFriction: 8,
    wheelRadius: 0.18,
    wheelbase: 2.6,
    linearDamping: 0.8, // Even lower for better momentum
    angularDamping: 3.0,
    yawRateLerpSpeed: 8,
    // New momentum parameters
    coastingDamping: 0.3, // Natural slowdown when not accelerating
    minimumSpeed: 0.1, // Below this speed, apply extra damping to stop completely
  };

  const maxSteerRadians = THREE.MathUtils.degToRad(CAR_CONFIG.maxSteerDegrees);
  const VISUAL_OFFSET_Y = -0.7;

  // Steering and wheel spin state
  const steerAngleRef = useRef(0);
  const wheelSpinRef = useRef({ FL: 0, FR: 0, RL: 0, RR: 0 });

  // Store base quaternions for proper wheel rotation composition
  const wheelBaseQuats = useRef({
    FL: new THREE.Quaternion(),
    FR: new THREE.Quaternion(),
    RL: new THREE.Quaternion(),
    RR: new THREE.Quaternion(),
  });

  // Temp vectors and quaternions for calculations
  const tempForward = useRef(new THREE.Vector3());
  const tempRight = useRef(new THREE.Vector3());
  const tempImpulse = useRef(new THREE.Vector3());
  const tempQuat = useRef(new THREE.Quaternion());
  const tempVel = useRef(new THREE.Vector3());
  const tempSteerQuat = useRef(new THREE.Quaternion());
  const tempSpinQuat = useRef(new THREE.Quaternion());

  // Use drei's keyboard controls
  const [, getKeys] = useKeyboardControls();

  // Ground detection function - simplified approach
  const isGrounded = (rigidBody: RapierRigidBody) => {
    if (!rigidBody) return false;
    const t = rigidBody.translation();
    // Simple ground check: if car is close to ground level (y=0), assume grounded
    return t.y < 4; // Adjust this threshold based on your car's height
  };

  // Resolve wheel objects once the GLTF is available
  useEffect(() => {
    const root = gltf.scene;
    if (!root) return;

    wheelFLRef.current = root.getObjectByName("WHEEL_LF") ?? null;
    wheelFRRef.current = root.getObjectByName("WHEEL_RF") ?? null;
    wheelRLRef.current = root.getObjectByName("WHEEL_LR") ?? null;
    wheelRRRef.current = root.getObjectByName("WHEEL_RR") ?? null;

    // Store base quaternions for proper rotation composition
    if (wheelFLRef.current) wheelBaseQuats.current.FL.copy(wheelFLRef.current.quaternion);
    if (wheelFRRef.current) wheelBaseQuats.current.FR.copy(wheelFRRef.current.quaternion);
    if (wheelRLRef.current) wheelBaseQuats.current.RL.copy(wheelRLRef.current.quaternion);
    if (wheelRRRef.current) wheelBaseQuats.current.RR.copy(wheelRRRef.current.quaternion);
  }, [gltf.scene]);

  // Per-frame physics and animation update
  useFrame((_, delta) => {
    const rigidBody = (ref as React.RefObject<RapierRigidBody>)?.current || internalRef.current;
    if (!rigidBody) return;

    // Read velocity and limit speed on XZ plane
    const vel = rigidBody.linvel();
    const horizontalSpeed = Math.hypot(vel.x, vel.z);

    // Get orientation vectors
    const r = rigidBody.rotation();
    tempQuat.current.set(r.x, r.y, r.z, r.w);

    // Use +Z as model-forward (adjust if your model faces different direction)
    tempForward.current.set(0, 0, 1).applyQuaternion(tempQuat.current);
    tempForward.current.y = 0;
    if (tempForward.current.lengthSq() > 0.0001) tempForward.current.normalize();

    tempRight.current.set(1, 0, 0).applyQuaternion(tempQuat.current);
    tempRight.current.y = 0;
    if (tempRight.current.lengthSq() > 0.0001) tempRight.current.normalize();

    const { left, right, forward, backward } = getKeys();
    const grounded = isGrounded(rigidBody);

    // Lateral friction: cancel sideways velocity when on ground
    if (grounded) {
      tempVel.current.set(vel.x, 0, vel.z);
      const lateralSpeed = tempVel.current.dot(tempRight.current);
      const lateralCancel = -lateralSpeed;
      tempImpulse.current.copy(tempRight.current).multiplyScalar(lateralCancel * CAR_CONFIG.lateralFriction * delta);
      rigidBody.applyImpulse({ x: tempImpulse.current.x, y: 0, z: tempImpulse.current.z }, true);
    }

    // Propulsion as rear-wheel drive: apply along forward when grounded
    const moveInput = (forward ? 1 : 0) + (backward ? -1 : 0);
    if (grounded && moveInput !== 0 && horizontalSpeed < CAR_CONFIG.maxSpeed) {
      tempImpulse.current
        .copy(tempForward.current)
        .multiplyScalar((moveInput > 0 ? CAR_CONFIG.engineForce : -CAR_CONFIG.brakeForce) * delta);
      rigidBody.applyImpulse({ x: tempImpulse.current.x, y: 0, z: tempImpulse.current.z }, true);
    }

    // Natural momentum and coasting behavior
    if (grounded && moveInput === 0) {
      // Apply coasting damping when no input is pressed
      tempVel.current.set(vel.x, 0, vel.z);
      const coastingForce = CAR_CONFIG.coastingDamping * delta;

      // Apply stronger damping if speed is very low to help car come to complete stop
      const dampingMultiplier = horizontalSpeed < CAR_CONFIG.minimumSpeed ? 5.0 : 1.0;

      tempImpulse.current.copy(tempVel.current).multiplyScalar(-coastingForce * dampingMultiplier);
      rigidBody.applyImpulse({ x: tempImpulse.current.x, y: 0, z: tempImpulse.current.z }, true);
    }

    // Steering angle target from input
    const steerInput = (left ? 1 : 0) + (right ? -1 : 0);
    const targetSteer = maxSteerRadians * steerInput;
    steerAngleRef.current += (targetSteer - steerAngleRef.current) * Math.min(1, CAR_CONFIG.steerLerpSpeed * delta);

    // Bicycle model yaw-rate control: omega = v/L * tan(steer)
    if (grounded) {
      tempVel.current.set(vel.x, 0, vel.z);
      const forwardSpeed = tempVel.current.dot(tempForward.current);
      const curvature = Math.tan(steerAngleRef.current) / Math.max(0.1, CAR_CONFIG.wheelbase);
      const targetYawRate = THREE.MathUtils.clamp(forwardSpeed * curvature, -5, 5);
      const ang = rigidBody.angvel();
      const currentYaw = ang ? ang.y ?? 0 : 0;
      const blendedYaw = THREE.MathUtils.lerp(
        currentYaw,
        targetYawRate,
        Math.min(1, CAR_CONFIG.yawRateLerpSpeed * delta)
      );
      rigidBody.setAngvel({ x: 0, y: blendedYaw, z: 0 }, true);
    }

    // Visual wheel rotation - only update when moving
    const wheelRotSpeed = horizontalSpeed / Math.max(0.001, CAR_CONFIG.wheelRadius);
    const rotDelta = wheelRotSpeed * delta * (moveInput >= 0 ? 1 : -1);

    // Only update wheel spin when car is moving and grounded
    if (grounded && horizontalSpeed > 0.1) {
      wheelSpinRef.current.FL += rotDelta;
      wheelSpinRef.current.FR += rotDelta;
      wheelSpinRef.current.RL += rotDelta;
      wheelSpinRef.current.RR += rotDelta;
    }

    // Apply rotations to wheels using proper quaternion composition
    // This prevents gimbal lock and maintains proper wheel orientation

    // Front wheels: base * steering * spinning (order matters!)
    if (wheelFLRef.current) {
      // Start with base quaternion, then apply steering (Y-axis), then spinning (X-axis)
      tempSteerQuat.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), steerAngleRef.current);
      tempSpinQuat.current.setFromAxisAngle(new THREE.Vector3(1, 0, 0), wheelSpinRef.current.FL);

      wheelFLRef.current.quaternion
        .copy(wheelBaseQuats.current.FL)
        .multiply(tempSteerQuat.current)
        .multiply(tempSpinQuat.current);
    }

    if (wheelFRRef.current) {
      tempSteerQuat.current.setFromAxisAngle(new THREE.Vector3(0, 1, 0), steerAngleRef.current);
      tempSpinQuat.current.setFromAxisAngle(new THREE.Vector3(1, 0, 0), wheelSpinRef.current.FR);

      wheelFRRef.current.quaternion
        .copy(wheelBaseQuats.current.FR)
        .multiply(tempSteerQuat.current)
        .multiply(tempSpinQuat.current);
    }

    // Rear wheels: base * spinning only (no steering)
    if (wheelRLRef.current) {
      tempSpinQuat.current.setFromAxisAngle(new THREE.Vector3(1, 0, 0), wheelSpinRef.current.RL);

      wheelRLRef.current.quaternion.copy(wheelBaseQuats.current.RL).multiply(tempSpinQuat.current);
    }

    if (wheelRRRef.current) {
      tempSpinQuat.current.setFromAxisAngle(new THREE.Vector3(1, 0, 0), wheelSpinRef.current.RR);

      wheelRRRef.current.quaternion.copy(wheelBaseQuats.current.RR).multiply(tempSpinQuat.current);
    }
  });

  return (
    <RigidBody
      ref={ref}
      position={[0, 3, 0]}
      colliders={false}
      linearDamping={CAR_CONFIG.linearDamping}
      angularDamping={CAR_CONFIG.angularDamping}
      enabledRotations={[false, true, false]}
    >
      {/* Car chassis collider - kept inside body to avoid ground contact */}
      <CuboidCollider args={[0.9, 0.25, 1.8]} position={[0, -0.2, 0]} friction={0.6} />
      {/* Wheel colliders (spherical) for contact without visual lift */}
      <BallCollider args={[0.18]} position={[-0.7, -0.52, 1.2]} friction={1.6} /> {/* Front Left */}
      <BallCollider args={[0.18]} position={[0.7, -0.52, 1.2]} friction={1.6} /> {/* Front Right */}
      <BallCollider args={[0.18]} position={[-0.7, -0.52, -1.2]} friction={1.6} /> {/* Rear Left */}
      <BallCollider args={[0.18]} position={[0.7, -0.52, -1.2]} friction={1.6} /> {/* Rear Right */}
      {/* The visual GLTF model (lowered slightly to meet ground visually) */}
      <group position={[0, VISUAL_OFFSET_Y, 0]}>
        <primitive object={gltf.scene} />
      </group>
    </RigidBody>
  );
});

HondaAce.displayName = "HondaAce";

export default HondaAce;
