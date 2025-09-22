import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

const HondaAce = () => {
  const gltf = useLoader(GLTFLoader, "assets/models/honda-ace/scene.gltf");

  return <primitive object={gltf.scene} />;
};

export default HondaAce;
