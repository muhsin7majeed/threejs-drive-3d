import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { useEffect, useRef } from "react";
import type { Object3D } from "three";

const HondaAce = () => {
  const url = new URL("../assets/models/honda-ace/scene.gltf", import.meta.url).href;
  const gltf = useLoader(GLTFLoader, url);

  // Refs to wheel objects in the GLTF scene
  const wheelFLRef = useRef<Object3D | null>(null);
  const wheelFRRef = useRef<Object3D | null>(null);

  // Steering state (using refs to avoid rerenders)
  const steerLeftRef = useRef(false);
  const steerRightRef = useRef(false);
  const steerAngleRef = useRef(0);

  // Resolve wheel objects once the GLTF is available
  useEffect(() => {
    const root = gltf.scene;
    if (!root) return;
    wheelFLRef.current = root.getObjectByName("WHEEL_LF") ?? null;
    wheelFRRef.current = root.getObjectByName("WHEEL_RF") ?? null;
  }, [gltf.scene]);

  // Keyboard input handlers (WASD + Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          steerLeftRef.current = true;
          break;
        case "ArrowRight":
        case "KeyD":
          steerRightRef.current = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          steerLeftRef.current = false;
          break;
        case "ArrowRight":
        case "KeyD":
          steerRightRef.current = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Per-frame steering update for front wheels (rotate around Y)
  useFrame(() => {
    const maxSteerRadians = 0.5; // ~28.6°
    const steerLerp = 0.2; // smoothing factor

    const left = steerLeftRef.current ? 1 : 0;
    const right = steerRightRef.current ? 1 : 0;
    const steerDir = left - right; // +1 = left, -1 = right
    const targetAngle = steerDir * maxSteerRadians;

    steerAngleRef.current += (targetAngle - steerAngleRef.current) * steerLerp;

    if (wheelFLRef.current) wheelFLRef.current.rotation.y = steerAngleRef.current;
    if (wheelFRRef.current) wheelFRRef.current.rotation.y = steerAngleRef.current;
  });

  return <primitive object={gltf.scene} />;
};

export default HondaAce;
