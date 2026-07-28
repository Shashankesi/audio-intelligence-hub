import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Environment, Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useRef } from "react";
import type { Mesh } from "three";

function DistortedOrb() {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock, pointer }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.25 + pointer.x * 0.4;
    ref.current.rotation.x = pointer.y * 0.3;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh ref={ref} scale={1.6}>
        <icosahedronGeometry args={[1, 48]} />
        <MeshDistortMaterial
          color="#a78bfa"
          distort={0.45}
          speed={2.2}
          roughness={0.15}
          metalness={0.7}
          emissive="#4c1d95"
          emissiveIntensity={0.35}
        />
      </mesh>
    </Float>
  );
}

function Inner() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[4, 4, 4]} intensity={2.2} color="#c4b5fd" />
      <pointLight position={[-4, -3, -2]} intensity={1.5} color="#67e8f9" />
      <DistortedOrb />
      <Environment preset="night" />
      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.15} luminanceSmoothing={0.4} />
        <Vignette eskil={false} offset={0.15} darkness={0.6} />
      </EffectComposer>
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Inner />
    </Canvas>
  );
}