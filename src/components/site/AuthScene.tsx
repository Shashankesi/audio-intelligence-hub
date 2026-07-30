import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, Torus, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRef } from "react";
import type { Group, Mesh } from "three";

function Core() {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock, pointer }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.3 + pointer.x * 0.5;
    ref.current.rotation.x = Math.sin(t * 0.4) * 0.2 + pointer.y * 0.3;
  });
  return (
    <Float speed={1.6} rotationIntensity={0.5} floatIntensity={1.4}>
      <mesh ref={ref} scale={1.15}>
        <icosahedronGeometry args={[1, 32]} />
        <MeshDistortMaterial
          color="#8b5cf6"
          distort={0.5}
          speed={2.6}
          roughness={0.1}
          metalness={0.85}
          emissive="#312e81"
          emissiveIntensity={0.5}
        />
      </mesh>
    </Float>
  );
}

function Rings() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.z = t * 0.18;
    ref.current.rotation.x = Math.sin(t * 0.25) * 0.5;
  });
  return (
    <group ref={ref}>
      <Torus args={[1.9, 0.012, 16, 128]} rotation={[Math.PI / 2.4, 0, 0]}>
        <meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={1.6} />
      </Torus>
      <Torus args={[2.35, 0.008, 16, 128]} rotation={[Math.PI / 1.7, 0.4, 0]}>
        <meshStandardMaterial color="#c4b5fd" emissive="#7c3aed" emissiveIntensity={1.4} />
      </Torus>
    </group>
  );
}

export default function AuthScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 4, 4]} intensity={2.4} color="#c4b5fd" />
      <pointLight position={[-4, -3, -2]} intensity={1.6} color="#67e8f9" />
      <Core />
      <Rings />
      <Sparkles count={70} scale={7} size={2.5} speed={0.3} color="#a5b4fc" />
      <Environment preset="night" />
      <EffectComposer>
        <Bloom intensity={1.05} luminanceThreshold={0.12} luminanceSmoothing={0.4} />
      </EffectComposer>
    </Canvas>
  );
}