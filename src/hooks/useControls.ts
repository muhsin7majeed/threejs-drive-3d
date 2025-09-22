import { useEffect, useRef } from 'react';

export interface Controls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export const useControls = () => {
  // Using refs to avoid rerenders
  const forwardRef = useRef(false);
  const backwardRef = useRef(false);
  const leftRef = useRef(false);
  const rightRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          forwardRef.current = true;
          break;
        case "ArrowDown":
        case "KeyS":
          backwardRef.current = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          leftRef.current = true;
          break;
        case "ArrowRight":
        case "KeyD":
          rightRef.current = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          forwardRef.current = false;
          break;
        case "ArrowDown":
        case "KeyS":
          backwardRef.current = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          leftRef.current = false;
          break;
        case "ArrowRight":
        case "KeyD":
          rightRef.current = false;
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

  // Return getter functions to access current state
  const getControls = (): Controls => ({
    forward: forwardRef.current,
    backward: backwardRef.current,
    left: leftRef.current,
    right: rightRef.current,
  });

  return {
    getControls,
    // Individual getters for convenience
    isForward: () => forwardRef.current,
    isBackward: () => backwardRef.current,
    isLeft: () => leftRef.current,
    isRight: () => rightRef.current,
  };
};
