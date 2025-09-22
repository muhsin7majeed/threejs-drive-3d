import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { useEffect, useRef } from "react";
import type { Object3D } from "three";
import { useKeyboardControls } from "@react-three/drei";

const HondaAce = () => {
  const url = new URL("../assets/models/honda-ace/scene.gltf", import.meta.url).href;
  const gltf = useLoader(GLTFLoader, url);

  // Refs to wheel objects in the GLTF scene
  const wheelFLRef = useRef<Object3D | null>(null);
  const wheelFRRef = useRef<Object3D | null>(null);

  // Steering state (using refs to avoid rerenders)
  const steerAngleRef = useRef(0);

  // Use drei's keyboard controls
  const [, getKeys] = useKeyboardControls();

  // Resolve wheel objects once the GLTF is available
  useEffect(() => {
    const root = gltf.scene;
    if (!root) return;

    wheelFLRef.current = root.getObjectByName("WHEEL_LF") ?? null;
    wheelFRRef.current = root.getObjectByName("WHEEL_RF") ?? null;
  }, [gltf.scene]);

  // Per-frame steering update for front wheels (rotate around Y)
  useFrame(() => {
    const maxSteerRadians = 0.5; // ~28.6°
    const steerLerp = 0.2; // smoothing factor

    const { left, right } = getKeys();

    const steerDir = (left ? 1 : 0) - (right ? 1 : 0); // +1 = left, -1 = right
    const targetAngle = steerDir * maxSteerRadians;

    steerAngleRef.current += (targetAngle - steerAngleRef.current) * steerLerp;

    if (wheelFLRef.current) wheelFLRef.current.rotation.y = steerAngleRef.current;
    if (wheelFRRef.current) wheelFRRef.current.rotation.y = steerAngleRef.current;
  });

  return <primitive object={gltf.scene} />;
};

export default HondaAce;
