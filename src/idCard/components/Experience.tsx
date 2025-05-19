import { Environment, Lightformer, } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Canvas } from "@react-three/fiber";
import Card from "./Card";

const Experience = () => {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 13], fov: 25 }}>
      <ambientLight intensity={.3} />
      <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
        <Card  />
      </Physics>
      <Environment background blur={0.75}>
        <color attach="background" args={["black"]} />
        <Lightformer intensity={1} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={2} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={2} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={5} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        <Lightformer toneMapped intensity={4} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[500, 10, 1]} />
        <Lightformer toneMapped intensity={2} color="white" position={[15, 0, 10]} scale={[10, 10, 1]} />
      </Environment>
    </Canvas>
  )
}



export default Experience;